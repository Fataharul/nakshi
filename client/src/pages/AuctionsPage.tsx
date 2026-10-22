import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuctionService, AuctionResponse } from '../services/auction.service';
import { socketService } from '../services/socket.service';
import { getStoredToken } from '../services/auth.service';
import { Gavel, Clock, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { getArtworkImageUrl, DEFAULT_ARTWORK_IMAGE } from '../utils/image.util';

type StatusFilter = 'ALL' | 'ACTIVE' | 'UPCOMING' | 'CLOSED';

export const AuctionsPage: React.FC = () => {
  const [auctions, setAuctions] = useState<AuctionResponse[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<Date>(new Date());

  // Periodically refresh current time every second for smooth countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch auctions on mount or filter change
  const fetchAuctions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AuctionService.getAllAuctions();
      setAuctions(data);
    } catch (err: any) {
      console.error('Failed to load auctions:', err);
      setError(err.message || 'Unable to load auctions at this moment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  // Setup real-time WebSocket connection to listen for bids across active auctions
  useEffect(() => {
    const token = getStoredToken();
    socketService.connect(token || undefined);

    // Listen to new bid broadcast events
    const handleNewBid = (data: { auctionId: string; amount: number; bidderId?: string }) => {
      setAuctions((prev) =>
        prev.map((auc) => {
          if (auc.id === data.auctionId) {
            return {
              ...auc,
              currentHighestBid: data.amount,
            };
          }
          return auc;
        })
      );
    };

    socketService.onNewBid(handleNewBid);

    return () => {
      socketService.offNewBid(handleNewBid);
    };
  }, []);

  // Helper function to format countdown timer
  const getCountdownString = (auction: AuctionResponse) => {
    const startTime = new Date(auction.startTime).getTime();
    const endTime = new Date(auction.endTime).getTime();
    const currentTime = now.getTime();

    if (auction.status === 'UPCOMING' || currentTime < startTime) {
      const diff = startTime - currentTime;
      if (diff <= 0) return 'Starting soon';
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      return `Starts in: ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    }

    if (auction.status === 'ACTIVE' || (currentTime >= startTime && currentTime <= endTime)) {
      const diff = endTime - currentTime;
      if (diff <= 0) return 'Ending now';
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      return `Ends in: ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    }

    return 'Auction closed';
  };

  // Filtered auctions list
  const filteredAuctions = auctions.filter((auc) => {
    if (selectedFilter === 'ALL') return true;
    return auc.status === selectedFilter;
  });

  const activeCount = auctions.filter((a) => a.status === 'ACTIVE').length;
  const upcomingCount = auctions.filter((a) => a.status === 'UPCOMING').length;

  return (
    <main className="min-h-screen bg-surface pb-16">
      {/* 1. Page Hero / Header Banner */}
      <section className="bg-surface-container-low border-b border-outline/20 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
                <Gavel className="w-3.5 h-3.5" />
                <span>Live Bidding Floor</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-on-surface tracking-tight">
                Curated Live Auctions
              </h1>
              <p className="text-on-surface-variant max-w-2xl text-sm sm:text-base mt-2 leading-relaxed">
                Experience real-time competitive bidding on master-crafted Bangladeshi folk art,
                Nakshi Kantha heirlooms, and authentic terracotta sculptures.
              </p>
            </div>

            {/* Quick Metrics Badges */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-surface rounded-xl border border-outline/20 ambient-shadow">
                <span className="w-2.5 h-2.5 rounded-full bg-status-live animate-pulse" />
                <div>
                  <span className="text-[10px] uppercase font-semibold text-on-surface-variant block">
                    Active Rooms
                  </span>
                  <span className="font-serif font-bold text-base text-on-surface">
                    {activeCount} Live
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-surface rounded-xl border border-outline/20 ambient-shadow">
                <Sparkles className="w-4 h-4 text-primary" />
                <div>
                  <span className="text-[10px] uppercase font-semibold text-on-surface-variant block">
                    Scheduled
                  </span>
                  <span className="font-serif font-bold text-base text-on-surface">
                    {upcomingCount} Upcoming
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pt-8 border-t border-outline/10 mt-8">
            <button
              id="auctions-filter-all"
              onClick={() => setSelectedFilter('ALL')}
              className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                selectedFilter === 'ALL'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All Auctions ({auctions.length})
            </button>
            <button
              id="auctions-filter-active"
              onClick={() => setSelectedFilter('ACTIVE')}
              className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                selectedFilter === 'ACTIVE'
                  ? 'bg-status-live text-white shadow-xs'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>Live Now ({activeCount})</span>
            </button>
            <button
              id="auctions-filter-upcoming"
              onClick={() => setSelectedFilter('UPCOMING')}
              className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                selectedFilter === 'UPCOMING'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Upcoming ({upcomingCount})
            </button>
            <button
              id="auctions-filter-closed"
              onClick={() => setSelectedFilter('CLOSED')}
              className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                selectedFilter === 'CLOSED'
                  ? 'bg-secondary text-white shadow-xs'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Past / Closed ({auctions.filter((a) => a.status === 'CLOSED').length})
            </button>
          </div>
        </div>
      </section>

      {/* 3. Auctions Grid Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-on-surface-variant font-medium">
              Synchronizing active auctions...
            </p>
          </div>
        ) : error ? (
          <div className="p-6 bg-error-container/20 border border-error/20 rounded-xl text-center max-w-lg mx-auto">
            <AlertCircle className="w-8 h-8 text-error mx-auto mb-2" />
            <h3 className="font-serif font-bold text-base text-on-surface mb-1">
              Unable to load live auctions
            </h3>
            <p className="text-xs text-on-surface-variant mb-4">{error}</p>
            <button
              onClick={fetchAuctions}
              className="px-5 py-2 bg-primary text-on-primary rounded-full text-xs uppercase font-semibold tracking-wider hover:bg-surface-tint cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredAuctions.length === 0 ? (
          <div
            id="no-auctions-state"
            className="text-center py-20 px-6 bg-surface-container-low rounded-xl border border-dashed border-outline/30 max-w-2xl mx-auto"
          >
            <Gavel className="w-12 h-12 text-on-surface-variant mx-auto mb-3 opacity-40" />
            <h3 className="font-serif text-xl font-bold text-on-surface mb-2">
              No {selectedFilter !== 'ALL' ? selectedFilter.toLowerCase() : ''} auctions right now
            </h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed mb-6">
              Check back soon for upcoming bidding sessions, or explore our curated permanent gallery
              storefront.
            </p>
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-full text-xs uppercase font-semibold tracking-wider hover:bg-surface-tint shadow-xs transition-all"
            >
              <span>Explore Gallery Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div
            id="auctions-browse-grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {filteredAuctions.map((auction) => {
              const countdown = getCountdownString(auction);
              const isLive = auction.status === 'ACTIVE';
              const currentBid = auction.currentHighestBid || auction.startingBid;

              return (
                <div
                  key={auction.id}
                  id={`auction-card-${auction.id}`}
                  className="bg-surface-container-lowest rounded-xl border border-outline/20 overflow-hidden flex flex-col ambient-shadow hover:border-outline/40 transition-all group"
                >
                  {/* Artwork Image & Status Header */}
                  <div className="relative h-60 bg-surface-container-high overflow-hidden">
                    <img
                      src={getArtworkImageUrl(auction.artwork?.imageUrl || (auction as any).artwork?.image || (auction as any).imageUrl)}
                      alt={auction.artwork?.title || 'Heritage Artwork'}
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
                        id={`auction-status-${auction.id}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase backdrop-blur-md shadow-xs ${
                          isLive
                            ? 'bg-status-live/90 text-white border border-white/20'
                            : auction.status === 'UPCOMING'
                            ? 'bg-amber-600/90 text-white border border-white/20'
                            : 'bg-surface-container-highest/90 text-on-surface border border-outline/20'
                        }`}
                      >
                        {isLive && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                        <span>{auction.status}</span>
                      </span>
                    </div>

                    {/* Live Timer Pill */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-xs">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary-inverse" />
                        <span id={`auction-timer-${auction.id}`} className="font-semibold tracking-wide">
                          {countdown}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-mono text-white/70">
                        INC: +{auction.minIncrement}
                      </span>
                    </div>
                  </div>

                  {/* Artwork Details Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider font-semibold text-primary mb-1">
                        {auction.artwork?.medium || 'Heritage Craft'}
                      </div>
                      <h2 className="font-serif text-xl font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                        {auction.artwork?.title || 'Bengali Heritage Artwork'}
                      </h2>
                      <p className="text-xs text-on-surface-variant mt-1">
                        By{' '}
                        <span className="font-semibold text-on-surface">
                          {auction.artwork?.artist?.name || 'Curated Artisan'}
                        </span>
                      </p>
                    </div>

                    {/* Bid & Call to Action Footer */}
                    <div className="border-t border-outline/10 pt-4 mt-5 space-y-4">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant block">
                            {auction.currentHighestBid ? 'Highest Bid' : 'Starting Bid'}
                          </span>
                          <span
                            id={`auction-current-bid-${auction.id}`}
                            className="font-serif text-2xl font-bold text-primary"
                          >
                            {currentBid.toFixed(2)}{' '}
                            <span className="text-xs font-sans font-normal text-on-surface-variant">
                              Credits
                            </span>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase tracking-wider font-medium text-on-surface-variant block">
                            Min Next Bid
                          </span>
                          <span className="text-xs font-semibold text-on-surface">
                            {(currentBid + (auction.currentHighestBid ? auction.minIncrement : 0)).toFixed(2)} C
                          </span>
                        </div>
                      </div>

                      <Link
                        id={`enter-bidding-room-${auction.id}`}
                        to={`/auctions/${auction.id}`}
                        className={`w-full py-3 px-4 rounded-lg font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                          isLive
                            ? 'bg-primary text-on-primary hover:bg-surface-tint'
                            : 'bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline/20'
                        }`}
                      >
                        <Gavel className="w-4 h-4" />
                        <span>
                          {isLive
                            ? 'Enter Bidding Room'
                            : auction.status === 'UPCOMING'
                            ? 'Preview Bidding Room'
                            : 'View Closed Auction'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default AuctionsPage;
