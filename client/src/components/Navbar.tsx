import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Wallet, LogOut, LayoutDashboard, Settings } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    return `/dashboard/${user.role.toLowerCase()}`;
  };

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex flex-col">
              <span className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-on-surface hover:text-primary transition-colors">
                Nakshi
              </span>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-primary -mt-1">
                Curated Digital Gallery
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Gallery
            </Link>
            <Link
              to="/marketplace"
              id="navbar-marketplace-link"
              className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Marketplace
            </Link>
            <Link
              to="/"
              className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Live Auctions
            </Link>
            <Link
              to="/"
              className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Exhibitions
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                {/* Internal Credit Balance Badge */}
                <div
                  id="navbar-wallet-balance"
                  className="flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-full text-xs font-medium text-on-surface border border-outline/20"
                >
                  <Wallet className="w-3.5 h-3.5 text-primary" />
                  <span>
                    <strong className="font-semibold">{user.walletBalance.toFixed(2)}</strong> Credits
                  </span>
                </div>

                {/* Role Badge */}
                <span
                  id="navbar-role-badge"
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-primary-container/20 text-primary border border-primary/20"
                >
                  {user.role}
                </span>

                {/* Dashboard Link */}
                <Link
                  to={getDashboardPath()}
                  id="navbar-dashboard-link"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-on-surface hover:text-primary transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                {/* Account Setup / Profile */}
                <Link
                  to="/setup"
                  id="navbar-setup-link"
                  className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors rounded hover:bg-surface-container"
                  title="Account Settings"
                >
                  <Settings className="w-4 h-4" />
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  id="navbar-logout-btn"
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-error hover:bg-error-container/20 rounded transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  id="navbar-login-link"
                  className="text-xs uppercase tracking-wider font-semibold px-4 py-2 text-on-surface hover:text-primary transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  id="navbar-register-link"
                  className="text-xs uppercase tracking-wider font-semibold px-5 py-2.5 bg-primary text-on-primary rounded-full hover:bg-surface-tint transition-all shadow-sm"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && user && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-surface-container rounded-full text-[11px] font-medium text-on-surface">
                <Wallet className="w-3 h-3 text-primary" />
                <span>{user.walletBalance.toFixed(0)} C</span>
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              id="mobile-menu-toggle"
              className="p-2 rounded text-on-surface hover:bg-surface-container focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (tested for 360px usability) */}
      {mobileMenuOpen && (
        <div id="mobile-menu-drawer" className="md:hidden border-t border-outline/20 bg-surface px-4 pt-3 pb-6 space-y-4">
          {isAuthenticated && user ? (
            <div className="space-y-3 pb-3 border-b border-outline/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-on-surface">{user.name}</p>
                  <p className="text-xs text-on-surface-variant">{user.email}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-primary-container/20 text-primary">
                  {user.role}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-on-surface-variant bg-surface-container p-2.5 rounded">
                <Wallet className="w-4 h-4 text-primary" />
                <span>Wallet Balance: <strong className="text-on-surface font-semibold">{user.walletBalance.toFixed(2)} Credits</strong></span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-on-surface text-surface text-xs font-medium rounded hover:bg-black transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/setup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 border border-outline text-on-surface text-xs font-medium rounded hover:bg-surface-container transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Profile</span>
                </Link>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-error hover:bg-error-container/20 rounded transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 pb-3 border-b border-outline/20">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2.5 text-center text-xs uppercase tracking-wider font-semibold border border-outline text-on-surface rounded hover:bg-surface-container"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2.5 text-center text-xs uppercase tracking-wider font-semibold bg-primary text-on-primary rounded-full hover:bg-surface-tint"
              >
                Create Account
              </Link>
            </div>
          )}

          <div className="space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-on-surface hover:text-primary"
            >
              Gallery Home
            </Link>
            <Link
              to="/marketplace"
              id="mobile-navbar-marketplace-link"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-on-surface hover:text-primary"
            >
              Marketplace
            </Link>
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-on-surface hover:text-primary"
            >
              Live Auctions
            </Link>
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-on-surface hover:text-primary"
            >
              Exhibitions
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
