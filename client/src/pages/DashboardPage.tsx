import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wallet, Settings, ShoppingBag, Palette, Compass, ShieldCheck, Plus, Package } from 'lucide-react';
import { CreateArtworkModal } from '../components/marketplace/CreateArtworkModal';
import { artworkApi } from '../services/artwork.service';
import { Artwork } from '../types/artwork';

export const DashboardPage: React.FC = () => {
  const { role } = useParams<{ role: string }>();
  const { user } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoadingArtworks, setIsLoadingArtworks] = useState(false);

  useEffect(() => {
    if (user && user.role === 'ARTIST') {
      setIsLoadingArtworks(true);
      artworkApi
        .getMyArtworks()
        .then((data) => setArtworks(data))
        .catch((err) => console.error('Failed to load artist artworks:', err))
        .finally(() => setIsLoadingArtworks(false));
    }
  }, [user]);

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

  const handleArtworkCreated = (newArtwork: Artwork) => {
    setArtworks((prev) => [newArtwork, ...prev]);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Header Banner */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 sm:p-8 border border-outline/20 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-container/20 text-primary border border-primary/20 flex items-center justify-center font-serif text-2xl font-bold overflow-hidden">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
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

        {/* Right Columns: Role Highlights & Storefront */}
        <div className="md:col-span-2 space-y-6">
          {/* Artist Storefront Section */}
          {user.role === 'ARTIST' && (
            <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 sm:p-8 border border-outline/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <span className="text-[11px] uppercase tracking-widest font-semibold text-primary block mb-1">
                    Storefront Management
                  </span>
                  <h2 className="font-serif text-xl font-bold text-on-surface">
                    Your Published Artworks
                  </h2>
                </div>
                <button
                  id="add-artwork-btn"
                  onClick={() => setIsModalOpen(true)}
                  className="px-5 py-2.5 bg-primary text-on-primary font-semibold text-xs uppercase tracking-wider rounded-full hover:bg-surface-tint transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Artwork</span>
                </button>
              </div>

              {isLoadingArtworks ? (
                <div className="text-center py-8 text-xs text-on-surface-variant">Loading your artworks...</div>
              ) : artworks.length === 0 ? (
                <div id="no-artworks-banner" className="text-center py-10 px-4 bg-surface-container-low rounded-lg border border-dashed border-outline/30">
                  <Package className="w-8 h-8 text-on-surface-variant mx-auto mb-2 opacity-50" />
                  <p className="font-serif text-base font-bold text-on-surface mb-1">No Artworks Published Yet</p>
                  <p className="text-xs text-on-surface-variant max-w-sm mx-auto mb-4">
                    Click "Add New Artwork" to publish your handcrafted Jamdani sarees, Nakshi Kantha quilts, terracotta, or heritage craft items.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-primary/10 text-primary font-semibold text-xs uppercase tracking-wider rounded-full hover:bg-primary/20 transition-all"
                  >
                    + Publish First Artwork
                  </button>
                </div>
              ) : (
                <div id="artworks-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {artworks.map((artwork) => (
                    <div
                      key={artwork.id}
                      className="bg-surface-container-low rounded-lg border border-outline/20 overflow-hidden flex flex-col hover:border-outline/40 transition-colors"
                    >
                      <div className="h-36 bg-surface-container-high relative overflow-hidden">
                        <img
                          src={artwork.imageUrl}
                          alt={artwork.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-surface-container-lowest/90 text-on-surface backdrop-blur-xs border border-outline/20">
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
                          <p className="text-xs text-on-surface-variant line-clamp-2 mb-2">
                            {artwork.description}
                          </p>
                          {(artwork.dimensions || artwork.weight) && (
                            <div className="text-[11px] text-on-surface-variant/80 mb-2 flex flex-wrap gap-2">
                              {artwork.dimensions && <span>Size: {artwork.dimensions}</span>}
                              {artwork.weight && <span>Weight: {artwork.weight} {artwork.weightUnit || 'kg'}</span>}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between border-t border-outline/10 pt-2.5 mt-auto">
                          <span className="text-[11px] text-on-surface-variant">Price</span>
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
          )}

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

      {/* Create Artwork Modal */}
      <CreateArtworkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onArtworkCreated={handleArtworkCreated}
      />
    </div>
  );
};

export default DashboardPage;

