import React, { useState } from 'react';
import { X, Gavel, Calendar, Clock, Image as ImageIcon } from 'lucide-react';
import { Artwork } from '../../types/artwork';

interface CreateAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  artworks: Artwork[];
  onSubmit: (data: {
    artworkId: string;
    startingBid: number;
    minIncrement: number;
    startTime: string;
    endTime: string;
  }) => Promise<void>;
}

export const CreateAuctionModal: React.FC<CreateAuctionModalProps> = ({
  isOpen,
  onClose,
  artworks,
  onSubmit,
}) => {
  const [artworkId, setArtworkId] = useState('');
  const [startingBid, setStartingBid] = useState('');
  const [minIncrement, setMinIncrement] = useState('100');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Only allow APPROVED and AVAILABLE artworks
  const eligibleArtworks = artworks.filter(
    (a) => a.availability === 'AVAILABLE' && a.moderationStatus === 'APPROVED'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!artworkId) throw new Error('Please select an artwork');
      if (Number(startingBid) <= 0) throw new Error('Starting bid must be greater than 0');
      if (Number(minIncrement) <= 0) throw new Error('Minimum increment must be greater than 0');
      if (!startTime) throw new Error('Start time is required');
      if (!endTime) throw new Error('End time is required');
      
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      if (end <= start) throw new Error('End time must be after start time');

      await onSubmit({
        artworkId,
        startingBid: Number(startingBid),
        minIncrement: Number(minIncrement),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while scheduling the auction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedArtwork = artworks.find(a => a.id === artworkId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
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
              <h2 className="font-serif text-xl font-bold text-on-surface leading-tight">
                Schedule Live Auction
              </h2>
              <p className="text-xs text-on-surface-variant font-medium">
                Set up an exclusive bidding event for your heritage craft.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-error-container/20 border border-error/20 text-error rounded-lg text-sm flex items-start gap-2">
              <div className="font-semibold shrink-0">Error:</div>
              <div>{error}</div>
            </div>
          )}

          <form id="create-auction-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Artwork Selection */}
            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
                Select Artwork
              </label>
              <select
                required
                value={artworkId}
                onChange={(e) => setArtworkId(e.target.value)}
                className="w-full bg-surface-container-low border border-outline/30 rounded px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none"
              >
                <option value="" disabled>Select an available artwork...</option>
                {eligibleArtworks.map((artwork) => (
                  <option key={artwork.id} value={artwork.id}>
                    {artwork.title} (Medium: {artwork.medium})
                  </option>
                ))}
              </select>
              {eligibleArtworks.length === 0 && (
                <p className="mt-2 text-xs text-error font-medium">
                  You have no approved and available artworks to auction.
                </p>
              )}
            </div>

            {/* Preview Selected Artwork (if any) */}
            {selectedArtwork && (
              <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-lg border border-outline/20">
                 {selectedArtwork.imageUrl ? (
                   <img src={selectedArtwork.imageUrl} alt={selectedArtwork.title} className="w-16 h-16 object-cover rounded bg-surface-container-high shrink-0" />
                 ) : (
                   <div className="w-16 h-16 bg-surface-container-high rounded flex items-center justify-center shrink-0">
                     <ImageIcon className="w-6 h-6 text-on-surface-variant" />
                   </div>
                 )}
                 <div>
                   <p className="font-serif font-bold text-on-surface text-sm">{selectedArtwork.title}</p>
                   <p className="text-xs text-on-surface-variant line-clamp-1">{selectedArtwork.description}</p>
                   <p className="text-xs font-semibold text-primary mt-1">Listing Price: {selectedArtwork.price.toFixed(2)} ৳</p>
                 </div>
              </div>
            )}

            {/* Bidding Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
                  Starting Bid (৳)
                </label>
                <input
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
                  Minimum Increment (৳)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={minIncrement}
                  onChange={(e) => setMinIncrement(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full bg-surface-container-low border border-outline/30 rounded px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            {/* Scheduling */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
                  <Calendar className="w-3.5 h-3.5" /> Start Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline/30 rounded px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
                  <Clock className="w-3.5 h-3.5" /> End Time
                </label>
                <input
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
            className="px-5 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs uppercase tracking-wider rounded border border-outline/30 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-auction-form"
            disabled={isSubmitting || eligibleArtworks.length === 0}
            className="px-6 py-2.5 bg-primary hover:bg-surface-tint text-on-primary font-semibold text-xs uppercase tracking-wider rounded shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                <span>Scheduling...</span>
              </>
            ) : (
              <>
                <Gavel className="w-4 h-4" />
                <span>Schedule Auction</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
