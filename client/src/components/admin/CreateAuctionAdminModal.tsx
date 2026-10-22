import React, { useState, useEffect } from 'react';
import { X, Gavel, Calendar, Clock, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { artworkApi } from '../../services/artwork.service';
import { AuctionService, AuctionResponse } from '../../services/auction.service';
import { Artwork } from '../../types/artwork';
import { getArtworkImageUrl, DEFAULT_ARTWORK_IMAGE } from '../../utils/image.util';

interface CreateAuctionAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuctionCreated?: (auction: AuctionResponse) => void;
}

export const CreateAuctionAdminModal: React.FC<CreateAuctionAdminModalProps> = ({
  isOpen,
  onClose,
  onAuctionCreated,
}) => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoadingArtworks, setIsLoadingArtworks] = useState(false);
  const [artworkId, setArtworkId] = useState('');
  const [startingBid, setStartingBid] = useState('');
  const [minIncrement, setMinIncrement] = useState('50');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingArtworks(true);
      setError(null);
      // Admin schedules auctions for approved available artworks
      artworkApi
        .getArtworks({ availability: 'AVAILABLE', limit: 100 })
        .then((res) => {
          // Filter to only APPROVED artworks
          const approved = res.artworks.filter(
            (a) => a.moderationStatus === 'APPROVED' && a.availability === 'AVAILABLE'
          );
          setArtworks(approved);
          if (approved.length > 0 && !artworkId) {
            setArtworkId(approved[0].id);
            setStartingBid(String(approved[0].price || 100));
          }
        })
        .catch((err) => {
          console.error('Failed to load eligible artworks:', err);
          setError('Failed to fetch eligible artworks for auction scheduling.');
        })
        .finally(() => setIsLoadingArtworks(false));

      // Preset default start time (1 minute ago) and end time (+2 hours)
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const inTwoHours = new Date(Date.now() + 2 * 60 * 60 * 1000);
      
      const formatLocalDatetime = (date: Date) => {
        const pad = (n: number) => String(n).padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setStartTime(formatLocalDatetime(oneMinuteAgo));
      setEndTime(formatLocalDatetime(inTwoHours));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleArtworkChange = (id: string) => {
    setArtworkId(id);
    const chosen = artworks.find((a) => a.id === id);
    if (chosen && (!startingBid || Number(startingBid) <= 0)) {
      setStartingBid(String(chosen.price));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!artworkId) throw new Error('Please select an approved artwork.');
      if (!startingBid || Number(startingBid) <= 0) {
        throw new Error('Starting bid must be greater than 0.');
      }
      if (!minIncrement || Number(minIncrement) <= 0) {
        throw new Error('Minimum increment must be greater than 0.');
      }
      if (!startTime) throw new Error('Start time is required.');
      if (!endTime) throw new Error('End time is required.');

      const start = new Date(startTime);
      const end = new Date(endTime);

      if (end <= start) {
        throw new Error('End time must be after the start time.');
      }

      const created = await AuctionService.createAuction({
        artworkId,
        startingBid: Number(startingBid),
        minIncrement: Number(minIncrement),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });

      if (onAuctionCreated) {
        onAuctionCreated(created);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while scheduling the auction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedArtwork = artworks.find((a) => a.id === artworkId);

  return (
    <div
      id="admin-create-auction-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div
        className="bg-surface-container-lowest w-full max-w-2xl rounded-xl ambient-shadow overflow-hidden border border-outline/20 my-8 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline/10 flex items-center justify-between bg-surface-container-low/50 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl font-bold text-on-surface leading-tight">
                  Admin Auction Scheduler
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-primary text-on-primary">
                  RBAC ADMIN
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                Schedule a live bidding event for approved marketplace artworks.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="admin-create-auction-close-btn"
            className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div
              id="admin-auction-error"
              className="mb-6 p-4 bg-error-container/20 border border-error/20 text-error rounded-lg text-sm flex items-start gap-2.5"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs uppercase tracking-wider">Scheduler Error</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form id="admin-create-auction-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Artwork Selection */}
            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
                Select Approved Artwork
              </label>
              {isLoadingArtworks ? (
                <div className="p-3 bg-surface-container-low rounded border border-outline/20 text-xs text-on-surface-variant flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Loading eligible approved artworks...</span>
                </div>
              ) : (
                <select
                  id="admin-auction-artwork-select"
                  required
                  value={artworkId}
                  onChange={(e) => handleArtworkChange(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline/30 rounded px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
                >
                  <option value="" disabled>
                    {artworks.length === 0 ? 'No approved available artworks found' : 'Select an artwork...'}
                  </option>
                  {artworks.map((artwork) => (
                    <option key={artwork.id} value={artwork.id}>
                      {artwork.title} — {artwork.medium} ({artwork.price} Credits)
                    </option>
                  ))}
                </select>
              )}
              {artworks.length === 0 && !isLoadingArtworks && (
                <p className="mt-2 text-xs text-error font-medium">
                  There are no approved and available artworks in the gallery to schedule for auction.
                </p>
              )}
            </div>

            {/* Selected Artwork Preview */}
            {selectedArtwork && (
              <div
                id="admin-selected-artwork-preview"
                className="flex items-center gap-4 p-4 bg-surface-container-low rounded-lg border border-outline/20"
              >
                {selectedArtwork.imageUrl ? (
                  <img
                    src={getArtworkImageUrl(selectedArtwork.imageUrl)}
                    alt={selectedArtwork.title}
                    className="w-16 h-16 object-cover rounded bg-surface-container-high shrink-0 border border-outline/20"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (target.src !== DEFAULT_ARTWORK_IMAGE) {
                        target.src = DEFAULT_ARTWORK_IMAGE;
                      }
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 bg-surface-container-high rounded flex items-center justify-center shrink-0">
                    <ImageIcon className="w-6 h-6 text-on-surface-variant" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-serif font-bold text-on-surface text-sm truncate">
                    {selectedArtwork.title}
                  </p>
                  <p className="text-xs text-on-surface-variant line-clamp-1">
                    {selectedArtwork.medium} • {selectedArtwork.description}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    <span className="font-semibold text-primary">
                      Catalog Price: {selectedArtwork.price.toFixed(2)} Credits
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-status-valid/10 text-status-valid border border-status-valid/20">
                      Approved
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Bidding Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
                  Starting Bid (Credits)
                </label>
                <input
                  id="admin-auction-starting-bid"
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={startingBid}
                  onChange={(e) => setStartingBid(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full bg-surface-container-low border border-outline/30 rounded px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
                  Minimum Increment (Credits)
                </label>
                <input
                  id="admin-auction-min-increment"
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={minIncrement}
                  onChange={(e) => setMinIncrement(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full bg-surface-container-low border border-outline/30 rounded px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            {/* Timing & Schedule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>Auction Start Time</span>
                </label>
                <input
                  id="admin-auction-start-time"
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline/30 rounded px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>Auction End Time</span>
                </label>
                <input
                  id="admin-auction-end-time"
                  type="datetime-local"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline/30 rounded px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-outline/10 bg-surface-container-low/50 flex justify-end gap-3 sticky bottom-0 z-10">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs uppercase tracking-wider rounded border border-outline/30 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="admin-create-auction-submit-btn"
            type="submit"
            form="admin-create-auction-form"
            disabled={isSubmitting || artworks.length === 0}
            className="px-6 py-2.5 bg-primary hover:bg-surface-tint text-on-primary font-semibold text-xs uppercase tracking-wider rounded shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                <span>Scheduling Auction...</span>
              </>
            ) : (
              <>
                <Gavel className="w-4 h-4" />
                <span>Schedule Live Auction</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
