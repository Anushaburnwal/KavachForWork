/**
 * Navbar — KavachForWork
 * Light, sun-readable, sticky top nav
 */
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-orange-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-kavach-orange to-orange-600 rounded-lg flex items-center justify-center shadow-kavach">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
          </div>
          <span className="font-display font-bold text-kavach-dark text-lg tracking-tight">
            Kavach<span className="text-kavach-orange">ForWork</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink to="/" active={isActive('/')}>Home</NavLink>
          <NavLink to="/faqs" active={isActive('/faqs')}>FAQs</NavLink>
          <NavLink to="/chatbot" active={isActive('/chatbot')}>Chatbot</NavLink>

          {user ? (
            <>
              <NavLink to="/dashboard" active={isActive('/dashboard')}>Dashboard</NavLink>
              <NavLink to="/wallet" active={isActive('/wallet')}>Wallet</NavLink>
              <NavLink to="/claim" active={isActive('/claim')}>File Claim</NavLink>
              <button
                onClick={handleLogout}
                className="ml-2 px-4 py-2 text-sm font-semibold text-gray-500 hover:text-red-500 transition-colors font-body"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="ml-2 btn-secondary text-sm py-2 px-4">Login</Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Covered</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-orange-50 transition-colors"
          aria-label="Toggle menu"
        >
          <div className="w-5 space-y-1.5">
            <span className={`block h-0.5 bg-kavach-dark transition-transform ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block h-0.5 bg-kavach-dark transition-opacity ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 bg-kavach-dark transition-transform ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-orange-100 bg-white animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            <MobileLink to="/" onClick={() => setMobileOpen(false)}>Home</MobileLink>
            <MobileLink to="/faqs" onClick={() => setMobileOpen(false)}>FAQs</MobileLink>
            <MobileLink to="/chatbot" onClick={() => setMobileOpen(false)}>Chatbot</MobileLink>
            {user ? (
              <>
                <MobileLink to="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</MobileLink>
                <MobileLink to="/wallet" onClick={() => setMobileOpen(false)}>Wallet</MobileLink>
                <MobileLink to="/claim" onClick={() => setMobileOpen(false)}>File Claim</MobileLink>
                <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 text-sm text-red-500 font-semibold">
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link to="/login" className="btn-secondary flex-1 text-center text-sm py-2.5" onClick={() => setMobileOpen(false)}>Login</Link>
                <Link to="/register" className="btn-primary flex-1 text-center text-sm py-2.5" onClick={() => setMobileOpen(false)}>Get Covered</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors font-body
        ${active ? 'text-kavach-orange bg-orange-50' : 'text-gray-600 hover:text-kavach-orange hover:bg-orange-50'}`}
    >
      {children}
    </Link>
  );
}

function MobileLink({ to, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-3 py-2.5 text-sm font-semibold text-gray-700 hover:text-kavach-orange hover:bg-orange-50 rounded-lg transition-colors"
    >
      {children}
    </Link>
  );
}
