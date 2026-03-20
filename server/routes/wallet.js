/**
 * Wallet Routes - KavachForWork
 * POST /api/wallet/topup   — add money (Razorpay/demo)
 * GET  /api/wallet/balance — get balance
 */

const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// ─── Get Balance ──────────────────────────────────────────────────────────────
router.get('/balance', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('wallet premiumUntil isInsured');
    res.json({
      balance: user.wallet.balance,
      currency: 'INR',
      isInsured: user.isInsured,
      premiumUntil: user.premiumUntil,
      isInsuranceActive: user.isInsuranceActive(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch balance.' });
  }
});

// ─── Top Up Wallet (Demo / Razorpay hook) ────────────────────────────────────
router.post('/topup', protect, [
  body('amount')
    .isFloat({ min: 29, max: 10000 })
    .withMessage('Amount must be between ₹29 and ₹10,000'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, paymentReference } = req.body;

    // In production: verify Razorpay payment signature here
    // For demo: direct top-up
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { 'wallet.balance': amount } },
      { new: true }
    );

    await Transaction.create({
      user: req.user._id,
      type: 'topup',
      amount: +amount,
      balanceAfter: updatedUser.wallet.balance,
      description: `Wallet top-up via UPI/Card`,
      status: 'completed',
      reference: paymentReference || `TOPUP-${Date.now()}`,
    });

    res.json({
      message: `₹${amount} added to your wallet!`,
      balance: updatedUser.wallet.balance,
    });
  } catch (err) {
    console.error('[Wallet] Topup error:', err);
    res.status(500).json({ error: 'Top-up failed. Please try again.' });
  }
});

module.exports = router;
