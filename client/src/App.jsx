/**
 * App.jsx — KavachForWork main router
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';

// Public pages
import Home from './pages/Home.jsx';
import FAQs from './pages/FAQs.jsx';
import Chatbot from './pages/Chatbot.jsx';

// User pages
import Login from './pages/user/Login.jsx';
import Register from './pages/user/Register.jsx';
import Dashboard from './pages/user/Dashboard.jsx';
import Wallet from './pages/user/Wallet.jsx';
import ClaimPage from './pages/user/ClaimPage.jsx';

// Admin pages
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';

// Route guards
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-kavach-warm flex items-center justify-center">
    <div className="animate-spin w-8 h-8 border-4 border-kavach-orange border-t-transparent rounded-full" />
  </div>;
  return user && user.role === 'user' ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user && user.role === 'admin' ? children : <Navigate to="/admin/login" replace />;
}

function PublicOnlyRoute({ children }) {
  const { user } = useAuth();
  if (user?.role === 'user') return <Navigate to="/dashboard" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/chatbot" element={<Chatbot />} />

          {/* Auth */}
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

          {/* User — protected */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/wallet" element={<PrivateRoute><Wallet /></PrivateRoute>} />
          <Route path="/claim" element={<PrivateRoute><ClaimPage /></PrivateRoute>} />

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
