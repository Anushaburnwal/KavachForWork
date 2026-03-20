/**
 * ClaimPage — KavachForWork
 * Full claim flow: check weather → collect sensors → AI verify → submit
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { weatherAPI, claimsAPI } from '../../utils/api.js';
import { useSensors } from '../../hooks/useSensors.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import Navbar from '../../components/Navbar.jsx';

const STEPS = ['Check Weather', 'Collect Sensors', 'AI Verify', 'Result'];

export default function ClaimPage() {
  const { user, refreshUser } = useAuth();
  const { collectSensorData, loading: sensorLoading } = useSensors();

  const [step, setStep] = useState(0); // 0=check, 1=sensors, 2=verifying, 3=result
  const [weather, setWeather] = useState(null);
  const [sensors, setSensors] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isInsured = user?.isInsured && user?.premiumUntil && new Date() < new Date(user.premiumUntil);

  // Step 1: Check weather at user's location
  const checkWeather = async () => {
    setChecking(true);
    setError('');
    try {
      // First get rough location for city
      let city = user?.city || 'Jaipur';
      try {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation?.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        // We'll use coords in the actual claim
        city = user?.city || 'Jaipur';
        setSensors(prev => ({ ...prev, _coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } }));
      } catch { /* use city fallback */ }

      const { data } = await weatherAPI.getHeatwave({ city });
      setWeather(data);
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not fetch weather. Check internet connection.');
    } finally {
      setChecking(false);
    }
  };

  // Step 2: Collect device sensors
  const collectSensors = async () => {
    setError('');
    try {
      const data = await collectSensorData();
      setSensors(prev => ({ ...prev, ...data }));
      setStep(2);
      // Auto-submit after sensor collection
      await submitClaim(data);
    } catch (err) {
      setError(err.message || 'Failed to collect sensor data');
    }
  };

  // Step 3: Submit claim (calls backend which calls AI)
  const submitClaim = async (sensorData) => {
    setSubmitting(true);
    setError('');
    try {
      const locationData = sensorData?.location || { lat: 26.9124, lng: 75.7873 };

      const payload = {
        location: {
          lat: locationData.lat,
          lng: locationData.lng,
          accuracy: locationData.accuracy,
          city: weather?.city,
          state: user?.state,
        },
        weather: {
          ambientTemp: weather.temperature,
          feelsLike: weather.feelsLike,
          humidity: weather.humidity,
          windSpeed: weather.windSpeed,
          condition: weather.condition,
          city: weather.city,
          weatherIcon: weather.weatherIcon,
        },
        sensorData: {
          deviceTemp: sensorData?.deviceTemp,
          isCharging: sensorData?.isCharging || false,
          batteryDrainRate: sensorData?.batteryDrainRate || 0.3,
          brightnessLevel: sensorData?.brightnessLevel || 0.7,
          networkType: sensorData?.networkType || 'mobile',
          networkTypeEncoded: sensorData?.networkTypeEncoded ?? 2,
          jitter: sensorData?.jitter || 0.5,
          altitudeVariance: sensorData?.altitudeVariance || 0.2,
        },
      };

      const { data } = await claimsAPI.submit(payload);
      setResult(data);
      setStep(3);
      await refreshUser();
    } catch (err) {
      const msg = err.response?.data?.error || 'Claim submission failed';
      setError(msg);
      if (err.response?.status === 403) {
        // Insurance not active
        setStep(0);
      } else {
        setStep(3);
        setResult({ error: msg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep(0);
    setWeather(null);
    setSensors(null);
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-kavach-warm font-body">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-8">

        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-kavach-dark">File Heatwave Claim</h1>
          <p className="text-gray-500 text-sm mt-1">Our AI verifies you're outdoors in the heat</p>
        </div>

        {/* Not insured warning */}
        {!isInsured && (
          <div className="card mb-6 border-amber-200 bg-amber-50">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="font-semibold text-amber-800">Insurance Not Active</div>
                <p className="text-sm text-amber-700 mt-1">
                  You need active Kavach coverage to file a claim.
                </p>
                <Link to="/dashboard" className="btn-primary text-sm py-2 px-4 mt-3 inline-block">
                  Activate Coverage →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-1.5 ${i <= step ? 'text-kavach-orange' : 'text-gray-300'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                  ${i < step ? 'bg-kavach-orange border-kavach-orange text-white'
                    : i === step ? 'border-kavach-orange text-kavach-orange bg-orange-50'
                    : 'border-gray-200 text-gray-300 bg-white'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block">{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 transition-colors ${i < step ? 'bg-kavach-orange' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        {/* ── Step 0: Check Weather ─────────────────────────────────────────── */}
        {step === 0 && (
          <div className="card animate-fade-in">
            <div className="text-center py-4">
              <div className="text-6xl mb-4">🌡️</div>
              <h2 className="font-display font-bold text-xl text-kavach-dark mb-2">
                Check Heatwave at Your Location
              </h2>
              <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                We'll use WeatherStack API to verify the temperature at your current GPS location.
              </p>
              {user?.city && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-full text-sm text-orange-700 font-medium mb-6">
                  📍 {user.city}, {user.state}
                </div>
              )}
              <button
                onClick={checkWeather}
                disabled={checking || !isInsured}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4"
              >
                {checking ? (
                  <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Checking weather...</>
                ) : '🌡️ Check Temperature Now'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Weather result + collect sensors ──────────────────────── */}
        {step === 1 && weather && (
          <div className="space-y-4 animate-fade-in">
            {/* Weather card */}
            <div className={`rounded-2xl p-5 border-2 ${weather.isHeatwave
              ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-300'
              : 'bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200'}`}>

              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-gray-600">📍 {weather.city}, India</div>
                  <div className="font-display text-5xl font-bold text-kavach-dark mt-1">
                    {weather.temperature}°C
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Feels like {weather.feelsLike}°C • {weather.humidity}% humidity</div>
                </div>
                <div className="text-right">
                  {weather.weatherIcon && (
                    <img src={weather.weatherIcon} alt={weather.condition} className="w-16 h-16" />
                  )}
                  <div className="text-sm font-medium text-gray-600">{weather.condition}</div>
                </div>
              </div>

              {weather.isHeatwave ? (
                <div className="flex items-center gap-2 p-3 bg-red-100 rounded-xl border border-red-200">
                  <span className="text-red-500 text-lg">🔥</span>
                  <div>
                    <div className="font-semibold text-red-700 text-sm">Heatwave Detected!</div>
                    <div className="text-xs text-red-600">
                      {weather.temperature}°C ≥ 45°C threshold. Eligible payout: <strong>₹{weather.payoutAmount}</strong> ({weather.payoutTier})
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-blue-100 rounded-xl border border-blue-200">
                  <span className="text-blue-500">ℹ️</span>
                  <div className="text-sm text-blue-700">
                    Temperature is {weather.temperature}°C. Claim requires ≥45°C. No payout applicable today.
                  </div>
                </div>
              )}
            </div>

            {weather.isHeatwave && (
              <div className="card">
                <h3 className="font-display font-bold text-kavach-dark mb-2">Step 2: Verify You're Outdoors</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Our AI Sentry model will check your device sensors — battery temp, GPS, network type, screen brightness — to confirm you're actually working outside.
                </p>
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  {[
                    { icon: '🔋', label: 'Battery Temp' },
                    { icon: '📍', label: 'GPS Signal' },
                    { icon: '📶', label: 'Network Type' },
                  ].map(s => (
                    <div key={s.label} className="p-2 bg-orange-50 rounded-xl border border-orange-100">
                      <div className="text-xl mb-0.5">{s.icon}</div>
                      <div className="text-xs text-gray-600 font-medium">{s.label}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={collectSensors}
                  disabled={sensorLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-4"
                >
                  {sensorLoading ? (
                    <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Reading sensors...</>
                  ) : '📱 Collect Sensor Data & Submit Claim'}
                </button>
              </div>
            )}

            {!weather.isHeatwave && (
              <button onClick={reset} className="btn-secondary w-full py-3">← Try Again</button>
            )}
          </div>
        )}

        {/* ── Step 2: AI Verifying ───────────────────────────────────────────── */}
        {step === 2 && (
          <div className="card text-center py-10 animate-fade-in">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="w-20 h-20 border-4 border-orange-200 border-t-kavach-orange rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">🤖</div>
            </div>
            <h2 className="font-display font-bold text-xl text-kavach-dark mb-2">
              Sentry AI Verifying...
            </h2>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              Analyzing 8 device signals: battery temperature, GPS jitter, network type, screen brightness, motion patterns...
            </p>
            <div className="mt-6 space-y-2 text-left max-w-xs mx-auto">
              {['Battery temperature check', 'GPS location verified', 'Network type analyzed', 'Fraud score computed'].map((s, i) => (
                <div key={s} className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="w-4 h-4 border-2 border-t-kavach-orange border-orange-200 rounded-full animate-spin" style={{ animationDelay: `${i * 0.3}s` }} />
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: Result ────────────────────────────────────────────────── */}
        {step === 3 && result && (
          <div className="space-y-4 animate-fade-in">
            {result.error ? (
              <div className="card border-red-200 bg-red-50 text-center py-8">
                <div className="text-4xl mb-3">❌</div>
                <h2 className="font-display font-bold text-xl text-red-800 mb-2">Claim Failed</h2>
                <p className="text-sm text-red-600">{result.error}</p>
                <button onClick={reset} className="btn-secondary mt-4">Try Again</button>
              </div>
            ) : (
              <>
                {/* Status card */}
                <div className={`rounded-2xl p-6 border-2 text-center ${
                  result.claim?.status === 'approved' || result.claim?.status === 'paid'
                    ? 'bg-green-50 border-green-300'
                    : result.claim?.status === 'flagged'
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="text-5xl mb-3">
                    {result.claim?.status === 'approved' || result.claim?.status === 'paid' ? '✅'
                      : result.claim?.status === 'flagged' ? '🔍' : '❌'}
                  </div>
                  <div className={`font-display font-bold text-2xl mb-2 ${
                    result.claim?.status === 'approved' || result.claim?.status === 'paid' ? 'text-green-800'
                      : result.claim?.status === 'flagged' ? 'text-amber-800' : 'text-red-800'
                  }`}>
                    {result.claim?.status === 'approved' || result.claim?.status === 'paid' ? `₹${result.claim.payoutAmount} Credited!`
                      : result.claim?.status === 'flagged' ? 'Under Review'
                      : 'Claim Not Approved'}
                  </div>
                  <p className="text-sm text-gray-600">{result.message}</p>
                </div>

                {/* Fraud score breakdown */}
                {result.claim?.fraudScore !== undefined && (
                  <div className="card">
                    <h3 className="font-display font-bold text-kavach-dark mb-3">AI Fraud Analysis</h3>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Legitimacy Score</span>
                        <span className="font-bold text-kavach-dark">{100 - result.claim.fraudScore}%</span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            result.claim.fraudScore < 40 ? 'bg-green-400' : result.claim.fraudScore < 70 ? 'bg-amber-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${100 - result.claim.fraudScore}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { label: 'Temperature', value: `${result.claim.temperature}°C at ${result.claim.city}` },
                        { label: 'Fraud Score', value: `${result.claim.fraudScore}/100` },
                        { label: 'Payout Tier', value: result.claim.payoutTier },
                        { label: 'Status', value: result.claim.status },
                      ].map(({ label, value }) => (
                        <div key={label} className="p-2 bg-gray-50 rounded-lg">
                          <div className="text-gray-400">{label}</div>
                          <div className="font-semibold text-gray-700 capitalize">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={reset} className="btn-secondary flex-1 py-3">File Another</button>
                  <Link to="/wallet" className="btn-primary flex-1 py-3 text-center">View Wallet</Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
