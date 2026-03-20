/**
 * Transaction Model - KavachForWork
 * Wallet transactions: premiums, payouts, top-ups
 */

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['premium_deduction', 'payout', 'topup', 'refund'],
    required: true,
  },
  amount: { type: Number, required: true }, // positive = credit, negative = debit
  balanceAfter: { type: Number, required: true },
  description: { type: String, required: true },
  claim: { type: mongoose.Schema.Types.ObjectId, ref: 'Claim' }, // linked claim if payout
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed'],
    default: 'completed',
  },
  reference: String, // Razorpay payment ID or internal ref
}, {
  timestamps: true,
});

transactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
