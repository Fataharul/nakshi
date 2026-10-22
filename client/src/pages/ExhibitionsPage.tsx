import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExhibitionService, Exhibition } from '../services/exhibition.service';
import { getArtworkImageUrl, DEFAULT_ARTWORK_IMAGE } from '../utils/image.util';
import {
  Sparkles,
  Clock,
  Ticket,
  Users,
  ArrowRight,
  Crown,
  Layers,
  AlertCircle,
} from 'lucide-react';

type StatusFilter = 'ALL' | 'ACTIVE' | 'UPCOMING' | 'VIP_EXCLUSIVE' | 'CLOSED';

export const ExhibitionsPage: React.FC = () => {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchExhibitions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ExhibitionService.getExhibitions(selectedFilter);
      setExhibitions(data);
    } catch (err: any) {
      console.error('Failed to load exhibitions:', err);
      setError('Unable to load exhibitions catalog. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExhibitions();
  }, [selectedFilter]);

  const getCountdownString = (exh: Exhibition) => {
    const startTime = new Date(exh.startTime).getTime();
    const endTime = new Date(exh.endTime).getTime();
    const currentTime = now.getTime();

    if (currentTime < startTime) {
      const diff = startTime - currentTime;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `Opens in: ${days > 0 ? `${days}d ` : ''}${hours}h ${minutes}m`;
    } else if (currentTime <= endTime) {
      const diff = endTime - currentTime;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      return `Closes in: ${days > 0 ? `${days}d ` : ''}${hours}h ${minutes}m ${seconds}s`;
    }
    return 'Exhibition Concluded';
  };

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Hero Banner with Terracotta Curation Styling */}
      <section className="bg-gradient-to-b from-surface-container-low via-surface-container-lowest to-surface pt-12 pb-16 px-4 border-b border-outline/10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary mb-4 border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Virtual Heritage Curation</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-on-surface tracking-tight mb-4 max-w-4xl mx-auto">
            Sacred Spaces & Digital Heritage Halls
          </h1>

          <p className="text-on-surface-variant max-w-2xl mx-auto text-base sm:text-lg leading-relaxed mb-8">
            Step inside curated virtual gallery exhibitions celebrating indigenous Bengali craft masters, heirloom textile traditions, and timeless terracotta relics.
          </p>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 pt-4 border-t border-outline/15 max-w-3xl mx-auto text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-on-surface-variant font-medium">Virtual Halls</p>
                <p className="font-serif font-bold text-lg text-on-surface">{exhibitions.length} Exhibitions</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-on-surface-variant font-medium">Collector Access</p>
                <p className="font-serif font-bold text-lg text-on-surface">VIP Windows & Passes</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-on-surface-variant font-medium">Internal Credits</p>
                <p className="font-serif font-bold text-lg text-on-surface">Instant Admission</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Browse Container */}
      <section className="max-w-7xl mx-auto px-4 pt-10">
        {/* Filter Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-outline/10 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
            {(
              [
                { id: 'ALL', label: 'All Exhibitions', testId: 'exhibitions-filter-all' },
                { id: 'ACTIVE', label: 'Currently Live', testId: 'exhibitions-filter-active' },
                { id: 'VIP_EXCLUSIVE', label: 'VIP Exclusive', testId: 'exhibitions-filter-vip' },
                { id: 'UPCOMING', label: 'Upcoming', testId: 'exhibitions-filter-upcoming' },
                { id: 'CLOSED', label: 'Past Archives', testId: 'exhibitions-filter-closed' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                id={tab.testId}
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  selectedFilter === tab.id
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-on-surface-variant font-medium">
            Showing <strong className="text-on-surface">{exhibitions.length}</strong> Curation{exhibitions.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* State: Error */}
        {error && (
          <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button
              onClick={fetchExhibitions}
              className="text-xs font-bold uppercase underline hover:opacity-80"
            >
              Retry
            </button>
          </div>
        )}

        {/* State: Loading */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-on-surface-variant">Opening virtual exhibition halls...</p>
          </div>
        ) : exhibitions.length === 0 ? (
          <div className="text-center py-24 bg-surface-container-lowest rounded-2xl border border-outline/10 p-8">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4 text-on-surface-variant">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="font-serif font-bold text-xl text-on-surface mb-2">No Exhibitions Found</h3>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">
              There are currently no exhibitions listed under this filter. Check back shortly as curators open new gallery halls.
            </p>
            <button
              onClick={() => setSelectedFilter('ALL')}
              className="px-6 py-2.5 rounded-full text-xs font-semibold bg-primary text-on-primary hover:bg-surface-tint transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Exhibitions Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {exhibitions.map((exh) => {
              const isLive = exh.status === 'ACTIVE';
              const isVip = exh.status === 'VIP_EXCLUSIVE';
              const isUpcoming = exh.status === 'UPCOMING';

              return (
                <article
                  key={exh.id}
                  id={`exhibition-card-${exh.id}`}
                  className="bg-surface-container-lowest rounded-2xl border border-outline/20 overflow-hidden flex flex-col ambient-shadow hover:border-outline/40 transition-all duration-300 group"
                >
                  {/* Banner Image & Status Header */}
                  <div className="relative h-60 bg-surface-container-high overflow-hidden">
                    <img
                      src={getArtworkImageUrl(exh.bannerUrl || (exh.sampleArtworks && exh.sampleArtworks[0]?.imageUrl))}
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
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span
                        id={`exhibition-status-${exh.id}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase backdrop-blur-md shadow-xs ${
                          isLive
                            ? 'bg-status-live/90 text-white border border-white/20'
                            : isVip
                            ? 'bg-amber-600/90 text-white border border-white/20'
                            : isUpcoming
                            ? 'bg-primary/90 text-white border border-white/20'
                            : 'bg-surface-container-highest/90 text-on-surface border border-outline/20'
                        }`}
                      >
                        {isLive && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                        {isVip && <Crown className="w-3 h-3" />}
                        {isLive
                          ? 'Live Hall'
                          : isVip
                          ? 'VIP Preview'
                          : isUpcoming
                          ? 'Upcoming'
                          : 'Concluded'}
                      </span>
                    </div>

                    {/* Ticket Price Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-surface-container-lowest/90 text-primary backdrop-blur-md border border-outline/20 shadow-xs">
                        {exh.ticketPrice === 0 ? 'Free Entry' : `${exh.ticketPrice} Credits`}
                      </span>
                    </div>

                    {/* Countdown Timer strip */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-6 flex items-center justify-between text-xs text-white">
                      <div id={`exhibition-timer-${exh.id}`} className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-primary-container" />
                        <span>{getCountdownString(exh)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] opacity-90">
                        <Users className="w-3 h-3" />
                        <span>{exh.ticketsCount} Passes</span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
                        <span>Curated by</span>
                        <strong className="text-on-surface">{exh.organizer.name}</strong>
                      </div>

                      <h2 className="text-xl font-serif font-bold text-on-surface mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                        {exh.title}
                      </h2>

                      <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed mb-4">
                        {exh.description}
                      </p>

                      {/* Sample Exhibits Thumbnails */}
                      {exh.sampleArtworks && exh.sampleArtworks.length > 0 && (
                        <div className="mb-6">
                          <p className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold mb-2">
                            Featured Masterpieces ({exh.artworksCount})
                          </p>
                          <div className="flex items-center gap-2 overflow-hidden">
                            {exh.sampleArtworks.map((art) => (
                              <img
                                key={art.id}
                                src={getArtworkImageUrl(art.imageUrl)}
                                alt={art.title}
                                title={art.title}
                                className="w-12 h-12 rounded-lg object-cover border border-outline/20 hover:scale-105 transition-transform shrink-0"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  if (target.src !== DEFAULT_ARTWORK_IMAGE) {
                                    target.src = DEFAULT_ARTWORK_IMAGE;
                                  }
                                }}
                              />
                            ))}
                            {exh.artworksCount > 4 && (
                              <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-[10px] font-bold text-on-surface-variant border border-outline/20 shrink-0">
                                +{exh.artworksCount - 4}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Row */}
                    <div className="pt-4 border-t border-outline/10 flex items-center justify-between gap-4">
                      <div className="text-xs text-on-surface-variant">
                        <span className="block text-[10px] uppercase font-semibold">Schedule</span>
                        <span>{new Date(exh.startTime).toLocaleDateString()}</span>
                      </div>

                      <Link
                        id={`enter-exhibition-btn-${exh.id}`}
                        to={`/exhibitions/${exh.id}`}
                        className="px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-primary text-on-primary hover:bg-surface-tint transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <span>Explore Hall</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
