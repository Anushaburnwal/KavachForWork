/**
 * User Routes - KavachForWork
 * GET  /api/user/profile
 * PUT  /api/user/profile
 * POST /api/user/activate-insurance
 * GET  /api/user/transactions
 */

const router = require('express').Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// ─── Get Profile ──────────────────────────────────────────────────────────────
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// ─── Update Profile ───────────────────────────────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    const allowed = ['name', 'city', 'state', 'workerType', 'email'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ message: 'Profile updated', user: user.toPublic() });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Update failed.' });
  }
});

// ─── Activate Weekly Insurance ────────────────────────────────────────────────
router.post('/activate-insurance', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const PREMIUM = 29; // ₹29/week

    if (user.wallet.balance < PREMIUM) {
      return res.status(400).json({
        error: `Insufficient balance. Need ₹${PREMIUM}, have ₹${user.wallet.balance}. Please top up your wallet.`,
        code: 'INSUFFICIENT_BALANCE',
      });
    }

    // Calculate premium period
    const now = new Date();
    const premiumUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days

    // Extend if already active
    const currentExpiry = user.premiumUntil && user.premiumUntil > now ? user.premiumUntil : now;
    const newExpiry = new Date(currentExpiry.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Deduct premium & activate
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $inc: { 'wallet.balance': -PREMIUM, totalPremiumPaid: PREMIUM },
        isInsured: true,
        premiumUntil: newExpiry,
      },
      { new: true }
    );

    // Record transaction
    await Transaction.create({
      user: user._id,
      type: 'premium_deduction',
      amount: -PREMIUM,
      balanceAfter: updatedUser.wallet.balance,
      description: `Weekly Kavach insurance premium — valid until ${newExpiry.toLocaleDateString('en-IN')}`,
      status: 'completed',
      reference: `PREM-${Date.now()}`,
    });

    res.json({
      message: `Insurance activated! ₹${PREMIUM} deducted. Covered until ${newExpiry.toLocaleDateString('en-IN')}.`,
      isInsured: true,
      premiumUntil: newExpiry,
      walletBalance: updatedUser.wallet.balance,
    });
  } catch (err) {
    console.error('[Insurance] Activation error:', err);
    res.status(500).json({ error: 'Failed to activate insurance.' });
  }
});

// ─── Get Transaction History ──────────────────────────────────────────────────
router.get('/transactions', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const [transactions, total] = await Promise.all([
      Transaction.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('claim', 'status triggerTemp weather.city'),
      Transaction.countDocuments({ user: req.user._id }),
    ]);

    res.json({
      transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
});

module.exports = router;
