import { getStoredToken } from './auth.service';
import { ModerationQueueItem, ModerationReviewPayload } from '../types/moderation';

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000';

export const moderationApi = {
  /**
   * Retrieves all flagged artworks in the moderation queue
   */
  async getQueue(): Promise<ModerationQueueItem[]> {
    const token = getStoredToken();
    const res = await fetch(`${API_BASE_URL}/api/moderation/queue`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to fetch moderation queue');
    }

    const data = await res.json();
    return data.queue || [];
  },

  /**
   * Approves or rejects a flagged artwork listing
   */
  async reviewItem(id: string, payload: ModerationReviewPayload): Promise<any> {
    const token = getStoredToken();
    const res = await fetch(`${API_BASE_URL}/api/moderation/${id}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to submit moderation review');
    }

    return await res.json();
  },
};
