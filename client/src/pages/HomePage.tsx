import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArtisanStoriesTray } from '../components/feed/ArtisanStoriesTray';
import { FeedPostCard, FeedPostData } from '../components/feed/FeedPostCard';
import { artworkApi } from '../services/artwork.service';
import { Artwork } from '../types/artwork';
import { Sparkles, CheckCheck, Compass, ArrowRight } from 'lucide-react';

const CRAFT_CATEGORIES = [
  'All Crafts',
  'Handloom Jamdani',
  'Nakshi Kantha',
  'Terracotta Clay',
  'Brass & Bell Metal',
  'Shital Pati & Cane',
  'Jute Craft',
  'Wood Carving',
];

// Rich Authentic Heritage Collection Posts (Curated Bangladeshi Crafts)
const CURATED_FEED_POSTS: FeedPostData[] = [
  {
    id: 'post-001',
    title: 'Sonargaon Heritage Jamdani Saree',
    artistName: 'Alkas Mia',
    artistRegion: 'Sonargaon, Narayanganj',
    artistAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    artistBio: 'Third generation master weaver practicing 200-count cotton muslin and pure zari weaving on traditional pit looms.',
    medium: 'Handloom Jamdani',
    style: 'Floral Motifs',
    description: 'Authentic 200-count handloom muslin Jamdani woven with pure zari floral jaal motifs. Each flower was woven petal by petal from memory on our bamboo pit loom over 7 weeks.',
    dimensions: '5.5 meters x 1.2 meters',
    weight: '0.85 kg',
    price: 1250.0,
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    availability: 'AVAILABLE',
    timeAgo: '2 hours ago',
    likesCount: 54,
    initialLiked: false,
    comments: [
      {
        id: 'c1',
        userName: 'Sadia Rahman',
        text: 'The zari density on the border is exceptional! Is the count genuine 200-ply?',
        createdAt: '1h ago',
      },
      {
        id: 'c2',
        userName: 'Tanvir Hossain',
        text: 'Master Alkas weaves like poetry. Truly an heirloom piece.',
        createdAt: '35m ago',
      },
    ],
    tags: ['Jamdani', 'Muslin', 'Sonargaon', 'HandloomHeirloom'],
  },
  {
    id: 'post-002',
    title: 'Mayurpakkhi Heirloom Nakshi Kantha',
    artistName: 'Rokeya Begum',
    artistRegion: 'Jessore',
    artistAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    artistBio: 'Folk embroidery artist continuing the historic Jessore running-stitch tradition with natural dyed threads.',
    medium: 'Nakshi Kantha',
    style: 'Traditional Folk',
    description: 'Traditional heirloom quilt featuring intricate run-stitch peacocks, lotus pond medallions, and village folklore. Created from natural cotton layers stitched together during monsoon evenings.',
    dimensions: '72 x 54 inches',
    weight: '1.4 kg',
    price: 850.0,
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    availability: 'AVAILABLE',
    timeAgo: '4 hours ago',
    likesCount: 89,
    initialLiked: true,
    comments: [
      {
        id: 'c3',
        userName: 'Dr. Niloufar',
        text: 'The medallion stitches resemble 19th century Jessore museum archives. Magnificent work Rokeya apa!',
        createdAt: '2h ago',
      },
    ],
    tags: ['NakshiKantha', 'JessoreCraft', 'HeirloomQuilt', 'BengaliTextiles'],
  },
  {
    id: 'post-003',
    title: 'Terracotta Folk Horse Sculpture',
    artistName: 'Gouranga Pal',
    artistRegion: 'Panchagarh',
    artistAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    artistBio: 'Traditional clay artisan working with alluvial red river silt and wood-fired open kilns.',
    medium: 'Terracotta Clay',
    style: 'Sculptural & Relic',
    description: 'Hand-molded kiln-fired terracotta folk artifact embodying ancient North Bengal sacrificial horse motifs. The rich burnt umber patina is achieved through straw-smoke reduction firing.',
    dimensions: '35 x 22 x 12 cm',
    weight: '2.8 kg',
    price: 450.0,
    imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    availability: 'AVAILABLE',
    timeAgo: '7 hours ago',
    likesCount: 38,
    initialLiked: false,
    comments: [
      {
        id: 'c4',
        userName: 'Kamal Uddin',
        text: 'The glaze-free earthy finish is what makes authentic Panchagarh terracotta so special.',
        createdAt: '5h ago',
      },
    ],
    tags: ['Terracotta', 'NorthBengal', 'ClaySculpture', 'FolkRelic'],
  },
  {
    id: 'post-004',
    title: 'Dhamrai Bell Metal Royal Kansa Urn',
    artistName: 'Sukumar Banik',
    artistRegion: 'Dhamrai',
    artistAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    artistBio: 'Hereditary bell metal caster representing the ancient Dhamrai brass and bronze guilds.',
    medium: 'Brass & Bell Metal',
    style: 'Royal Heritage',
    description: 'Hand-beaten high-resonance lost-wax cast bell metal ceremonial vessel polished with natural river mud and mustard oil. Rings with a pure harmonic tone when struck.',
    dimensions: '28 x 28 x 38 cm',
    weight: '4.2 kg',
    price: 920.0,
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    availability: 'AVAILABLE',
    timeAgo: '12 hours ago',
    likesCount: 71,
    initialLiked: false,
    comments: [
      {
        id: 'c5',
        userName: 'Fariha Anjum',
        text: 'Lost-wax casting in Dhamrai is an endangered art. Proud to see Banik babu keeping this heritage alive.',
        createdAt: '9h ago',
      },
    ],
    tags: ['BellMetal', 'Kansa', 'DhamraiCraft', 'RoyalArtifact'],
  },
  {
    id: 'post-005',
    title: 'Sylhet Imperial Murta Cane Shital Pati',
    artistName: 'Binoy Das',
    artistRegion: 'Sylhet',
    artistAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    artistBio: 'Master cane artisan recognized by UNESCO intangible cultural heritage for Murta cold-mat weaving.',
    medium: 'Shital Pati & Cane',
    style: 'Geometric Jaal',
    description: 'Master-grade cold mat handwoven from razor-thin strips of green Murta reed featuring geometric diamond weave. Naturally cooler than the surrounding ambient room temperature.',
    dimensions: '84 x 60 inches',
    weight: '1.2 kg',
    price: 640.0,
    imageUrl: 'https://images.unsplash.com/photo-1606744824163-985d376605aa?auto=format&fit=crop&w=800&q=80',
    availability: 'SOLD',
    timeAgo: '1 day ago',
    likesCount: 62,
    initialLiked: false,
    comments: [],
    tags: ['ShitalPati', 'SylhetMurta', 'UNESCOHeritage', 'NaturalFiber'],
  },
  {
    id: 'post-006',
    title: 'Golden Fiber Embroidered Jute Tapestry',
    artistName: 'Fatema Khatun',
    artistRegion: 'Faridpur',
    artistAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    artistBio: 'Faridpur jute cooperative organizer blending traditional braiding with contemporary botanical dye techniques.',
    medium: 'Jute Craft',
    style: 'Contemporary Heritage',
    description: 'Naturally dyed spun golden jute fibers braided and cross-stitched into an expansive wall tapestry with indigo, madder, and pomegranate peel pigments.',
    dimensions: '40 x 30 inches',
    weight: '1.5 kg',
    price: 360.0,
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
    availability: 'AVAILABLE',
    timeAgo: '1 day ago',
    likesCount: 45,
    initialLiked: false,
    comments: [
      {
        id: 'c6',
        userName: 'Zubair Qazi',
        text: 'The natural dyes look so organic and warm on jute. Beautiful texture!',
        createdAt: '18h ago',
      },
    ],
    tags: ['GoldenFiber', 'JuteTapestry', 'FaridpurCraft', 'NaturalDye'],
  },
];

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('All Crafts');
  const [posts, setPosts] = useState<FeedPostData[]>(CURATED_FEED_POSTS);

  // Fetch live backend artworks and merge smoothly into the feed
  useEffect(() => {
    let isMounted = true;
    artworkApi
      .getArtworks({ limit: 12 })
      .then((data) => {
        if (isMounted && data.artworks && data.artworks.length > 0) {
          const livePosts: FeedPostData[] = data.artworks.map((item: Artwork, idx: number) => ({
            id: item.id,
            title: item.title,
            artistName: item.artist?.name || 'Master Artisan',
            artistRegion: 'Bangladesh',
            artistAvatar:
              item.artist?.avatarUrl ||
              `https://images.unsplash.com/photo-${1500000000000 + (idx % 5) * 100000}?auto=format&fit=crop&w=200&q=80`,
            artistBio: item.artist?.bio || undefined,
            medium: item.medium,
            style: item.style || undefined,
            description: item.description,
            dimensions: item.dimensions || undefined,
            weight: item.weight ? `${item.weight} ${item.weightUnit || 'kg'}` : undefined,
            price: item.price,
            imageUrl: item.imageUrl,
            availability:
              item.availability === 'SOLD'
                ? 'SOLD'
                : item.availability === 'RESERVED'
                ? 'RESERVED'
                : 'AVAILABLE',
            timeAgo: 'Recently listed',
            likesCount: item.like ?? Math.floor(Math.random() * 20) + 5,
            initialLiked: false,
            comments: [],
            tags: [item.medium.replace(/\s+/g, ''), 'BangladeshiCraft', 'ArtisanMade'],
          }));

          // Put live backend artworks at the top, followed by curated items
          setPosts([...livePosts, ...CURATED_FEED_POSTS]);
        }
      })
      .catch(() => {
        // Fallback safely to curated collection
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter posts based on selected category pill
  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'All Crafts') return posts;
    return posts.filter((post) =>
      post.medium.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      selectedCategory.toLowerCase().includes(post.medium.toLowerCase())
    );
  }, [posts, selectedCategory]);

  return (
    <main className="min-h-screen bg-surface pb-16">
      {/* Centered Scrollable Feed Container (No sidebars, clean Instagram/Facebook feed width) */}
      <div className="max-w-xl md:max-w-2xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6">
        {/* Subtle Welcome & Navigation Header (preserves all backward-compatible DOM IDs) */}
        <section
          aria-label="Welcome Banner"
          className="bg-surface-container-lowest rounded-2xl border border-outline/20 p-4 sm:p-5 mb-5 ambient-shadow"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary mb-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Heritage Gallery Feed</span>
              </div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
                Nakshi Art & Crafts
              </h1>
              <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">
                Live stream of curated artisan masterpieces and heritage textiles.
              </p>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="flex items-center flex-wrap gap-2 pt-1 sm:pt-0">
              <Link
                to="/marketplace"
                id="home-explore-marketplace-btn"
                className="px-4 py-2 bg-primary hover:bg-surface-tint text-on-primary font-semibold text-xs uppercase tracking-wider rounded-full transition-all shadow-xs flex items-center gap-1"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Marketplace</span>
              </Link>

              {isAuthenticated && user ? (
                <Link
                  to={`/dashboard/${user.role.toLowerCase()}`}
                  id="home-dashboard-btn"
                  className="px-4 py-2 border border-outline/30 text-on-surface hover:bg-surface-container font-semibold text-xs uppercase tracking-wider rounded-full transition-all"
                >
                  {user.role} Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    id="home-explore-btn"
                    className="px-4 py-2 border border-outline/30 text-on-surface hover:bg-surface-container font-semibold text-xs uppercase tracking-wider rounded-full transition-all"
                  >
                    Join
                  </Link>
                  <Link
                    to="/login"
                    id="home-login-btn"
                    className="px-4 py-2 border border-outline/30 text-on-surface hover:bg-surface-container font-semibold text-xs uppercase tracking-wider rounded-full transition-all"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* 1. Artisan Stories Bar (Instagram-style stories tray) */}
        <ArtisanStoriesTray />

        {/* 2. Category Filter Pills */}
        <section aria-label="Craft Categories" className="mb-5">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
            {CRAFT_CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container-lowest border border-outline/20 text-on-surface-variant hover:text-on-surface hover:border-outline/40'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. Scrollable Feed of Artwork Posts (Instagram / Facebook Style) */}
        <section aria-label="Artwork Feed Stream" className="space-y-6">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                onLikeChanged={(postId, newCount) => {
                  setPosts((prev) =>
                    prev.map((p) => (p.id === postId ? { ...p, likesCount: newCount } : p))
                  );
                }}
              />
            ))
          ) : (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline/20 p-8 text-center ambient-shadow my-8">
              <p className="text-on-surface-variant text-sm mb-3">
                No artworks currently listed under "{selectedCategory}".
              </p>
              <button
                onClick={() => setSelectedCategory('All Crafts')}
                className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider rounded-full"
              >
                Show All Crafts
              </button>
            </div>
          )}
        </section>

        {/* 4. End of Feed "Caught Up" State (Like Instagram) */}
        <div className="my-10 p-6 bg-surface-container-low rounded-2xl border border-outline/20 text-center">
          <div className="w-10 h-10 rounded-full bg-status-valid/15 text-status-valid mx-auto flex items-center justify-center mb-2">
            <CheckCheck className="w-5 h-5" />
          </div>
          <h4 className="font-serif font-bold text-base text-on-surface mb-1">
            You're All Caught Up
          </h4>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto mb-4">
            You have viewed all recent artwork dispatches from our verified artisan community.
          </p>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-on-surface hover:bg-black text-surface text-xs font-semibold uppercase tracking-wider rounded-full transition-colors"
          >
            <span>Browse Full Marketplace Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </main>
  );
};

export default HomePage;

