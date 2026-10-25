import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Layers,
  Calendar,
  AlertCircle,
  Plus,
  CheckCircle2,
  Crown,
  Palette,
} from 'lucide-react';
import { artworkApi } from '../../services/artwork.service';
import { ExhibitionService, Exhibition } from '../../services/exhibition.service';
import { Artwork } from '../../types/artwork';
import { getArtworkImageUrl, DEFAULT_ARTWORK_IMAGE } from '../../utils/image.util';

interface CreateExhibitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExhibitionCreated: (exhibition: Exhibition) => void;
  onOpenUploadArtwork: () => void;
}

export const CreateExhibitionModal: React.FC<CreateExhibitionModalProps> = ({
  isOpen,
  onClose,
  onExhibitionCreated,
  onOpenUploadArtwork,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [ticketPrice, setTicketPrice] = useState('50');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [hasVipWindow, setHasVipWindow] = useState(false);
  const [vipStartTime, setVipStartTime] = useState('');
  const [vipEndTime, setVipEndTime] = useState('');
  const [wallsText, setWallsText] = useState('Central Pavilion, West Gallery, East Gallery');
  const [curatorNote, setCuratorNote] = useState('');

  const [myArtworks, setMyArtworks] = useState<Artwork[]>([]);
  const [selectedArtworkIds, setSelectedArtworkIds] = useState<string[]>([]);
  const [isLoadingArtworks, setIsLoadingArtworks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to format Date to datetime-local value
  const toLocalDatetime = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${y}-${m}-${d}T${h}:${min}`;
  };

  useEffect(() => {
    if (!isOpen) return;

    // Reset default dates: Starts now, ends in 14 days
    const now = new Date();
    const end = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    setStartTime(toLocalDatetime(now));
    setEndTime(toLocalDatetime(end));

    // Preset VIP window: Starts now, ends in 2 days
    const vipEnd = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    setVipStartTime(toLocalDatetime(now));
    setVipEndTime(toLocalDatetime(vipEnd));

    // Fetch the organizer's own artworks
    setIsLoadingArtworks(true);
    setError(null);
    artworkApi
      .getMyArtworks()
      .then((artworks) => {
        // Exclude rejected artworks
        const eligible = artworks.filter((a) => a.moderationStatus !== 'REJECTED');
        setMyArtworks(eligible);
        // Pre-select all or first few artworks
        if (eligible.length > 0) {
          setSelectedArtworkIds(eligible.map((a) => a.id));
        }
      })
      .catch((err) => {
        console.error('Failed to load organizer artworks:', err);
        setError('Failed to fetch your uploaded artworks. Please try again.');
      })
      .finally(() => {
        setIsLoadingArtworks(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleArtworkSelection = (artworkId: string) => {
    setSelectedArtworkIds((prev) =>
      prev.includes(artworkId) ? prev.filter((id) => id !== artworkId) : [...prev, artworkId]
    );
  };

  const handleSelectAll = () => {
    if (selectedArtworkIds.length === myArtworks.length) {
      setSelectedArtworkIds([]);
    } else {
      setSelectedArtworkIds(myArtworks.map((a) => a.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Exhibition title is required.');
      return;
    }

    if (!startTime || !endTime) {
      setError('Start time and end time are required.');
      return;
    }

    if (new Date(endTime) <= new Date(startTime)) {
      setError('End date must be scheduled after start date.');
      return;
    }

    if (selectedArtworkIds.length === 0) {
      setError('Please select at least 1 of your uploaded artworks to showcase in this exhibition.');
      return;
    }

    const walls = wallsText
      .split(',')
      .map((w) => w.trim())
      .filter(Boolean);

    setIsSubmitting(true);

    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        bannerUrl: bannerUrl.trim() || undefined,
        ticketPrice: Math.max(0, Number(ticketPrice) || 0),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        layoutConfig: {
          walls: walls.length > 0 ? walls : ['Central Pavilion', 'West Gallery', 'East Gallery'],
          curatorNote: curatorNote.trim() || undefined,
        },
        artworkIds: selectedArtworkIds,
      };

      if (hasVipWindow && vipStartTime && vipEndTime) {
        payload.vipStartTime = new Date(vipStartTime).toISOString();
        payload.vipEndTime = new Date(vipEndTime).toISOString();
      }

      const created = await ExhibitionService.createExhibition(payload);
      onExhibitionCreated(created);
      onClose();
    } catch (err: any) {
      console.error('Failed to create exhibition:', err);
      setError(err.message || 'Failed to create virtual exhibition.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="create-exhibition-modal"
        className="bg-surface rounded-2xl max-w-3xl w-full overflow-hidden border border-outline/20 shadow-2xl relative flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 bg-surface-container-low border-b border-outline/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-on-surface">Curate Virtual Exhibition</h2>
              <p className="text-xs text-on-surface-variant">
                Showcase your own uploaded artworks in an interactive 3D virtual gallery hall
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {error && (
            <div
              id="create-exhibition-error-banner"
              className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Details */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-wider font-bold text-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> General Information
            </h3>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Exhibition Title <span className="text-error">*</span>
              </label>
              <input
                id="create-exhibition-title-input"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Threads of Bengal: Sacred Folk Tapestries"
                className="w-full px-4 py-2.5 rounded-lg border border-outline/30 bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Curator Description & Theme
              </label>
              <textarea
                id="create-exhibition-description-input"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the historical context, artistic narratives, and regional craftsmanship of this curation..."
                className="w-full px-4 py-2.5 rounded-lg border border-outline/30 bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Banner Image URL (Optional)
                </label>
                <input
                  id="create-exhibition-banner-input"
                  type="url"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 rounded-lg border border-outline/30 bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Ticket Admission Price (Credits)
                </label>
                <input
                  id="create-exhibition-ticket-price-input"
                  type="number"
                  min="0"
                  step="1"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(e.target.value)}
                  placeholder="0 for Free Admission"
                  className="w-full px-4 py-2.5 rounded-lg border border-outline/30 bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Schedule & Timing */}
          <div className="space-y-4 pt-4 border-t border-outline/10">
            <h3 className="text-xs uppercase tracking-wider font-bold text-primary flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Scheduling & Access Windows
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Exhibition Opens <span className="text-error">*</span>
                </label>
                <input
                  id="create-exhibition-start-time-input"
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-outline/30 bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Exhibition Closes <span className="text-error">*</span>
                </label>
                <input
                  id="create-exhibition-end-time-input"
                  type="datetime-local"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-outline/30 bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* VIP Preview Option */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline/10 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasVipWindow}
                  onChange={(e) => setHasVipWindow(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-600" /> Enable Early VIP Collector Access Window
                </span>
              </label>

              {hasVipWindow && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                      VIP Window Opens
                    </label>
                    <input
                      type="datetime-local"
                      value={vipStartTime}
                      onChange={(e) => setVipStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-outline/30 bg-surface text-on-surface text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                      VIP Window Closes
                    </label>
                    <input
                      type="datetime-local"
                      value={vipEndTime}
                      onChange={(e) => setVipEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-outline/30 bg-surface text-on-surface text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Wall Layout & Atmosphere */}
          <div className="space-y-4 pt-4 border-t border-outline/10">
            <h3 className="text-xs uppercase tracking-wider font-bold text-primary flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Virtual Hall Architecture
            </h3>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Gallery Wall Names (Comma-separated)
              </label>
              <input
                id="create-exhibition-walls-input"
                type="text"
                value={wallsText}
                onChange={(e) => setWallsText(e.target.value)}
                placeholder="Central Pavilion, West Gallery, East Gallery"
                className="w-full px-4 py-2.5 rounded-lg border border-outline/30 bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary"
              />
              <p className="text-[10px] text-on-surface-variant mt-1">
                Artworks will be automatically arrayed across these gallery walls with spotlight framing.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Curator's Exhibition Note (Displayed in Hall Reception)
              </label>
              <input
                type="text"
                value={curatorNote}
                onChange={(e) => setCuratorNote(e.target.value)}
                placeholder="Walk through our 3 ceremonial halls to experience indigenous crafts..."
                className="w-full px-4 py-2.5 rounded-lg border border-outline/30 bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Artwork Selection: MUST BE ORGANIZER'S OWN ARTWORKS */}
          <div className="space-y-4 pt-4 border-t border-outline/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs uppercase tracking-wider font-bold text-primary flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" /> Showcase Your Artworks ({selectedArtworkIds.length} Selected)
                </h3>
                <p className="text-[11px] text-on-surface-variant">
                  Select which of your uploaded artworks will be featured in this virtual exhibition hall.
                </p>
              </div>

              {myArtworks.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[11px] text-primary hover:underline font-semibold"
                  >
                    {selectedArtworkIds.length === myArtworks.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    type="button"
                    onClick={onOpenUploadArtwork}
                    className="px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded hover:bg-primary/20 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Upload New</span>
                  </button>
                </div>
              )}
            </div>

            {isLoadingArtworks ? (
              <div className="py-8 text-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-on-surface-variant">Loading your uploaded artworks...</p>
              </div>
            ) : myArtworks.length === 0 ? (
              /* Notice when organizer hasn't uploaded any artworks yet */
              <div
                id="organizer-no-artworks-notice"
                className="p-6 rounded-2xl bg-surface-container-low border-2 border-dashed border-outline/20 text-center space-y-3"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Palette className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-base text-on-surface">No Uploaded Artworks Found</h4>
                  <p className="text-xs text-on-surface-variant max-w-md mx-auto mt-1 leading-relaxed">
                    Organizers must upload their own artwork first before creating an exhibition. You cannot showcase other artists' artworks.
                  </p>
                </div>
                <button
                  type="button"
                  id="modal-upload-artwork-trigger-btn"
                  onClick={onOpenUploadArtwork}
                  className="px-5 py-2.5 bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-surface-tint transition-all shadow-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Your First Artwork</span>
                </button>
              </div>
            ) : (
              /* Grid of Organizer's own artworks */
              <div
                id="organizer-artworks-selector-grid"
                className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1"
              >
                {myArtworks.map((art) => {
                  const isSelected = selectedArtworkIds.includes(art.id);
                  return (
                    <div
                      key={art.id}
                      onClick={() => toggleArtworkSelection(art.id)}
                      className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between group ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-xs'
                          : 'border-outline/20 hover:border-outline/40 bg-surface-container-lowest'
                      }`}
                    >
                      <div className="relative aspect-4/3 rounded-lg overflow-hidden mb-2 bg-surface-container">
                        <img
                          src={getArtworkImageUrl(art.imageUrl)}
                          alt={art.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (target.src !== DEFAULT_ARTWORK_IMAGE) {
                              target.src = DEFAULT_ARTWORK_IMAGE;
                            }
                          }}
                        />
                        <div
                          className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-primary text-on-primary' : 'bg-black/50 text-white'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      <div>
                        <h5 className="font-serif font-bold text-xs text-on-surface truncate">{art.title}</h5>
                        <p className="text-[10px] text-on-surface-variant truncate">{art.medium}</p>
                        <p className="text-[10px] font-semibold text-primary mt-0.5">
                          {Number(art.price).toFixed(2)} Credits
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Submit Action */}
          <div className="pt-4 border-t border-outline/10 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-outline/30 text-xs font-semibold uppercase tracking-wider text-on-surface hover:bg-surface-container transition-all"
            >
              Cancel
            </button>

            <button
              id="submit-create-exhibition-btn"
              type="submit"
              disabled={isSubmitting || selectedArtworkIds.length === 0}
              className="px-6 py-2.5 bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-surface-tint disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  <span>Publishing Hall...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Publish Exhibition ({selectedArtworkIds.length} Exhibits)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
