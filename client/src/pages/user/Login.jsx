/**
 * Login Page — KavachForWork
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../utils/api.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import Navbar from '../../components/Navbar.jsx';

export default function Login() {
  const [form, setForm] = useState({ phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-kavach-warm font-body">
      <Navbar />
      <div className="flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-kavach-orange to-orange-600 rounded-2xl flex items-center justify-center shadow-kavach mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-kavach-dark">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to your Kavach account</p>
          </div>

          <div className="card">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">+91</span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="9876543210"
                    className="input-field pl-12"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Enter password"
                  className="input-field"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex items-center gap-2 py-3.5">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign In →'}
              </button>
            </form>

            {/* Demo hint */}
            <div className="mt-4 p-3 bg-orange-50 rounded-xl border border-orange-100">
              <p className="text-xs text-orange-700 font-medium text-center">
                Demo: Register first, then login with your mobile number
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            New to Kavach?{' '}
            <Link to="/register" className="text-kavach-orange font-semibold hover:underline">
              Get covered →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
