import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  Layers,
  ArrowRightLeft,
  Sparkles,
} from 'lucide-react';
import { moderationApi } from '../../services/moderation.service';
import { ModerationQueueItem } from '../../types/moderation';

export const AdminModerationQueue: React.FC = () => {
  const [queue, setQueue] = useState<ModerationQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notesState, setNotesState] = useState<Record<string, string>>({});

  const fetchQueue = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await moderationApi.getQueue();
      setQueue(items);
    } catch (err: any) {
      setError(err.message || 'Failed to load moderation queue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleReview = async (item: ModerationQueueItem, action: 'APPROVE' | 'REJECT') => {
    setProcessingId(item.id);
    const notes = notesState[item.id] || '';
    try {
      await moderationApi.reviewItem(item.id, { action, notes });
      setToastMessage(
        action === 'APPROVE'
          ? `Successfully approved "${item.sourceArtwork.title}" and published it to the marketplace!`
          : `Listing "${item.sourceArtwork.title}" has been rejected.`
      );

      // Optimistically remove reviewed item from the queue list
      setQueue((prev) => prev.filter((q) => q.id !== item.id));

      setTimeout(() => {
        setToastMessage(null);
      }, 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to process moderation review.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div id="admin-moderation-queue" className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="moderation-success-toast"
          className="p-4 rounded-xl bg-status-valid/15 border border-status-valid/30 text-on-surface flex items-center justify-between animate-fade-in shadow-xs"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-status-valid shrink-0" />
            <p className="text-xs font-medium">{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs text-on-surface-variant hover:text-on-surface underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-6 sm:p-8 border border-outline/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Moderation Console</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-500/20">
              Threshold: &gt; 80% Similarity
            </span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface">
            Duplicate Artwork Moderation Queue
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl mt-1 leading-relaxed">
            Perceptual hash (dHash) engine detects listings exceeding 80% visual similarity against existing gallery pieces. Review side-by-side comparative scans to preserve artisan originality.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <button
            type="button"
            id="refresh-queue-btn"
            onClick={fetchQueue}
            disabled={isLoading}
            className="px-4 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold uppercase tracking-wider rounded-lg border border-outline/20 flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>

          <div className="px-4 py-2 rounded-lg bg-surface-container-low border border-outline/20 text-center">
            <span className="text-[10px] uppercase font-semibold text-on-surface-variant block">Pending</span>
            <span id="queue-count-badge" className="font-serif text-lg font-bold text-primary">
              {queue.length}
            </span>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="text-center py-16 bg-surface-container-lowest rounded-xl border border-outline/20">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-on-surface-variant font-medium">Scanning moderation review queue...</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-error-container/20 border border-error/30 text-on-surface flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-error shrink-0" />
          <p className="text-xs">{error}</p>
        </div>
      )}

      {/* Empty Queue State */}
      {!isLoading && queue.length === 0 && (
        <div
          id="empty-queue-banner"
          className="text-center py-16 px-6 bg-surface-container-lowest rounded-xl border border-dashed border-outline/30 space-y-3"
        >
          <div className="w-14 h-14 rounded-full bg-status-valid/10 text-status-valid mx-auto flex items-center justify-center">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-xl font-bold text-on-surface">Moderation Queue is Clear</h2>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
            All submitted artworks meet heritage originality criteria. Any new listings with perceptual similarity exceeding 80% will automatically appear here for comparative review.
          </p>
        </div>
      )}

      {/* Flagged Artworks Queue List */}
      {!isLoading && queue.length > 0 && (
        <div id="moderation-queue-list" className="space-y-8">
          {queue.map((item) => {
            const isProcessing = processingId === item.id;
            const score = item.similarityScore || 85.0;

            return (
              <div
                key={item.id}
                id={`moderation-card-${item.id}`}
                className="bg-surface-container-lowest rounded-2xl ambient-shadow border border-outline/25 overflow-hidden transition-all hover:border-outline/40"
              >
                {/* Card Top Banner: Similarity Metrics */}
                <div className="px-6 py-4 bg-surface-container-low border-b border-outline/15 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      id={`similarity-score-${item.id}`}
                      className="px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-500/15 text-amber-700 border border-amber-500/30 flex items-center gap-1.5 shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>{score.toFixed(1)}% Visual Match</span>
                    </span>

                    <span className="text-xs text-on-surface-variant flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 opacity-60" />
                      <span>Flagged {new Date(item.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>

                  <div className="text-[11px] uppercase tracking-wider font-semibold text-primary">
                    Review Required: Source vs. Suspected Match
                  </div>
                </div>

                {/* Split-Screen Comparative View */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                  {/* Floating match indicator on large screens */}
                  <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-surface-container border border-outline/30 items-center justify-center text-primary shadow-sm pointer-events-none">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>

                  {/* LEFT: Flagged New Submission */}
                  <div
                    id={`source-artwork-${item.sourceArtwork.id}`}
                    className="p-5 rounded-xl bg-surface-container-low/60 border border-amber-500/20 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-800 border border-amber-500/30">
                          Flagged Submission (New)
                        </span>
                        <span className="text-[11px] font-serif font-bold text-primary">
                          {item.sourceArtwork.price.toFixed(2)} Credits
                        </span>
                      </div>

                      <div className="h-56 sm:h-64 rounded-lg overflow-hidden bg-surface-container-high border border-outline/20 mb-4 group relative">
                        <img
                          src={item.sourceArtwork.imageUrl}
                          alt={item.sourceArtwork.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      <h3 className="font-serif text-lg font-bold text-on-surface mb-1">
                        {item.sourceArtwork.title}
                      </h3>

                      <div className="text-xs text-on-surface-variant flex items-center gap-2 mb-2">
                        <span className="font-semibold text-on-surface">Artisan:</span>
                        <span>{item.sourceArtwork.artist?.name || 'Unknown Artisan'}</span>
                        <span>•</span>
                        <span className="text-[11px] opacity-75">{item.sourceArtwork.artist?.email}</span>
                      </div>

                      <div className="text-xs text-on-surface-variant mb-3 flex flex-wrap gap-2">
                        <span className="px-2 py-0.5 rounded bg-surface-container text-[11px]">
                          {item.sourceArtwork.medium}
                        </span>
                        {item.sourceArtwork.style && (
                          <span className="px-2 py-0.5 rounded bg-surface-container text-[11px]">
                            {item.sourceArtwork.style}
                          </span>
                        )}
                        {item.sourceArtwork.dimensions && (
                          <span className="px-2 py-0.5 rounded bg-surface-container text-[11px]">
                            {item.sourceArtwork.dimensions}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed">
                        {item.sourceArtwork.description}
                      </p>
                    </div>

                    <div className="text-[10px] text-on-surface-variant/80 border-t border-outline/10 pt-2 flex items-center justify-between">
                      <span>Listing ID: {item.sourceArtwork.id.substring(0, 8)}...</span>
                      <span className="text-amber-700 font-semibold">Hidden from Public Search</span>
                    </div>
                  </div>

                  {/* RIGHT: Suspected Match (Existing Listing) */}
                  <div
                    id={`suspected-match-${item.suspectedMatchArtwork?.id || 'none'}`}
                    className="p-5 rounded-xl bg-surface-container-low/60 border border-outline/20 flex flex-col justify-between space-y-4"
                  >
                    {item.suspectedMatchArtwork ? (
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface border border-outline/30">
                            Suspected Match (Existing Archive)
                          </span>
                          <span className="text-[11px] font-serif font-bold text-primary">
                            {item.suspectedMatchArtwork.price.toFixed(2)} Credits
                          </span>
                        </div>

                        <div className="h-56 sm:h-64 rounded-lg overflow-hidden bg-surface-container-high border border-outline/20 mb-4 group relative">
                          <img
                            src={item.suspectedMatchArtwork.imageUrl}
                            alt={item.suspectedMatchArtwork.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>

                        <h3 className="font-serif text-lg font-bold text-on-surface mb-1">
                          {item.suspectedMatchArtwork.title}
                        </h3>

                        <div className="text-xs text-on-surface-variant flex items-center gap-2 mb-2">
                          <span className="font-semibold text-on-surface">Original Artisan:</span>
                          <span>{item.suspectedMatchArtwork.artist?.name || 'Heritage Artisan'}</span>
                          <span>•</span>
                          <span className="text-[11px] opacity-75">{item.suspectedMatchArtwork.artist?.email}</span>
                        </div>

                        <div className="text-xs text-on-surface-variant mb-3 flex flex-wrap gap-2">
                          <span className="px-2 py-0.5 rounded bg-surface-container text-[11px]">
                            {item.suspectedMatchArtwork.medium}
                          </span>
                          {item.suspectedMatchArtwork.style && (
                            <span className="px-2 py-0.5 rounded bg-surface-container text-[11px]">
                              {item.suspectedMatchArtwork.style}
                            </span>
                          )}
                          {item.suspectedMatchArtwork.dimensions && (
                            <span className="px-2 py-0.5 rounded bg-surface-container text-[11px]">
                              {item.suspectedMatchArtwork.dimensions}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed">
                          {item.suspectedMatchArtwork.description}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-20 px-4 flex flex-col items-center justify-center">
                        <Layers className="w-10 h-10 text-on-surface-variant mb-2 opacity-40" />
                        <h4 className="font-serif text-base font-bold text-on-surface mb-1">Catalogue Hash Match</h4>
                        <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
                          This submission exceeded the 80% perceptual dHash threshold against the platform's preserved archive fingerprint database.
                        </p>
                      </div>
                    )}

                    <div className="text-[10px] text-on-surface-variant/80 border-t border-outline/10 pt-2 flex items-center justify-between">
                      <span>Match Status: Verified Archive Piece</span>
                      <span className="text-status-valid font-medium">Currently Published</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="p-6 bg-surface-container-low border-t border-outline/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div className="flex-1 max-w-md">
                    <input
                      type="text"
                      id={`admin-notes-${item.id}`}
                      placeholder="Add administrative review notes (optional)..."
                      value={notesState[item.id] || ''}
                      onChange={(e) =>
                        setNotesState((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg bg-surface-container-lowest border border-outline/30 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-hidden focus:border-primary"
                    />
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Reject Button */}
                    <button
                      type="button"
                      id={`reject-btn-${item.id}`}
                      onClick={() => handleReview(item, 'REJECT')}
                      disabled={isProcessing}
                      className="px-4 py-2.5 bg-error-container/20 hover:bg-error-container/40 text-error font-semibold text-xs uppercase tracking-wider rounded-lg border border-error/30 transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{isProcessing ? 'Processing...' : 'Reject Listing'}</span>
                    </button>

                    {/* Approve Button */}
                    <button
                      type="button"
                      id={`approve-btn-${item.id}`}
                      onClick={() => handleReview(item, 'APPROVE')}
                      disabled={isProcessing}
                      className="px-5 py-2.5 bg-primary hover:bg-surface-tint text-on-primary font-semibold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{isProcessing ? 'Processing...' : 'Approve & Publish'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminModerationQueue;
