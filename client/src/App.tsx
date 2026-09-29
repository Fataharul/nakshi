import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AccountSetupPage } from './pages/AccountSetupPage';
import { DashboardPage } from './pages/DashboardPage';
import { MarketplacePage } from './pages/MarketplacePage';

const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <main className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center">
      <span className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">
        Digital Gallery & Marketplace
      </span>
      <h1 className="text-4xl md:text-6xl font-serif font-bold text-on-surface mb-4 tracking-tight">
        Nakshi
      </h1>
      <p className="text-on-surface-variant max-w-lg text-base leading-relaxed mb-8">
        Celebrating Bangladeshi craft heritage through curated art, live auctions, and virtual exhibitions.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/marketplace"
          id="home-explore-marketplace-btn"
          className="px-8 py-3.5 bg-primary text-on-primary font-semibold text-xs uppercase tracking-wider rounded-full hover:bg-surface-tint transition-all shadow-sm"
        >
          Explore Marketplace
        </Link>
        {isAuthenticated && user ? (
          <>
            <Link
              to={`/dashboard/${user.role.toLowerCase()}`}
              id="home-dashboard-btn"
              className="px-8 py-3.5 border border-outline/40 text-on-surface font-semibold text-xs uppercase tracking-wider rounded-full hover:bg-surface-container transition-all"
            >
              Go to {user.role} Dashboard
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/register"
              id="home-explore-btn"
              className="px-8 py-3.5 border border-outline/40 text-on-surface font-semibold text-xs uppercase tracking-wider rounded-full hover:bg-surface-container transition-all"
            >
              Join the Gallery
            </Link>
            <Link
              to="/login"
              id="home-login-btn"
              className="px-8 py-3.5 border border-outline/40 text-on-surface font-semibold text-xs uppercase tracking-wider rounded-full hover:bg-surface-container transition-all"
            >
              Sign In
            </Link>
          </>
        )}
      </div>
    </main>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-surface flex flex-col text-on-surface">
          <Navbar />
          <div className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/search" element={<MarketplacePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected User Routes */}
              <Route
                path="/setup"
                element={
                  <ProtectedRoute>
                    <AccountSetupPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/:role"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
