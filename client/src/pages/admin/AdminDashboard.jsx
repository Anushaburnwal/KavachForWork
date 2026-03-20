/**
 * Admin Dashboard — KavachForWork
 * Real-time stats via Socket.io, Recharts, React-Leaflet map
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { adminAPI } from '../../utils/api.js';
import { useAuth } from '../../hooks/useAuth.jsx';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Status badge colors
const STATUS_COLORS = {
  pending: 'badge-warning',
  approved: 'badge-active',
  paid: 'badge-active',
  rejected: 'badge-danger',
  flagged: 'badge-danger',
};

const CHART_COLORS = {
  premiums: '#F97316',
  payouts: '#EF4444',
  profit: '#22C55E',
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [claims, setClaims] = useState([]);
  const [fraudStats, setFraudStats] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveEvents, setLiveEvents] = useState([]);
  const [claimsFilter, setClaimsFilter] = useState('');
  const [reviewingId, setReviewingId] = useState(null);

  // ── Load all admin data ────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [statsRes, revRes, claimsRes, fraudRes, workersRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getRevenue(8),
        adminAPI.getClaims({ limit: 20 }),
        adminAPI.getFraudStats(),
        adminAPI.getWorkerMap(),
      ]);
      setStats(statsRes.data);
      setRevenue(revRes.data.chartData || []);
      setClaims(claimsRes.data.claims || []);
      setFraudStats(fraudRes.data);
      setWorkers(workersRes.data.workers || []);
    } catch (err) {
      console.error('[Admin] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Socket.io real-time connection ─────────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socket.emit('join_admin');

    socket.on('new_claim', (data) => {
      setLiveEvents(prev => [{ ...data, eventType: 'new_claim', ts: new Date() }, ...prev.slice(0, 9)]);
      loadData(); // Refresh stats
    });

    socket.on('claim_updated', () => loadData());
    socket.on('cron_complete', (data) => {
      setLiveEvents(prev => [{ ...data, eventType: 'cron', ts: new Date() }, ...prev.slice(0, 9)]);
      loadData();
    });

    return () => socket.disconnect();
  }, [loadData]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Handle claim review ────────────────────────────────────────────────────
  const handleClaim = async (id, action, note = '') => {
    setReviewingId(id);
    try {
      await adminAPI.updateClaim(id, { action, adminNote: note });
      await loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    } finally {
      setReviewingId(null);
    }
  };

  const filteredClaims = claims.filter(c =>
    !claimsFilter || c.status === claimsFilter
  );

  const fraudPieData = fraudStats ? [
    { name: 'Legitimate', value: fraudStats.legitimate || 0, color: '#22C55E' },
    { name: 'Suspected', value: fraudStats.suspectedFraud || 0, color: '#F59E0B' },
    { name: 'Flagged', value: fraudStats.flaggedFraud || 0, color: '#EF4444' },
  ] : [];

  if (!user || user.role !== 'admin') {
    navigate('/admin/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-kavach-warm font-body">
      {/* Admin Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-gradient-to-br from-kavach-orange to-red-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
            </div>
            <span className="font-display font-bold text-kavach-dark">KavachForWork <span className="text-xs font-normal text-gray-400 font-body">Admin</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-700 font-medium">Live</span>
            </div>
            <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-gray-400 hover:text-red-500 px-3 py-1.5">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-orange-100 w-fit">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'claims', label: '📋 Claims' },
            { id: 'fraud', label: '🤖 Fraud AI' },
            { id: 'map', label: '🗺️ Worker Map' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-kavach-orange text-white shadow-kavach'
                  : 'text-gray-500 hover:text-kavach-orange'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl heat-shimmer" />)}
          </div>
        ) : (
          <>
            {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KPICard label="Total Users" value={stats?.overview?.totalUsers || 0} icon="👥" color="blue" />
                  <KPICard label="Active Insured" value={stats?.overview?.activeInsured || 0} icon="🛡️" color="green" />
                  <KPICard label="Total Revenue" value={`₹${stats?.overview?.totalRevenue || 0}`} icon="💰" color="orange" />
                  <KPICard label="Net Profit" value={`₹${stats?.overview?.netProfit || 0}`} icon="📈" color="emerald" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KPICard label="Total Claims" value={stats?.overview?.totalClaims || 0} icon="📋" color="gray" />
                  <KPICard label="Approved" value={stats?.overview?.approvedClaims || 0} icon="✅" color="green" />
                  <KPICard label="Flagged Fraud" value={stats?.overview?.flaggedClaims || 0} icon="🚩" color="red" />
                  <KPICard label="Total Payouts" value={`₹${stats?.overview?.totalPayouts || 0}`} icon="💸" color="amber" />
                </div>

                {/* Revenue Chart */}
                <div className="card">
                  <h2 className="font-display font-bold text-kavach-dark mb-4">Revenue vs Payouts (8 weeks)</h2>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={revenue}>
                      <defs>
                        <linearGradient id="premGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.premiums} stopOpacity={0.2}/>
                          <stop offset="95%" stopColor={CHART_COLORS.premiums} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.payouts} stopOpacity={0.2}/>
                          <stop offset="95%" stopColor={CHART_COLORS.payouts} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip formatter={(v) => `₹${v}`} />
                      <Legend />
                      <Area type="monotone" dataKey="premiums" name="Premiums" stroke={CHART_COLORS.premiums} fill="url(#premGrad)" strokeWidth={2} />
                      <Area type="monotone" dataKey="payouts" name="Payouts" stroke={CHART_COLORS.payouts} fill="url(#payGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Profit bar + Live events */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="card">
                    <h2 className="font-display font-bold text-kavach-dark mb-4">Weekly Profit</h2>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={revenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} />
                        <Tooltip formatter={v => `₹${v}`} />
                        <Bar dataKey="profit" name="Profit" fill={CHART_COLORS.profit} radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="card">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-display font-bold text-kavach-dark">Live Events</h2>
                      <span className="badge-active">● Live</span>
                    </div>
                    {liveEvents.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">Waiting for events...</div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {liveEvents.map((e, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg text-xs">
                            <span>{e.eventType === 'new_claim' ? '📋' : '🔄'}</span>
                            <div>
                              <span className="font-semibold">
                                {e.eventType === 'new_claim' ? `New claim: ${e.userName}` : `Cron: ${e.type}`}
                              </span>
                              {e.fraudScore && <span className="ml-1 text-gray-400">fraud:{e.fraudScore}</span>}
                              <div className="text-gray-400">{new Date(e.ts).toLocaleTimeString('en-IN')}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent claims */}
                <div className="card">
                  <h2 className="font-display font-bold text-kavach-dark mb-4">Recent Claims</h2>
                  <ClaimsTable claims={stats?.recentActivity || []} onAction={handleClaim} reviewingId={reviewingId} compact />
                </div>
              </div>
            )}

            {/* ── CLAIMS TAB ───────────────────────────────────────────────── */}
            {activeTab === 'claims' && (
              <div className="animate-fade-in space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {['', 'pending', 'approved', 'paid', 'flagged', 'rejected'].map(s => (
                    <button
                      key={s || 'all'}
                      onClick={() => setClaimsFilter(s)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        claimsFilter === s
                          ? 'bg-kavach-orange text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'
                      }`}
                    >
                      {s || 'All'} {s && `(${claims.filter(c => c.status === s).length})`}
                    </button>
                  ))}
                </div>
                <div className="card">
                  <ClaimsTable claims={filteredClaims} onAction={handleClaim} reviewingId={reviewingId} />
                </div>
              </div>
            )}

            {/* ── FRAUD AI TAB ─────────────────────────────────────────────── */}
            {activeTab === 'fraud' && (
              <div className="animate-fade-in space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KPICard label="Total Analyzed" value={fraudStats?.totalAnalyzed || 0} icon="🔍" color="blue" />
                  <KPICard label="Legitimate" value={fraudStats?.legitimate || 0} icon="✅" color="green" />
                  <KPICard label="Flagged Fraud" value={fraudStats?.flaggedFraud || 0} icon="🚩" color="red" />
                  <KPICard label="Money Saved" value={`₹${Math.round(fraudStats?.moneySaved || 0)}`} icon="💰" color="emerald" />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="card">
                    <h2 className="font-display font-bold text-kavach-dark mb-4">Claim Distribution</h2>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={fraudPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`}>
                          {fraudPieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="card">
                    <h2 className="font-display font-bold text-kavach-dark mb-4">AI Model — Sentry RF</h2>
                    <div className="space-y-3 text-sm">
                      {[
                        { label: 'Model', value: 'RandomForestClassifier' },
                        { label: 'Features', value: '8 sensor signals' },
                        { label: 'Top Signal', value: 'Screen Brightness (51%)' },
                        { label: 'Battery Drain', value: '28.4% importance' },
                        { label: 'Avg Fraud Score', value: `${Math.round(stats?.overview?.avgFraudScore || 0)}/100` },
                        { label: 'Model Version', value: 'sentry_v1_rf' },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between py-2 border-b border-gray-50">
                          <span className="text-gray-500">{label}</span>
                          <span className="font-semibold text-kavach-dark font-mono text-xs">{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-orange-50 rounded-xl border border-orange-100">
                      <p className="text-xs text-orange-700 font-medium">
                        🔥 Key fraud signals: device_temp &lt;30°C while claiming 45°C+, WiFi-only network, charging during claim, low screen brightness.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── MAP TAB ──────────────────────────────────────────────────── */}
            {activeTab === 'map' && (
              <div className="animate-fade-in">
                <div className="card">
                  <h2 className="font-display font-bold text-kavach-dark mb-4">
                    Live Worker Map ({workers.length} tracked)
                  </h2>
                  <WorkerMap workers={workers} />
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
                    {[
                      { icon: '🛵', label: 'Delivery', count: workers.filter(w => w.workerType === 'delivery_driver').length },
                      { icon: '🏗️', label: 'Construction', count: workers.filter(w => w.workerType === 'construction_worker').length },
                      { icon: '🛒', label: 'Vendors', count: workers.filter(w => w.workerType === 'street_vendor').length },
                    ].map(t => (
                      <div key={t.label} className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                        <div className="text-2xl mb-1">{t.icon}</div>
                        <div className="font-display font-bold text-kavach-dark">{t.count}</div>
                        <div className="text-xs text-gray-500">{t.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function KPICard({ label, value, icon, color }) {
  const colorMap = {
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    orange: 'bg-orange-50 border-orange-100',
    emerald: 'bg-emerald-50 border-emerald-100',
    red: 'bg-red-50 border-red-100',
    amber: 'bg-amber-50 border-amber-100',
    gray: 'bg-gray-50 border-gray-100',
  };
  return (
    <div className={`rounded-2xl border p-4 ${colorMap[color] || 'bg-white border-gray-100'}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-display font-bold text-xl text-kavach-dark">{value}</div>
      <div className="text-xs text-gray-500 font-medium mt-0.5">{label}</div>
    </div>
  );
}

function ClaimsTable({ claims, onAction, reviewingId, compact }) {
  if (!claims || claims.length === 0) {
    return <div className="text-center py-8 text-gray-400 text-sm">No claims found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {['Worker', 'Temp', 'Fraud Score', 'Status', 'Payout', 'Date', !compact && 'Actions'].filter(Boolean).map(h => (
              <th key={h} className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {claims.map(c => (
            <tr key={c._id} className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors">
              <td className="py-3 px-2">
                <div className="font-medium text-kavach-dark">{c.user?.name || '—'}</div>
                <div className="text-xs text-gray-400">{c.user?.city || c.weather?.city || '—'}</div>
              </td>
              <td className="py-3 px-2">
                <span className={`font-mono font-bold ${(c.weather?.ambientTemp || 0) >= 45 ? 'text-red-500' : 'text-gray-600'}`}>
                  {c.weather?.ambientTemp}°C
                </span>
              </td>
              <td className="py-3 px-2">
                <FraudScoreBadge score={c.fraudAnalysis?.fraudScore} />
              </td>
              <td className="py-3 px-2">
                <span className={STATUS_COLORS[c.status] || 'badge-inactive'}>{c.status}</span>
              </td>
              <td className="py-3 px-2 font-semibold text-green-600">
                {c.payoutAmount > 0 ? `₹${c.payoutAmount}` : '—'}
              </td>
              <td className="py-3 px-2 text-gray-400 text-xs">
                {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </td>
              {!compact && (
                <td className="py-3 px-2">
                  {(c.status === 'pending' || c.status === 'flagged') && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => onAction(c._id, 'approve')}
                        disabled={reviewingId === c._id}
                        className="px-2 py-1 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => onAction(c._id, 'reject', 'Rejected by admin')}
                        disabled={reviewingId === c._id}
                        className="px-2 py-1 text-xs bg-red-400 text-white rounded-lg hover:bg-red-500 disabled:opacity-50"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FraudScoreBadge({ score }) {
  if (score == null) return <span className="text-gray-300">—</span>;
  const color = score < 40 ? 'text-green-600 bg-green-50' : score < 70 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
      {score}
    </span>
  );
}

function WorkerMap({ workers }) {
  // Dynamic import of react-leaflet to avoid SSR issues
  const [MapComponent, setMapComponent] = useState(null);

  useEffect(() => {
    import('react-leaflet').then(({ MapContainer, TileLayer, Marker, Popup, CircleMarker }) => {
      const Map = () => (
        <MapContainer
          center={[22.9734, 78.6569]}
          zoom={5}
          style={{ height: '400px', width: '100%' }}
          className="rounded-xl"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {workers.map(w => w.lastLocation?.lat && (
            <CircleMarker
              key={w._id}
              center={[w.lastLocation.lat, w.lastLocation.lng]}
              radius={8}
              fillColor={w.isInsured ? '#22C55E' : '#F97316'}
              color="white"
              weight={2}
              fillOpacity={0.8}
            >
              <Popup>
                <div className="font-body text-sm p-1">
                  <div className="font-bold">{w.name}</div>
                  <div className="text-gray-500">{w.workerType?.replace('_', ' ')}</div>
                  <div className="text-xs mt-1">{w.lastLocation.city}</div>
                  <div className={`text-xs font-semibold ${w.isInsured ? 'text-green-600' : 'text-gray-400'}`}>
                    {w.isInsured ? '🛡️ Insured' : 'Not covered'}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      );
      setMapComponent(() => Map);
    }).catch(console.error);
  }, [workers]);

  // Demo static map if no real workers or leaflet not loaded
  if (!MapComponent) {
    return (
      <div className="h-96 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="text-sm">Loading map...</p>
          <p className="text-xs mt-1">{workers.length} workers tracked</p>
        </div>
      </div>
    );
  }

  return <MapComponent />;
}
