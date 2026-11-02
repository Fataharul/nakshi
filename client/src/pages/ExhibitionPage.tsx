import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Sparkles,
  Ticket,
  Clock,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Lock,
  DoorOpen,
  Image as ImageIcon,
} from 'lucide-react';
import { exhibitionApi, ApiError } from '../services/exhibition.service';
import { useAuth } from '../context/AuthContext';
import { Exhibition, ExhibitionTicket, ExhibitionAccessResponse } from '../types/exhibition';

export const ExhibitionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();

  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [ticket, setTicket] = useState<ExhibitionTicket | null>(null);
  const [accessData, setAccessData] = useState<ExhibitionAccessResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isEntering, setIsEntering] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const [restrictionError, setRestrictionError] = useState<{
    message: string;
    code?: string;
  } | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);

    Promise.all([
      exhibitionApi.getExhibitionById(id),
      isAuthenticated ? exhibitionApi.getMyTicket(id).catch(() => null) : Promise.resolve(null),
    ])
      .then(([exh, userTicket]) => {
        setExhibition(exh);
        if (userTicket) setTicket(userTicket);
      })
      .catch((err) => console.error('Failed to load exhibition details:', err))
      .finally(() => setIsLoading(false));
  }, [id, isAuthenticated]);

  const handleBuyTicket = async (isVip: boolean) => {
    if (!id || !isAuthenticated) return;
    setIsPurchasing(true);
    setRestrictionError(null);
    setPurchaseSuccess(null);

    try {
      const newTicket = await exhibitionApi.purchaseTicket(id, isVip);
      setTicket(newTicket);
      setPurchaseSuccess(
        `Successfully issued ${isVip ? 'VIP Access Pass' : 'Standard Admission Ticket'} (${newTicket.ticketToken})!`
      );
    } catch (err: any) {
      setRestrictionError({
        message: err.message || 'Ticket purchase failed. Please verify your credit balance.',
        code: err.code,
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleEnterGallery = async () => {
    if (!id) return;
    setIsEntering(true);
    setRestrictionError(null);

    try {
      const response = await exhibitionApi.enterExhibition(id);
      setAccessData(response);
      if (response.ticket) {
        setTicket(response.ticket);
      }
    } catch (err: any) {
      if (err instanceof ApiError || err.statusCode === 403 || err.statusCode === 400) {
        setRestrictionError({
          message: err.message,
          code: err.code,
        });
      } else {
        setRestrictionError({
          message: err.message || 'Could not verify exhibition access permissions.',
        });
      }
    } finally {
      setIsEntering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs uppercase tracking-widest text-on-surface-variant font-medium">
            Loading Virtual Exhibition...
          </span>
        </div>
      </div>
    );
  }

  if (!exhibition) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="font-serif text-2xl font-bold text-on-surface mb-3">Exhibition Not Found</h2>
        <p className="text-on-surface-variant text-sm mb-6">
          The requested exhibition may have been moved or is currently unpublished.
        </p>
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary text-xs font-semibold rounded-full"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const isOrganizer = user && user.id === exhibition.organizerId;
  const isAdmin = user && user.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-surface pb-16">
      {/* Editorial Header Banner */}
      <div className="relative bg-surface-container border-b border-outline/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant hover:text-primary mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Directory
          </Link>

          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            {exhibition.isVipEnabled && (
              <span
                id="exhibition-vip-status-chip"
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase ${
                  exhibition.vipStatus === 'ACTIVE'
                    ? 'bg-primary text-on-primary animate-pulse'
                    : exhibition.vipStatus === 'SCHEDULED'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-surface text-on-surface-variant border border-outline/30'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {exhibition.vipStatus === 'ACTIVE'
                  ? 'VIP Early Access Active Now'
                  : exhibition.vipStatus === 'SCHEDULED'
                  ? `VIP Preview Scheduled (${exhibition.vipDuration || 'Preview Window'})`
                  : 'VIP Preview Concluded'}
              </span>
            )}

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium bg-surface text-on-surface border border-outline/30">
              <Calendar className="w-3.5 h-3.5 text-on-surface-variant" />
              Public: {new Date(exhibition.startTime).toLocaleDateString()} –{' '}
              {new Date(exhibition.endTime).toLocaleDateString()}
            </span>
          </div>

          <h1
            id="exhibition-page-title"
            className="font-serif text-3xl sm:text-5xl font-bold text-on-surface tracking-tight mb-4"
          >
            {exhibition.title}
          </h1>

          <p className="text-on-surface-variant text-sm sm:text-base max-w-3xl leading-relaxed mb-6 font-serif italic">
            "{exhibition.description}"
          </p>

          <div className="flex flex-wrap items-center gap-6 text-xs text-on-surface-variant pt-4 border-t border-outline/20">
            <div>
              <span className="font-semibold text-on-surface">Curated by: </span>
              {exhibition.organizer?.name || 'Heritage Curator'}
            </div>
            <div>
              <span className="font-semibold text-on-surface">Admission: </span>
              {exhibition.ticketPrice > 0 ? `${exhibition.ticketPrice} credits` : 'Complimentary'}
            </div>
            {exhibition.vipStartTime && (
              <div>
                <span className="font-semibold text-primary">VIP Preview Window: </span>
                {new Date(exhibition.vipStartTime).toLocaleString()} –{' '}
                {new Date(exhibition.vipEndTime!).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Timestamp-Based VIP Access Restriction Alert Banner */}
        {restrictionError && (
          <div
            id="vip-access-restricted-banner"
            className="p-5 rounded-xl border border-red-200 bg-red-50 text-red-900 ambient-shadow"
            role="alert"
          >
            <div className="flex items-start gap-3.5">
              <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-base text-red-950">
                  {restrictionError.code === 'VIP_NOT_STARTED'
                    ? 'VIP Viewing Window Has Not Commenced'
                    : restrictionError.code === 'VIP_PREVIEW_ONLY'
                    ? 'Exclusive VIP Preview in Progress'
                    : restrictionError.code === 'VIP_CONCLUDED'
                    ? 'VIP Viewing Window Concluded'
                    : restrictionError.code === 'EXHIBITION_ENDED'
                    ? 'Virtual Exhibition Concluded'
                    : 'Access Restricted'}
                </h3>
                <p className="text-xs sm:text-sm text-red-800 leading-relaxed">
                  {restrictionError.message}
                </p>

                {restrictionError.code === 'VIP_NOT_STARTED' && exhibition.vipStartTime && (
                  <div className="pt-2 text-xs text-red-700 flex items-center gap-1.5 font-medium">
                    <Clock className="w-4 h-4" />
                    Preview begins at {new Date(exhibition.vipStartTime).toLocaleString()}
                  </div>
                )}

                {restrictionError.code === 'VIP_PREVIEW_ONLY' && (
                  <div className="pt-2">
                    <button
                      type="button"
                      id="upgrade-to-vip-btn"
                      onClick={() => handleBuyTicket(true)}
                      disabled={isPurchasing}
                      className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded hover:bg-surface-tint transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Get VIP Early Access Pass Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Purchase Success Banner */}
        {purchaseSuccess && (
          <div
            id="ticket-purchase-success-banner"
            className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 flex items-center gap-3 text-xs sm:text-sm font-medium"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{purchaseSuccess}</span>
          </div>
        )}

        {/* Virtual Gallery Room (Rendered when access is granted) */}
        {accessData ? (
          <div
            id="virtual-gallery-view"
            className="p-6 sm:p-8 bg-surface-bright rounded-2xl border border-outline/30 ambient-shadow space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-outline/20">
              <div>
                <span
                  id="gallery-access-badge"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300"
                >
                  <DoorOpen className="w-4 h-4 text-emerald-700" />
                  {accessData.accessType === 'VIP'
                    ? 'VIP Exclusive Vernissage Access'
                    : accessData.accessType === 'ORGANIZER'
                    ? 'Curatorial Preview (Organizer Access)'
                    : 'General Admission Access'}
                </span>
                <h2 className="font-serif text-2xl font-bold text-on-surface mt-2">
                  Welcome to the Virtual Gallery
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Explore curated artifacts arranged along virtual exhibition walls.
                </p>
              </div>

              {ticket && (
                <div
                  id="ticket-token-display"
                  className="p-3 bg-surface rounded-lg border border-outline/30 text-right"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant block">
                    Access Pass Token
                  </span>
                  <span className="font-mono text-xs font-bold text-primary">
                    {ticket.ticketToken}
                  </span>
                </div>
              )}
            </div>

            {/* Artworks Gallery Wall Grid */}
            <div>
              <h3 className="font-serif text-lg font-bold text-on-surface mb-4">
                Curated Artifacts ({accessData.artworks.length})
              </h3>
              {accessData.artworks.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-outline/40 rounded-xl bg-surface">
                  <ImageIcon className="w-10 h-10 text-on-surface-variant/40 mx-auto mb-2" />
                  <p className="text-xs text-on-surface-variant">
                    Curator is currently positioning artworks for this exhibition.
                  </p>
                </div>
              ) : (
                <div
                  id="gallery-artworks-grid"
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
                >
                  {accessData.artworks.map((item) => (
                    <div
                      key={item.id}
                      className="group bg-surface rounded-xl overflow-hidden border border-outline/30 hover:border-primary/50 transition-all ambient-shadow flex flex-col"
                    >
                      <div className="relative aspect-[4/3] bg-surface-container overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {item.wallPosition != null && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-white text-[10px] font-mono rounded">
                            Wall Bay #{item.wallPosition}
                          </span>
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                            {item.medium}
                          </span>
                          <h4 className="font-serif font-bold text-sm text-on-surface mt-0.5 line-clamp-1">
                            {item.title}
                          </h4>
                        </div>
                        <div className="mt-3 pt-3 border-t border-outline/10 flex items-center justify-between">
                          <span className="text-xs font-semibold text-on-surface">
                            {item.price} credits
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Pre-Entry Access Portal */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left 2 Cols: Access Pass Overview */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-surface-bright rounded-2xl border border-outline/30 p-6 sm:p-8 ambient-shadow space-y-4">
                <div className="flex items-center gap-2.5">
                  <DoorOpen className="w-5 h-5 text-primary" />
                  <h2 className="font-serif text-xl font-bold text-on-surface">
                    Virtual Exhibition Access Portal
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  Admission tickets grant immersive digital access to the curated virtual exhibition
                  gallery, showcasing high-resolution traditional crafts and historical contextual
                  provenance.
                </p>

                {ticket ? (
                  <div
                    id="my-ticket-badge"
                    className="p-4 bg-surface rounded-xl border border-outline/30 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <Ticket className="w-5 h-5 text-primary shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-on-surface">
                            {ticket.isVip ? 'VIP Early Access Pass' : 'General Admission Pass'}
                          </span>
                          {ticket.isVip && (
                            <span className="px-2 py-0.5 bg-primary text-on-primary text-[10px] font-bold uppercase rounded-full">
                              VIP
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-on-surface-variant">
                          Token: {ticket.ticketToken}
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Issued & Valid
                    </span>
                  </div>
                ) : (
                  <div className="p-4 bg-surface-container rounded-xl border border-outline/20 flex items-center gap-3 text-xs text-on-surface-variant">
                    <Lock className="w-4 h-4 text-on-surface-variant shrink-0" />
                    <span>
                      {isOrganizer || isAdmin
                        ? 'You have administrative curator access to this exhibition.'
                        : 'You do not hold an admission pass for this exhibition yet. Select a pass below.'}
                    </span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    id="enter-exhibition-btn"
                    onClick={handleEnterGallery}
                    disabled={isEntering}
                    className="w-full sm:w-auto px-8 py-3.5 bg-on-surface hover:bg-black text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ambient-shadow flex items-center justify-center gap-2"
                  >
                    <DoorOpen className="w-4 h-4" />
                    {isEntering
                      ? 'Verifying Schedule & Access...'
                      : ticket?.isVip || isOrganizer
                      ? 'Enter Virtual Gallery (VIP Preview)'
                      : 'Enter Virtual Gallery'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Col: Ticket Options Card */}
            <div className="space-y-4">
              <div
                id="ticket-purchase-card"
                className="bg-surface-bright rounded-2xl border border-outline/30 p-6 ambient-shadow space-y-4"
              >
                <div className="flex items-center gap-2 pb-3 border-b border-outline/20">
                  <Ticket className="w-4 h-4 text-primary" />
                  <h3 className="font-serif font-bold text-base text-on-surface">
                    Exhibition Passes
                  </h3>
                </div>

                {/* VIP Pass Option */}
                {exhibition.isVipEnabled && (
                  <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        VIP Vernissage Pass
                      </span>
                      <span className="text-xs font-bold text-primary">
                        {Math.max(10, Math.round(exhibition.ticketPrice * 1.5))} credits
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Exclusive admission during the {exhibition.vipDuration || 'preview window'}{' '}
                      prior to general public opening.
                    </p>
                    <button
                      type="button"
                      id="buy-vip-ticket-btn"
                      onClick={() => handleBuyTicket(true)}
                      disabled={isPurchasing || (ticket?.isVip ?? false)}
                      className="w-full py-2 bg-primary text-on-primary hover:bg-surface-tint text-xs font-semibold rounded transition-colors disabled:opacity-50"
                    >
                      {ticket?.isVip ? 'VIP Pass Owned' : 'Purchase VIP Pass'}
                    </button>
                  </div>
                )}

                {/* Standard Pass Option */}
                <div className="p-4 rounded-xl border border-outline/30 bg-surface space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface">General Admission</span>
                    <span className="text-xs font-bold text-on-surface">
                      {exhibition.ticketPrice} credits
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Standard admission commencing on{' '}
                    {new Date(exhibition.startTime).toLocaleDateString()}.
                  </p>
                  <button
                    type="button"
                    id="buy-standard-ticket-btn"
                    onClick={() => handleBuyTicket(false)}
                    disabled={isPurchasing || ticket != null}
                    className="w-full py-2 border border-outline/40 text-on-surface hover:bg-surface-container text-xs font-semibold rounded transition-colors disabled:opacity-50"
                  >
                    {ticket ? 'Pass Owned' : 'Purchase Standard Pass'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ExhibitionPage;
