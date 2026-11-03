import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  ExhibitionService,
  ExhibitionDetail,
  ExhibitionArtworkDetail,
  ExhibitionTicket,
} from '../services/exhibition.service';
import { getArtworkImageUrl, DEFAULT_ARTWORK_IMAGE } from '../utils/image.util';
import { BuyTicketModal } from '../components/exhibition/BuyTicketModal';
import { useAuth } from '../context/AuthContext';
import { useExhibitionVisitTracking } from '../hooks/useExhibitionVisitTracking';
import {
  Sparkles,
  Ticket,
  Crown,
  Clock,
  ArrowLeft,
  Maximize2,
  X,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const ExhibitionRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [exhibition, setExhibition] = useState<ExhibitionDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeWallIndex, setActiveWallIndex] = useState<number>(0);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState<boolean>(false);
  const [spotlightArtwork, setSpotlightArtwork] = useState<ExhibitionArtworkDetail | null>(null);
  const [now, setNow] = useState<Date>(new Date());

  const [tokenInput, setTokenInput] = useState<string>('');
  const [isValidatingToken, setIsValidatingToken] = useState<boolean>(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenSuccess, setTokenSuccess] = useState<string | null>(null);
  const [validatedTicket, setValidatedTicket] = useState<ExhibitionTicket | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadExhibition = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await ExhibitionService.getExhibitionById(id);
      setExhibition(data);
    } catch (err: any) {
      console.error('Failed to load exhibition details:', err);
      setError(err.message || 'Exhibition not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExhibition();
  }, [id, user?.id]);
    // T-081: record visitor traffic and viewing time.
  // Curators and admins previewing the hall are not counted as visitors.
  const canTrackVisit = Boolean(
    exhibition &&
      exhibition.status !== 'CLOSED' &&
      user?.id !== exhibition.organizer.id &&
      user?.role !== 'ADMIN' &&
      (exhibition.userTicket || Number(exhibition.ticketPrice) === 0)
  );
  useExhibitionVisitTracking(id, canTrackVisit);

  const handleValidateToken = async (overrideToken?: string) => {
    const token = (overrideToken ?? tokenInput).trim();
    if (!token || !id) {
      setTokenError('Please enter a ticket token to validate.');
      return;
    }
    try {
      setIsValidatingToken(true);
      setTokenError(null);
      setTokenSuccess(null);
      const res = await ExhibitionService.validateTicket(id, token);
      setValidatedTicket({
        id: res.ticket.id,
        ticketToken: res.ticket.ticketToken,
        isVip: res.ticket.isVip,
        purchasedAt: res.ticket.purchasedAt,
      });
      setTokenSuccess('Ticket pass verified! Access to virtual gallery hall granted.');
    } catch (err: any) {
      setTokenError(err.message || 'Invalid or mismatched ticket token.');
    } finally {
      setIsValidatingToken(false);
    }
  };

  // Auto-validate ticket if passed in query string ?token=...
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken && id && !validatedTicket && !exhibition?.userTicket) {
      setTokenInput(urlToken);
      handleValidateToken(urlToken);
    }
  }, [searchParams, id, exhibition?.userTicket]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-surface">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-on-surface-variant font-serif">
          Entering virtual curation hall...
        </p>
      </div>
    );
  }

  if (error || !exhibition) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-surface text-center">
        <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-on-surface mb-2">Exhibition Unavailable</h2>
        <p className="text-sm text-on-surface-variant max-w-md mb-6">{error || 'This exhibition could not be loaded.'}</p>
        <Link
          to="/exhibitions"
          className="px-6 py-2.5 bg-primary text-on-primary rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-surface-tint transition-all"
        >
          Return to Exhibitions Catalog
        </Link>
      </div>
    );
  }

  // Check access permissions
  const activeTicket = exhibition.userTicket || validatedTicket;
  const isOrganizer = user?.id === exhibition.organizer.id || user?.role === 'ADMIN';
  const isFree = Number(exhibition.ticketPrice) === 0;
  const hasTicket = Boolean(activeTicket) || isOrganizer || isFree;
  const isTicketVip = activeTicket?.isVip || isOrganizer;

  const isConcluded = now > new Date(exhibition.endTime);
  const isExpired = isConcluded && !isOrganizer;

  // Check VIP window
  const isVipWindowActive = Boolean(
    exhibition.vipStartTime &&
      exhibition.vipEndTime &&
      now >= new Date(exhibition.vipStartTime) &&
      now <= new Date(exhibition.vipEndTime)
  );

  const isVipRestricted = isVipWindowActive && !isTicketVip;

  // Layout Wall Names
  const defaultWalls = ['Central Pavilion', 'West Gallery', 'East Gallery'];
  const wallNames = exhibition.layoutConfig?.walls || defaultWalls;

  // Filter artworks by active wall position (or distribute evenly)
  const currentWallArtworks = exhibition.artworks.filter((art, idx) => {
    if (art.wallPosition) {
      return (art.wallPosition - 1) % wallNames.length === activeWallIndex;
    }
    return idx % wallNames.length === activeWallIndex;
  });

  return (
    <div id="exhibition-room-container" className="min-h-screen bg-surface-container-low flex flex-col text-on-surface">
      {/* Top Ambient Navigation Bar */}
      <header className="bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline/10 px-4 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              id="back-to-exhibitions-link"
              to="/exhibitions"
              className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
              title="Return to Catalog"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-primary flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Virtual Gallery Hall
              </span>
              <h1 id="exhibition-hall-title" className="text-base sm:text-lg font-serif font-bold text-on-surface line-clamp-1">
                {exhibition.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Admission / Pass Status Pill */}
            {isExpired ? (
              <div
                id="expired-ticket-badge"
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-container-high text-error border border-error/20 flex items-center gap-1.5 shadow-xs"
              >
                <Clock className="w-3.5 h-3.5 text-error" />
                <span>Viewing Closed</span>
              </div>
            ) : hasTicket ? (
              <div
                id="active-ticket-badge"
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5 shadow-xs"
              >
                {isTicketVip ? (
                  <>
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-amber-700 font-bold">VIP Collector Pass</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-valid" />
                    <span>Pass: {activeTicket?.ticketToken || 'Complimentary'}</span>
                  </>
                )}
              </div>
            ) : (
              <button
                id="header-reserve-ticket-btn"
                disabled={isConcluded}
                onClick={() => setIsTicketModalOpen(true)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary text-on-primary hover:bg-surface-tint disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs flex items-center gap-1.5"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>{isConcluded ? 'Schedule Concluded' : `Reserve Pass (${exhibition.ticketPrice} Credits)`}</span>
              </button>
            )}

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-on-surface-variant font-medium pl-3 border-l border-outline/20">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{exhibition.status}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Exhibition Hall Viewport */}
      {isExpired ? (
        /* Dedicated Concluded / Expired Access Screen */
        <main
          id="exhibition-concluded-view"
          className="flex-1 max-w-3xl mx-auto px-4 py-16 text-center flex flex-col items-center justify-center"
        >
          <div className="w-20 h-20 rounded-full bg-error/10 text-error flex items-center justify-center mb-6 border border-error/20">
            <Clock className="w-10 h-10" />
          </div>

          <div
            id="exhibition-concluded-badge"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-error/10 text-error border border-error/20 mb-4 uppercase tracking-wider"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Exhibition Schedule Concluded</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-on-surface mb-3">
            Viewing Period Has Ended
          </h2>

          <p className="text-sm text-on-surface-variant max-w-lg mb-6 leading-relaxed">
            This curated exhibition concluded its viewing schedule on{' '}
            <strong className="text-on-surface">
              {new Date(exhibition.endTime).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </strong>
            . Access to the virtual gallery walls and curator spotlights is now closed to visitors.
          </p>

          {/* Exhibition Schedule and Ticket Details */}
          <div className="w-full max-w-md bg-surface-container-lowest p-6 rounded-2xl border border-outline/20 mb-8 text-left shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-outline/10 text-xs">
              <span className="text-on-surface-variant uppercase font-semibold">Exhibition</span>
              <strong className="text-on-surface font-serif">{exhibition.title}</strong>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-outline/10 text-xs">
              <span className="text-on-surface-variant uppercase font-semibold">Curator</span>
              <span className="text-on-surface font-medium">{exhibition.organizer.name}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-outline/10 text-xs">
              <span className="text-on-surface-variant uppercase font-semibold">Schedule Period</span>
              <span className="text-on-surface font-mono text-[11px]">
                {new Date(exhibition.startTime).toLocaleDateString()} – {new Date(exhibition.endTime).toLocaleDateString()}
              </span>
            </div>
            {activeTicket && (
              <div className="flex items-center justify-between pt-3 text-xs">
                <span className="text-on-surface-variant uppercase font-semibold">Expired Pass Token</span>
                <span id="expired-ticket-token-pill" className="font-mono text-primary font-bold text-xs bg-primary/10 px-2.5 py-1 rounded-md">
                  {activeTicket.ticketToken}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              id="unlock-exhibition-ticket-btn"
              disabled
              className="px-6 py-3 bg-surface-container-high text-on-surface-variant font-semibold text-xs uppercase tracking-wider rounded-full border border-outline/20 flex items-center gap-2 cursor-not-allowed opacity-60"
            >
              <Ticket className="w-4 h-4" />
              <span>Pass Reservations Closed</span>
            </button>
            <Link
              id="return-to-catalog-btn"
              to="/exhibitions"
              className="px-8 py-3 bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-surface-tint transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Exhibitions Catalog</span>
            </Link>
          </div>
        </main>
      ) : !hasTicket ? (
        /* Foyer / Reception View: Locked Hall Requiring Admission Pass */
        <main id="exhibition-foyer-view" className="flex-1 max-w-5xl mx-auto px-4 py-12 flex flex-col justify-center">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline/20 overflow-hidden ambient-shadow shadow-xl">
            {/* Grand Banner */}
            <div className="relative h-72 sm:h-96 bg-surface-container-high overflow-hidden">
              <img
                src={getArtworkImageUrl(exhibition.bannerUrl || (exhibition.artworks[0]?.artwork.imageUrl))}
                alt={exhibition.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (target.src !== DEFAULT_ARTWORK_IMAGE) {
                    target.src = DEFAULT_ARTWORK_IMAGE;
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 sm:p-10 text-white">
                <span className="text-xs uppercase font-semibold tracking-widest text-primary-fixed mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Curated Heritage Exhibition
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-3">{exhibition.title}</h2>
                <p className="text-sm opacity-90 max-w-2xl leading-relaxed">
                  Curated by <span className="font-semibold">{exhibition.organizer.name}</span> • Featuring {exhibition.artworksCount} Selected Masterpieces
                </p>
              </div>
            </div>

            {/* Curation Overview & Admission Action */}
            <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7">
                <h3 className="text-xs uppercase tracking-widest text-primary font-bold mb-2">Curator's Statement</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                  {exhibition.description}
                </p>

                {exhibition.layoutConfig?.curatorNote && (
                  <blockquote className="p-4 rounded-xl bg-surface-container border-l-4 border-primary text-xs italic text-on-surface-variant mb-6">
                    "{exhibition.layoutConfig.curatorNote}"
                  </blockquote>
                )}

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-surface-container-low border border-outline/10">
                    <span className="text-on-surface-variant block text-[10px] uppercase font-semibold">Schedule Period</span>
                    <strong className="text-on-surface">
                      {new Date(exhibition.startTime).toLocaleDateString()} – {new Date(exhibition.endTime).toLocaleDateString()}
                    </strong>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-container-low border border-outline/10">
                    <span className="text-on-surface-variant block text-[10px] uppercase font-semibold">Admission Tier</span>
                    <strong className="text-primary font-bold">
                      {exhibition.ticketPrice === 0 ? 'Complimentary' : `${exhibition.ticketPrice} Credits`}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Admission Pass Trigger Card */}
              <div className="md:col-span-5 bg-surface-container-low p-6 rounded-2xl border border-outline/20 text-center flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif font-bold text-lg text-on-surface mb-1">Reserve Your Access</h4>
                  <p className="text-xs text-on-surface-variant mb-6">
                    Unlock the virtual 3D gallery walls, inspect high-res artisan textiles, and examine provenance.
                  </p>

                  {isConcluded ? (
                    <button
                      id="unlock-exhibition-ticket-btn"
                      disabled
                      className="w-full py-3.5 bg-surface-container-high text-on-surface-variant font-semibold text-xs uppercase tracking-wider rounded-xl border border-outline/20 flex items-center justify-center gap-2 cursor-not-allowed opacity-75"
                    >
                      <div id="exhibition-concluded-badge" className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-error" />
                        <span>Exhibition Schedule Concluded</span>
                      </div>
                    </button>
                  ) : (
                    <button
                      id="unlock-exhibition-ticket-btn"
                      onClick={() => setIsTicketModalOpen(true)}
                      className="w-full py-3.5 bg-primary text-on-primary font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-surface-tint transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>Get Exhibition Pass</span>
                    </button>
                  )}
                </div>

                {/* Ticket Token Validation Gate */}
                <div id="enter-ticket-token-section" className="mt-6 pt-6 border-t border-outline/15 text-left">
                  <label htmlFor="ticket-token-input" className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Already have a Ticket Token?
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="ticket-token-input"
                      type="text"
                      placeholder="e.g. NK-EXH-2026-..."
                      value={tokenInput}
                      onChange={(e) => {
                        setTokenInput(e.target.value);
                        if (tokenError) setTokenError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleValidateToken();
                        }
                      }}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-outline/30 bg-surface text-on-surface text-xs font-mono placeholder:text-on-surface-variant/50 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <button
                      id="validate-ticket-token-btn"
                      type="button"
                      disabled={isValidatingToken || !tokenInput.trim()}
                      onClick={() => handleValidateToken()}
                      className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold uppercase tracking-wider rounded-xl border border-outline/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                    >
                      {isValidatingToken ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                          <span>Verify Token</span>
                        </>
                      )}
                    </button>
                  </div>
                  {tokenError && (
                    <div id="ticket-validation-error" className="mt-2.5 p-2.5 rounded-lg bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{tokenError}</span>
                    </div>
                  )}
                  {tokenSuccess && (
                    <div id="ticket-validation-success" className="mt-2.5 p-2.5 rounded-lg bg-status-valid/10 border border-status-valid/20 text-status-valid text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{tokenSuccess}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      ) : isVipRestricted ? (
        /* VIP Restricting Screen */
        <main id="vip-restriction-view" className="flex-1 max-w-3xl mx-auto px-4 py-16 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
            <Crown className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-on-surface mb-3">VIP Collector Window Active</h2>
          <p className="text-sm text-on-surface-variant max-w-lg mb-8 leading-relaxed">
            The virtual hall is currently reserved for VIP Collector Pass holders. General admission pass holders will be granted entrance as soon as the VIP preview concludes.
          </p>
          <div className="p-4 rounded-xl bg-surface-container border border-outline/10 text-xs text-on-surface-variant mb-6">
            VIP Window Closes: <strong className="text-on-surface">{new Date(exhibition.vipEndTime!).toLocaleString()}</strong>
          </div>
          <button
            onClick={() => setIsTicketModalOpen(true)}
            className="px-8 py-3 bg-amber-600 text-on-primary text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-amber-700 transition-all shadow-sm"
          >
            Upgrade to VIP Pass
          </button>
        </main>
      ) : (
        /* Interactive Virtual Gallery Walk Hall */
        <main className="flex-1 flex flex-col">
          {/* Wall Navigation Ribbon */}
          <nav aria-label="Gallery Walls" className="bg-surface-container-lowest border-b border-outline/10 px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-xs uppercase font-bold text-on-surface-variant tracking-wider mr-2 hidden sm:inline">
                  Gallery Walls:
                </span>
                {wallNames.map((wallName: string, idx: number) => (
                  <button
                    key={idx}
                    id={`wall-tab-${idx}`}
                    onClick={() => setActiveWallIndex(idx)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      activeWallIndex === idx
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{wallName}</span>
                  </button>
                ))}
              </div>

              <div className="text-xs text-on-surface-variant hidden md:block">
                Displaying <strong>{currentWallArtworks.length}</strong> Exhibit{currentWallArtworks.length === 1 ? '' : 's'} on this wall
              </div>
            </div>
          </nav>

          {/* Virtual Wall Canvas with Museum Lighting */}
          <section className="flex-1 py-12 px-4 sm:px-8 max-w-7xl mx-auto w-full">
            <div className="text-center mb-8">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Virtual Wall View</span>
              <h2 className="text-2xl font-serif font-bold text-on-surface mt-1">{wallNames[activeWallIndex]}</h2>
            </div>

            {currentWallArtworks.length === 0 ? (
              <div className="text-center py-24 bg-surface-container-lowest/50 rounded-2xl border border-dashed border-outline/20">
                <p className="text-sm text-on-surface-variant">No exhibits positioned on this wall.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 sm:gap-12 items-start">
                {currentWallArtworks.map((item) => {
                  const art = item.artwork;
                  return (
                    <div
                      key={item.id}
                      id={`exhibit-frame-${art.id}`}
                      className="flex flex-col items-center group cursor-pointer"
                      onClick={() => setSpotlightArtwork(item)}
                    >
                      {/* Spotlight Cast & Wooden Frame */}
                      <div className="relative p-4 sm:p-5 bg-surface-container-lowest rounded-xl shadow-2xl border-4 border-outline/30 transition-transform duration-500 hover:scale-[1.02] cursor-pointer w-full"
                        onClick={() => setSpotlightArtwork(item)}
                      >
                        {/* Matting border */}
                        <div className="relative overflow-hidden rounded bg-surface-container-high aspect-4/3 flex items-center justify-center">
                          <img
                            id={`exhibit-image-${art.id}`}
                            src={getArtworkImageUrl(art.imageUrl)}
                            alt={art.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              if (target.src !== DEFAULT_ARTWORK_IMAGE) {
                                target.src = DEFAULT_ARTWORK_IMAGE;
                              }
                            }}
                          />
                          <button
                            id={`inspect-artwork-${art.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSpotlightArtwork(item);
                            }}
                            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/70 hover:bg-black text-white text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md flex items-center gap-1 transition-opacity opacity-0 group-hover:opacity-100 shadow-md cursor-pointer"
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>Curator Spotlight</span>
                          </button>
                        </div>
                      </div>

                      {/* Museum Plaque Mounted beneath exhibit */}
                      <div className="mt-4 p-3 bg-surface-container-lowest rounded-lg border border-outline/20 shadow-sm text-center max-w-xs w-full">
                        <h4 className="font-serif font-bold text-sm text-on-surface line-clamp-1">{art.title}</h4>
                        <p className="text-[11px] text-on-surface-variant line-clamp-1">
                          {art.medium} • By <span className="font-semibold text-on-surface">{art.artist?.name || 'Master Artisan'}</span>
                        </p>
                        {art.price && (
                          <p className="text-[11px] font-bold text-primary mt-1">
                            {Number(art.price).toFixed(2)} Credits
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      )}

      {/* Curator Spotlight Inspection Drawer/Modal */}
      {spotlightArtwork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            id="artwork-spotlight-modal"
            className="bg-surface rounded-2xl max-w-3xl w-full overflow-hidden border border-outline/20 shadow-2xl relative flex flex-col max-h-[90vh]"
          >
            <div className="p-4 bg-surface-container-low border-b border-outline/10 flex items-center justify-between">
              <span className="text-xs font-serif font-bold uppercase tracking-wider text-primary">
                Curator Spotlight Exhibit
              </span>
              <button
                onClick={() => setSpotlightArtwork(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Exhibit High-Res Artwork Frame */}
              <div className="rounded-xl overflow-hidden border border-outline/20 bg-surface-container-high shadow-md">
                <img
                  src={getArtworkImageUrl(spotlightArtwork.artwork.imageUrl)}
                  alt={spotlightArtwork.artwork.title}
                  className="w-full h-auto object-cover max-h-[50vh]"
                />
              </div>

              {/* Exhibit Curatorial Metadata */}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                  {spotlightArtwork.artwork.style || 'Heritage Collection'}
                </span>
                <h3 className="text-2xl font-serif font-bold text-on-surface mb-2">
                  {spotlightArtwork.artwork.title}
                </h3>
                <p className="text-xs text-on-surface-variant mb-4">
                  By <strong className="text-on-surface">{spotlightArtwork.artwork.artist?.name || 'Master Artisan'}</strong>
                </p>

                <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
                  {spotlightArtwork.artwork.description}
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs mb-6">
                  <div className="p-2.5 rounded bg-surface-container border border-outline/10">
                    <span className="text-[10px] uppercase text-on-surface-variant block">Medium</span>
                    <strong className="text-on-surface text-xs">{spotlightArtwork.artwork.medium}</strong>
                  </div>
                  {spotlightArtwork.artwork.dimensions && (
                    <div className="p-2.5 rounded bg-surface-container border border-outline/10">
                      <span className="text-[10px] uppercase text-on-surface-variant block">Dimensions</span>
                      <strong className="text-on-surface text-xs">{spotlightArtwork.artwork.dimensions}</strong>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <Link
                    to={`/artworks/${spotlightArtwork.artwork.id}`}
                    className="flex-1 py-3 bg-primary text-on-primary font-semibold text-xs uppercase tracking-wider rounded-lg hover:bg-surface-tint transition-all shadow-xs flex items-center justify-center gap-2"
                  >
                    <span>Acquire Artwork ({Number(spotlightArtwork.artwork.price).toFixed(2)} Credits)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buy Ticket Modal */}
      <BuyTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        exhibition={exhibition}
        onTicketPurchased={(ticket) => {
          setExhibition((prev) => (prev ? { ...prev, userTicket: ticket } : prev));
          setValidatedTicket(ticket);
        }}
      />
    </div>
  );
};
