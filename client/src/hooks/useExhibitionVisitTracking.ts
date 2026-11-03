import { useEffect } from 'react';
import { ExhibitionService } from '../services/exhibition.service';

const HEARTBEAT_INTERVAL_MS = 30000;

/**
 * Records a visit when a visitor enters an exhibition hall and sends a
 * heartbeat every 30 seconds while the browser tab is visible.
 * Tracking failures are ignored so they can never break the page.
 */
export function useExhibitionVisitTracking(
  exhibitionId: string | undefined,
  enabled: boolean
): void {
  useEffect(() => {
    if (!exhibitionId || !enabled) return;

    let cancelled = false;
    let visitId: string | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;

    const beat = () => {
      if (!visitId) return;
      ExhibitionService.sendVisitHeartbeat(exhibitionId, visitId).catch(() => undefined);
    };

    ExhibitionService.startVisit(exhibitionId)
      .then((res) => {
        if (cancelled) return;
        visitId = res.visitId;
        timer = setInterval(() => {
          if (!document.hidden) beat();
        }, HEARTBEAT_INTERVAL_MS);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      beat(); // final heartbeat when the visitor leaves the hall
    };
  }, [exhibitionId, enabled]);
}