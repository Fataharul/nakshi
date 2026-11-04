export const DEFAULT_ARTWORK_IMAGE = '/images/nakshi-kantha-quilt.jpg';

/**
 * Resolves artwork image URLs robustly:
 * 1. Handles missing, null, or empty URLs by returning an authentic heritage masterwork image.
 * 2. Catches unresolvable demo/mock URLs (e.g. example.com or dead placeholder services) and substitutes with default.
 * 3. Client public static assets (e.g. /images/...) are served directly by the frontend and returned as-is.
 * 4. Prepends the backend server origin to local relative upload paths (/uploads/...).
 */
export const getArtworkImageUrl = (url?: string | null): string => {
  if (!url || !url.trim()) {
    return DEFAULT_ARTWORK_IMAGE;
  }

  const trimmed = url.trim();

  // If mock/example url that does not exist on the web or known missing local uploads
  if (
    trimmed.includes('example.com') ||
    trimmed.includes('via.placeholder.com') ||
    trimmed.includes('socket-test') ||
    trimmed.includes('photo-test-lot') ||
    trimmed.includes('454d34a3-ea4f-43fe-babf-8584874f6e00')
  ) {
    return DEFAULT_ARTWORK_IMAGE;
  }

  // If already absolute URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Client public assets in client/public/images (e.g. /images/heritage/...)
  if (trimmed.startsWith('/images/')) {
    return trimmed;
  }

  // Local / relative upload path (e.g. /uploads/artworks/...)
  const apiBase =
    (import.meta as any).env?.VITE_API_BASE_URL ||
    (import.meta as any).env?.VITE_API_URL ||
    'http://localhost:5000';
  const cleanBase = apiBase.replace(/\/+$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  return `${cleanBase}${cleanPath}`;
};
