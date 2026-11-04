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
  Edit,
} from 'lucide-react';
import { artworkApi } from '../../services/artwork.service';
import { ExhibitionService, Exhibition } from '../../services/exhibition.service';
import { Artwork } from '../../types/artwork';
import { getArtworkImageUrl, DEFAULT_ARTWORK_IMAGE } from '../../utils/image.util';

interface EditExhibitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  exhibition: Exhibition | null;
  onExhibitionUpdated: (updated: Exhibition) => void;
  onOpenUploadArtwork?: () => void;
}

export const EditExhibitionModal: React.FC<EditExhibitionModalProps> = ({
  isOpen,
  onClose,
  exhibition,
  onExhibitionUpdated,
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
    if (!isOpen || !exhibition) return;

    setTitle(exhibition.title || '');
    setDescription(exhibition.description || '');
    setBannerUrl(exhibition.bannerUrl || '');
    setTicketPrice(String(exhibition.ticketPrice ?? 50));

    if (exhibition.startTime) {
      setStartTime(toLocalDatetime(new Date(exhibition.startTime)));
    }
    if (exhibition.endTime) {
      setEndTime(toLocalDatetime(new Date(exhibition.endTime)));
    }

    if (exhibition.vipStartTime && exhibition.vipEndTime) {
      setHasVipWindow(true);
      setVipStartTime(toLocalDatetime(new Date(exhibition.vipStartTime)));
      setVipEndTime(toLocalDatetime(new Date(exhibition.vipEndTime)));
    } else {
      setHasVipWindow(false);
      const now = new Date();
      const vipEnd = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      setVipStartTime(toLocalDatetime(now));
      setVipEndTime(toLocalDatetime(vipEnd));
    }

    const walls = exhibition.layoutConfig?.walls || ['Central Pavilion', 'West Gallery', 'East Gallery'];
    setWallsText(Array.isArray(walls) ? walls.join(', ') : 'Central Pavilion, West Gallery, East Gallery');
    setCuratorNote(exhibition.layoutConfig?.curatorNote || '');

    // Fetch the organizer's own artworks and the exhibition's linked artworks
    setIsLoadingArtworks(true);
    setError(null);

    Promise.all([
      artworkApi.getMyArtworks(),
      ExhibitionService.getExhibitionById(exhibition.id),
    ])
      .then(([artworks, detail]) => {
        const eligible = artworks.filter((a) => a.moderationStatus !== 'REJECTED');
        setMyArtworks(eligible);
        if (detail && detail.artworks) {
          setSelectedArtworkIds(detail.artworks.map((ea) => ea.artwork.id));
        }
      })
      .catch((err) => {
        console.error('Failed to load exhibition details:', err);
        setError('Failed to fetch exhibition details. Please try again.');
      })
      .finally(() => {
        setIsLoadingArtworks(false);
      });
  }, [isOpen, exhibition]);

  if (!isOpen || !exhibition) return null;

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
    if (!title.trim()) {
      setError('Exhibition title is required.');
      return;
    }
    if (!startTime || !endTime) {
      setError('Please provide valid start and end dates.');
      return;
    }
    if (new Date(endTime) <= new Date(startTime)) {
      setError('Exhibition end date must be after the start date.');
      return;
    }
    if (hasVipWindow) {
      if (!vipStartTime || !vipEndTime) {
        setError('Please provide valid VIP window start and end dates.');
        return;
      }
      if (new Date(vipEndTime) <= new Date(vipStartTime)) {
        setError('VIP window end time must be after the VIP start time.');
        return;
      }
    }
    if (selectedArtworkIds.length === 0) {
      setError('Please select at least 1 artwork to showcase in this virtual exhibition.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const walls = wallsText
        .split(',')
        .map((w) => w.trim())
        .filter(Boolean);

      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        bannerUrl: bannerUrl.trim() || undefined,
        ticketPrice: parseFloat(ticketPrice) || 0,
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
      } else {
        payload.vipStartTime = null;
        payload.vipEndTime = null;
      }

      const updated = await ExhibitionService.updateExhibition(exhibition.id, payload);
      onExhibitionUpdated(updated);
      onClose();
    } catch (err: any) {
      console.error('Failed to update exhibition:', err);
      setError(err.message || 'Failed to update virtual exhibition.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="edit-exhibition-modal"
        className="bg-surface rounded-2xl max-w-3xl w-full overflow-hidden border border-outline/20 shadow-2xl relative flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 bg-surface-container-low border-b border-outline/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-on-surface">Edit Virtual Exhibition</h2>
              <p className="text-xs text-on-surface-variant">
                Modify exhibition details, schedule dates, gallery walls, and featured artworks
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
              id="edit-exhibition-error-banner"
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
                id="edit-exhibition-title-input"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Threads of Bengal: Tapestry & Modern Fiber Canvas"
                className="w-full px-4 py-2.5 rounded-lg border border-outline/30 bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Curator Description & Theme
              </label>
              <textarea
                id="edit-exhibition-description-input"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the historical context, artistic narratives, and regional craftsmanship..."
                className="w-full px-4 py-2.5 rounded-lg border border-outline/30 bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Banner Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="/images/paintings/..."
                  className="w-full px-4 py-2.5 rounded-lg border border-outline/30 bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Ticket Pass Price (Credits)
                </label>
                <input
                  id="edit-exhibition-price-input"
                  type="number"
                  min="0"
                  step="5"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-outline/30 bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Schedule & Timing */}
          <div className="space-y-4 pt-4 border-t border-outline/10">
            <h3 className="text-xs uppercase tracking-wider font-bold text-primary flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Schedule & Admission Window
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Public Opening Time <span className="text-error">*</span>
                </label>
                <input
                  id="edit-exhibition-start-time"
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-outline/30 bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Closing Time <span className="text-error">*</span>
                </label>
                <input
                  id="edit-exhibition-end-time"
                  type="datetime-local"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-outline/30 bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* VIP Preview Window Toggle */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-semibold text-on-surface">Enable VIP Collector Preview Window</span>
                </div>
                <input
                  type="checkbox"
                  checked={hasVipWindow}
                  onChange={(e) => setHasVipWindow(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-outline/30 focus:ring-primary cursor-pointer"
                />
              </div>

              {hasVipWindow && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-outline/10">
                  <div>
                    <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                      VIP Preview Opens
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
                      VIP Preview Closes
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
                id="edit-exhibition-walls-input"
                type="text"
                value={wallsText}
                onChange={(e) => setWallsText(e.target.value)}
                placeholder="East Pavilion Wall, West Pavilion Wall"
                className="w-full px-4 py-2.5 rounded-lg border border-outline/30 bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary"
              />
              <p className="text-[10px] text-on-surface-variant mt-1">
                Artworks will be distributed evenly across these gallery walls.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Curator's Statement Note (Displayed in Hall Reception)
              </label>
              <input
                type="text"
                value={curatorNote}
                onChange={(e) => setCuratorNote(e.target.value)}
                placeholder="Curator's statement on cultural context and medium..."
                className="w-full px-4 py-2.5 rounded-lg border border-outline/30 bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Artwork Selection: Organizer's Owned Artworks */}
          <div className="space-y-4 pt-4 border-t border-outline/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs uppercase tracking-wider font-bold text-primary flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" /> Select Your Owned Artworks ({selectedArtworkIds.length} Selected)
                </h3>
                <p className="text-[11px] text-on-surface-variant">
                  Choose which of your uploaded fine art paintings will be featured in this hall.
                </p>
              </div>

              {myArtworks.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                  >
                    {selectedArtworkIds.length === myArtworks.length ? 'Deselect All' : 'Select All'}
                  </button>
                  {onOpenUploadArtwork && (
                    <button
                      type="button"
                      onClick={onOpenUploadArtwork}
                      className="px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded hover:bg-primary/20 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Upload New</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {isLoadingArtworks ? (
              <div className="py-8 text-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-on-surface-variant">Loading your uploaded artworks...</p>
              </div>
            ) : myArtworks.length === 0 ? (
              <div className="p-6 rounded-2xl bg-surface-container-low border-2 border-dashed border-outline/20 text-center space-y-3">
                <Palette className="w-6 h-6 text-primary mx-auto" />
                <p className="text-xs text-on-surface-variant">No artworks uploaded under your curator account yet.</p>
              </div>
            ) : (
              <div
                id="edit-exhibition-artworks-grid"
                className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1"
              >
                {myArtworks.map((art) => {
                  const isSelected = selectedArtworkIds.includes(art.id);
                  return (
                    <div
                      key={art.id}
                      onClick={() => toggleArtworkSelection(art.id)}
                      className={`relative p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-outline/20 bg-surface-container-lowest hover:border-outline/40'
                      }`}
                    >
                      <div className="relative aspect-4/3 rounded-lg overflow-hidden mb-2 bg-surface-container">
                        <img
                          src={getArtworkImageUrl(art.imageUrl)}
                          alt={art.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (target.src !== DEFAULT_ARTWORK_IMAGE) target.src = DEFAULT_ARTWORK_IMAGE;
                          }}
                        />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-serif font-bold text-on-surface line-clamp-1">{art.title}</h4>
                        <p className="text-[10px] text-on-surface-variant line-clamp-1">{art.medium}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline/10 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-lg border border-outline/30 text-xs font-semibold text-on-surface hover:bg-surface-container transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="save-exhibition-changes-btn"
              type="submit"
              disabled={isSubmitting || selectedArtworkIds.length === 0}
              className="px-6 py-2.5 rounded-lg bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider hover:bg-surface-tint disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Update Exhibition</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
