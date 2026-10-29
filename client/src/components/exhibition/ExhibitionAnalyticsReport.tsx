import React, { useEffect, useState } from 'react';
import { Users, Clock, Ticket, Wallet, RefreshCw, AlertCircle } from 'lucide-react';
import { ExhibitionService } from '../../services/exhibition.service';
import { ExhibitionAnalytics } from '../../types/exhibitionAnalytics';
import { formatDuration } from '../../utils/format.util';

interface ExhibitionAnalyticsReportProps {
  exhibitionId: string;
}

export const ExhibitionAnalyticsReport: React.FC<ExhibitionAnalyticsReportProps> = ({
  exhibitionId,
}) => {
  const [analytics, setAnalytics] = useState<ExhibitionAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await ExhibitionService.getExhibitionAnalytics(exhibitionId);
        if (!cancelled) setAnalytics(data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load exhibition analytics');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [exhibitionId, reloadKey]);

  if (isLoading) {
    return (
      <div id="analytics-loading" className="py-20 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-on-surface-variant">Loading exhibition analytics...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div
        id="analytics-error"
        className="p-5 rounded-xl bg-error-container/40 border border-error/20 text-error text-sm flex items-center gap-2"
      >
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{error || 'Analytics are not available for this exhibition.'}</span>
      </div>
    );
  }

  const stats = [
    {
      id: 'analytics-visitor-traffic',
      label: 'Visitor Traffic',
      value: String(analytics.totalVisits),
      hint: 'Recorded hall visits',
      Icon: Users,
    },
    {
      id: 'analytics-average-viewing-time',
      label: 'Average Viewing Time',
      value: formatDuration(analytics.averageViewingTimeSeconds),
      hint: 'Per recorded visit',
      Icon: Clock,
    },
    {
      id: 'analytics-tickets-sold',
      label: 'Tickets Sold',
      value: String(analytics.ticketsSold),
      hint: 'Issued admission passes',
      Icon: Ticket,
    },
    {
      id: 'analytics-ticket-revenue',
      label: 'Ticket Revenue',
      value: `${analytics.totalTicketRevenue.toFixed(2)} Credits`,
      hint: 'Total credits from ticket sales',
      Icon: Wallet,
    },
  ];

  return (
    <section id="analytics-report" className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-primary">
            Exhibition Report
          </span>
          <h2 id="analytics-report-title" className="font-serif text-2xl font-bold text-on-surface">
            {analytics.title}
          </h2>
        </div>
        <button
          id="analytics-refresh-btn"
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="px-4 py-2 rounded-full border border-outline/30 text-xs font-semibold uppercase tracking-wider text-on-surface hover:bg-surface-container transition-all flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.map(({ id, label, value, hint, Icon }) => (
          <div
            key={id}
            className="p-5 rounded-2xl bg-surface-container-lowest border border-outline/20 ambient-shadow"
          >
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold">{label}</span>
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div id={id} className="font-serif text-3xl font-bold text-on-surface">
              {value}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1">{hint}</p>
          </div>
        ))}
      </div>

      {analytics.totalVisits === 0 && (
        <p
          id="analytics-empty-note"
          className="text-xs text-on-surface-variant bg-surface-container-low border border-outline/10 rounded-lg p-3"
        >
          No visitor activity has been recorded yet. Visitor traffic and average viewing time
          will appear after visitors enter the exhibition hall.
        </p>
      )}
    </section>
  );
};