import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Palette,
  Wallet,
  Settings,
  Plus,
  Edit,
  Trash2,
  Ticket,
  ArrowRight,
  Sparkles,
  Crown,
} from 'lucide-react';
import { User } from '../../types/auth';
import { Artwork } from '../../types/artwork';
import { ExhibitionService, Exhibition } from '../../services/exhibition.service';
import { getArtworkImageUrl, DEFAULT_ARTWORK_IMAGE } from '../../utils/image.util';
import { TopUpCreditsModal } from '../wallet/TopUpCreditsModal';

interface OrganizerDashboardViewProps {
  user: User;
  artworks: Artwork[];
  isLoadingArtworks: boolean;
  onOpenAddModal: () => void;
  onOpenEditModal: (artwork: Artwork) => void;
  onDeleteArtwork: (id: string) => void;
  onOpenCreateExhibitionModal: () => void;
}

type TabType = 'exhibitions' | 'artworks';

export const OrganizerDashboardView: React.FC<OrganizerDashboardViewProps> = ({
  user,
  artworks,
  isLoadingArtworks,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteArtwork,
  onOpenCreateExhibitionModal,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('exhibitions');
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [isLoadingExhibitions, setIsLoadingExhibitions] = useState<boolean>(true);
  const [isTopUpOpen, setIsTopUpOpen] = useState<boolean>(false);

  const fetchOrganizerExhibitions = async () => {
    try {
      setIsLoadingExhibitions(true);
      const data = await ExhibitionService.getExhibitions(undefined, user.id);
      setExhibitions(data);
    } catch (err) {
      console.error('Failed to load organizer exhibitions:', err);
    } finally {
      setIsLoadingExhibitions(false);
    }
  };

  useEffect(() => {
    fetchOrganizerExhibitions();
  }, [user.id]);

  const totalTicketsSold = exhibitions.reduce((acc, curr) => acc + (curr.ticketsCount || 0), 0);

  return (
    <div id="organizer-dashboard-container" className="space-y-8">
      {/* 1. Organizer Identity & Action Banner */}
      <div className="bg-surface-container-lowest rounded-2xl ambient-shadow p-6 sm:p-8 border border-outline/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Organizer Avatar & Bio */}
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
                  ORGANIZER
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-status-valid/10 text-status-valid border border-status-valid/20">
                  <Sparkles className="w-3 h-3" /> Virtual Curator
                </span>
              </div>
              <p className="text-xs text-on-surface-variant max-w-xl">
                {user.bio || 'Curator and patron orchestrating virtual heritage craft exhibitions.'}
              </p>
            </div>
          </div>

          {/* Wallet Balance & Action Controls */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Wallet Balance Card */}
            <div className="flex items-center gap-4 bg-surface-container-low px-4 py-3 rounded-xl border border-outline/20">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant block">
                  Wallet Balance
                </span>
                <span id="dashboard-wallet-balance" className="font-serif text-xl font-bold text-on-surface">
                  {user.walletBalance.toFixed(2)}{' '}
                  <span className="text-xs font-sans font-normal text-on-surface-variant">Credits</span>
                </span>
              </div>
              <button
                type="button"
                id="dashboard-topup-btn"
                onClick={() => setIsTopUpOpen(true)}
                className="ml-2 px-2.5 py-1.5 bg-primary text-on-primary text-[11px] font-semibold uppercase tracking-wider rounded hover:bg-surface-tint transition-all"
              >
                + Top Up
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="add-artwork-btn"
                onClick={onOpenAddModal}
                className="py-2.5 px-4 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold uppercase tracking-wider rounded-lg border border-outline/20 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Upload artwork to showcase in your exhibitions"
              >
                <Plus className="w-4 h-4 text-primary" />
                <span>Upload Artwork</span>
              </button>

              <button
                type="button"
                id="create-exhibition-btn"
                onClick={onOpenCreateExhibitionModal}
                className="py-2.5 px-4 bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-surface-tint transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Create Exhibition</span>
              </button>

              <Link
                to="/setup"
                id="dashboard-edit-profile-btn"
                className="p-2.5 rounded-lg border border-outline/20 text-on-surface hover:bg-surface-container transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Metric Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline/20 ambient-shadow">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Virtual Exhibitions</span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div id="organizer-kpi-exhibitions-count" className="font-serif text-3xl font-bold text-on-surface">
            {exhibitions.length}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">Interactive 3D gallery halls</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline/20 ambient-shadow">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">My Exhibition Artworks</span>
            <Palette className="w-4 h-4 text-primary" />
          </div>
          <div id="organizer-kpi-artworks-count" className="font-serif text-3xl font-bold text-on-surface">
            {artworks.length}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">Artworks uploaded for curation</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline/20 ambient-shadow">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold">Ticket Passes Issued</span>
            <Ticket className="w-4 h-4 text-primary" />
          </div>
          <div id="organizer-kpi-tickets-count" className="font-serif text-3xl font-bold text-on-surface">
            {totalTicketsSold}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">Total visitor admission tokens</p>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="border-b border-outline/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <button
            id="organizer-exhibitions-tab"
            type="button"
            onClick={() => setActiveTab('exhibitions')}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === 'exhibitions' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>My Virtual Exhibitions ({exhibitions.length})</span>
            {activeTab === 'exhibitions' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>

          <button
            id="organizer-artworks-tab"
            type="button"
            onClick={() => setActiveTab('artworks')}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === 'artworks' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>My Uploaded Artworks ({artworks.length})</span>
            {activeTab === 'artworks' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        </div>

        <div>
          {activeTab === 'exhibitions' ? (
            <button
              onClick={onOpenCreateExhibitionModal}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Exhibition</span>
            </button>
          ) : (
            <button
              onClick={onOpenAddModal}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload New Artwork</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Tab Content Views */}
      {activeTab === 'exhibitions' ? (
        /* Exhibitions List View */
        <div>
          {isLoadingExhibitions ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-on-surface-variant">Loading your curated exhibitions...</p>
            </div>
          ) : exhibitions.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-dashed border-outline/20 p-8 space-y-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="font-serif font-bold text-lg text-on-surface">No Virtual Exhibitions Created Yet</h3>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
                As an Organizer, upload your artworks and curate immersive virtual gallery exhibitions. Select from your own uploaded craft pieces to display on virtual walls.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                {artworks.length === 0 ? (
                  <button
                    type="button"
                    onClick={onOpenAddModal}
                    className="px-6 py-2.5 bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-surface-tint shadow-xs transition-all"
                  >
                    1. Upload Your First Artwork
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenCreateExhibitionModal}
                    className="px-6 py-2.5 bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-surface-tint shadow-xs transition-all"
                  >
                    Curate Your First Exhibition
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exhibitions.map((exh) => {
                const isLive = exh.status === 'ACTIVE';
                const isVip = exh.status === 'VIP_EXCLUSIVE';
                const isUpcoming = exh.status === 'UPCOMING';

                return (
                  <div
                    key={exh.id}
                    className="bg-surface-container-lowest rounded-2xl border border-outline/20 overflow-hidden flex flex-col justify-between ambient-shadow group hover:border-outline/40 transition-all"
                  >
                    {/* Header Image */}
                    <div className="relative h-48 bg-surface-container-high overflow-hidden">
                      <img
                        src={getArtworkImageUrl(
                          exh.bannerUrl || (exh.sampleArtworks && exh.sampleArtworks[0]?.imageUrl)
                        )}
                        alt={exh.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          if (target.src !== DEFAULT_ARTWORK_IMAGE) {
                            target.src = DEFAULT_ARTWORK_IMAGE;
                          }
                        }}
                      />

                      {/* Status Badge */}
                      <div className="absolute top-3 left-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md shadow-xs ${
                            isLive
                              ? 'bg-status-live/90 text-white'
                              : isVip
                              ? 'bg-amber-600/90 text-white'
                              : isUpcoming
                              ? 'bg-primary/90 text-white'
                              : 'bg-surface-container-highest/90 text-on-surface'
                          }`}
                        >
                          {isLive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                          {isVip && <Crown className="w-3 h-3" />}
                          <span>{exh.status}</span>
                        </span>
                      </div>

                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-surface-container-lowest/90 text-primary backdrop-blur-md shadow-xs">
                          {exh.ticketPrice === 0 ? 'Free' : `${exh.ticketPrice} Credits`}
                        </span>
                      </div>
                    </div>

                    {/* Exhibition Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-serif font-bold text-base text-on-surface mb-1 group-hover:text-primary transition-colors line-clamp-1">
                          {exh.title}
                        </h4>
                        <p className="text-xs text-on-surface-variant line-clamp-2 mb-4 leading-relaxed">
                          {exh.description || 'No description provided.'}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-[11px] mb-4">
                          <div className="p-2 rounded bg-surface-container-low border border-outline/10">
                            <span className="text-on-surface-variant block text-[9px] uppercase font-semibold">Exhibits</span>
                            <strong className="text-on-surface">{exh.artworksCount} Pieces</strong>
                          </div>
                          <div className="p-2 rounded bg-surface-container-low border border-outline/10">
                            <span className="text-on-surface-variant block text-[9px] uppercase font-semibold">Passes Sold</span>
                            <strong className="text-primary font-bold">{exh.ticketsCount} Passes</strong>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-outline/10 flex items-center justify-between">
                        <span className="text-[11px] text-on-surface-variant">
                          {new Date(exh.startTime).toLocaleDateString()}
                        </span>

                        <Link
                          to={`/exhibitions/${exh.id}`}
                          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider hover:bg-surface-tint transition-all shadow-xs flex items-center gap-1"
                        >
                          <span>Enter Hall</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Organizer Uploaded Artworks Grid */
        <div>
          {isLoadingArtworks ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-on-surface-variant">Loading your uploaded artworks...</p>
            </div>
          ) : artworks.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-dashed border-outline/20 p-8 space-y-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Palette className="w-7 h-7" />
              </div>
              <h3 className="font-serif font-bold text-lg text-on-surface">No Artworks Uploaded Yet</h3>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
                Upload your curated artisan textiles, terracotta pieces, or traditional craft items to showcase them in your exhibitions.
              </p>
              <button
                type="button"
                onClick={onOpenAddModal}
                className="px-6 py-2.5 bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-surface-tint shadow-xs transition-all inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Artwork</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {artworks.map((art) => (
                <div
                  key={art.id}
                  className="bg-surface-container-lowest rounded-xl border border-outline/20 overflow-hidden flex flex-col justify-between ambient-shadow group hover:border-outline/40 transition-all"
                >
                  <div className="relative aspect-4/3 bg-surface-container-high overflow-hidden">
                    <img
                      src={getArtworkImageUrl(art.imageUrl)}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (target.src !== DEFAULT_ARTWORK_IMAGE) {
                          target.src = DEFAULT_ARTWORK_IMAGE;
                        }
                      }}
                    />

                    {/* Moderation Status */}
                    <div className="absolute top-2 left-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md ${
                          art.moderationStatus === 'APPROVED'
                            ? 'bg-status-valid/90 text-white'
                            : art.moderationStatus === 'FLAGGED'
                            ? 'bg-amber-600/90 text-white'
                            : 'bg-surface-container-highest/90 text-on-surface'
                        }`}
                      >
                        {art.moderationStatus}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/60 text-white backdrop-blur-md">
                        {Number(art.price).toFixed(2)} Credits
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                        {art.title}
                      </h4>
                      <p className="text-xs text-on-surface-variant truncate">{art.medium}</p>
                    </div>

                    <div className="pt-3 border-t border-outline/10 mt-3 flex items-center justify-between">
                      <button
                        onClick={() => onOpenEditModal(art)}
                        className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                        title="Edit Artwork"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteArtwork(art.id)}
                        className="p-1.5 rounded hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
                        title="Delete Artwork"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top-Up Credits Modal */}
      <TopUpCreditsModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
      />
    </div>
  );
};
