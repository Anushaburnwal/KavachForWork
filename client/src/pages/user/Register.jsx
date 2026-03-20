/**
 * Register Page — KavachForWork
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../utils/api.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import Navbar from '../../components/Navbar.jsx';

const WORKER_TYPES = [
  { value: 'delivery_driver', label: '🛵 Delivery Driver' },
  { value: 'construction_worker', label: '🏗️ Construction Worker' },
  { value: 'street_vendor', label: '🛒 Street Vendor' },
  { value: 'other', label: '👷 Other Outdoor Worker' },
];

const INDIAN_STATES = ['Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh', 'Maharashtra', 'Gujarat', 'Punjab', 'Haryana', 'Bihar', 'Odisha', 'Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu', 'Delhi', 'Other'];

export default function Register() {
  const [form, setForm] = useState({
    name: '', phone: '', password: '', confirmPassword: '',
    workerType: '', city: '', state: 'Rajasthan',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!form.workerType) {
      setError('Please select your worker type');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authAPI.register({
        name: form.name, phone: form.phone, password: form.password,
        workerType: form.workerType, city: form.city, state: form.state,
      });
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      const errs = err.response?.data?.errors;
      setError(errs ? errs[0].msg : err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-kavach-warm font-body">
      <Navbar />
      <div className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-kavach-orange to-orange-600 rounded-2xl flex items-center justify-center shadow-kavach mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-kavach-dark">Create your Kavach account</h1>
            <p className="text-gray-500 text-sm mt-1">Get ₹100 signup bonus + heat protection</p>
          </div>

          <div className="card">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                <input type="text" value={form.name} onChange={set('name')} placeholder="Raju Kumar" className="input-field" required />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">+91</span>
                  <input type="tel" value={form.phone} onChange={set('phone')} placeholder="9876543210" className="input-field pl-12" maxLength={10} required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">I am a...</label>
                <div className="grid grid-cols-2 gap-2">
                  {WORKER_TYPES.map(w => (
                    <button
                      key={w.value} type="button"
                      onClick={() => setForm(f => ({ ...f, workerType: w.value }))}
                      className={`p-3 rounded-xl border text-sm font-medium text-left transition-all ${
                        form.workerType === w.value
                          ? 'border-kavach-orange bg-orange-50 text-kavach-orange'
                          : 'border-gray-200 hover:border-orange-200 text-gray-600'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
                  <input type="text" value={form.city} onChange={set('city')} placeholder="Jaipur" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">State</label>
                  <select value={form.state} onChange={set('state')} className="input-field">
                    {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <input type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" className="input-field" required minLength={6} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat password" className="input-field" required />
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-xs text-green-700 font-semibold">🎁 ₹100 signup bonus will be added to your wallet automatically!</p>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : 'Create Account & Get ₹100 →'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-kavach-orange font-semibold hover:underline">Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
