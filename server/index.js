/**
 * KavachForWork - Main Server Entry Point
 * Node.js + Express + Socket.io + MongoDB
 */

require('dotenv').config({ path: '../.env' });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const claimRoutes = require('./routes/claims');
const adminRoutes = require('./routes/admin');
const weatherRoutes = require('./routes/weather');
const walletRoutes = require('./routes/wallet');
const chatbotRoutes = require('./routes/chatbot');

// Cron jobs
const { deductWeeklyPremiums } = require('./cron/premiums');

const app = express();
const server = http.createServer(app);

// ─── Socket.io Setup ─────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Expose io to routes for real-time admin sync
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('join_admin', () => {
    socket.join('admin_room');
    console.log(`[Socket] Admin joined: ${socket.id}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limiter - 100 requests per 15 min per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'KavachForWork API',
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/chatbot', chatbotRoutes);

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── MongoDB Connection ───────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kavachforwork';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('[DB] Connected to MongoDB');
    startServer();
  })
  .catch((err) => {
    console.error('[DB] Connection failed:', err.message);
    process.exit(1);
  });

function startServer() {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`[Server] KavachForWork running on port ${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // ─── Cron Jobs ──────────────────────────────────────────────────────────────
  // Every Monday at 6:00 AM IST — deduct weekly premium ₹29 from active users
  cron.schedule('0 6 * * 1', () => {
    console.log('[Cron] Running weekly premium deduction...');
    deductWeeklyPremiums(io);
  }, { timezone: 'Asia/Kolkata' });

  console.log('[Cron] Weekly premium scheduler active (Mondays 6AM IST)');
}

module.exports = { app, io };
