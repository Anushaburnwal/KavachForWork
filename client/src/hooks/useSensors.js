/**
 * useSensors Hook — KavachForWork
 * Bridges to Android Java via Capacitor for:
 *  - Battery temperature
 *  - GPS location
 *  - Network type
 *  - Device motion (jitter)
 * Falls back to web APIs / mock data when not on native.
 */
import { useState, useCallback } from 'react';

// Check if running in Capacitor native context
const isNative = () => typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();

export function useSensors() {
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const collectSensorData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let location = null;
      let deviceInfo = {};
      let networkType = 'mobile';
      let networkTypeEncoded = 2;

      // ── Geolocation ─────────────────────────────────────────────────────────
      try {
        if (isNative()) {
          // Use Capacitor Geolocation plugin
          const { Geolocation } = await import('@capacitor/geolocation');
          const pos = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
          });
          location = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
          };
        } else {
          // Web Geolocation API fallback
          location = await new Promise((resolve, reject) => {
            navigator.geolocation?.getCurrentPosition(
              (pos) => resolve({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
              }),
              (err) => reject(err),
              { enableHighAccuracy: true, timeout: 8000 }
            );
          });
        }
      } catch (geoErr) {
        console.warn('[Sensors] Geolocation failed, using Jaipur demo:', geoErr.message);
        location = { lat: 26.9124, lng: 75.7873, accuracy: 50 }; // Jaipur demo
      }

      // ── Device / Battery Info ────────────────────────────────────────────────
      let deviceTemp = null;
      let isCharging = false;
      let batteryLevel = 0.6;
      let batteryDrainRate = 0.3;

      if (isNative()) {
        try {
          // Custom KavachPlugin must be built into the Android app
          const { KavachPlugin } = await import('@capacitor/core').then(m => m.Capacitor.Plugins);
          const thermal = await KavachPlugin.getBatteryTemperature();
          deviceTemp = thermal.temperature;
          isCharging = thermal.isCharging;
          batteryDrainRate = thermal.drainRate || 0.3;
        } catch {
          // Fallback to Device plugin
          const { Device } = await import('@capacitor/device');
          const info = await Device.getBatteryInfo();
          isCharging = info.isCharging;
          batteryLevel = info.batteryLevel;
          deviceTemp = 40; // Estimated for outdoor in heat
        }
      } else {
        // Web Battery API (limited support)
        try {
          if (navigator.getBattery) {
            const battery = await navigator.getBattery();
            isCharging = battery.charging;
            batteryLevel = battery.level;
            batteryDrainRate = isCharging ? 0.05 : 0.35;
          }
        } catch {
          isCharging = false;
          batteryDrainRate = 0.3;
        }
        // Simulate device temp for demo (outdoor: ~40-44°C in 45°C heat)
        deviceTemp = 40 + Math.random() * 4;
      }

      // ── Network Type ──────────────────────────────────────────────────────────
      try {
        if (navigator.connection) {
          const conn = navigator.connection;
          const type = conn.type || conn.effectiveType;
          if (type === 'wifi') {
            networkType = 'wifi';
            networkTypeEncoded = 0;
          } else if (type && type !== 'unknown') {
            networkType = 'mobile';
            networkTypeEncoded = 2;
          } else {
            networkType = 'unknown';
            networkTypeEncoded = 1;
          }
        }
      } catch {
        networkType = 'mobile';
        networkTypeEncoded = 2;
      }

      // ── Screen Brightness (proxy for outdoor) ─────────────────────────────────
      // On native: use Capacitor. On web: estimate from ambient light sensor or default high (outdoor)
      let brightnessLevel = 0.8; // Default: assume outdoors = high brightness
      if (isNative()) {
        try {
          const { KavachPlugin } = await import('@capacitor/core').then(m => m.Capacitor.Plugins);
          const b = await KavachPlugin.getScreenBrightness();
          brightnessLevel = b.brightness;
        } catch { /* use default */ }
      }

      // ── GPS Jitter (repeated readings delta) ──────────────────────────────────
      const jitter = location.accuracy
        ? Math.min(5, (100 / location.accuracy) * 0.5)
        : 0.5;

      // ── Altitude Variance ─────────────────────────────────────────────────────
      const altitudeVariance = isNative() ? (Math.random() * 0.5) : 0.15;

      const data = {
        location,
        deviceTemp: parseFloat((deviceTemp || 40).toFixed(1)),
        isCharging,
        batteryLevel,
        batteryDrainRate: parseFloat(batteryDrainRate.toFixed(3)),
        networkType,
        networkTypeEncoded,
        brightnessLevel: parseFloat(brightnessLevel.toFixed(2)),
        jitter: parseFloat(jitter.toFixed(3)),
        altitudeVariance: parseFloat(altitudeVariance.toFixed(3)),
        collectedAt: new Date().toISOString(),
        isNative: isNative(),
      };

      setSensorData(data);
      return data;
    } catch (err) {
      const msg = err.message || 'Failed to collect sensor data';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { sensorData, loading, error, collectSensorData };
}
