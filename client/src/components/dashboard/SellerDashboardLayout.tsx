import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Palette,
  Wallet,
  Settings,
  Plus,
  Package,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  PackageCheck,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { User } from '../../types/auth';
import { Artwork } from '../../types/artwork';

interface SellerDashboardLayoutProps {
  user: User;
  artworks: Artwork[];
  isLoadingArtworks: boolean;
  onOpenAddModal: () => void;
}

export const SellerDashboardLayout: React.FC<SellerDashboardLayoutProps> = ({
  user,
  artworks,
  isLoadingArtworks,
  onOpenAddModal,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  // Filter artworks by availability if filter is applied
  const filteredArtworks = artworks.filter((artwork) => {
    if (selectedFilter === 'ALL') return true;
    return artwork.availability === selectedFilter;
  });

  const availableCount = artworks.filter((a) => a.availability === 'AVAILABLE').length;
  const soldCount = artworks.filter((a) => a.availability === 'SOLD').length;

  return (
    <div id="seller-dashboard-container" className="space-y-8">
      {/* 1. Artist Studio Header & Identity Bar */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 sm:p-8 border border-outline/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Artist Bio & Avatar */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-container/20 text-primary border border-primary/20 flex items-center justify-center font-serif text-2xl font-bold shrink-0 overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 id="dashboard-user-name" className="font-serif text-2xl sm:text-3xl font-bold text-on-surface">
                  {user.name}
                </h1>
                <span
                  id="dashboard-role-badge"
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-primary-container/20 text-primary border border-primary/20"
                >
                  {user.role}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-status-valid/10 text-status-valid border border-status-valid/20">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified Artisan</span>
                </span>
              </div>
              <p className="text-xs text-on-surface-variant max-w-xl line-clamp-2">
                {user.bio || 'Master craftsman dedicated to traditional Bangladeshi heritage art and textile preservation.'}
              </p>
              <div className="text-[11px] text-on-surface-variant/80 mt-1 flex items-center gap-3">
                <span>{user.email}</span>
                <span>•</span>
                <span className="text-primary font-medium">Digital Studio & Storefront</span>
              </div>
            </div>
          </div>

          {/* Right Header Controls: Wallet & Quick Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Credit Balance Card */}
            <div className="flex items-center gap-3.5 bg-surface-container-low px-4 py-3 rounded-lg border border-outline/20">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant block">
                  Credit Wallet
                </span>
                <span id="dashboard-wallet-balance" className="font-serif text-xl sm:text-2xl font-bold text-on-surface">
                  {user.walletBalance.toFixed(2)}{' '}
                  <span className="text-xs font-sans font-normal text-on-surface-variant">Credits</span>
                </span>
              </div>
            </div>

            {/* Add Artwork Button */}
            <button
              id="add-artwork-btn"
              onClick={onOpenAddModal}
              className="px-5 py-3 bg-primary text-on-primary font-semibold text-xs uppercase tracking-wider rounded-full hover:bg-surface-tint transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Artwork</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Sales & Performance Metrics Layout */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-on-surface flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span>Studio Performance & Sales Overview</span>
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Key indicators for your digital storefront and craft revenue.
            </p>
          </div>
          <span className="text-[11px] uppercase tracking-wider font-medium text-on-surface-variant bg-surface-container px-3 py-1 rounded-full border border-outline/20">
            Real-time Metrics
          </span>
        </div>

        {/* 4 KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Total Revenue */}
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline/20 ambient-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
                Total Revenue
              </span>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div id="metric-total-revenue" className="font-serif font-bold text-2xl text-on-surface">
              0.00 <span className="text-xs font-sans font-normal text-on-surface-variant">Credits</span>
            </div>
            <p className="text-[11px] text-on-surface-variant/80 mt-1">
              Gross credits earned from completed sales
            </p>
          </div>

          {/* Metric 2: Total Orders */}
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline/20 ambient-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
                Total Orders
              </span>
              <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                <ShoppingBag className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div id="metric-total-orders" className="font-serif font-bold text-2xl text-on-surface">
              0
            </div>
            <p className="text-[11px] text-on-surface-variant/80 mt-1">
              Successful customer orders completed
            </p>
          </div>

          {/* Metric 3: Average Order Value */}
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline/20 ambient-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
                Avg. Order Value
              </span>
              <div className="p-2 rounded-lg bg-tertiary/10 text-tertiary">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div id="metric-avg-order-value" className="font-serif font-bold text-2xl text-on-surface">
              0.00 <span className="text-xs font-sans font-normal text-on-surface-variant">Credits</span>
            </div>
            <p className="text-[11px] text-on-surface-variant/80 mt-1">
              Average revenue per artwork purchase
            </p>
          </div>

          {/* Metric 4: Active Inventory */}
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline/20 ambient-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">
                Active Inventory
              </span>
              <div className="p-2 rounded-lg bg-surface-container text-on-surface-variant">
                <PackageCheck className="w-4 h-4" />
              </div>
            </div>
            <div id="metric-active-listings" className="font-serif font-bold text-2xl text-on-surface">
              {artworks.length} <span className="text-xs font-sans font-normal text-on-surface-variant">Listings</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-on-surface-variant/80 mt-1">
              <span>{availableCount} Available</span>
              <span>•</span>
              <span>{soldCount} Sold</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Studio Grid: Storefront & Studio Information Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Storefront Management & Artworks Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 sm:p-8 border border-outline/20">
            {/* Storefront Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-outline/10">
              <div>
                <span className="text-[11px] uppercase tracking-widest font-semibold text-primary block mb-1">
                  Storefront Management
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-on-surface flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  <span>Your Published Artworks</span>
                  <span className="text-xs font-sans font-normal text-on-surface-variant px-2.5 py-0.5 rounded-full bg-surface-container">
                    {artworks.length}
                  </span>
                </h2>
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(['ALL', 'AVAILABLE', 'SOLD'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedFilter === filter
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {filter === 'ALL' ? 'All Artworks' : filter === 'AVAILABLE' ? 'Available' : 'Sold'}
                  </button>
                ))}
              </div>
            </div>

            {/* Artworks Content */}
            {isLoadingArtworks ? (
              <div className="text-center py-12 text-xs text-on-surface-variant flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Loading your artworks...</span>
              </div>
            ) : filteredArtworks.length === 0 ? (
              <div
                id="no-artworks-banner"
                className="text-center py-12 px-6 bg-surface-container-low rounded-lg border border-dashed border-outline/30"
              >
                <Package className="w-10 h-10 text-on-surface-variant mx-auto mb-3 opacity-50" />
                <h3 className="font-serif text-lg font-bold text-on-surface mb-1">
                  {selectedFilter === 'ALL' ? 'No Artworks Published Yet' : `No ${selectedFilter.toLowerCase()} artworks`}
                </h3>
                <p className="text-xs text-on-surface-variant max-w-md mx-auto mb-5 leading-relaxed">
                  Start publishing your handcrafted Jamdani sarees, Nakshi Kantha quilts, terracotta clay sculptures, or traditional crafts to your digital storefront.
                </p>
                <button
                  onClick={onOpenAddModal}
                  className="px-5 py-2.5 bg-primary text-on-primary font-semibold text-xs uppercase tracking-wider rounded-full hover:bg-surface-tint transition-all inline-flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Publish First Artwork</span>
                </button>
              </div>
            ) : (
              <div id="artworks-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredArtworks.map((artwork) => (
                  <div
                    key={artwork.id}
                    className="bg-surface-container-low rounded-lg border border-outline/20 overflow-hidden flex flex-col hover:border-outline/40 transition-colors group"
                  >
                    <div className="h-44 bg-surface-container-high relative overflow-hidden">
                      <img
                        src={artwork.imageUrl}
                        alt={artwork.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span
                        className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider backdrop-blur-xs border ${
                          artwork.availability === 'AVAILABLE'
                            ? 'bg-surface-container-lowest/90 text-status-valid border-status-valid/30'
                            : 'bg-surface-container-lowest/90 text-on-surface-variant border-outline/20'
                        }`}
                      >
                        {artwork.availability}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-primary block mb-1">
                          {artwork.medium}
                        </span>
                        <h3 className="font-serif text-base font-bold text-on-surface mb-1 line-clamp-1">
                          {artwork.title}
                        </h3>
                        <p className="text-xs text-on-surface-variant line-clamp-2 mb-2 leading-relaxed">
                          {artwork.description}
                        </p>
                        {(artwork.dimensions || artwork.weight) && (
                          <div className="text-[11px] text-on-surface-variant/80 mb-2 flex flex-wrap gap-2">
                            {artwork.dimensions && <span>Size: {artwork.dimensions}</span>}
                            {artwork.weight && (
                              <span>
                                Weight: {artwork.weight} {artwork.weightUnit || 'kg'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-outline/10 pt-3 mt-auto">
                        <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-medium">
                          Listing Price
                        </span>
                        <span className="font-serif font-bold text-sm text-primary">
                          {artwork.price.toFixed(2)} Credits
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Studio Information & Summary Cards */}
        <div className="space-y-6">
          {/* Studio Profile Card */}
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 border border-outline/20 space-y-4">
            <h3 className="font-serif text-lg font-bold text-on-surface flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Studio & Profile Summary</span>
            </h3>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              {user.bio || 'Your artist profile is live. Add a detailed biography highlighting your craft heritage and awards in Account Settings.'}
            </p>

            <div className="border-t border-outline/10 pt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>Account Role:</span>
                <span className="font-semibold text-on-surface">{user.role}</span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>Total Catalog:</span>
                <span className="font-semibold text-on-surface">{artworks.length} Items</span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>Verification:</span>
                <span className="font-semibold text-status-valid">Verified Artisan</span>
              </div>
            </div>

            <Link
              to="/setup"
              id="dashboard-edit-profile-btn"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium rounded border border-outline/20 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-primary" />
              <span>Configure Studio & Account</span>
            </Link>
          </div>

          {/* Storefront Guidance Card */}
          <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 border border-outline/20">
            <h3 className="font-serif text-base font-bold text-on-surface mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span>Storefront Guidelines</span>
            </h3>
            <ul className="text-xs text-on-surface-variant space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>Upload high-resolution photography showcasing heritage textures and needlework.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>Specify exact dimensions and craft materials for accurate buyer transparency.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>Duplicate detection checks images upon submission to protect original folk artisans.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
