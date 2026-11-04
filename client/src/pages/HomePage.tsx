import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FeedPostCard, FeedPostData } from '../components/feed/FeedPostCard';
import { artworkApi } from '../services/artwork.service';
import { Artwork } from '../types/artwork';
import { Sparkles, CheckCheck, Compass, ArrowRight, Loader2 } from 'lucide-react';

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

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('All Crafts');
  const [posts, setPosts] = useState<FeedPostData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch live backend artworks
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    artworkApi
      .getArtworks({ limit: 30 })
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
            price: Number(item.price),
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
            comments: Array.isArray((item as any).comments)
              ? (item as any).comments.map((c: any) => ({
                  id: c.id,
                  userName: c.user?.name || 'Patron',
                  text: c.content,
                  createdAt: 'Recent',
                }))
              : [],
            tags: [item.medium.replace(/\s+/g, ''), 'BangladeshiCraft', 'ArtisanMade'],
          }));

          setPosts(livePosts);
        }
      })
      .catch((err) => {
        console.error('[HomePage] Failed to fetch live artworks:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter posts based on selected category pill
  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'All Crafts') return posts;
    return posts.filter(
      (post) =>
        post.medium.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        selectedCategory.toLowerCase().includes(post.medium.toLowerCase())
    );
  }, [posts, selectedCategory]);

  return (
    <main className="min-h-screen bg-surface pb-16">
      {/* Centered Scrollable Feed Container */}
      <div className="max-w-xl md:max-w-2xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6">
        {/* Subtle Welcome & Navigation Header */}
        <section
          aria-label="Welcome Banner"
          className="bg-surface-container-lowest rounded-2xl border border-outline/20 p-4 sm:p-5 ambient-shadow mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-primary mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Living Heritage Stream</span>
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

        {/* Category Filter Pills */}
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

        {/* 3. Scrollable Feed of Artwork Posts */}
        <section aria-label="Artwork Feed Stream" className="space-y-6">
          {isLoading ? (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline/20 p-12 text-center ambient-shadow my-6 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs font-serif uppercase tracking-widest text-on-surface-variant">
                Loading Authentic Heritage Dispatches...
              </p>
            </div>
          ) : filteredPosts.length > 0 ? (
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
        {!isLoading && filteredPosts.length > 0 && (
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
        )}
      </div>
    </main>
  );
};

export default HomePage;
