import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wallet, Settings, ShoppingBag, Palette, Compass, ShieldCheck } from 'lucide-react';
import { SellerMetricsView } from '../components/dashboard/SellerMetricsView';

export const DashboardPage: React.FC = () => {
  const { role } = useParams<{ role: string }>();
  const { user } = useAuth();

  if (!user) return null;

  const roleName = user.role.toUpperCase();

  const getRoleIcon = () => {
    switch (user.role) {
      case 'ARTIST':
        return Palette;
      case 'ORGANIZER':
        return Compass;
      case 'ADMIN':
        return ShieldCheck;
      default:
        return ShoppingBag;
    }
  };

  const RoleIcon = getRoleIcon();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Header Banner */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 sm:p-8 border border-outline/20 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-container/20 text-primary border border-primary/20 flex items-center justify-center font-serif text-2xl font-bold">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              <span>{user.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 id="dashboard-user-name" className="font-serif text-2xl sm:text-3xl font-bold text-on-surface">
                {user.name}
              </h1>
              <span
                id="dashboard-role-badge"
                className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-primary-container/20 text-primary border border-primary/20"
              >
                {roleName}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Credit Balance Card */}
        <div className="flex items-center gap-4 bg-surface-container-low px-5 py-3 rounded-lg border border-outline/20">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant block">
              Internal Credit Balance
            </span>
            <span id="dashboard-wallet-balance" className="font-serif text-xl sm:text-2xl font-bold text-on-surface">
              {user.walletBalance.toFixed(2)}{' '}
              <span className="text-xs font-sans font-normal text-on-surface-variant">Credits</span>
            </span>
          </div>
        </div>
      </div>

      {/* Seller Sales Performance Metrics (ARTIST Role) */}
      {user.role === 'ARTIST' && (
        <div className="mb-8">
          <SellerMetricsView />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Quick Profile Info */}
        <div className="space-y-6">
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 border border-outline/20">
            <h2 className="font-serif text-lg font-bold text-on-surface mb-3 flex items-center gap-2">
              <RoleIcon className="w-4 h-4 text-primary" />
              <span>{roleName} Overview</span>
            </h2>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
              {user.bio || 'No biography added yet. Update your profile in Account Settings.'}
            </p>
            <Link
              to="/setup"
              id="dashboard-edit-profile-btn"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium rounded border border-outline/20 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-primary" />
              <span>Configure Account & Settings</span>
            </Link>
          </div>
        </div>

        {/* Right Columns: Role Highlights & Quick Links */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 sm:p-8 border border-outline/20">
            <span className="text-[11px] uppercase tracking-widest font-semibold text-primary block mb-1">
              Active Session
            </span>
            <h2 className="font-serif text-xl font-bold text-on-surface mb-2">
              Welcome to your {role || user.role.toLowerCase()} dashboard
            </h2>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
              Your account is successfully authenticated with full Role-Based Access Control privileges. Browse available gallery pieces, participate in auctions, and manage your account seamlessly.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/"
                className="p-4 rounded-lg bg-surface-container-low hover:bg-surface-container border border-outline/20 transition-colors"
              >
                <div className="font-semibold text-sm text-on-surface mb-1">Explore Gallery</div>
                <div className="text-[11px] text-on-surface-variant">Browse heritage artworks and textiles.</div>
              </Link>
              <Link
                to="/setup"
                className="p-4 rounded-lg bg-surface-container-low hover:bg-surface-container border border-outline/20 transition-colors"
              >
                <div className="font-semibold text-sm text-on-surface mb-1">Security & Profile</div>
                <div className="text-[11px] text-on-surface-variant">Update personal bio, avatar, and password.</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
