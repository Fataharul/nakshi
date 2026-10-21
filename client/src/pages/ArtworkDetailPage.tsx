import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { artworkApi } from '../services/artwork.service';
import { Artwork, ArtworkComment } from '../types/artwork';
import {
  Heart,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Sparkles,
  MessageSquare,
  Send,
  ShoppingBag,
  Info,
  Clock,
  User as UserIcon,
} from 'lucide-react';

export const ArtworkDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Like state
  const [likes, setLikes] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isSubmittingLike, setIsSubmittingLike] = useState<boolean>(false);

  // Comment state
  const [comments, setComments] = useState<ArtworkComment[]>([]);
  const [commentContent, setCommentContent] = useState<string>('');
  const [isPostingComment, setIsPostingComment] = useState<boolean>(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Purchase modal placeholder
  const [purchaseNotice, setPurchaseNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/gallery');
      return;
    }

    setLoading(true);
    setError(null);

    artworkApi
      .getArtworkById(id)
      .then((data) => {
        setArtwork(data);
        setLikes(data.like ?? 0);
        setComments(data.comments ?? []);
      })
      .catch((err) => {
        console.error('Failed to load artwork:', err);
        setError('Artwork record not found or unavailable.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, navigate]);

  const handleLike = async () => {
    if (!artwork || isSubmittingLike) return;

    const prevLikes = likes;
    const prevIsLiked = isLiked;
    const nextLikes = isLiked ? Math.max(0, likes - 1) : likes + 1;

    setIsLiked(!isLiked);
    setLikes(nextLikes);
    setIsSubmittingLike(true);

    try {
      const updated = await artworkApi.likeArtwork(artwork.id);
      setLikes(updated.like ?? nextLikes);
    } catch (err) {
      setLikes(prevLikes);
      setIsLiked(prevIsLiked);
      console.error('Failed to like artwork:', err);
    } finally {
      setIsSubmittingLike(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || !artwork || isPostingComment) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setIsPostingComment(true);
    setCommentError(null);

    try {
      const newComment = await artworkApi.addComment(artwork.id, commentContent.trim());
      setComments((prev) => [newComment, ...prev]);
      setCommentContent('');
    } catch (err: any) {
      setCommentError(err.message || 'Failed to submit comment');
    } finally {
      setIsPostingComment(false);
    }
  };

  const handlePurchaseClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.role !== 'BUYER') {
      setPurchaseNotice('Only registered Buyer accounts can purchase artworks with internal credits.');
      return;
    }
    if (user && user.walletBalance < (artwork?.price || 0)) {
      setPurchaseNotice(
        `Insufficient credit balance (${user.walletBalance.toFixed(2)} Credits). You need ${Number(artwork?.price).toFixed(2)} Credits to complete this purchase.`
      );
      return;
    }
    setPurchaseNotice(
      `Purchase order confirmed for ${artwork?.title} at ${Number(artwork?.price).toFixed(2)} Credits. Processing order record...`
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-on-surface-variant">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-serif uppercase tracking-widest">Loading Curated Artwork...</span>
      </div>
    );
  }

  if (error || !artwork) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error-container/30 text-error flex items-center justify-center">
          <Info className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-on-surface mb-2">Artwork Not Found</h2>
        <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
          {error || 'The requested handcrafted artwork could not be located in our curated collection.'}
        </p>
        <Link
          to="/gallery"
          id="back-to-gallery-btn"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary font-semibold text-xs uppercase tracking-wider rounded-full hover:bg-surface-tint transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Gallery</span>
        </Link>
      </div>
    );
  }

  const isAvailable = artwork.availability === 'AVAILABLE';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Navigation Breadcrumb / Back button */}
      <div className="mb-6">
        <Link
          to="/gallery"
          id="back-to-gallery-btn"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Gallery Collection</span>
        </Link>
      </div>

      {/* Main Grid: Artwork Imagery & Editorial Spec Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Matted Exhibition Frame */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div
            id="artwork-hero-frame"
            className="rounded-2xl bg-surface-container-high/30 border border-outline/20 p-4 sm:p-8 flex items-center justify-center overflow-hidden ambient-shadow"
          >
            <div className="relative w-full max-h-[70vh] rounded-xl overflow-hidden bg-surface-container-lowest shadow-sm flex items-center justify-center">
              <img
                id="artwork-detail-image"
                src={artwork.imageUrl}
                alt={artwork.title}
                className="w-full h-auto max-h-[70vh] object-contain transition-transform duration-700 hover:scale-[1.02]"
              />

              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <span
                  id="artwork-availability-badge"
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border shadow-xs ${
                    isAvailable
                      ? 'bg-surface-container-lowest/95 text-status-valid border-status-valid/40'
                      : artwork.availability === 'RESERVED'
                      ? 'bg-surface-container-lowest/95 text-primary border-primary/40'
                      : 'bg-surface-container-lowest/95 text-on-surface-variant border-outline/40'
                  }`}
                >
                  {artwork.availability}
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Action Row beneath Image */}
          <div className="flex items-center justify-between px-2 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Bangladeshi Heritage Craft Certification</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                id="artwork-detail-like-btn"
                onClick={handleLike}
                disabled={isSubmittingLike}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                  isLiked
                    ? 'bg-primary/10 border-primary/40 text-primary font-semibold'
                    : 'bg-surface-container-lowest border-outline/20 text-on-surface-variant hover:text-primary hover:border-primary/40'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${isLiked ? 'fill-primary text-primary' : ''}`}
                />
                <span id="artwork-detail-like-count">{likes} Likes</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Editorial Details, Pricing, Artisan Info & Purchase */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {/* Medium & Craft Style Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                id="artwork-medium-badge"
                className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary-container/20 text-primary border border-primary/30"
              >
                {artwork.medium}
              </span>
              {artwork.style && (
                <span
                  id="artwork-style-badge"
                  className="px-3 py-1 rounded-full text-xs font-medium bg-surface-container text-on-surface-variant border border-outline/20"
                >
                  {artwork.style}
                </span>
              )}
            </div>

            {/* Title */}
            <div>
              <h1 id="artwork-title" className="font-serif text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">
                {artwork.title}
              </h1>
              <p className="text-xs text-on-surface-variant mt-1.5 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-outline" />
                <span>Listed on {new Date(artwork.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
              </p>
            </div>

            {/* Price & Valuation Card */}
            <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline/20 ambient-shadow space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant block">
                    Valuation & Purchase Price
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span id="artwork-price" className="font-serif text-3xl font-bold text-primary">
                      {Number(artwork.price).toFixed(2)}
                    </span>
                    <span className="text-sm font-sans font-medium text-on-surface-variant">
                      Internal Credits
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-on-surface-variant block">
                    Acquisition Mode
                  </span>
                  <span className="text-xs font-semibold text-on-surface">
                    Direct Gallery Sale
                  </span>
                </div>
              </div>

              {/* Purchase Notice / Status */}
              {purchaseNotice && (
                <div
                  id="purchase-notice-banner"
                  className="p-3 bg-surface-container text-xs rounded text-on-surface border border-outline/20"
                >
                  {purchaseNotice}
                </div>
              )}

              {/* Purchase CTA */}
              <button
                id="buy-artwork-btn"
                type="button"
                onClick={handlePurchaseClick}
                disabled={!isAvailable}
                className={`w-full py-3.5 px-6 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm ${
                  isAvailable
                    ? 'bg-primary text-on-primary hover:bg-surface-tint cursor-pointer'
                    : 'bg-surface-container text-on-surface-variant cursor-not-allowed opacity-60'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isAvailable ? 'Purchase with Internal Credits' : `Artwork is ${artwork.availability}`}</span>
              </button>
            </div>

            {/* Description Narrative */}
            <div className="space-y-2">
              <h2 className="text-xs uppercase tracking-wider font-semibold text-on-surface">
                Artisan Narrative & Motif Description
              </h2>
              <p
                id="artwork-description"
                className="text-xs sm:text-sm text-on-surface-variant leading-relaxed whitespace-pre-line"
              >
                {artwork.description}
              </p>
            </div>

            {/* Physical Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline/10">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant block mb-1">
                  Dimensions
                </span>
                <span id="artwork-dimensions" className="font-medium text-xs text-on-surface">
                  {artwork.dimensions ||
                    (artwork.height && artwork.width
                      ? `${artwork.height} × ${artwork.width} ${artwork.depth ? `× ${artwork.depth}` : ''} cm`
                      : 'Custom Heritage Sizing')}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline/10">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant block mb-1">
                  Weight Metric
                </span>
                <span id="artwork-weight" className="font-medium text-xs text-on-surface">
                  {artwork.weight ? `${artwork.weight} ${artwork.weightUnit || 'kg'}` : 'Not Specified'}
                </span>
              </div>
            </div>

            {/* Artisan Profile Card */}
            {artwork.artist && (
              <div id="artist-info-card" className="p-4 rounded-xl bg-surface-container-lowest border border-outline/20 flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-full bg-primary-container/20 text-primary border border-primary/20 flex items-center justify-center font-serif text-lg font-bold shrink-0 overflow-hidden">
                  {artwork.artist.avatarUrl ? (
                    <img src={artwork.artist.avatarUrl} alt={artwork.artist.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{artwork.artist.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-serif font-bold text-sm text-on-surface truncate">
                      {artwork.artist.name}
                    </h3>
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-valid shrink-0" />
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-2">
                    {artwork.artist.bio || 'Dedicated Bangladeshi artisan master recognized for heritage preservation.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Community Interaction & Comments Section */}
      <section id="artwork-comments-section" className="mt-16 pt-10 border-t border-outline/20">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-2xl font-bold text-on-surface">
              Gallery Dialogue & Artisan Feedback
            </h2>
            <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium">
              {comments.length}
            </span>
          </div>

          {/* Add Comment Form */}
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline/20 ambient-shadow mb-8">
            {isAuthenticated ? (
              <form id="add-comment-form" onSubmit={handleAddComment} className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-on-surface">
                  <UserIcon className="w-3.5 h-3.5 text-primary" />
                  <span>Commenting as {user?.name} ({user?.role})</span>
                </div>

                <textarea
                  id="comment-input"
                  rows={3}
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Share your appreciation, inquiry, or notes on this heritage craft piece..."
                  className="w-full p-3 bg-surface-container-low border border-outline/20 rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary resize-none"
                  maxLength={500}
                  required
                />

                {commentError && (
                  <p id="comment-error-banner" className="text-xs text-error">{commentError}</p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-on-surface-variant">
                    {500 - commentContent.length} characters remaining
                  </span>
                  <button
                    id="comment-submit-btn"
                    type="submit"
                    disabled={isPostingComment || !commentContent.trim()}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary text-on-primary font-semibold text-xs uppercase tracking-wider rounded-full hover:bg-surface-tint disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>{isPostingComment ? 'Posting...' : 'Post Comment'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div id="comment-login-prompt" className="text-center py-4">
                <p className="text-xs text-on-surface-variant mb-3">
                  Sign in with your Nakshi account to leave comments, inquiries, and notes for the artist.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary text-on-primary text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-surface-tint"
                >
                  Sign In to Comment
                </Link>
              </div>
            )}
          </div>

          {/* Comments List */}
          <div id="comments-list" className="space-y-4">
            {comments.length === 0 ? (
              <div id="no-comments-msg" className="py-8 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-lg border border-dashed border-outline/30">
                Be the first to appreciate or inquire about this handcrafted piece.
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  id={`comment-item-${comment.id}`}
                  className="p-4 rounded-xl bg-surface-container-lowest border border-outline/10 ambient-shadow flex items-start gap-3.5"
                >
                  <div className="w-9 h-9 rounded-full bg-surface-container text-on-surface border border-outline/20 flex items-center justify-center font-serif text-xs font-bold shrink-0 overflow-hidden">
                    {comment.user.avatarUrl ? (
                      <img src={comment.user.avatarUrl} alt={comment.user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{comment.user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-on-surface">{comment.user.name}</span>
                        <span className="px-2 py-0.2 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-surface-container text-on-surface-variant">
                          {comment.user.role}
                        </span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ArtworkDetailPage;
