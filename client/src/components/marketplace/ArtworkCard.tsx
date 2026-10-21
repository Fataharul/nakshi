import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Sparkles } from 'lucide-react';
import { artworkApi } from '../../services/artwork.service';

export interface SearchableArtwork {
  id: string;
  title: string;
  artistName: string;
  artistRegion: string;
  medium: string;
  style?: string;
  description: string;
  dimensions: string;
  weight?: string;
  price: number;
  imageUrl: string;
  availability: 'AVAILABLE' | 'SOLD' | 'RESERVED';
  createdAt: string;
  featured?: boolean;
  like?: number;
}

interface ArtworkCardProps {
  artwork: SearchableArtwork;
  onLike?: (artworkId: string, updatedLikes: number) => void;
  onViewDetails?: (artwork: SearchableArtwork) => void;
}

export const ArtworkCard: React.FC<ArtworkCardProps> = ({
  artwork,
  onLike,
  onViewDetails,
}) => {
  const navigate = useNavigate();
  const [likes, setLikes] = useState<number>(artwork.like ?? 0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(artwork);
    } else {
      navigate(`/artworks/${artwork.id}`);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSubmitting) return;

    // Optimistic UI update
    const previousLikes = likes;
    const previousIsLiked = isLiked;
    const nextLikes = isLiked ? Math.max(0, likes - 1) : likes + 1;

    setIsLiked(!isLiked);
    setLikes(nextLikes);
    setIsSubmitting(true);

    try {
      const updatedArtwork = await artworkApi.likeArtwork(artwork.id);
      const serverLikes = updatedArtwork.like ?? nextLikes;
      setLikes(serverLikes);
      onLike?.(artwork.id, serverLikes);
    } catch (error) {
      // Revert optimistic update on error
      setLikes(previousLikes);
      setIsLiked(previousIsLiked);
      console.error('Failed to like artwork:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <article
      id={`artwork-card-${artwork.id}`}
      className="bg-surface-container-lowest rounded-xl border border-outline/20 ambient-shadow overflow-hidden flex flex-col hover:border-outline/40 transition-all hover:scale-[1.01] duration-300 group"
    >
      {/* Image Frame */}
      <div className="h-60 bg-surface-container-high relative overflow-hidden">
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {artwork.featured ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-primary text-on-primary flex items-center gap-1 shadow-xs pointer-events-auto">
              <Sparkles className="w-3 h-3" />
              <span>Curator Pick</span>
            </span>
          ) : (
            <div />
          )}

          <span
            className={`px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase backdrop-blur-xs border pointer-events-auto ${
              artwork.availability === 'AVAILABLE'
                ? 'bg-surface-container-lowest/90 text-status-valid border-status-valid/30'
                : 'bg-surface-container-lowest/90 text-on-surface-variant border-outline/20'
            }`}
          >
            {artwork.availability}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">
              {artwork.medium}
            </span>
            <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
              <MapPin className="w-3 h-3 text-outline" />
              <span>{artwork.artistRegion}</span>
            </span>
          </div>

          <h3
            onClick={handleViewDetails}
            className="font-serif text-lg font-bold text-on-surface mb-1 group-hover:text-primary transition-colors line-clamp-1 cursor-pointer"
          >
            {artwork.title}
          </h3>

          <p className="text-xs text-on-surface-variant/90 font-medium mb-2">
            By <span className="text-on-surface font-semibold">{artwork.artistName}</span>
          </p>

          <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed mb-4">
            {artwork.description}
          </p>

          {/* Metadata Chips */}
          <div className="text-[11px] text-on-surface-variant/80 mb-3 flex flex-wrap gap-2">
            {artwork.style && (
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium border border-primary/20">
                {artwork.style}
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-surface-container-low border border-outline/10">
              {artwork.dimensions}
            </span>
            {artwork.weight && (
              <span className="px-2 py-0.5 rounded bg-surface-container-low border border-outline/10">
                {artwork.weight}
              </span>
            )}
          </div>
        </div>

        {/* Card Footer: Price, Like Button & Actions */}
        <div className="pt-3 border-t border-outline/10 flex items-center justify-between mt-auto">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-on-surface-variant block font-medium">
              Valuation
            </span>
            <span className="font-serif font-bold text-base text-primary">
              {artwork.price.toFixed(2)}{' '}
              <span className="text-xs font-sans font-normal text-on-surface-variant">Credits</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Like Button */}
            <button
              id={`artwork-like-btn-${artwork.id}`}
              type="button"
              onClick={handleLike}
              disabled={isSubmitting}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                isLiked
                  ? 'bg-primary/10 border-primary/40 text-primary font-semibold'
                  : 'bg-surface-container-low border-outline/20 text-on-surface-variant hover:text-primary hover:border-primary/30'
              }`}
              title="Like this artwork"
              aria-label="Like artwork"
            >
              <Heart
                className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                  isLiked ? 'fill-primary text-primary' : ''
                }`}
              />
              <span id={`artwork-like-count-${artwork.id}`}>{likes}</span>
            </button>

            {/* View Details Button */}
            <button
              id={`view-details-btn-${artwork.id}`}
              type="button"
              onClick={handleViewDetails}
              className="px-3.5 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold uppercase tracking-wider rounded-full border border-outline/20 hover:border-outline/40 transition-colors cursor-pointer"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
