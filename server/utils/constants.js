/**
 * Shared constants — KavachForWork
 * Payout tiers, thresholds, business logic
 */

const HEATWAVE_THRESHOLD = 45; // °C

const PAYOUT_AMOUNTS = {
  none:    0,
  mild:    150,  // 45-46.9°C
  severe:  300,  // 47-49.9°C
  extreme: 500,  // 50°C+
};

function getPayoutTier(temp) {
  if (temp >= 50) return 'extreme';
  if (temp >= 47) return 'severe';
  if (temp >= HEATWAVE_THRESHOLD) return 'mild';
  return 'none';
}

function getPayoutAmount(temp) {
  return PAYOUT_AMOUNTS[getPayoutTier(temp)];
}

const WEEKLY_PREMIUM = 29; // ₹

module.exports = {
  HEATWAVE_THRESHOLD,
  PAYOUT_AMOUNTS,
  WEEKLY_PREMIUM,
  getPayoutTier,
  getPayoutAmount,
};
