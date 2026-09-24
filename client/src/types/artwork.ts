export type ArtworkAvailability = 'AVAILABLE' | 'RESERVED' | 'SOLD';
export type ModerationStatus = 'PENDING' | 'APPROVED' | 'FLAGGED' | 'REJECTED';

export interface ArtworkArtist {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface Artwork {
  id: string;
  title: string;
  description: string;
  medium: string;
  dimensions?: string | null;
  price: number;
  imageUrl: string;
  imageHash?: string | null;
  availability: ArtworkAvailability;
  moderationStatus: ModerationStatus;
  artistId: string;
  artist?: ArtworkArtist;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArtworkPayload {
  title: string;
  description: string;
  medium: string;
  dimensions?: string;
  price: number;
  imageUrl?: string;
  availability?: ArtworkAvailability;
}

export interface UpdateArtworkPayload {
  title?: string;
  description?: string;
  medium?: string;
  dimensions?: string;
  price?: number;
  imageUrl?: string;
  availability?: ArtworkAvailability;
}

export interface StorefrontStats {
  totalArtworks: number;
  approvedArtworks: number;
  pendingArtworks: number;
  flaggedArtworks: number;
  soldArtworks: number;
  totalEarningsCredits: number;
}

export interface StorefrontResponse {
  artist: ArtworkArtist;
  artworks: Artwork[];
  stats?: StorefrontStats;
}
