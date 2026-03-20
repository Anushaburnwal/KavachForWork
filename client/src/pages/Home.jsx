/**
 * Home Page — KavachForWork
 * Hero + features + how it works + CTA
 * Light theme, high contrast for outdoor sunlight readability
 */
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';

const FEATURES = [
  {
    icon: '🌡️',
    title: 'Real-Time Heat Detection',
    desc: 'WeatherStack API monitors temperature at your exact GPS location. Auto-triggers when temp crosses 45°C.',
    color: 'from-orange-50 to-red-50 border-orange-200',
  },
  {
    icon: '🤖',
    title: 'AI Fraud Shield',
    desc: 'Our Sentry Random Forest model checks 8 device signals — battery temp, GPS, network, brightness — to verify you\'re actually outdoors.',
    color: 'from-blue-50 to-indigo-50 border-blue-200',
  },
  {
    icon: '💸',
    title: 'Instant Payouts',
    desc: 'Verified claims get ₹150–₹500 credited to your wallet instantly. No paperwork, no waiting.',
    color: 'from-green-50 to-emerald-50 border-green-200',
  },
  {
    icon: '🛡️',
    title: '₹29/Week Coverage',
    desc: 'Auto-deducted from your wallet every Monday. Cancel anytime. No annual lock-in.',
    color: 'from-amber-50 to-yellow-50 border-amber-200',
  },
  {
    icon: '📱',
    title: 'Works on Your Phone',
    desc: 'No documents needed. Just open the app, hit "Check Heatwave", and claim in under 60 seconds.',
    color: 'from-purple-50 to-pink-50 border-purple-200',
  },
  {
    icon: '🌬️',
    title: 'AQI Protection',
    desc: 'We also monitor Air Quality Index. Extreme pollution + heat = enhanced payout tier.',
    color: 'from-teal-50 to-cyan-50 border-teal-200',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Sign Up & Top Up', desc: 'Register with your phone number. Add ₹29+ to your wallet. Get ₹100 signup bonus.' },
  { step: '02', title: 'Activate Weekly Cover', desc: 'Pay ₹29 to activate your Kavach shield for 7 days. Auto-renews if balance available.' },
  { step: '03', title: 'Claim on Heatwave Days', desc: 'When it\'s 45°C+, open the app and tap "File Claim". AI verifies in seconds.' },
  { step: '04', title: 'Money in Your Wallet', desc: 'Approved claims get instant wallet credit. Withdraw anytime via UPI.' },
];

const PAYOUT_TIERS = [
  { range: '45°C – 46.9°C', tier: 'Mild Heatwave', payout: '₹150', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { range: '47°C – 49.9°C', tier: 'Severe Heatwave', payout: '₹300', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { range: '50°C +', tier: 'Extreme Heatwave', payout: '₹500', color: 'text-red-600 bg-red-50 border-red-200' },
];

const WORKERS = [
  { emoji: '🛵', label: 'Delivery Drivers' },
  { emoji: '🏗️', label: 'Construction Workers' },
  { emoji: '🛒', label: 'Street Vendors' },
  { emoji: '🌾', label: 'Field Workers' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-kavach-warm font-body">
      <Navbar />

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-kavach-orange rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400 rounded-full -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="max-w-6xl mx-auto px-4 pt-16 pb-20 relative">
          <div className="max-w-3xl">
            {/* Announcement badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 border border-orange-200 text-kavach-orange text-sm font-semibold mb-6 animate-fade-in">
              <span className="w-2 h-2 bg-kavach-orange rounded-full animate-pulse" />
              India's First AI Heat Insurance for Workers
            </div>

            <h1 className="font-display text-5xl md:text-6xl font-bold text-kavach-dark leading-tight mb-6 animate-slide-up">
              Work Safe in the{' '}
              <span className="text-kavach-orange relative">
                Heat
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M0 6 Q50 0 100 6 Q150 12 200 6" stroke="#F97316" strokeWidth="3" strokeLinecap="round" fill="none"/>
                </svg>
              </span>
              . Get Paid When It's Dangerous.
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl animate-slide-up">
              ₹29/week micro-insurance that auto-pays when temperature crosses 45°C at your location.
              Built for delivery drivers, construction workers, and street vendors across India.
            </p>

            {/* Who it's for */}
            <div className="flex flex-wrap gap-3 mb-8 animate-slide-up">
              {WORKERS.map(w => (
                <span key={w.label} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-orange-100 text-sm font-medium text-gray-700 shadow-sm">
                  {w.emoji} {w.label}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 animate-slide-up">
              <Link to="/register" className="btn-primary text-base py-3.5 px-8">
                Get Covered — ₹29/week →
              </Link>
              <Link to="/faqs" className="btn-secondary text-base py-3.5 px-8">
                How it works
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center gap-6 mt-10 text-sm text-gray-500 animate-fade-in">
              <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> No documents needed</span>
              <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Instant wallet payout</span>
              <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Cancel anytime</span>
              <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Works offline on Android</span>
            </div>
          </div>

          {/* Hero stat card */}
          <div className="absolute right-4 top-16 hidden lg:block">
            <div className="card p-5 w-64 animate-fade-in shadow-kavach">
              <div className="text-3xl font-display font-bold text-kavach-orange">47.2°C</div>
              <div className="text-sm text-gray-500 mt-1">Jaipur, Rajasthan</div>
              <div className="mt-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-red-600">HEATWAVE ACTIVE</span>
              </div>
              <div className="mt-3 pt-3 border-t border-orange-100">
                <div className="text-xs text-gray-500">Eligible payout</div>
                <div className="text-xl font-display font-bold text-green-600">₹300</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Payout Tiers ────────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-orange-100 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-display text-2xl font-bold text-center text-kavach-dark mb-8">
            Payout Tiers — The Hotter It Is, The More You Get
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PAYOUT_TIERS.map(t => (
              <div key={t.tier} className={`rounded-2xl border p-6 text-center ${t.color}`}>
                <div className="text-sm font-medium mb-1">{t.range}</div>
                <div className="font-display font-bold text-lg mb-2">{t.tier}</div>
                <div className="font-display font-bold text-4xl">{t.payout}</div>
                <div className="text-xs mt-1 opacity-70">instant wallet credit</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold text-kavach-dark mb-4">
              Built Different. Built for You.
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Every feature is designed for workers with no time to waste and no room for fake claims.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className={`rounded-2xl border bg-gradient-to-br p-6 ${f.color} transition-transform hover:-translate-y-0.5 duration-200`}>
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-display font-bold text-kavach-dark text-lg mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────────── */}
      <section className="bg-white py-20 px-4 border-y border-orange-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-4xl font-bold text-center text-kavach-dark mb-12">
            4 Steps to Heat Protection
          </h2>
          <div className="space-y-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-kavach-orange to-orange-600 rounded-2xl flex items-center justify-center shadow-kavach">
                  <span className="font-display font-bold text-white text-lg">{step.step}</span>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-display font-bold text-kavach-dark text-lg mb-1">{step.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="absolute left-7 mt-14 w-0.5 h-6 bg-orange-200 hidden md:block" />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/register" className="btn-primary text-base py-4 px-10">
              Start Coverage Today →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-kavach-orange to-orange-600 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
              </div>
              <span className="font-display font-bold text-kavach-dark">KavachForWork</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link to="/faqs" className="hover:text-kavach-orange transition-colors">FAQs</Link>
              <Link to="/chatbot" className="hover:text-kavach-orange transition-colors">Support</Link>
              <Link to="/admin/login" className="hover:text-kavach-orange transition-colors">Admin</Link>
            </div>
            <div className="text-sm text-gray-400">
              © 2024 KavachForWork. Prototype — Not a licensed insurer.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
