import React from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  Calendar,
  Sparkles,
  ShieldCheck,
  Clock,
  Radio,
  Lock,
  Plus,
  Compass,
  ExternalLink,
} from 'lucide-react';
import { Exhibition } from '../../types/exhibition';
import { User } from '../../types/auth';

interface OrganizerDashboardLayoutProps {
  user: User;
  exhibitions: Exhibition[];
  isLoading: boolean;
  onOpenCreateExhibition: () => void;
  onOpenVipConfig: (exhibition: Exhibition) => void;
}

function formatExhibitionDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatVipRange(startStr: string | null, endStr: string | null): string {
  if (!startStr || !endStr) return 'No VIP early-access window active';
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Invalid schedule';

  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
}

export const OrganizerDashboardLayout: React.FC<OrganizerDashboardLayoutProps> = ({
  user,
  exhibitions,
  isLoading,
  onOpenCreateExhibition,
  onOpenVipConfig,
}) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Curator Identity & Header Bar */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 sm:p-8 border border-outline/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
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
                Curator / Organizer
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-primary" />
              <span>{user.bio || 'Curator of heritage art exhibitions and digital folk craft galleries.'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Credit Wallet Card */}
          <div className="flex items-center gap-3.5 bg-surface-container-low px-5 py-3 rounded-lg border border-outline/20">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant block">
                Internal Credit Wallet
              </span>
              <span id="dashboard-wallet-balance" className="font-serif text-xl font-bold text-on-surface">
                {user.walletBalance.toFixed(2)}{' '}
                <span className="text-xs font-sans font-normal text-on-surface-variant">Credits</span>
              </span>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            id="create-exhibition-btn"
            onClick={onOpenCreateExhibition}
            className="flex items-center gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white bg-on-surface hover:bg-black rounded transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Curate Exhibition</span>
          </button>
        </div>
      </div>

      {/* Exhibitions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-on-surface">
              Curated Virtual Exhibitions
            </h2>
            <p className="text-xs text-on-surface-variant">
              Manage virtual gallery galleries, access pricing, and exclusive VIP viewing schedules.
            </p>
          </div>
          <span className="text-xs font-medium text-on-surface-variant bg-surface-container px-3 py-1 rounded-full border border-outline/20">
            {exhibitions.length} Exhibition{exhibitions.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-16 text-center text-on-surface-variant">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs">Loading curated exhibitions...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && exhibitions.length === 0 && (
          <div
            id="no-exhibitions-banner"
            className="p-12 text-center rounded-xl bg-surface-container-low border border-dashed border-outline/40 space-y-4"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-on-surface">No exhibitions published yet</h3>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto mt-1">
                You haven't curated any virtual exhibitions yet. Launch your first heritage gallery to configure custom wall layouts and exclusive VIP viewing windows.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenCreateExhibition}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-primary hover:bg-primary-hover rounded transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Curate First Exhibition</span>
            </button>
          </div>
        )}

        {/* Exhibition Grid */}
        {!isLoading && exhibitions.length > 0 && (
          <div id="organizer-exhibitions-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exhibitions.map((exhibition) => {
              const isVipConfigured = exhibition.isVipEnabled || Boolean(exhibition.vipStartTime && exhibition.vipEndTime);

              return (
                <div
                  key={exhibition.id}
                  id={`exhibition-card-${exhibition.id}`}
                  className="bg-surface-bright rounded-xl ambient-shadow border border-outline/30 overflow-hidden flex flex-col justify-between"
                >
                  {/* Card Header & Banner */}
                  <div>
                    {exhibition.bannerUrl ? (
                      <div className="h-44 w-full overflow-hidden bg-surface-container">
                        <img
                          src={exhibition.bannerUrl}
                          alt={exhibition.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="h-32 w-full bg-surface-container-low border-b border-outline/20 flex items-center justify-center text-on-surface-variant/40">
                        <Calendar className="w-10 h-10" />
                      </div>
                    )}

                    <div className="p-6 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-serif text-lg sm:text-xl font-bold text-on-surface line-clamp-1">
                          {exhibition.title}
                        </h3>
                        <span className="shrink-0 text-xs font-bold font-serif text-primary bg-primary-container/20 px-2.5 py-1 rounded border border-primary/20">
                          {exhibition.ticketPrice.toFixed(2)} Credits
                        </span>
                      </div>

                      <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                        {exhibition.description}
                      </p>

                      {/* General Public Dates */}
                      <div className="text-[11px] text-on-surface-variant flex items-center gap-1.5 pt-1">
                        <Calendar className="w-3.5 h-3.5 text-on-surface-variant/60" />
                        <span>Public: {formatExhibitionDate(exhibition.startTime)} – {formatExhibitionDate(exhibition.endTime)}</span>
                      </div>
                    </div>
                  </div>

                  {/* VIP Viewing Schedule Sub-Card */}
                  <div className="p-6 pt-0 space-y-4">
                    <div className="p-4 rounded-lg bg-surface border border-outline/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span>VIP Viewing Window</span>
                        </div>

                        {/* Status Badge */}
                        <span
                          id={`vip-status-badge-${exhibition.id}`}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border flex items-center gap-1 ${
                            exhibition.vipStatus === 'SCHEDULED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : exhibition.vipStatus === 'ACTIVE'
                              ? 'bg-primary-container/30 text-primary border-primary/30'
                              : exhibition.vipStatus === 'CONCLUDED'
                              ? 'bg-neutral-100 text-neutral-600 border-neutral-300'
                              : 'bg-surface-container text-on-surface-variant border-outline/30'
                          }`}
                        >
                          {exhibition.vipStatus === 'ACTIVE' && <Radio className="w-2.5 h-2.5 animate-pulse" />}
                          {exhibition.vipStatus === 'SCHEDULED' && <ShieldCheck className="w-2.5 h-2.5" />}
                          {exhibition.vipStatus === 'CONCLUDED' && <Clock className="w-2.5 h-2.5" />}
                          {exhibition.vipStatus === 'NOT_CONFIGURED' && <Lock className="w-2.5 h-2.5" />}
                          <span>
                            {exhibition.vipStatus === 'ACTIVE'
                              ? 'VIP Live'
                              : exhibition.vipStatus === 'SCHEDULED'
                              ? 'VIP Scheduled'
                              : exhibition.vipStatus === 'CONCLUDED'
                              ? 'VIP Ended'
                              : 'VIP Disabled'}
                          </span>
                        </span>
                      </div>

                      {/* VIP Window Schedule Details */}
                      <div className="text-xs text-on-surface-variant flex items-center justify-between">
                        <span className="text-[11px] truncate pr-2">
                          {formatVipRange(exhibition.vipStartTime, exhibition.vipEndTime)}
                        </span>
                        {exhibition.vipDuration && (
                          <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded bg-surface-container text-on-surface border border-outline/20">
                            {exhibition.vipDuration}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Trigger Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to={`/exhibitions/${exhibition.id}`}
                        id={`view-exhibition-btn-${exhibition.id}`}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold uppercase tracking-wider text-on-surface hover:text-white bg-surface hover:bg-on-surface border border-outline/30 rounded transition-all shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Gallery</span>
                      </Link>
                      <button
                        type="button"
                        id={`configure-vip-btn-${exhibition.id}`}
                        onClick={() => onOpenVipConfig(exhibition)}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold uppercase tracking-wider text-on-surface hover:text-white bg-surface-container hover:bg-on-surface border border-outline/30 rounded transition-all shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-primary group-hover:text-white" />
                        <span>{isVipConfigured ? 'VIP Window' : 'Set Up VIP'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
