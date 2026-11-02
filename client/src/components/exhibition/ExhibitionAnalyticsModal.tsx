import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  Ticket,
  Users,
  Palette,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Sparkles,
  DollarSign,
  Award,
} from 'lucide-react';
import { Exhibition, CalculatedExhibitionAnalytics } from '../../types/exhibition';
import { exhibitionApi } from '../../services/exhibition.service';

interface ExhibitionAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  exhibition: Exhibition | null;
}

export const ExhibitionAnalyticsModal: React.FC<ExhibitionAnalyticsModalProps> = ({
  isOpen,
  onClose,
  exhibition,
}) => {
  const [analytics, setAnalytics] = useState<CalculatedExhibitionAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const fetchAnalytics = async () => {
    if (!exhibition) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await exhibitionApi.getExhibitionAnalytics(exhibition.id);
      setAnalytics(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load exhibition analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && exhibition) {
      fetchAnalytics();
    } else {
      setAnalytics(null);
      setError(null);
      setIsCopied(false);
    }
  }, [isOpen, exhibition]);

  if (!isOpen || !exhibition) return null;

  const handleCopyReport = async () => {
    if (!analytics?.reportOutput) return;
    try {
      await navigator.clipboard.writeText(analytics.reportOutput);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div
      id="analytics-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="analytics-modal"
        className="relative w-full max-w-4xl bg-surface-bright rounded-2xl ambient-shadow border border-outline/30 overflow-hidden my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="analytics-modal-title"
      >
        {/* Header */}
        <div className="p-6 bg-surface-container-low border-b border-outline/20 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Live Curatorial Intelligence
              </span>
              <span className="text-xs text-on-surface-variant">
                ID: {exhibition.id.slice(0, 8)}...
              </span>
            </div>
            <h2 id="analytics-modal-title" className="font-serif text-2xl font-bold text-on-surface mt-1.5">
              {exhibition.title}
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Exhibition performance metrics, visitor engagement, and curatorial executive reporting.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="refresh-analytics-btn"
              onClick={fetchAnalytics}
              disabled={isLoading}
              className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg border border-outline/20 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              id="close-analytics-modal-btn"
              onClick={onClose}
              className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg border border-outline/20 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-140px)] overflow-y-auto">
          {/* Loading State */}
          {isLoading && !analytics && (
            <div className="py-20 text-center text-on-surface-variant space-y-3">
              <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-medium">Aggregating curatorial attendance and revenue records...</p>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-semibold">Unable to load exhibition analytics</p>
                <p className="opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          {analytics && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Revenue Card */}
                <div
                  id="analytics-revenue-card"
                  className="p-4 rounded-xl bg-surface-container-low border border-outline/20 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Total Revenue
                    </span>
                    <DollarSign className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div id="analytics-revenue-value" className="text-2xl font-serif font-bold text-on-surface">
                      {analytics.revenue.totalRevenue.toFixed(2)}{' '}
                      <span className="text-xs font-sans font-normal text-on-surface-variant">Credits</span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant mt-1 space-y-0.5">
                      <div className="flex justify-between">
                        <span>VIP Passes:</span>
                        <span className="font-medium text-on-surface">{analytics.revenue.vipRevenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>General:</span>
                        <span className="font-medium text-on-surface">{analytics.revenue.standardRevenue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Ticketing Card */}
                <div
                  id="analytics-tickets-card"
                  className="p-4 rounded-xl bg-surface-container-low border border-outline/20 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Passes Issued
                    </span>
                    <Ticket className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div id="analytics-tickets-value" className="text-2xl font-serif font-bold text-on-surface">
                      {analytics.tickets.totalTicketsSold}{' '}
                      <span className="text-xs font-sans font-normal text-on-surface-variant">Tickets</span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant mt-1 space-y-0.5">
                      <div className="flex justify-between">
                        <span>VIP Vernissage:</span>
                        <span className="font-medium text-primary font-bold">
                          {analytics.tickets.vipTicketsCount} ({analytics.tickets.vipTicketPercentage}%)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Standard:</span>
                        <span className="font-medium text-on-surface">{analytics.tickets.standardTicketsCount}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Attendance & Engagement */}
                <div
                  id="analytics-attendance-card"
                  className="p-4 rounded-xl bg-surface-container-low border border-outline/20 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Attendance & Dwell
                    </span>
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div id="analytics-attendance-value" className="text-2xl font-serif font-bold text-on-surface">
                      {analytics.attendance.totalVisits}{' '}
                      <span className="text-xs font-sans font-normal text-on-surface-variant">Visits</span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant mt-1 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Unique Visitors:</span>
                        <span className="font-medium text-on-surface">{analytics.attendance.uniqueVisitors}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pass Conversion:</span>
                        <span className="font-medium text-on-surface">{analytics.attendance.conversionRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Dwell:</span>
                        <span className="font-medium text-on-surface">{analytics.attendance.averageVisitDurationMinutes}m</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Collection Curation Value */}
                <div
                  id="analytics-collection-card"
                  className="p-4 rounded-xl bg-surface-container-low border border-outline/20 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Exhibited Artworks
                    </span>
                    <Palette className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div id="analytics-collection-value" className="text-2xl font-serif font-bold text-on-surface">
                      {analytics.collection.artworksCount}{' '}
                      <span className="text-xs font-sans font-normal text-on-surface-variant">Pieces</span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant mt-1 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Total Valuation:</span>
                        <span className="font-medium text-on-surface">{analytics.collection.totalCollectionValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Artifact:</span>
                        <span className="font-medium text-on-surface">{analytics.collection.averageArtworkPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* VIP Window Insights Breakdown */}
              <div className="p-4 rounded-xl bg-surface border border-outline/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Vernissage Window Traffic Distribution
                  </h4>
                  <span className="text-[11px] text-on-surface-variant font-medium">
                    VIP Window: {analytics.attendance.vipWindowVisits} visits • Public Hours: {analytics.attendance.generalWindowVisits} visits
                  </span>
                </div>

                {/* Progress bar ratio */}
                <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden flex">
                  <div
                    style={{
                      width: `${
                        analytics.attendance.totalVisits > 0
                          ? (analytics.attendance.vipWindowVisits / analytics.attendance.totalVisits) * 100
                          : 0
                      }%`,
                    }}
                    className="bg-primary h-full transition-all duration-500"
                    title={`VIP Entries: ${analytics.attendance.vipWindowVisits}`}
                  />
                  <div
                    style={{
                      width: `${
                        analytics.attendance.totalVisits > 0
                          ? (analytics.attendance.generalWindowVisits / analytics.attendance.totalVisits) * 100
                          : 100
                      }%`,
                    }}
                    className="bg-primary/20 h-full transition-all duration-500"
                    title={`General Entries: ${analytics.attendance.generalWindowVisits}`}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                    <span>VIP Vernissage Entries ({analytics.attendance.vipWindowVisits})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary/20 border border-primary/30 inline-block"></span>
                    <span>Standard Admission Entries ({analytics.attendance.generalWindowVisits})</span>
                  </div>
                </div>
              </div>

              {/* Curatorial Report Text Output Section */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-primary" />
                      Executive Curatorial Report Output
                    </h4>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      Generated text record for curatorial archives, stakeholder reports, and artist earnings reconciliation.
                    </p>
                  </div>

                  <button
                    type="button"
                    id="copy-curatorial-report-btn"
                    onClick={handleCopyReport}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-on-surface bg-surface-bright hover:bg-surface-container border border-outline/30 rounded-lg transition-all min-h-[44px]"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-on-surface-variant" />
                        <span>Copy Report</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <pre
                    id="curatorial-report-output-pre"
                    className="p-4 rounded-lg bg-surface-container-highest border border-outline/30 text-[11px] font-mono text-on-surface whitespace-pre overflow-x-auto leading-relaxed select-all"
                  >
                    {analytics.reportOutput}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-surface-container-low border-t border-outline/20 flex items-center justify-between">
          <span className="text-[11px] text-on-surface-variant">
            {analytics?.generatedAt ? `Generated on ${new Date(analytics.generatedAt).toLocaleString()}` : ''}
          </span>
          <button
            type="button"
            id="close-analytics-modal-footer-btn"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-on-surface hover:text-white bg-surface hover:bg-on-surface border border-outline/30 rounded-lg transition-all min-h-[44px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
