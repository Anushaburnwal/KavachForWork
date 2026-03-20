/**
 * Claim Model - KavachForWork
 * Heatwave insurance claim with AI fraud detection result
 */

const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  // ─── Claimant ──────────────────────────────────────────────────────────────
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // ─── Weather Data (from WeatherStack at claim time) ────────────────────────
  weather: {
    ambientTemp: { type: Number, required: true }, // °C from API
    feelsLike: Number,
    humidity: Number,
    windSpeed: Number,
    condition: String,
    city: String,
    country: { type: String, default: 'IN' },
    weatherIcon: String,
  },

  // ─── Sensor Data (from device/Capacitor) ──────────────────────────────────
  sensorData: {
    deviceTemp: { type: Number }, // Battery temperature °C
    isCharging: { type: Boolean, default: false },
    batteryDrainRate: { type: Number, default: 0.3 },
    brightnessLevel: { type: Number, default: 0.5 }, // 0-1 (screen brightness as proxy for outdoor)
    networkType: { type: String, default: 'mobile' }, // wifi=indoor suspect, mobile=outdoor
    networkTypeEncoded: { type: Number, default: 2 }, // 0=wifi, 1=unknown, 2=mobile
    jitter: { type: Number, default: 0.5 },
    altitudeVariance: { type: Number, default: 0.1 },
  },

  // ─── Geolocation ──────────────────────────────────────────────────────────
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    accuracy: Number,
    city: String,
    state: String,
  },

  // ─── AQI Data ─────────────────────────────────────────────────────────────
  aqi: {
    value: Number,
    category: String, // Good, Moderate, Unhealthy, etc.
    pm25: Number,
  },

  // ─── AI Fraud Detection Results ───────────────────────────────────────────
  fraudAnalysis: {
    fraudScore: { type: Number, min: 0, max: 100 }, // 0=legit, 100=fraud
    fraudProbability: Number, // Raw model probability
    legitimacyProbability: Number,
    isLegit: Boolean,
    signals: {
      tempMatch: Boolean,       // API temp matches device temp
      outdoorBattery: Boolean,  // Battery >42°C
      networkOutdoor: Boolean,  // Mobile network (not home WiFi)
      motionDetected: Boolean,
      brightnessHigh: Boolean,
    },
    modelVersion: { type: String, default: 'sentry_v1' },
    analyzedAt: { type: Date, default: Date.now },
  },

  // ─── Payout ───────────────────────────────────────────────────────────────
  payoutAmount: { type: Number, default: 0 }, // ₹
  payoutTier: {
    type: String,
    enum: ['none', 'mild', 'severe', 'extreme'],
    default: 'none',
  },

  // ─── Status ───────────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid', 'flagged'],
    default: 'pending',
    index: true,
  },
  rejectionReason: String,
  adminNote: String,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  paidAt: Date,

  // ─── Heatwave Trigger ─────────────────────────────────────────────────────
  heatwaveTriggered: { type: Boolean, default: false }, // temp >= 45°C
  triggerTemp: Number, // The temp that triggered (from WeatherStack oracle)
}, {
  timestamps: true,
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
claimSchema.index({ user: 1, createdAt: -1 });
claimSchema.index({ status: 1 });
claimSchema.index({ heatwaveTriggered: 1 });

// ─── Statics ──────────────────────────────────────────────────────────────────
claimSchema.statics.getAdminStats = async function () {
  const [totals] = await this.aggregate([
    {
      $group: {
        _id: null,
        totalClaims: { $sum: 1 },
        approvedClaims: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        rejectedClaims: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        flaggedClaims: { $sum: { $cond: [{ $eq: ['$status', 'flagged'] }, 1, 0] } },
        paidClaims: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
        totalPayouts: { $sum: '$payoutAmount' },
        avgFraudScore: { $avg: '$fraudAnalysis.fraudScore' },
      },
    },
  ]);
  return totals || {};
};

module.exports = mongoose.model('Claim', claimSchema);
