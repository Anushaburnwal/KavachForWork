/**
 * Weather Routes - KavachForWork
 * Uses WeatherStack API for real-time temperature oracle
 * GET /api/weather/current?city=Jaipur
 * GET /api/weather/heatwave?lat=26.9&lng=75.8
 * GET /api/weather/aqi?lat=26.9&lng=75.8
 */

const router = require('express').Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');

const WEATHERSTACK_KEY = process.env.WEATHERSTACK_API_KEY || '41ff0a1791b3b3092862614c6d4dcf61';
const { getPayoutTier, PAYOUT_AMOUNTS, HEATWAVE_THRESHOLD } = require('../utils/constants');

// ─── Heatwave Check (primary oracle for payout trigger) ───────────────────────
router.get('/heatwave', protect, async (req, res) => {
  try {
    const { lat, lng, city } = req.query;

    // Build query: prefer coordinates, fallback to city name
    const query = (lat && lng) ? `${lat},${lng}` : (city || 'Jaipur');

    const response = await axios.get('http://api.weatherstack.com/current', {
      params: {
        access_key: WEATHERSTACK_KEY,
        query,
        units: 'm', // metric
      },
      timeout: 8000,
    });

    const data = response.data;

    if (data.error) {
      console.error('[Weather] API error:', data.error);
      return res.status(502).json({ error: 'Weather service error', detail: data.error.info });
    }

    const temp = data.current.temperature;
    const feelsLike = data.current.feelslike;
    const humidity = data.current.humidity;
    const uvIndex = data.current.uv_index;

    const isHeatwave = temp >= HEATWAVE_THRESHOLD;
    const payoutTier = getPayoutTier(temp);

    res.json({
      temperature: temp,
      feelsLike,
      humidity,
      uvIndex,
      windSpeed: data.current.wind_speed,
      condition: data.current.weather_descriptions?.[0] || 'Clear',
      weatherIcon: data.current.weather_icons?.[0],
      city: data.location?.name,
      region: data.location?.region,
      country: data.location?.country,
      isHeatwave,
      heatwaveThreshold: HEATWAVE_THRESHOLD,
      payoutTier,
      payoutAmount: PAYOUT_AMOUNTS[payoutTier],
      timestamp: data.location?.localtime,
      source: 'WeatherStack',
    });
  } catch (err) {
    console.error('[Weather] Heatwave check error:', err.message);
    // Fallback: use mock data for demo/dev
    if (process.env.NODE_ENV === 'development') {
      return res.json(getMockWeatherData());
    }
    res.status(502).json({ error: 'Weather API unavailable. Try again.' });
  }
});

// ─── Current Weather ──────────────────────────────────────────────────────────
router.get('/current', async (req, res) => {
  try {
    const { city = 'Jaipur' } = req.query;

    const response = await axios.get('http://api.weatherstack.com/current', {
      params: {
        access_key: WEATHERSTACK_KEY,
        query: city,
        units: 'm',
      },
      timeout: 8000,
    });

    const data = response.data;
    if (data.error) {
      return res.status(502).json({ error: data.error.info });
    }

    res.json({
      city: data.location?.name,
      temperature: data.current.temperature,
      feelsLike: data.current.feelslike,
      humidity: data.current.humidity,
      condition: data.current.weather_descriptions?.[0],
      weatherIcon: data.current.weather_icons?.[0],
      isHeatwave: data.current.temperature >= HEATWAVE_THRESHOLD,
    });
  } catch (err) {
    res.status(502).json({ error: 'Weather service unavailable.' });
  }
});

// ─── AQI Data (OpenAQ - Free, no key) ────────────────────────────────────────
router.get('/aqi', protect, async (req, res) => {
  try {
    const { lat, lng } = req.query;

    const response = await axios.get('https://api.openaq.org/v2/latest', {
      params: {
        coordinates: `${lat},${lng}`,
        radius: 25000, // 25km radius
        limit: 5,
        parameter: 'pm25',
      },
      timeout: 6000,
      headers: { 'X-API-Key': '' }, // OpenAQ doesn't require key for basic queries
    });

    const results = response.data.results;
    if (!results || results.length === 0) {
      return res.json({ aqi: null, message: 'No AQI data for this location' });
    }

    // Get latest PM2.5 reading
    const latest = results[0]?.measurements?.find(m => m.parameter === 'pm25');
    const pm25 = latest?.value || 0;
    const aqiCategory = getAQICategory(pm25);

    res.json({
      pm25,
      aqiCategory,
      station: results[0]?.name,
      lastUpdated: latest?.lastUpdated,
    });
  } catch (err) {
    console.error('[AQI] Error:', err.message);
    // Return safe fallback
    res.json({ pm25: 85, aqiCategory: 'Moderate', message: 'Estimated data' });
  }
});

// ─── Helper Functions ────────────────────────────────────────────────────────

function getAQICategory(pm25) {
  if (pm25 <= 12) return 'Good';
  if (pm25 <= 35.4) return 'Moderate';
  if (pm25 <= 55.4) return 'Unhealthy for Sensitive Groups';
  if (pm25 <= 150.4) return 'Unhealthy';
  if (pm25 <= 250.4) return 'Very Unhealthy';
  return 'Hazardous';
}

function getMockWeatherData() {
  const temp = 46 + Math.random() * 4; // 46-50°C for demo
  const tier = getPayoutTier(temp);
  return {
    temperature: parseFloat(temp.toFixed(1)),
    feelsLike: parseFloat((temp + 3).toFixed(1)),
    humidity: 18,
    uvIndex: 11,
    windSpeed: 12,
    condition: 'Sunny',
    city: 'Jaipur',
    region: 'Rajasthan',
    country: 'India',
    isHeatwave: true,
    heatwaveThreshold: 45,
    payoutTier: tier,
    payoutAmount: PAYOUT_AMOUNTS[tier],
    source: 'Mock (dev mode)',
  };
}

module.exports = router;
