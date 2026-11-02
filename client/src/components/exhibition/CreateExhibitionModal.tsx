import React, { useState } from 'react';
import { X, Calendar, Sparkles, AlertCircle } from 'lucide-react';
import { Exhibition, CreateExhibitionPayload } from '../../types/exhibition';
import { exhibitionApi } from '../../services/exhibition.service';

interface CreateExhibitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExhibitionCreated: (newExhibition: Exhibition) => void;
}

export const CreateExhibitionModal: React.FC<CreateExhibitionModalProps> = ({
  isOpen,
  onClose,
  onExhibitionCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [ticketPrice, setTicketPrice] = useState('20.00');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isVipEnabled, setIsVipEnabled] = useState(false);
  const [vipStartTime, setVipStartTime] = useState('');
  const [vipEndTime, setVipEndTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (new Date(endTime) <= new Date(startTime)) {
      setError('Exhibition conclusion time must be after opening time.');
      return;
    }

    if (isVipEnabled) {
      if (!vipStartTime || !vipEndTime) {
        setError('Please configure both VIP commencement and conclusion times.');
        return;
      }
      if (new Date(vipEndTime) <= new Date(vipStartTime)) {
        setError('VIP viewing end time must be after VIP start time.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload: CreateExhibitionPayload = {
        title,
        description,
        bannerUrl: bannerUrl.trim() !== '' ? bannerUrl : undefined,
        ticketPrice: parseFloat(ticketPrice) || 0,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        isVipEnabled,
        vipStartTime: isVipEnabled && vipStartTime ? new Date(vipStartTime).toISOString() : null,
        vipEndTime: isVipEnabled && vipEndTime ? new Date(vipEndTime).toISOString() : null,
      };

      const created = await exhibitionApi.createExhibition(payload);
      onExhibitionCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create exhibition.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="create-exhibition-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl bg-surface-bright rounded-xl ambient-shadow border border-outline/30 overflow-hidden my-8">
        <div className="px-6 py-5 border-b border-outline/20 bg-surface flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-xl font-bold text-on-surface">Curate Virtual Exhibition</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface mb-1">
              Exhibition Title *
            </label>
            <input
              type="text"
              id="exhibition-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Masterpieces of Jamdani Weaving"
              required
              className="w-full px-3.5 py-2.5 bg-surface text-on-surface text-xs rounded border border-outline/30 focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface mb-1">
              Curatorial Statement / Description *
            </label>
            <textarea
              id="exhibition-desc-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the themes and historical craft contexts..."
              required
              className="w-full px-3.5 py-2.5 bg-surface text-on-surface text-xs rounded border border-outline/30 focus:border-primary outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface mb-1">
                Admission Price (Credits)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                id="exhibition-price-input"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-surface text-on-surface text-xs rounded border border-outline/30 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface mb-1">
                Banner Image URL (Optional)
              </label>
              <input
                type="url"
                id="exhibition-banner-input"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 bg-surface text-on-surface text-xs rounded border border-outline/30 focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface mb-1">
                Public Opening *
              </label>
              <input
                type="datetime-local"
                id="exhibition-start-time-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-surface text-on-surface text-xs rounded border border-outline/30 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface mb-1">
                Public Closing *
              </label>
              <input
                type="datetime-local"
                id="exhibition-end-time-input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-surface text-on-surface text-xs rounded border border-outline/30 focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* Inline VIP Toggle Option */}
          <div className="p-3.5 rounded bg-surface border border-outline/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-on-surface">Enable VIP Early Access Viewing</span>
            </div>
            <input
              type="checkbox"
              id="create-exhibition-vip-toggle"
              checked={isVipEnabled}
              onChange={(e) => setIsVipEnabled(e.target.checked)}
              className="accent-primary w-4 h-4 cursor-pointer"
            />
          </div>

          {isVipEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">
                  VIP Preview Start *
                </label>
                <input
                  type="datetime-local"
                  id="create-vip-start-time-input"
                  value={vipStartTime}
                  onChange={(e) => setVipStartTime(e.target.value)}
                  required={isVipEnabled}
                  className="w-full px-3 py-2 bg-surface text-on-surface text-xs rounded border border-outline/30 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">
                  VIP Preview End *
                </label>
                <input
                  type="datetime-local"
                  id="create-vip-end-time-input"
                  value={vipEndTime}
                  onChange={(e) => setVipEndTime(e.target.value)}
                  required={isVipEnabled}
                  className="w-full px-3 py-2 bg-surface text-on-surface text-xs rounded border border-outline/30 focus:border-primary outline-none"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline/20">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-on-surface bg-surface hover:bg-surface-container border border-outline/30 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-create-exhibition-btn"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-on-surface hover:bg-black rounded"
            >
              {isSubmitting ? 'Curating...' : 'Publish Exhibition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
