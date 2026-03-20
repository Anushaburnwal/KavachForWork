/**
 * Claims Routes - KavachForWork
 * POST /api/claims/submit — submit a claim
 * GET  /api/claims/my    — get my claims
 * GET  /api/claims/:id   — get single claim
 */

const router = require('express').Router();
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/auth');
const Claim = require('../models/Claim');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// One claim per user per 24 hours
const claimLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { error: 'You can only submit 3 claims per day.' },
});

// ─── Submit Claim ─────────────────────────────────────────────────────────────
router.post('/submit', protect, claimLimiter, [
  body('location.lat').isFloat({ min: 6, max: 35 }).withMessage('Invalid latitude for India'),
  body('location.lng').isFloat({ min: 68, max: 98 }).withMessage('Invalid longitude for India'),
  body('weather.ambientTemp').isFloat({ min: 30, max: 60 }).withMessage('Invalid temperature'),
  body('sensorData.deviceTemp').optional().isFloat({ min: 20, max: 65 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = req.user;

    // ── Insurance check ──────────────────────────────────────────────────────
    if (!user.isInsuranceActive()) {
      return res.status(403).json({
        error: 'Your insurance is not active. Please activate weekly coverage first.',
        code: 'INSURANCE_INACTIVE',
      });
    }

    // ── Heatwave threshold check ──────────────────────────────────────────────
    const ambientTemp = req.body.weather.ambientTemp;
    if (ambientTemp < 45) {
      return res.status(400).json({
        error: `Temperature ${ambientTemp}°C is below heatwave threshold (45°C). Claim not applicable.`,
        code: 'BELOW_THRESHOLD',
      });
    }

    const { location, weather, sensorData, aqi } = req.body;

    // ── Call AI Fraud Detection Service ──────────────────────────────────────
    let fraudAnalysis = {
      fraudScore: 50,
      isLegit: true,
      modelVersion: 'sentry_v1',
    };

    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/verify-claim`, {
        ambient_temp: ambientTemp,
        device_temp: sensorData?.deviceTemp || 40,
        jitter: sensorData?.jitter || 0.5,
        is_charging: sensorData?.isCharging ? 1 : 0,
        network_type_encoded: sensorData?.networkTypeEncoded || 2,
        battery_drain_rate: sensorData?.batteryDrainRate || 0.4,
        brightness_level: sensorData?.brightnessLevel || 0.7,
        altitude_variance: sensorData?.altitudeVariance || 0.2,
      }, { timeout: 5000 });

      fraudAnalysis = aiResponse.data;
    } catch (aiErr) {
      console.error('[Claims] AI service error:', aiErr.message);
      // Don't fail the claim if AI is down — flag for manual review
      fraudAnalysis.reviewRequired = true;
    }

    // ── Determine claim status & payout ──────────────────────────────────────
    const { getPayoutTier, PAYOUT_AMOUNTS } = require('../utils/constants');
    const payoutTier = getPayoutTier(ambientTemp);
    const payoutAmount = PAYOUT_AMOUNTS[payoutTier];

    let status = 'pending';
    if (fraudAnalysis.fraudScore >= 70) {
      status = 'flagged'; // High fraud risk — admin review
    } else if (fraudAnalysis.isLegit && payoutTier !== 'none') {
      status = 'approved';
    } else if (payoutTier === 'none') {
      status = 'rejected';
    }

    // ── Save claim ────────────────────────────────────────────────────────────
    const claim = await Claim.create({
      user: user._id,
      weather: {
        ambientTemp,
        feelsLike: weather.feelsLike,
        humidity: weather.humidity,
        windSpeed: weather.windSpeed,
        condition: weather.condition,
        city: weather.city || location.city,
        weatherIcon: weather.weatherIcon,
      },
      sensorData: {
        deviceTemp: sensorData?.deviceTemp,
        isCharging: sensorData?.isCharging || false,
        batteryDrainRate: sensorData?.batteryDrainRate || 0.3,
        brightnessLevel: sensorData?.brightnessLevel || 0.5,
        networkType: sensorData?.networkType || 'mobile',
        networkTypeEncoded: sensorData?.networkTypeEncoded || 2,
        jitter: sensorData?.jitter || 0.5,
        altitudeVariance: sensorData?.altitudeVariance || 0.1,
      },
      location,
      aqi: aqi || {},
      fraudAnalysis: {
        fraudScore: fraudAnalysis.fraudScore,
        fraudProbability: fraudAnalysis.fraud_probability,
        legitimacyProbability: fraudAnalysis.legit_probability,
        isLegit: fraudAnalysis.isLegit,
        signals: fraudAnalysis.signals || {},
        modelVersion: 'sentry_v1',
      },
      payoutAmount: status === 'approved' ? payoutAmount : 0,
      payoutTier,
      status,
      heatwaveTriggered: ambientTemp >= 45,
      triggerTemp: ambientTemp,
    });

    // ── Auto-payout for approved claims ──────────────────────────────────────
    if (status === 'approved' && payoutAmount > 0) {
      await processPayoutToWallet(user, claim, payoutAmount, req.app.get('io'));
    }

    // ── Emit real-time update to admin ────────────────────────────────────────
    const io = req.app.get('io');
    io?.to('admin_room').emit('new_claim', {
      claimId: claim._id,
      userId: user._id,
      userName: user.name,
      status,
      fraudScore: fraudAnalysis.fraudScore,
      payoutAmount: status === 'approved' ? payoutAmount : 0,
      city: weather.city,
      temp: ambientTemp,
    });

    // ── Update user stats ─────────────────────────────────────────────────────
    await User.findByIdAndUpdate(user._id, {
      $inc: { totalClaimsSubmitted: 1 },
    });

    res.status(201).json({
      message: status === 'approved'
        ? `Claim approved! ₹${payoutAmount} credited to your wallet.`
        : status === 'flagged'
        ? 'Claim flagged for review. Our team will verify within 24 hours.'
        : 'Claim submitted for review.',
      claim: {
        _id: claim._id,
        status,
        fraudScore: fraudAnalysis.fraudScore,
        payoutAmount: status === 'approved' ? payoutAmount : 0,
        payoutTier,
        temperature: ambientTemp,
        city: weather.city,
      },
    });
  } catch (err) {
    console.error('[Claims] Submit error:', err);
    res.status(500).json({ error: 'Failed to submit claim. Please try again.' });
  }
});

// ─── Get My Claims ────────────────────────────────────────────────────────────
router.get('/my', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [claims, total] = await Promise.all([
      Claim.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v'),
      Claim.countDocuments({ user: req.user._id }),
    ]);

    res.json({
      claims,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch claims.' });
  }
});

// ─── Get Single Claim ─────────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const claim = await Claim.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found.' });
    }

    res.json({ claim });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch claim.' });
  }
});

// ─── Helper: Process payout to wallet ────────────────────────────────────────
async function processPayoutToWallet(user, claim, amount, io) {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $inc: {
          'wallet.balance': amount,
          totalPayoutsReceived: amount,
        },
      },
      { new: true }
    );

    await Transaction.create({
      user: user._id,
      type: 'payout',
      amount: +amount,
      balanceAfter: updatedUser.wallet.balance,
      description: `Heatwave claim payout — ${claim.weather?.city || 'India'} ${claim.triggerTemp}°C`,
      claim: claim._id,
      status: 'completed',
      reference: `PAY-${claim._id}`,
    });

    await Claim.findByIdAndUpdate(claim._id, { status: 'paid', paidAt: new Date() });

    // Real-time wallet update to user
    io?.emit(`wallet_update_${user._id}`, {
      newBalance: updatedUser.wallet.balance,
      payout: amount,
    });

    console.log(`[Payout] ₹${amount} credited to ${user.name} (${user._id})`);
  } catch (err) {
    console.error('[Payout] Error:', err.message);
  }
}

module.exports = router;
