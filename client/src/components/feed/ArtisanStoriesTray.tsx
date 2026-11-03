import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { StoryModal, ArtisanStory } from './StoryModal';

export const DEMO_ARTISAN_STORIES: ArtisanStory[] = [
  {
    id: 'story-1',
    artisanName: 'Alkas Mia',
    artisanAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    region: 'Sonargaon, Narayanganj',
    craftMedium: 'Jamdani',
    title: 'Weaving 200-Count Muslin Floral Jaal',
    caption: 'Setting up the bamboo pit loom at dawn in Sonargaon. Hand-spinning the fine muslin warp with pure silver zari threads.',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    timeAgo: '2h ago',
    artworkLink: '/marketplace',
    price: 1250.0,
  },
  {
    id: 'story-2',
    artisanName: 'Rokeya Begum',
    artisanAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    region: 'Jessore',
    craftMedium: 'Nakshi Kantha',
    title: 'Peacock Run-Stitch & Lotus Medallion',
    caption: 'Layering repurposed vintage cotton saris with natural indigo thread. This peacock medallion took three generations of oral pattern knowledge.',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    timeAgo: '4h ago',
    artworkLink: '/marketplace',
    price: 850.0,
  },
  {
    id: 'story-3',
    artisanName: 'Gouranga Pal',
    artisanAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    region: 'Panchagarh',
    craftMedium: 'Terracotta',
    title: 'Sun-Drying Heritage Horse Sculptures',
    caption: 'Drying hand-molded red river silt sculptures before packing into the wood-fired kiln. Pure earth, shaped by touch.',
    imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    timeAgo: '6h ago',
    artworkLink: '/marketplace',
    price: 450.0,
  },
  {
    id: 'story-4',
    artisanName: 'Sukumar Banik',
    artisanAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    region: 'Dhamrai',
    craftMedium: 'Bell Metal',
    title: 'Lost-Wax Casting of Ceremonial Kansa',
    caption: 'Pouring molten brass and bronze alloy into beeswax clay molds. Preserving five centuries of Dhamrai metalwork metallurgy.',
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    timeAgo: '8h ago',
    artworkLink: '/marketplace',
    price: 920.0,
  },
  {
    id: 'story-5',
    artisanName: 'Binoy Das',
    artisanAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    region: 'Sylhet',
    craftMedium: 'Shital Pati',
    title: 'Diamond Weave on Murta Cane Mat',
    caption: 'Splitting slender green Murta reed canes into silky millimeter fibers. Naturally cool to the touch even in the height of summer.',
    imageUrl: 'https://images.unsplash.com/photo-1606744824163-985d376605aa?auto=format&fit=crop&w=800&q=80',
    timeAgo: '12h ago',
    artworkLink: '/marketplace',
    price: 640.0,
  },
  {
    id: 'story-6',
    artisanName: 'Fatema Khatun',
    artisanAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    region: 'Faridpur',
    craftMedium: 'Jute Craft',
    title: 'Golden Fiber Braided Wall Tapestry',
    caption: 'Spinning raw jute into heavy textured braids with botanical madder and turmeric pigments. Bringing golden fibers to contemporary walls.',
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
    timeAgo: '1d ago',
    artworkLink: '/marketplace',
    price: 360.0,
  },
];

interface ArtisanStoriesTrayProps {
  stories?: ArtisanStory[];
}

export const ArtisanStoriesTray: React.FC<ArtisanStoriesTrayProps> = ({
  stories = DEMO_ARTISAN_STORIES,
}) => {
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);

  return (
    <section aria-label="Artisan Stories" className="mb-6">
      {/* Stories Tray Horizontal Scroll Container */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline/20 p-4 ambient-shadow">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Artisan Studio Stories</span>
          </div>
          <span className="text-[11px] text-on-surface-variant font-medium">
            Live from Workshops
          </span>
        </div>

        <div className="flex items-center gap-4 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
          {stories.map((story, index) => (
            <button
              key={story.id}
              onClick={() => setActiveStoryIndex(index)}
              className="flex flex-col items-center gap-1.5 group focus:outline-none flex-shrink-0 cursor-pointer"
              aria-label={`View story by ${story.artisanName}`}
            >
              {/* Gradient Glowing Ring */}
              <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-primary via-primary-container to-amber-600 group-hover:scale-105 transition-transform duration-300 shadow-xs">
                <div className="p-0.5 bg-surface-container-lowest rounded-full">
                  <img
                    src={story.artisanAvatar}
                    alt={story.artisanName}
                    className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover group-hover:brightness-105 transition-all"
                  />
                </div>
              </div>

              {/* Artisan Name Label */}
              <span className="text-[11px] font-medium text-on-surface group-hover:text-primary transition-colors max-w-[68px] truncate text-center">
                {story.artisanName}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Story Viewer Modal */}
      {activeStoryIndex !== null && (
        <StoryModal
          stories={stories}
          initialIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
        />
      )}
    </section>
  );
};

