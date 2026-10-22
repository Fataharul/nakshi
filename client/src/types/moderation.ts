export interface ModerationArtworkSummary {
  id: string;
  title: string;
  description: string;
  medium: string;
  style?: string | null;
  dimensions?: string | null;
  price: number;
  imageUrl: string;
  imageHash?: string | null;
  moderationStatus: 'PENDING' | 'APPROVED' | 'FLAGGED' | 'REJECTED';
  availability: string;
  createdAt: string;
  artist?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    bio?: string | null;
  };
}

export interface ModerationQueueItem {
  id: string;
  sourceArtworkId: string;
  suspectedMatchId?: string | null;
  similarityScore: number;
  actionTaken?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  sourceArtwork: ModerationArtworkSummary;
  suspectedMatchArtwork?: ModerationArtworkSummary | null;
  admin?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface ModerationReviewPayload {
  action: 'APPROVE' | 'REJECT';
  notes?: string;
}
