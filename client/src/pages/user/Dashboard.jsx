/**
 * Dashboard — KavachForWork
 * Shield status, wallet, recent claims, quick actions
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { userAPI, walletAPI } from '../../utils/api.js';
import Navbar from '../../components/Navbar.jsx';

const WORKER_LABELS = {
  delivery_driver: '🛵 Delivery Driver',
  construction_worker: '🏗️ Construction Worker',
  street_vendor: '🛒 Street Vendor',
  other: '👷 Outdoor Worker',
};

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [balance, setBalance] = useState(null);
  const [claims, setClaims] = useState([]);
  const [activating, setActivating] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      const [balRes, claimsRes] = await Promise.all([
        walletAPI.getBalance(),
        userAPI.getTransactions({ limit: 5 }),
      ]);
      setBalance(balRes.data);
      setClaims(claimsRes.data.transactions || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const activateInsurance = async () => {
    setActivating(true);
    try {
      const { data } = await userAPI.activateInsurance();
      showToast(data.message);
      await Promise.all([loadData(), refreshUser()]);
    } catch (err) {
      showToast(err.response?.data?.error || 'Activation failed', 'error');
    } finally {
      setActivating(false);
    }
  };

  const isActive = balance?.isInsuranceActive;
  const expiryDate = balance?.premiumUntil
    ? new Date(balance.premiumUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : null;

  return (
    <div className="min-h-screen bg-kavach-warm font-body">
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold animate-slide-up
          ${toast.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-kavach-dark">
            Namaste, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {WORKER_LABELS[user?.workerType] || '👷 Worker'} • {user?.city || 'India'}
          </p>
        </div>

        {/* Shield Status — hero card */}
        <div className={`rounded-2xl p-6 mb-6 relative overflow-hidden border-2 transition-all
          ${isActive
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
            : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'}`}>

          {/* Background shield */}
          <div className="absolute right-4 top-4 opacity-10">
            <svg viewBox="0 0 24 24" fill="currentColor" className={`w-28 h-28 ${isActive ? 'text-green-500' : 'text-orange-400'}`}>
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
          </div>

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md
              ${isActive ? 'bg-green-500 shield-active' : 'bg-orange-400'}`}>
              <svg viewBox="0 0 24 24" fill="white" className="w-9 h-9">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
            </div>

            <div className="flex-1">
              {isActive ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge-active">● KAVACH ACTIVE</span>
                  </div>
                  <div className="font-display font-bold text-xl text-green-800">
                    You are protected until {expiryDate}
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    Coverage active. File a claim if temperature crosses 45°C at your location.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge-inactive">○ NOT COVERED</span>
                  </div>
                  <div className="font-display font-bold text-xl text-gray-800">
                    Activate your Kavach Shield
                  </div>
                  <p className="text-gray-600 text-sm mt-1">
                    Pay ₹29 from your wallet to get 7-day heatwave insurance.
                  </p>
                </>
              )}
            </div>

            {!isActive && (
              <button
                onClick={activateInsurance}
                disabled={activating || (balance?.balance < 29)}
                className="btn-primary flex-shrink-0 flex items-center gap-2 py-3"
              >
                {activating ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Activating...</>
                ) : '⚡ Activate — ₹29'}
              </button>
            )}

            {isActive && (
              <Link to="/claim" className="btn-primary flex-shrink-0 py-3 text-center">
                🌡️ File Claim
              </Link>
            )}
          </div>

          {!isActive && balance?.balance < 29 && (
            <div className="mt-3 p-2.5 bg-amber-100 rounded-xl border border-amber-200">
              <p className="text-xs text-amber-700 font-medium">
                ⚠️ Insufficient balance (₹{balance?.balance || 0}). <Link to="/wallet" className="underline">Top up wallet →</Link>
              </p>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Wallet Balance"
            value={loading ? '—' : `₹${balance?.balance || 0}`}
            icon="💰"
            link="/wallet"
          />
          <StatCard
            label="Total Paid Out"
            value={`₹${user?.totalPayoutsReceived || 0}`}
            icon="💸"
          />
          <StatCard
            label="Claims Filed"
            value={user?.totalClaimsSubmitted || 0}
            icon="📋"
          />
          <StatCard
            label="Premiums Paid"
            value={`₹${user?.totalPremiumPaid || 0}`}
            icon="🛡️"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <QuickAction to="/claim" icon="🌡️" label="File Claim" desc="Submit heatwave claim" />
          <QuickAction to="/wallet" icon="💳" label="Top Up Wallet" desc="Add money to wallet" />
          <QuickAction to="/chatbot" icon="💬" label="Get Help" desc="Chat with AI support" />
        </div>

        {/* Recent transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-kavach-dark">Recent Activity</h2>
            <Link to="/wallet" className="text-sm text-kavach-orange font-semibold hover:underline">View all →</Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-12 rounded-xl heat-shimmer" />
              ))}
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-sm">No transactions yet. Activate your coverage to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {claims.map(tx => (
                <TransactionRow key={tx._id} tx={tx} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, link }) {
  const Inner = (
    <div className="card p-4 hover:border-orange-200 transition-colors cursor-pointer">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="font-display font-bold text-lg text-kavach-dark">{value}</div>
      <div className="text-xs text-gray-500 font-medium">{label}</div>
    </div>
  );
  return link ? <Link to={link}>{Inner}</Link> : Inner;
}

function QuickAction({ to, icon, label, desc }) {
  return (
    <Link to={to} className="card p-4 flex items-start gap-3 hover:border-orange-200 hover:shadow-kavach transition-all group">
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="font-semibold text-sm text-kavach-dark group-hover:text-kavach-orange transition-colors">{label}</div>
        <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
      </div>
    </Link>
  );
}

function TransactionRow({ tx }) {
  const isCredit = tx.amount > 0;
  const typeLabel = {
    premium_deduction: 'Weekly Premium',
    payout: 'Claim Payout',
    topup: 'Wallet Top-up',
    refund: 'Refund',
  }[tx.type] || tx.type;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50/50 transition-colors">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0
        ${isCredit ? 'bg-green-100' : 'bg-orange-100'}`}>
        {tx.type === 'premium_deduction' ? '🛡️' : tx.type === 'payout' ? '💸' : tx.type === 'topup' ? '💳' : '↩️'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-kavach-dark truncate">{typeLabel}</div>
        <div className="text-xs text-gray-400 truncate">{tx.description}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className={`font-display font-bold text-sm ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
          {isCredit ? '+' : ''}₹{Math.abs(tx.amount)}
        </div>
        <div className="text-xs text-gray-400">
          {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </div>
      </div>
    </div>
  );
}
