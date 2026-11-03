import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, MapPin, Sparkles, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface ArtisanStory {
  id: string;
  artisanName: string;
  artisanAvatar: string;
  region: string;
  craftMedium: string;
  title: string;
  caption: string;
  imageUrl: string;
  timeAgo: string;
  artworkLink?: string;
  price?: number;
}

interface StoryModalProps {
  stories: ArtisanStory[];
  initialIndex: number;
  onClose: () => void;
}

export const StoryModal: React.FC<StoryModalProps> = ({
  stories,
  initialIndex,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  const currentStory = stories[currentIndex];

  // Auto-advance progress timer
  useEffect(() => {
    setProgress(0);
    const interval = 50; // Update every 50ms
    const step = (100 / (5000 / interval)); // 5 seconds per story

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Advance to next story if available, else close
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((curr) => curr + 1);
            return 0;
          } else {
            clearInterval(timer);
            onClose();
            return 100;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, stories.length, onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && currentIndex < stories.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, stories.length, onClose]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Story by ${currentStory.artisanName}`}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-colors"
        aria-label="Close story"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation Arrows (Desktop) */}
      {currentIndex > 0 && (
        <button
          onClick={handlePrev}
          className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-40 p-3 bg-white/10 hover:bg-white/25 text-white rounded-full transition-all"
          aria-label="Previous story"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {currentIndex < stories.length - 1 && (
        <button
          onClick={handleNext}
          className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-40 p-3 bg-white/10 hover:bg-white/25 text-white rounded-full transition-all"
          aria-label="Next story"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Main Story Container */}
      <div className="relative w-full max-w-sm sm:max-w-md h-[85vh] max-h-[750px] bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Progress Bars */}
        <div className="absolute top-3 left-3 right-3 z-30 flex gap-1">
          {stories.map((story, idx) => (
            <div
              key={story.id}
              className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-75"
                style={{
                  width:
                    idx < currentIndex
                      ? '100%'
                      : idx === currentIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Header */}
        <div className="absolute top-6 left-3 right-3 z-30 flex items-center justify-between text-white drop-shadow-md">
          <div className="flex items-center gap-2.5">
            <img
              src={currentStory.artisanAvatar}
              alt={currentStory.artisanName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-primary"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm tracking-tight">
                  {currentStory.artisanName}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/80 text-white">
                  {currentStory.craftMedium}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-white/80">
                <MapPin className="w-3 h-3" />
                <span>{currentStory.region}</span>
                <span>•</span>
                <span>{currentStory.timeAgo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Story Visual Media */}
        <div className="relative flex-1 w-full h-full bg-black overflow-hidden flex items-center justify-center">
          <img
            src={currentStory.imageUrl}
            alt={currentStory.title}
            className="w-full h-full object-cover"
          />

          {/* Touch navigation zones for mobile */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1/3 z-20"
            onClick={handlePrev}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-1/3 z-20"
            onClick={handleNext}
          />

          {/* Bottom Gradient Overlay */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
        </div>

        {/* Story Storytelling Footer */}
        <div className="absolute bottom-0 inset-x-0 z-30 p-5 text-white">
          <div className="flex items-center gap-1.5 mb-1 text-primary-fixed text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Studio Heritage Process</span>
          </div>
          <h3 className="font-serif text-lg font-bold mb-1 text-white">
            {currentStory.title}
          </h3>
          <p className="text-xs text-white/90 leading-relaxed mb-4 line-clamp-3">
            {currentStory.caption}
          </p>

          {/* Action CTA */}
          <div className="flex items-center justify-between pt-2 border-t border-white/20">
            {currentStory.price ? (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-white/70 block">
                  Valuation
                </span>
                <span className="font-serif font-bold text-sm text-primary-fixed">
                  {currentStory.price.toFixed(2)} Credits
                </span>
              </div>
            ) : (
              <span className="text-xs text-white/70 italic">Artisan Dispatch</span>
            )}

            <Link
              to={currentStory.artworkLink || '/marketplace'}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-container text-white text-xs font-semibold uppercase tracking-wider rounded-full transition-colors shadow-lg"
            >
              <span>Explore Piece</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

