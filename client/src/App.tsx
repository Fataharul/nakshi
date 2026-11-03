import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AccountSetupPage } from './pages/AccountSetupPage';
import { DashboardPage } from './pages/DashboardPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { AuctionPage } from './pages/AuctionPage';
import { AuctionsPage } from './pages/AuctionsPage';
import { ArtworkDetailPage } from './pages/ArtworkDetailPage';
import { ExhibitionsPage } from './pages/ExhibitionsPage';
import { ExhibitionRoomPage } from './pages/ExhibitionRoomPage';
import { ExhibitionAnalyticsPage } from './pages/ExhibitionAnalyticsPage';
import { AdminModerationPage } from './pages/AdminModerationPage';

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
              <Route path="/gallery" element={<MarketplacePage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/search" element={<MarketplacePage />} />
              <Route path="/artworks/:id" element={<ArtworkDetailPage />} />
              <Route path="/gallery/:id" element={<ArtworkDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/auctions" element={<AuctionsPage />} />
              <Route path="/auctions/:id" element={<AuctionPage />} />
              <Route path="/exhibitions" element={<ExhibitionsPage />} />
              <Route path="/exhibitions/:id" element={<ExhibitionRoomPage />} />
              <Route path="/exhibitions/:id/room" element={<ExhibitionRoomPage />} />

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
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
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
              <Route
                path="/dashboard/organizer/exhibitions/:id/analytics"
                element={
                  <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                    <ExhibitionAnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/moderation"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminModerationPage />
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
