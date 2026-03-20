/**
 * Auth Routes - KavachForWork
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/admin/login
 */

const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Strict rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ─── Register ────────────────────────────────────────────────────────────────
router.post('/register', authLimiter, [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid Indian mobile number required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('workerType').isIn(['delivery_driver', 'construction_worker', 'street_vendor', 'other']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, email, password, workerType, city, state } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ phone }, ...(email ? [{ email }] : [])],
    });
    if (existingUser) {
      return res.status(409).json({ error: 'Account with this phone/email already exists.' });
    }

    // Create user with initial wallet balance of ₹100 (signup bonus)
    const user = await User.create({
      name,
      phone,
      email,
      password,
      workerType,
      city,
      state: state || 'Rajasthan',
      wallet: { balance: 100 }, // ₹100 signup bonus
    });

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Account created successfully! ₹100 signup bonus added to wallet.',
      token,
      user: user.toPublic(),
    });
  } catch (err) {
    console.error('[Auth] Register error:', err.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
router.post('/login', authLimiter, [
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid phone number required'),
  body('password').notEmpty().withMessage('Password required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, password } = req.body;

    const user = await User.findOne({ phone, role: 'user' }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid phone number or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid phone number or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account deactivated. Contact support.' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    res.json({
      message: 'Login successful',
      token,
      user: user.toPublic(),
    });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ─── Admin Login ──────────────────────────────────────────────────────────────
router.post('/admin/login', authLimiter, [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const admin = await User.findOne({ email: email.toLowerCase(), role: 'admin' }).select('+password');
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = generateToken(admin._id);
    res.json({
      message: 'Admin login successful',
      token,
      user: admin.toPublic(),
    });
  } catch (err) {
    console.error('[Auth] Admin login error:', err.message);
    res.status(500).json({ error: 'Admin login failed.' });
  }
});

// ─── Get current user ─────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user.toPublic() });
});

module.exports = router;
