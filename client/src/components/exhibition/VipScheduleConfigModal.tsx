import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Eye,
  Radio,
} from 'lucide-react';
import { Exhibition, ConfigureVipSchedulePayload } from '../../types/exhibition';
import { exhibitionApi } from '../../services/exhibition.service';

interface VipScheduleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  exhibition: Exhibition | null;
  onScheduleUpdated: (updatedExhibition: Exhibition) => void;
}

/**
 * Converts ISO 8601 string or Date to datetime-local input format (YYYY-MM-DDTHH:mm)
 */
function toLocalDatetimeInput(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Formats a date string nicely for human readability
 */
function formatHumanDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Not configured';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export const VipScheduleConfigModal: React.FC<VipScheduleConfigModalProps> = ({
  isOpen,
  onClose,
  exhibition,
  onScheduleUpdated,
}) => {
  const [isVipEnabled, setIsVipEnabled] = useState(false);
  const [vipStartTime, setVipStartTime] = useState('');
  const [vipEndTime, setVipEndTime] = useState('');
  const [activePreset, setActivePreset] = useState<'24h' | '48h' | '72h' | 'custom' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when exhibition changes or modal opens
  useEffect(() => {
    if (exhibition && isOpen) {
      setIsVipEnabled(true);
      if (exhibition.vipStartTime && exhibition.vipEndTime) {
        setVipStartTime(toLocalDatetimeInput(exhibition.vipStartTime));
        setVipEndTime(toLocalDatetimeInput(exhibition.vipEndTime));
        setActivePreset(null);
      } else {
        // Default to a 48h preview relative to exhibition opening
        const publicStart = new Date(exhibition.startTime);
        let baseTime = publicStart.getTime();
        if (isNaN(baseTime) || baseTime < Date.now()) {
          baseTime = Date.now() + 3 * 24 * 60 * 60 * 1000;
        }
        const vipStartMs = baseTime - 48 * 60 * 60 * 1000;
        setVipStartTime(toLocalDatetimeInput(new Date(vipStartMs).toISOString()));
        setVipEndTime(toLocalDatetimeInput(new Date(baseTime).toISOString()));
        setActivePreset('48h');
      }
      setError(null);
      setSuccessMessage(null);
    }
  }, [exhibition, isOpen]);

  if (!isOpen || !exhibition) return null;

  // Handle Quick Presets (relative to general exhibition startTime)
  const applyPreset = (hoursBeforeOpening: number, presetKey: '24h' | '48h' | '72h') => {
    setError(null);
    setActivePreset(presetKey);
    setIsVipEnabled(true);

    const publicStart = new Date(exhibition.startTime);
    let baseTime = publicStart.getTime();

    // If exhibition start time is invalid or far in the past, anchor relative to now + 3 days
    if (isNaN(baseTime) || baseTime < Date.now()) {
      baseTime = Date.now() + 3 * 24 * 60 * 60 * 1000;
    }

    const vipStartMs = baseTime - hoursBeforeOpening * 60 * 60 * 1000;
    const vipEndMs = baseTime; // VIP concludes exactly as general public doors open

    setVipStartTime(toLocalDatetimeInput(new Date(vipStartMs).toISOString()));
    setVipEndTime(toLocalDatetimeInput(new Date(vipEndMs).toISOString()));
  };

  // Compute live duration preview
  const calculateLiveDuration = (): string | null => {
    if (!vipStartTime || !vipEndTime) return null;
    const start = new Date(vipStartTime);
    const end = new Date(vipEndTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null;

    const diffHours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} window`;
    }
    const days = Math.floor(diffHours / 24);
    const remaining = diffHours % 24;
    return remaining === 0
      ? `${days} day${days === 1 ? '' : 's'} (${diffHours}h)`
      : `${days}d ${remaining}h (${diffHours}h)`;
  };

  // Compute live status preview
  const calculateLiveStatus = (): { label: string; colorClass: string; icon: any } => {
    if (!isVipEnabled || !vipStartTime || !vipEndTime) {
      return {
        label: 'VIP Disabled',
        colorClass: 'bg-surface-container text-on-surface-variant border-outline/30',
        icon: Lock,
      };
    }

    const now = Date.now();
    const start = new Date(vipStartTime).getTime();
    const end = new Date(vipEndTime).getTime();

    if (isNaN(start) || isNaN(end) || end <= start) {
      return {
        label: 'Configuration Incomplete',
        colorClass: 'bg-amber-50 text-amber-800 border-amber-200',
        icon: AlertCircle,
      };
    }

    if (now < start) {
      return {
        label: 'VIP Scheduled',
        colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        icon: ShieldCheck,
      };
    } else if (now >= start && now <= end) {
      return {
        label: 'VIP Live Active',
        colorClass: 'bg-primary-container/30 text-primary border-primary/30',
        icon: Radio,
      };
    } else {
      return {
        label: 'VIP Concluded',
        colorClass: 'bg-neutral-100 text-neutral-700 border-neutral-300',
        icon: Clock,
      };
    }
  };

  const statusInfo = calculateLiveStatus();
  const liveDuration = calculateLiveDuration();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Client-side validation
    if (isVipEnabled) {
      if (!vipStartTime) {
        setError('Please select a VIP preview commencement time.');
        return;
      }
      if (!vipEndTime) {
        setError('Please select a VIP preview conclusion time.');
        return;
      }

      const start = new Date(vipStartTime);
      const end = new Date(vipEndTime);

      if (isNaN(start.getTime())) {
        setError('The VIP preview start time is invalid.');
        return;
      }
      if (isNaN(end.getTime())) {
        setError('The VIP preview end time is invalid.');
        return;
      }
      if (end <= start) {
        setError('VIP viewing end time must be after VIP start time.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload: ConfigureVipSchedulePayload = {
        isVipEnabled,
        vipStartTime: isVipEnabled && vipStartTime ? new Date(vipStartTime).toISOString() : null,
        vipEndTime: isVipEnabled && vipEndTime ? new Date(vipEndTime).toISOString() : null,
      };

      const updated = await exhibitionApi.configureVipSchedule(exhibition.id, payload);
      setSuccessMessage('VIP viewing schedule configured successfully!');
      onScheduleUpdated(updated);

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to update VIP schedule. Please verify your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="vip-schedule-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vip-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-surface-bright rounded-xl ambient-shadow border border-outline/30 overflow-hidden my-8">
        {/* Header Bar */}
        <div className="px-6 py-5 border-b border-outline/20 bg-surface flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-primary block">
                Exhibition Access Privileges
              </span>
              <h2 id="vip-modal-title" className="font-serif text-xl sm:text-2xl font-bold text-on-surface">
                VIP Viewing Schedule
              </h2>
              <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">
                {exhibition.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
            aria-label="Close VIP Schedule Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* General Public Schedule Banner (Context Reference) */}
          <div className="bg-surface-container-low p-4 rounded-lg border border-outline/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-semibold text-on-surface uppercase tracking-wider block mb-0.5 text-[10px]">
                Public Exhibition Doors Open
              </span>
              <div className="text-on-surface-variant flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>{formatHumanDateTime(exhibition.startTime)}</span>
                <span className="text-outline">→</span>
                <span>{formatHumanDateTime(exhibition.endTime)}</span>
              </div>
            </div>
            <div className="sm:text-right">
              <span className="font-semibold text-on-surface uppercase tracking-wider block mb-0.5 text-[10px]">
                Admission Tier
              </span>
              <span className="text-primary font-serif font-bold">
                {exhibition.ticketPrice.toFixed(2)} Credits
              </span>
            </div>
          </div>

          {/* Master VIP Enable Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-surface border border-outline/30">
            <div className="space-y-0.5 pr-4">
              <label htmlFor="vip-toggle" className="font-serif text-sm font-bold text-on-surface cursor-pointer">
                Enable VIP Early-Access Viewing Window
              </label>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Grant ticket holders exclusive private gallery access prior to general public admission.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                id="vip-toggle"
                checked={isVipEnabled}
                onChange={(e) => {
                  setIsVipEnabled(e.target.checked);
                  if (e.target.checked && !vipStartTime) {
                    applyPreset(48, '48h');
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Conditional Configuration Area */}
          {isVipEnabled && (
            <div className="space-y-5 animate-fadeIn">
              {/* Quick Presets Buttons */}
              <div>
                <span className="text-[11px] font-semibold text-on-surface uppercase tracking-wider block mb-2">
                  Quick Duration Presets (Relative to Opening)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    id="vip-quick-preset-24h"
                    onClick={() => applyPreset(24, '24h')}
                    className={`py-2 px-3 text-xs font-semibold rounded border transition-colors flex items-center justify-center gap-1.5 ${
                      activePreset === '24h'
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface hover:bg-surface-container text-on-surface border-outline/30'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>24h Early Access</span>
                  </button>
                  <button
                    type="button"
                    id="vip-quick-preset-48h"
                    onClick={() => applyPreset(48, '48h')}
                    className={`py-2 px-3 text-xs font-semibold rounded border transition-colors flex items-center justify-center gap-1.5 ${
                      activePreset === '48h'
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface hover:bg-surface-container text-on-surface border-outline/30'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>48h Preview</span>
                  </button>
                  <button
                    type="button"
                    id="vip-quick-preset-72h"
                    onClick={() => applyPreset(72, '72h')}
                    className={`py-2 px-3 text-xs font-semibold rounded border transition-colors flex items-center justify-center gap-1.5 ${
                      activePreset === '72h'
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface hover:bg-surface-container text-on-surface border-outline/30'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>72h Premiere</span>
                  </button>
                </div>
              </div>

              {/* Date & Time Input Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* VIP Start Time */}
                <div>
                  <label
                    htmlFor="vip-start-time-input"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface mb-1.5"
                  >
                    VIP Commencement (Start Date & Time) *
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      id="vip-start-time-input"
                      value={vipStartTime}
                      onChange={(e) => {
                        setVipStartTime(e.target.value);
                        setActivePreset('custom');
                        setError(null);
                      }}
                      required={isVipEnabled}
                      className="w-full px-3.5 py-2.5 bg-surface text-on-surface text-xs rounded border border-outline/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                    />
                  </div>
                  <span className="text-[10px] text-on-surface-variant mt-1 block">
                    Exclusive doors unlock for VIP pass holders.
                  </span>
                </div>

                {/* VIP End Time */}
                <div>
                  <label
                    htmlFor="vip-end-time-input"
                    className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface mb-1.5"
                  >
                    VIP Conclusion (End Date & Time) *
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      id="vip-end-time-input"
                      value={vipEndTime}
                      onChange={(e) => {
                        setVipEndTime(e.target.value);
                        setActivePreset('custom');
                        setError(null);
                      }}
                      required={isVipEnabled}
                      className="w-full px-3.5 py-2.5 bg-surface text-on-surface text-xs rounded border border-outline/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                    />
                  </div>
                  <span className="text-[10px] text-on-surface-variant mt-1 block">
                    Concludes when standard public viewing begins.
                  </span>
                </div>
              </div>

              {/* Visual Timeline & Live Status Strip */}
              <div
                id="vip-timeline-preview"
                className="p-4 rounded-lg bg-surface border border-outline/30 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">
                    Timeline & Access Status
                  </span>
                  <div className="flex items-center gap-2">
                    {liveDuration && (
                      <span
                        id="vip-duration-badge"
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary-container/20 text-primary border border-primary/20"
                      >
                        {liveDuration}
                      </span>
                    )}
                    <span
                      id="vip-status-badge"
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1 ${statusInfo.colorClass}`}
                    >
                      <statusInfo.icon className="w-3 h-3" />
                      <span>{statusInfo.label}</span>
                    </span>
                  </div>
                </div>

                {/* Visual Step Bar */}
                <div className="relative pt-3 pb-1">
                  <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden flex">
                    <div className="h-full bg-primary/40 w-1/3 border-r border-surface"></div>
                    <div className="h-full bg-primary w-1/3 border-r border-surface"></div>
                    <div className="h-full bg-surface-container w-1/3"></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-medium mt-2">
                    <div className="text-left">
                      <span className="block font-semibold text-primary">VIP Preview</span>
                      <span>{vipStartTime ? formatHumanDateTime(vipStartTime) : 'TBD'}</span>
                    </div>
                    <div className="text-center">
                      <span className="block font-semibold text-on-surface">Public Launch</span>
                      <span>{formatHumanDateTime(exhibition.startTime)}</span>
                    </div>
                    <div className="text-right">
                      <span className="block font-semibold text-on-surface-variant">Closing</span>
                      <span>{formatHumanDateTime(exhibition.endTime)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* VIP Benefits & Curator Notes */}
              <div className="bg-surface-container-low/60 p-3.5 rounded-lg border border-outline/20">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-primary block mb-1">
                  VIP Curator Inclusions
                </span>
                <ul className="text-xs text-on-surface-variant space-y-1 list-disc list-inside">
                  <li>Unrestricted ultra-high-resolution 360° zoom on heritage crafts.</li>
                  <li>Exclusive curator audio commentary and provenance background.</li>
                  <li>First right of acquisition on limited marketplace-listed items.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Inline Error Message */}
          {error && (
            <div
              id="vip-schedule-error"
              className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Inline Success Message */}
          {successMessage && (
            <div
              id="vip-schedule-success"
              className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline/20">
            <button
              type="button"
              id="vip-cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-on-surface bg-surface hover:bg-surface-container border border-outline/30 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="vip-save-schedule-btn"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-on-surface hover:bg-black rounded transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Saving Schedule...</span>
                </>
              ) : (
                <span>Save VIP Schedule</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
