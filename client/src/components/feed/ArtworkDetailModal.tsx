import React from 'react';
import { X, MapPin, ShieldCheck, ExternalLink, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface FeedArtworkDetail {
  id: string;
  title: string;
  artistName: string;
  artistRegion: string;
  artistAvatar?: string;
  artistBio?: string;
  medium: string;
  style?: string;
  description: string;
  dimensions?: string;
  weight?: string;
  price: number;
  imageUrl: string;
  availability: 'AVAILABLE' | 'SOLD' | 'RESERVED';
  likesCount?: number;
}

interface ArtworkDetailModalProps {
  artwork: FeedArtworkDetail;
  onClose: () => void;
  onLike?: () => void;
  isLiked?: boolean;
}

export const ArtworkDetailModal: React.FC<ArtworkDetailModalProps> = ({
  artwork,
  onClose,
  onLike,
  isLiked,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="artwork-detail-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl bg-surface-container-lowest rounded-2xl border border-outline/20 shadow-2xl overflow-hidden my-auto flex flex-col md:flex-row max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-on-surface-variant hover:text-on-surface bg-surface/80 hover:bg-surface rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Artwork Image Container */}
        <div className="md:w-1/2 bg-surface-container-high relative min-h-[300px] md:min-h-[480px] flex items-center justify-center overflow-hidden">
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            className="w-full h-full object-cover"
          />

          <span
            className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase backdrop-blur-md border ${
              artwork.availability === 'AVAILABLE'
                ? 'bg-surface-container-lowest/90 text-status-valid border-status-valid/30'
                : 'bg-surface-container-lowest/90 text-on-surface-variant border-outline/20'
            }`}
          >
            {artwork.availability}
          </span>
        </div>

        {/* Right Side: Artwork Information & Story */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Craft Medium Tag */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {artwork.medium}
              </span>
              {artwork.style && (
                <span className="text-[10px] uppercase font-medium tracking-wider text-on-surface-variant">
                  • {artwork.style}
                </span>
              )}
            </div>

            {/* Title */}
            <h2
              id="artwork-detail-title"
              className="font-serif text-2xl font-bold text-on-surface mb-2"
            >
              {artwork.title}
            </h2>

            {/* Artisan Profile */}
            <div className="flex items-center gap-3 py-3 border-y border-outline/15 my-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden ring-1 ring-outline/30">
                {artwork.artistAvatar ? (
                  <img
                    src={artwork.artistAvatar}
                    alt={artwork.artistName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{artwork.artistName.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-on-surface">
                    {artwork.artistName}
                  </span>
                  <span title="Verified Artisan" className="flex items-center">
                    <ShieldCheck className="w-4 h-4 text-status-valid" />
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                  <MapPin className="w-3 h-3 text-outline" />
                  <span>{artwork.artistRegion}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
              {artwork.description}
            </p>

            {/* Physical Attributes */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-surface-container-low rounded-lg text-xs mb-4">
              <div>
                <span className="text-on-surface-variant/70 text-[10px] uppercase tracking-wider block">
                  Dimensions
                </span>
                <span className="font-medium text-on-surface">
                  {artwork.dimensions || 'Custom Size'}
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant/70 text-[10px] uppercase tracking-wider block">
                  Weight
                </span>
                <span className="font-medium text-on-surface">
                  {artwork.weight || '1.0 kg (Approx)'}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Valuation & Action */}
          <div className="pt-4 border-t border-outline/15 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant block">
                Valuation
              </span>
              <span className="font-serif font-bold text-xl text-primary">
                {artwork.price.toFixed(2)}{' '}
                <span className="text-xs font-sans font-normal text-on-surface-variant">
                  Credits
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onLike && (
                <button
                  onClick={onLike}
                  className={`p-2.5 rounded-full border transition-all ${
                    isLiked
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-outline/30 text-on-surface-variant hover:text-primary'
                  }`}
                  aria-label="Like artwork"
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-primary' : ''}`} />
                </button>
              )}

              <Link
                to="/marketplace"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-surface-tint text-on-primary text-xs font-semibold uppercase tracking-wider rounded-full transition-colors shadow-sm"
              >
                <span>Acquire Piece</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
