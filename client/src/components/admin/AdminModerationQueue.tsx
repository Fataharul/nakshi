import React, { useState, useEffect, useMemo } from 'react';
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
  Search,
  Maximize2,
  X,
  History,
  SlidersHorizontal,
} from 'lucide-react';
import { moderationApi } from '../../services/moderation.service';
import {
  ModerationQueueItem,
  ModerationStats,
  ModerationFilter,
  ModerationSort,
} from '../../types/moderation';
import { getArtworkImageUrl, DEFAULT_ARTWORK_IMAGE } from '../../utils/image.util';

export const AdminModerationQueue: React.FC = () => {
  // Primary state
  const [queue, setQueue] = useState<ModerationQueueItem[]>([]);
  const [history, setHistory] = useState<ModerationQueueItem[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notesState, setNotesState] = useState<Record<string, string>>({});

  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'HISTORY'>('QUEUE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<ModerationFilter>('ALL');
  const [activeSort, setActiveSort] = useState<ModerationSort>('SIMILARITY_DESC');

  // Deep-dive inspection modal state
  const [inspectingItem, setInspectingItem] = useState<ModerationQueueItem | null>(null);

  // Decision reason presets
  const approvalPresets = [
    'Authentic folk craft variation',
    'Verified original artisan handcraft',
    'False positive perceptual match',
  ];

  const rejectionPresets = [
    'Exact visual copy / duplicate upload',
    'Uncredited archive duplication',
    'Copyright infringement',
    'Inauthentic / low quality listing',
  ];

  const fetchQueueAndStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [queueData, statsData] = await Promise.all([
        moderationApi.getQueue(),
        moderationApi.getStats().catch(() => null),
      ]);
      setQueue(queueData);
      if (statsData) {
        setStats(statsData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load moderation queue');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const historyData = await moderationApi.getHistory();
      setHistory(historyData);
    } catch (err: any) {
      console.error('Failed to load moderation history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueAndStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'HISTORY') {
      fetchHistory();
    }
  }, [activeTab]);

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

      // Close modal if inspecting this item
      if (inspectingItem?.id === item.id) {
        setInspectingItem(null);
      }

      // Update stats optimistically
      setStats((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          pendingCount: Math.max(0, prev.pendingCount - 1),
          approvedCount: action === 'APPROVE' ? prev.approvedCount + 1 : prev.approvedCount,
          rejectedCount: action === 'REJECT' ? prev.rejectedCount + 1 : prev.rejectedCount,
        };
      });

      setTimeout(() => {
        setToastMessage(null);
      }, 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to process moderation review.');
    } finally {
      setProcessingId(null);
    }
  };

  const setPresetNote = (itemId: string, noteText: string) => {
    setNotesState((prev) => ({
      ...prev,
      [itemId]: noteText,
    }));
  };

  // Filter & sort queue items
  const filteredQueue = useMemo(() => {
    let result = [...queue];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.sourceArtwork.title.toLowerCase().includes(q) ||
          item.sourceArtwork.medium.toLowerCase().includes(q) ||
          item.sourceArtwork.artist?.name.toLowerCase().includes(q) ||
          item.sourceArtwork.artist?.email.toLowerCase().includes(q) ||
          (item.suspectedMatchArtwork?.title &&
            item.suspectedMatchArtwork.title.toLowerCase().includes(q))
      );
    }

    // Risk category filter
    if (activeFilter === 'HIGH_RISK') {
      result = result.filter((item) => (item.similarityScore || 0) >= 90.0);
    } else if (activeFilter === 'CATALOGUE_DUPLICATE') {
      result = result.filter((item) => Boolean(item.suspectedMatchArtwork));
    } else if (activeFilter === 'MANUAL_FLAG') {
      result = result.filter((item) => !item.suspectedMatchArtwork || Boolean(item.adminNotes));
    }

    // Sorting
    result.sort((a, b) => {
      if (activeSort === 'SIMILARITY_DESC') {
        return (b.similarityScore || 0) - (a.similarityScore || 0);
      }
      if (activeSort === 'NEWEST') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (activeSort === 'OLDEST') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return 0;
    });

    return result;
  }, [queue, searchQuery, activeFilter, activeSort]);

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
            <p className="text-xs sm:text-sm font-medium">{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs text-on-surface-variant hover:text-on-surface underline ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-surface-container-lowest rounded-2xl ambient-shadow p-6 sm:p-8 border border-outline/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Moderation Console</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-500/20">
              Threshold: &gt; 80% Similarity
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-surface-container text-on-surface-variant border border-outline/20">
              Perceptual dHash Engine
            </span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface">
            Duplicate Artwork Moderation Queue
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl mt-1.5 leading-relaxed">
            Perceptual hashing scans new and updated artwork uploads against existing heritage gallery records. Listings exceeding 80% visual similarity are intercepted and isolated here for side-by-side comparative inspection.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <button
            type="button"
            id="refresh-queue-btn"
            onClick={fetchQueueAndStats}
            disabled={isLoading}
            className="px-4 py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold uppercase tracking-wider rounded-lg border border-outline/20 flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>

          <div className="px-4 py-2 rounded-lg bg-surface-container-low border border-outline/20 text-center min-w-[70px]">
            <span className="text-[10px] uppercase font-semibold text-on-surface-variant block">Pending</span>
            <span id="queue-count-badge" className="font-serif text-lg font-bold text-primary">
              {queue.length}
            </span>
          </div>
        </div>
      </div>

      {/* Overview Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline/20 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant block">
                Pending Reviews
              </span>
              <span id="stat-pending-reviews" className="font-serif text-xl font-bold text-on-surface">
                {stats.pendingCount}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline/20 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-status-valid/10 text-status-valid flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant block">
                Approved Overrides
              </span>
              <span id="stat-approved-overrides" className="font-serif text-xl font-bold text-status-valid">
                {stats.approvedCount}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline/20 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-error-container/30 text-error flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant block">
                Rejected Duplicates
              </span>
              <span id="stat-rejected-duplicates" className="font-serif text-xl font-bold text-error">
                {stats.rejectedCount}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline/20 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant block">
                Avg Match Score
              </span>
              <span id="stat-avg-similarity" className="font-serif text-xl font-bold text-primary">
                {stats.averageSimilarity.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Switcher: Pending Queue vs. Audit History */}
      <div className="flex items-center gap-2 border-b border-outline/20 pb-1">
        <button
          type="button"
          id="tab-pending-queue"
          onClick={() => setActiveTab('QUEUE')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'QUEUE'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Pending Review Queue</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'QUEUE'
                ? 'bg-on-primary/20 text-on-primary'
                : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            {queue.length}
          </span>
        </button>

        <button
          type="button"
          id="tab-audit-history"
          onClick={() => setActiveTab('HISTORY')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'HISTORY'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit History</span>
        </button>
      </div>

      {/* QUEUE TAB CONTENT */}
      {activeTab === 'QUEUE' && (
        <>
          {/* Search, Filter & Sort Toolbar */}
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-on-surface-variant/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                id="moderation-search-input"
                placeholder="Search by title, artisan name, or medium..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg bg-surface-container-low border border-outline/20 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-hidden focus:border-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Chips & Sorting */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="filter-all-btn"
                  onClick={() => setActiveFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeFilter === 'ALL'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  All ({queue.length})
                </button>

                <button
                  type="button"
                  id="filter-high-risk-btn"
                  onClick={() => setActiveFilter('HIGH_RISK')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeFilter === 'HIGH_RISK'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  High Match (&gt;90%)
                </button>

                <button
                  type="button"
                  id="filter-catalogue-btn"
                  onClick={() => setActiveFilter('CATALOGUE_DUPLICATE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeFilter === 'CATALOGUE_DUPLICATE'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Catalogue Matches
                </button>

                <button
                  type="button"
                  id="filter-manual-btn"
                  onClick={() => setActiveFilter('MANUAL_FLAG')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeFilter === 'MANUAL_FLAG'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Admin Flags
                </button>
              </div>

              {/* Sorting Select */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-outline/20">
                <SlidersHorizontal className="w-3.5 h-3.5 text-on-surface-variant" />
                <select
                  id="moderation-sort-select"
                  value={activeSort}
                  onChange={(e) => setActiveSort(e.target.value as ModerationSort)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-surface-container-low border border-outline/20 text-on-surface focus:outline-hidden focus:border-primary cursor-pointer"
                >
                  <option value="SIMILARITY_DESC">Highest Match</option>
                  <option value="NEWEST">Newest Flagged</option>
                  <option value="OLDEST">Oldest Flagged</option>
                </select>
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

          {/* Flagged Artworks Queue Container */}
          {!isLoading && (
            <div id="moderation-queue-list" className="space-y-8">
              {filteredQueue.length === 0 ? (
                <div
                  id="empty-queue-banner"
                  className="text-center py-16 px-6 bg-surface-container-lowest rounded-2xl border border-dashed border-outline/30 space-y-3"
                >
                  <div className="w-14 h-14 rounded-full bg-status-valid/10 text-status-valid mx-auto flex items-center justify-center">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <h2 className="font-serif text-xl font-bold text-on-surface">
                    {searchQuery || activeFilter !== 'ALL'
                      ? 'No Items Match Current Filter'
                      : 'Moderation Queue is Clear'}
                  </h2>
                  <p className="text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
                    {searchQuery || activeFilter !== 'ALL'
                      ? 'Try adjusting your search criteria or resetting filters to view all pending queue items.'
                      : 'All submitted artworks meet heritage originality criteria. Any new listings with perceptual similarity exceeding 80% will automatically appear here for comparative review.'}
                  </p>
                  {(searchQuery || activeFilter !== 'ALL') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setActiveFilter('ALL');
                      }}
                      className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-xs font-semibold rounded-lg text-primary transition-colors cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              ) : (
                filteredQueue.map((item) => {
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

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          id={`inspect-comparison-btn-${item.id}`}
                          onClick={() => setInspectingItem(item)}
                          className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium border border-outline/20 flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-primary" />
                          <span>Compare Fullscreen</span>
                        </button>
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-primary hidden sm:inline-block">
                          Source vs. Suspected Match
                        </span>
                      </div>
                    </div>

                    {/* Split-Screen Comparative View (50/50 Layout) */}
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
                              src={getArtworkImageUrl(item.sourceArtwork.imageUrl)} onError={(e) => { e.currentTarget.src = DEFAULT_ARTWORK_IMAGE; }}
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
                                src={getArtworkImageUrl(item.suspectedMatchArtwork.imageUrl)} onError={(e) => { e.currentTarget.src = DEFAULT_ARTWORK_IMAGE; }}
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
                            <h4 className="font-serif text-base font-bold text-on-surface mb-1">
                              {item.adminNotes ? 'Flagged for Moderation' : 'Catalogue Hash Match'}
                            </h4>
                            <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
                              {item.adminNotes || 'This submission was flagged and routed to the queue for comparative administrator review.'}
                            </p>
                          </div>
                        )}

                        <div className="text-[10px] text-on-surface-variant/80 border-t border-outline/10 pt-2 flex items-center justify-between">
                          <span>Match Status: {item.suspectedMatchArtwork ? 'Verified Archive Piece' : 'Direct Review Routing'}</span>
                          <span className={item.suspectedMatchArtwork ? 'text-status-valid font-medium' : 'text-amber-700 font-medium'}>
                            {item.suspectedMatchArtwork ? 'Currently Published' : 'Pending Administrative Review'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer with Presets & Review Actions */}
                    <div className="p-6 bg-surface-container-low border-t border-outline/15 space-y-4">
                      {/* Quick Reason Presets */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-[11px] font-semibold text-on-surface-variant">Quick Presets:</span>
                        {approvalPresets.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setPresetNote(item.id, preset)}
                            className="px-2 py-0.5 rounded text-[11px] bg-status-valid/10 text-status-valid border border-status-valid/25 hover:bg-status-valid/20 cursor-pointer transition-colors"
                          >
                            + {preset}
                          </button>
                        ))}
                        {rejectionPresets.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setPresetNote(item.id, preset)}
                            className="px-2 py-0.5 rounded text-[11px] bg-error-container/20 text-error border border-error/25 hover:bg-error-container/30 cursor-pointer transition-colors"
                          >
                            + {preset}
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="flex-1 max-w-lg">
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
                  </div>
                );
              })
            )}
          </div>
        )}

        </>
      )}


      {/* AUDIT HISTORY TAB CONTENT */}
      {activeTab === 'HISTORY' && (
        <div id="audit-history-section" className="space-y-4">
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-on-surface">Moderation Audit History</h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  Chronological audit log of all administrative decisions taken on flagged uploads.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchHistory}
                disabled={isHistoryLoading}
                className="px-3.5 py-2 bg-surface-container text-xs font-semibold rounded-lg border border-outline/20 flex items-center gap-2 self-start sm:self-auto cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isHistoryLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Log</span>
              </button>
            </div>

            {isHistoryLoading && (
              <div className="text-center py-12">
                <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-on-surface-variant">Loading decision audit log...</p>
              </div>
            )}

            {!isHistoryLoading && history.length === 0 && (
              <div className="text-center py-12 text-on-surface-variant text-xs">
                No past moderation decisions recorded yet.
              </div>
            )}

            {!isHistoryLoading && history.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-on-surface-variant uppercase text-[10px] tracking-wider border-b border-outline/20">
                    <tr>
                      <th className="py-3 px-4">Artwork Title</th>
                      <th className="py-3 px-4">Decision</th>
                      <th className="py-3 px-4">Match Score</th>
                      <th className="py-3 px-4">Artisan</th>
                      <th className="py-3 px-4">Reviewer</th>
                      <th className="py-3 px-4">Audit Notes</th>
                      <th className="py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/15">
                    {history.map((record) => {
                      const isApproved = record.actionTaken === 'APPROVED';
                      return (
                        <tr key={record.id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-on-surface flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-surface-container-high overflow-hidden shrink-0">
                              <img
                                src={getArtworkImageUrl(record.sourceArtwork.imageUrl)} onError={(e) => { e.currentTarget.src = DEFAULT_ARTWORK_IMAGE; }}
                                alt={record.sourceArtwork.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="line-clamp-1">{record.sourceArtwork.title}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isApproved
                                  ? 'bg-status-valid/15 text-status-valid border border-status-valid/30'
                                  : 'bg-error-container/30 text-error border border-error/30'
                              }`}
                            >
                              {record.actionTaken}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-on-surface">
                            {record.similarityScore ? `${record.similarityScore.toFixed(1)}%` : 'Manual'}
                          </td>
                          <td className="py-3.5 px-4 text-on-surface-variant">
                            {record.sourceArtwork.artist?.name || 'Artisan'}
                          </td>
                          <td className="py-3.5 px-4 text-on-surface-variant">
                            {record.admin?.name || 'Administrator'}
                          </td>
                          <td className="py-3.5 px-4 text-on-surface-variant max-w-xs truncate">
                            {record.adminNotes || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-on-surface-variant whitespace-nowrap">
                            {record.reviewedAt ? new Date(record.reviewedAt).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULLSCREEN DEEP-DIVE INSPECTION MODAL */}
      {inspectingItem && (
        <div
          id="comparison-inspection-modal"
          className="fixed inset-0 z-50 bg-on-surface/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in"
        >
          <div className="bg-surface-container-lowest rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-outline/30 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-surface-container-low border-b border-outline/20 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-500/15 text-amber-700 border border-amber-500/30 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{(inspectingItem.similarityScore || 85).toFixed(1)}% Visual Match</span>
                </span>
                <h3 className="font-serif text-lg font-bold text-on-surface">
                  High-Resolution Comparative Inspection
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="close-inspection-modal-btn"
                  onClick={() => setInspectingItem(null)}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Visual Side-by-Side Images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                      Flagged Upload (New)
                    </span>
                    <span className="text-xs text-primary font-bold">
                      {inspectingItem.sourceArtwork.price.toFixed(2)} Credits
                    </span>
                  </div>
                  <div className="h-80 rounded-xl bg-surface-container-high border border-outline/30 overflow-hidden flex items-center justify-center">
                    <img
                      src={getArtworkImageUrl(inspectingItem.sourceArtwork.imageUrl)} onError={(e) => { e.currentTarget.src = DEFAULT_ARTWORK_IMAGE; }}
                      alt={inspectingItem.sourceArtwork.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="mt-2 font-serif font-bold text-base text-on-surface">
                    {inspectingItem.sourceArtwork.title}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                      Suspected Match (Archive)
                    </span>
                    <span className="text-xs text-primary font-bold">
                      {inspectingItem.suspectedMatchArtwork
                        ? `${inspectingItem.suspectedMatchArtwork.price.toFixed(2)} Credits`
                        : '—'}
                    </span>
                  </div>
                  <div className="h-80 rounded-xl bg-surface-container-high border border-outline/30 overflow-hidden flex items-center justify-center">
                    {inspectingItem.suspectedMatchArtwork ? (
                      <img
                        src={getArtworkImageUrl(inspectingItem.suspectedMatchArtwork.imageUrl)} onError={(e) => { e.currentTarget.src = DEFAULT_ARTWORK_IMAGE; }}
                        alt={inspectingItem.suspectedMatchArtwork.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center p-6 text-on-surface-variant">
                        <Layers className="w-12 h-12 mx-auto mb-2 opacity-40" />
                        <p className="text-xs">No direct archive image paired with this flag.</p>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 font-serif font-bold text-base text-on-surface">
                    {inspectingItem.suspectedMatchArtwork?.title || 'Direct Moderation Routing'}
                  </p>
                </div>
              </div>

              {/* Detailed Spec Comparison Table */}
              <div className="rounded-xl border border-outline/20 overflow-hidden bg-surface-container-low/40">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-container text-on-surface-variant uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4 w-1/4">Attribute</th>
                      <th className="py-2.5 px-4 w-3/8 text-amber-800">Flagged Submission</th>
                      <th className="py-2.5 px-4 w-3/8">Suspected Archive Match</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/15">
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-on-surface">Artisan</td>
                      <td className="py-2.5 px-4 text-on-surface">
                        {inspectingItem.sourceArtwork.artist?.name} ({inspectingItem.sourceArtwork.artist?.email})
                      </td>
                      <td className="py-2.5 px-4 text-on-surface">
                        {inspectingItem.suspectedMatchArtwork?.artist?.name || '—'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-on-surface">Medium</td>
                      <td className="py-2.5 px-4 text-on-surface">{inspectingItem.sourceArtwork.medium}</td>
                      <td className="py-2.5 px-4 text-on-surface">
                        {inspectingItem.suspectedMatchArtwork?.medium || '—'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-on-surface">Style</td>
                      <td className="py-2.5 px-4 text-on-surface">{inspectingItem.sourceArtwork.style || '—'}</td>
                      <td className="py-2.5 px-4 text-on-surface">
                        {inspectingItem.suspectedMatchArtwork?.style || '—'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-on-surface">Dimensions</td>
                      <td className="py-2.5 px-4 text-on-surface">{inspectingItem.sourceArtwork.dimensions || '—'}</td>
                      <td className="py-2.5 px-4 text-on-surface">
                        {inspectingItem.suspectedMatchArtwork?.dimensions || '—'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-on-surface">Description</td>
                      <td className="py-2.5 px-4 text-on-surface-variant leading-relaxed">
                        {inspectingItem.sourceArtwork.description}
                      </td>
                      <td className="py-2.5 px-4 text-on-surface-variant leading-relaxed">
                        {inspectingItem.suspectedMatchArtwork?.description || '—'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-surface-container-low border-t border-outline/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shrink-0">
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Add administrative review notes..."
                  value={notesState[inspectingItem.id] || ''}
                  onChange={(e) =>
                    setNotesState((prev) => ({ ...prev, [inspectingItem.id]: e.target.value }))
                  }
                  className="w-full text-xs px-3.5 py-2 rounded-lg bg-surface-container-lowest border border-outline/30 text-on-surface focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleReview(inspectingItem, 'REJECT')}
                  disabled={processingId === inspectingItem.id}
                  className="px-4 py-2 bg-error-container/20 hover:bg-error-container/40 text-error font-semibold text-xs uppercase tracking-wider rounded-lg border border-error/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Listing</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleReview(inspectingItem, 'APPROVE')}
                  disabled={processingId === inspectingItem.id}
                  className="px-5 py-2 bg-primary hover:bg-surface-tint text-on-primary font-semibold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve & Publish</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminModerationQueue;
