/**
 * Wallet Page — KavachForWork
 */
import { useState, useEffect } from 'react';
import { walletAPI, userAPI } from '../../utils/api.js';
import Navbar from '../../components/Navbar.jsx';

const TOPUP_AMOUNTS = [29, 100, 200, 500];

export default function Wallet() {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topping, setTopping] = useState(false);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async (p = 1) => {
    try {
      const [balRes, txRes] = await Promise.all([
        walletAPI.getBalance(),
        userAPI.getTransactions({ page: p, limit: 15 }),
      ]);
      setBalance(balRes.data);
      setTransactions(p === 1 ? txRes.data.transactions : prev => [...prev, ...txRes.data.transactions]);
      setTotalPages(txRes.data.pagination.pages);
      setPage(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleTopUp = async () => {
    const amount = Number(customAmount) || selectedAmount;
    if (!amount || amount < 29) {
      showToast('Minimum top-up is ₹29', 'error');
      return;
    }
    setTopping(true);
    try {
      const { data } = await walletAPI.topUp({ amount });
      showToast(data.message);
      setCustomAmount('');
      setSelectedAmount(null);
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Top-up failed', 'error');
    } finally {
      setTopping(false);
    }
  };

  const TX_ICONS = {
    premium_deduction: { icon: '🛡️', label: 'Weekly Premium', bg: 'bg-orange-100' },
    payout: { icon: '💸', label: 'Claim Payout', bg: 'bg-green-100' },
    topup: { icon: '💳', label: 'Top-up', bg: 'bg-blue-100' },
    refund: { icon: '↩️', label: 'Refund', bg: 'bg-gray-100' },
  };

  return (
    <div className="min-h-screen bg-kavach-warm font-body">
      <Navbar />

      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold animate-slide-up
          ${toast.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-kavach-dark mb-6">My Wallet</h1>

        {/* Balance Card */}
        <div className="rounded-2xl bg-gradient-to-br from-kavach-orange to-orange-600 p-6 text-white mb-6 shadow-kavach-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 w-40 h-40 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="relative">
            <div className="text-sm font-medium opacity-80 mb-1">Available Balance</div>
            <div className="font-display text-5xl font-bold mb-4">
              {loading ? '—' : `₹${balance?.balance || 0}`}
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
                ${balance?.isInsuranceActive ? 'bg-green-400/20 text-white' : 'bg-white/20 text-white'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${balance?.isInsuranceActive ? 'bg-green-300' : 'bg-white/60'}`} />
                {balance?.isInsuranceActive ? `Covered until ${new Date(balance.premiumUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'Not covered'}
              </div>
            </div>
          </div>
        </div>

        {/* Top-up */}
        <div className="card mb-6">
          <h2 className="font-display font-bold text-kavach-dark mb-4">Add Money</h2>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {TOPUP_AMOUNTS.map(amt => (
              <button
                key={amt}
                onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                className={`py-2.5 rounded-xl text-sm font-bold border transition-all
                  ${selectedAmount === amt
                    ? 'bg-kavach-orange text-white border-kavach-orange shadow-kavach'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'}`}
              >
                ₹{amt}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <input
              type="number"
              placeholder="Or enter custom amount (min ₹29)"
              value={customAmount}
              onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
              className="input-field"
              min={29}
              max={10000}
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl mb-4">
            <p className="text-xs text-blue-700 font-medium">
              💡 Demo mode: Top-up is instant. In production, UPI/card payment via Razorpay.
            </p>
          </div>

          <button
            onClick={handleTopUp}
            disabled={topping || (!selectedAmount && !customAmount)}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
          >
            {topping ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
            ) : `Add ₹${customAmount || selectedAmount || '—'} to Wallet`}
          </button>
        </div>

        {/* Transaction History */}
        <div className="card">
          <h2 className="font-display font-bold text-kavach-dark mb-4">Transaction History</h2>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="h-14 rounded-xl heat-shimmer" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {transactions.map(tx => {
                const meta = TX_ICONS[tx.type] || { icon: '•', label: tx.type, bg: 'bg-gray-100' };
                const isCredit = tx.amount > 0;
                return (
                  <div key={tx._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${meta.bg} flex-shrink-0`}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-kavach-dark">{meta.label}</div>
                      <div className="text-xs text-gray-400 truncate">{tx.description}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`font-display font-bold text-sm ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                        {isCredit ? '+' : ''}₹{Math.abs(tx.amount)}
                      </div>
                      <div className="text-xs text-gray-400">
                        bal: ₹{tx.balanceAfter}
                      </div>
                      <div className="text-xs text-gray-300">
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {page < totalPages && (
                <button
                  onClick={() => loadData(page + 1)}
                  className="w-full py-3 text-sm text-kavach-orange font-semibold hover:bg-orange-50 rounded-xl transition-colors mt-2"
                >
                  Load more →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
