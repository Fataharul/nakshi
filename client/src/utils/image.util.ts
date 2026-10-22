export const DEFAULT_ARTWORK_IMAGE =
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80';

/**
 * Resolves artwork image URLs robustly:
 * 1. Handles missing, null, or empty URLs by returning a high-res default artwork image.
 * 2. Catches unresolvable demo/mock URLs (e.g. example.com or dead placeholder services) and substitutes with default.
 * 3. Prepends the backend server origin to local relative upload paths (/uploads/...).
 */
export const getArtworkImageUrl = (url?: string | null): string => {
  if (!url || !url.trim()) {
    return DEFAULT_ARTWORK_IMAGE;
  }

  const trimmed = url.trim();

  // If mock/example url that does not exist on the web
  if (trimmed.includes('example.com') || trimmed.includes('via.placeholder.com')) {
    return DEFAULT_ARTWORK_IMAGE;
  }

  // If already absolute URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Local / relative path (e.g. /uploads/artworks/...)
  const apiBase =
    (import.meta as any).env?.VITE_API_BASE_URL ||
    (import.meta as any).env?.VITE_API_URL ||
    'http://localhost:5000';
  const cleanBase = apiBase.replace(/\/+$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  return `${cleanBase}${cleanPath}`;
};
