/**
 * User Model - KavachForWork
 * Stores worker profile, wallet, insurance status
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // ─── Personal Info ─────────────────────────────────────────────────────────
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^[6-9]\d{9}$/, 'Enter valid Indian mobile number'],
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false, // Never return password in queries
  },

  // ─── Worker Details ────────────────────────────────────────────────────────
  workerType: {
    type: String,
    enum: ['delivery_driver', 'construction_worker', 'street_vendor', 'other'],
    default: 'other',
  },
  city: { type: String, trim: true },
  state: { type: String, default: 'Rajasthan' },
  aadhaar: { type: String, select: false }, // Masked for display

  // ─── Insurance Status ──────────────────────────────────────────────────────
  isInsured: { type: Boolean, default: false },
  premiumUntil: { type: Date, default: null }, // Insurance valid until
  weeklyPremium: { type: Number, default: 29 }, // ₹29/week

  // ─── Wallet ────────────────────────────────────────────────────────────────
  wallet: {
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
  },

  // ─── Stats ─────────────────────────────────────────────────────────────────
  totalPremiumPaid: { type: Number, default: 0 },
  totalClaimsSubmitted: { type: Number, default: 0 },
  totalPayoutsReceived: { type: Number, default: 0 },

  // ─── Geolocation (last known) ──────────────────────────────────────────────
  lastLocation: {
    lat: Number,
    lng: Number,
    city: String,
    updatedAt: Date,
  },

  // ─── Auth ──────────────────────────────────────────────────────────────────
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
}, {
  timestamps: true,
});

// ─── Hooks ────────────────────────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Methods ──────────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isInsuranceActive = function () {
  return this.isInsured && this.premiumUntil && new Date() < this.premiumUntil;
};

// Sanitize for client response
userSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.aadhaar;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
