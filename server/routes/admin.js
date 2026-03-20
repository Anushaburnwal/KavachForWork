/**
 * Admin Routes - KavachForWork
 * All require admin JWT token
 * GET  /api/admin/stats        — dashboard overview
 * GET  /api/admin/claims       — all claims with filters
 * PUT  /api/admin/claims/:id   — approve/reject claim
 * GET  /api/admin/users        — all users with locations
 * GET  /api/admin/revenue      — weekly revenue chart data
 */

const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Claim = require('../models/Claim');
const Transaction = require('../models/Transaction');

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// ─── Dashboard Stats ───────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [userCount, claimStats, totalRevenue, recentActivity] = await Promise.all([
      // User stats
      User.aggregate([
        { $match: { role: 'user' } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$isInsured', 1, 0] } },
            totalWalletBalance: { $sum: '$wallet.balance' },
          },
        },
      ]),

      // Claim stats
      Claim.getAdminStats(),

      // Revenue (total premiums collected)
      Transaction.aggregate([
        { $match: { type: 'premium_deduction' } },
        { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } },
      ]),

      // Recent 5 claims
      Claim.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name phone workerType city')
        .select('status fraudAnalysis.fraudScore weather.city weather.ambientTemp payoutAmount createdAt'),
    ]);

    const users = userCount[0] || { total: 0, active: 0, totalWalletBalance: 0 };
    const revenue = totalRevenue[0]?.total || 0;
    const totalPayouts = claimStats.totalPayouts || 0;

    res.json({
      overview: {
        totalUsers: users.total,
        activeInsured: users.active,
        totalClaims: claimStats.totalClaims || 0,
        approvedClaims: claimStats.approvedClaims || 0,
        rejectedClaims: claimStats.rejectedClaims || 0,
        flaggedClaims: claimStats.flaggedClaims || 0,
        totalRevenue: revenue,
        totalPayouts,
        netProfit: revenue - totalPayouts,
        avgFraudScore: Math.round(claimStats.avgFraudScore || 0),
      },
      recentActivity,
    });
  } catch (err) {
    console.error('[Admin] Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// ─── Revenue Chart Data (weekly breakdown) ────────────────────────────────────
router.get('/revenue', async (req, res) => {
  try {
    const weeks = parseInt(req.query.weeks) || 8;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    const [premiumData, payoutData] = await Promise.all([
      Transaction.aggregate([
        { $match: { type: 'premium_deduction', createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              week: { $week: '$createdAt' },
            },
            total: { $sum: { $abs: '$amount' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.week': 1 } },
      ]),

      Transaction.aggregate([
        { $match: { type: 'payout', createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              week: { $week: '$createdAt' },
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.week': 1 } },
      ]),
    ]);

    // Build week labels for chart
    const chartData = buildWeeklyChartData(premiumData, payoutData, weeks);

    res.json({ chartData, weeks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch revenue data.' });
  }
});

// ─── All Claims (with pagination + filters) ───────────────────────────────────
router.get('/claims', async (req, res) => {
  try {
    const { status, page = 1, limit = 20, flaggedOnly } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (flaggedOnly === 'true') filter.status = 'flagged';

    const [claims, total] = await Promise.all([
      Claim.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('user', 'name phone workerType city'),
      Claim.countDocuments(filter),
    ]);

    res.json({
      claims,
      pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch claims.' });
  }
});

// ─── Approve / Reject Claim ───────────────────────────────────────────────────
router.put('/claims/:id', async (req, res) => {
  try {
    const { action, adminNote } = req.body; // action: 'approve' | 'reject'
    const claim = await Claim.findById(req.params.id).populate('user');

    if (!claim) return res.status(404).json({ error: 'Claim not found.' });
    if (['paid', 'rejected'].includes(claim.status)) {
      return res.status(400).json({ error: 'Claim already finalized.' });
    }

    if (action === 'approve') {
      const { PAYOUT_AMOUNTS, getPayoutTier } = require('../utils/constants');
      const tier = getPayoutTier(claim.triggerTemp);
      const amount = PAYOUT_AMOUNTS[tier];

      await Claim.findByIdAndUpdate(claim._id, {
        status: 'paid',
        payoutAmount: amount,
        payoutTier: tier,
        adminNote,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        paidAt: new Date(),
      });

      // Credit user wallet
      const updatedUser = await User.findByIdAndUpdate(
        claim.user._id,
        { $inc: { 'wallet.balance': amount, totalPayoutsReceived: amount } },
        { new: true }
      );

      await Transaction.create({
        user: claim.user._id,
        type: 'payout',
        amount,
        balanceAfter: updatedUser.wallet.balance,
        description: `Admin approved payout — Claim #${claim._id}`,
        claim: claim._id,
        status: 'completed',
      });

      // Real-time notify user
      const io = req.app.get('io');
      io?.emit(`wallet_update_${claim.user._id}`, { newBalance: updatedUser.wallet.balance, payout: amount });
      io?.to('admin_room').emit('claim_updated', { claimId: claim._id, status: 'paid', amount });

      return res.json({ message: `Claim approved. ₹${amount} paid to ${claim.user.name}.` });
    }

    if (action === 'reject') {
      await Claim.findByIdAndUpdate(claim._id, {
        status: 'rejected',
        rejectionReason: adminNote || 'Rejected by admin',
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      });

      const io = req.app.get('io');
      io?.to('admin_room').emit('claim_updated', { claimId: claim._id, status: 'rejected' });

      return res.json({ message: 'Claim rejected.' });
    }

    res.status(400).json({ error: 'Invalid action. Use approve or reject.' });
  } catch (err) {
    console.error('[Admin] Claim update error:', err);
    res.status(500).json({ error: 'Failed to update claim.' });
  }
});

// ─── Live Worker Map Data ──────────────────────────────────────────────────────
router.get('/workers/map', async (req, res) => {
  try {
    const workers = await User.find({
      role: 'user',
      'lastLocation.lat': { $exists: true },
    })
      .select('name workerType city isInsured lastLocation wallet.balance')
      .limit(200);

    res.json({ workers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch worker locations.' });
  }
});

// ─── All Users ────────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [users, total] = await Promise.all([
      User.find({ role: 'user' })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .select('-password -aadhaar'),
      User.countDocuments({ role: 'user' }),
    ]);
    res.json({ users, pagination: { page: +page, limit: +limit, total } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// ─── Fraud Counter Stats ──────────────────────────────────────────────────────
router.get('/fraud-stats', async (req, res) => {
  try {
    const stats = await Claim.aggregate([
      {
        $group: {
          _id: null,
          totalAnalyzed: { $sum: 1 },
          flaggedFraud: { $sum: { $cond: [{ $gte: ['$fraudAnalysis.fraudScore', 70] }, 1, 0] } },
          suspectedFraud: {
            $sum: { $cond: [{ $and: [{ $gte: ['$fraudAnalysis.fraudScore', 40] }, { $lt: ['$fraudAnalysis.fraudScore', 70] }] }, 1, 0] },
          },
          legitimate: { $sum: { $cond: [{ $lt: ['$fraudAnalysis.fraudScore', 40] }, 1, 0] } },
          avgFraudScore: { $avg: '$fraudAnalysis.fraudScore' },
          moneySaved: {
            $sum: {
              $cond: [
                { $gte: ['$fraudAnalysis.fraudScore', 70] },
                '$payoutAmount',
                0,
              ],
            },
          },
        },
      },
    ]);

    res.json(stats[0] || { totalAnalyzed: 0, flaggedFraud: 0, legitimate: 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch fraud stats.' });
  }
});

// ─── Helper: Build weekly chart data ─────────────────────────────────────────
function buildWeeklyChartData(premiumData, payoutData, weeks) {
  const labels = [];
  const premiums = [];
  const payouts = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const weekNum = getWeekNumber(d);
    const year = d.getFullYear();
    const label = `W${weekNum}`;

    labels.push(label);

    const prem = premiumData.find(p => p._id.week === weekNum && p._id.year === year);
    const pay = payoutData.find(p => p._id.week === weekNum && p._id.year === year);

    premiums.push(prem?.total || 0);
    payouts.push(pay?.total || 0);
  }

  return labels.map((label, i) => ({
    week: label,
    premiums: premiums[i],
    payouts: payouts[i],
    profit: premiums[i] - payouts[i],
  }));
}

function getWeekNumber(d) {
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
}

module.exports = router;
