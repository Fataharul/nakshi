import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MapPin,
  CheckCircle,
  MoreHorizontal,
  Send,
  Sparkles,
} from 'lucide-react';
import { artworkApi } from '../../services/artwork.service';
import { useAuth } from '../../context/AuthContext';
import { ArtworkDetailModal, FeedArtworkDetail } from './ArtworkDetailModal';

export interface FeedComment {
  id: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

export interface FeedPostData {
  id: string;
  title: string;
  artistName: string;
  artistRegion: string;
  artistAvatar: string;
  artistBio?: string;
  medium: string;
  style?: string;
  description: string;
  dimensions?: string;
  weight?: string;
  price: number;
  imageUrl: string;
  availability: 'AVAILABLE' | 'SOLD' | 'RESERVED';
  timeAgo: string;
  likesCount: number;
  initialLiked?: boolean;
  comments: FeedComment[];
  tags: string[];
}

interface FeedPostCardProps {
  post: FeedPostData;
  onLikeChanged?: (postId: string, newCount: number) => void;
}

export const FeedPostCard: React.FC<FeedPostCardProps> = ({
  post,
  onLikeChanged,
}) => {
  const { user } = useAuth();
  const [likes, setLikes] = useState<number>(post.likesCount);
  const [isLiked, setIsLiked] = useState<boolean>(post.initialLiked ?? false);
  const [isSubmittingLike, setIsSubmittingLike] = useState<boolean>(false);
  const [showHeartBurst, setShowHeartBurst] = useState<boolean>(false);

  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [comments, setComments] = useState<FeedComment[]>(post.comments);
  const [commentInput, setCommentInput] = useState<string>('');
  const [isExpandedCaption, setIsExpandedCaption] = useState<boolean>(false);
  const [showShareToast, setShowShareToast] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  // Handle Like Action
  const handleLike = async () => {
    if (isSubmittingLike) return;

    const nextIsLiked = !isLiked;
    const nextLikes = nextIsLiked ? likes + 1 : Math.max(0, likes - 1);

    setIsLiked(nextIsLiked);
    setLikes(nextLikes);
    setIsSubmittingLike(true);

    try {
      const updated = await artworkApi.likeArtwork(post.id);
      const serverLikes = updated.like ?? nextLikes;
      setLikes(serverLikes);
      onLikeChanged?.(post.id, serverLikes);
    } catch {
      // If mock/curated item or network offline, keep optimistic update or revert if desired
      onLikeChanged?.(post.id, nextLikes);
    } finally {
      setIsSubmittingLike(false);
    }
  };

  // Double-tap or double-click to like (signature Instagram interaction)
  const handleDoubleClick = () => {
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 900);
    if (!isLiked) {
      handleLike();
    }
  };

  // Handle Bookmark / Save
  const handleToggleSave = () => {
    setIsSaved((prev) => !prev);
  };

  // Handle Share to Clipboard
  const handleShare = () => {
    const url = `${window.location.origin}/marketplace?artwork=${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2400);
  };

  // Handle adding a new comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    const newComment: FeedComment = {
      id: `comment-${Date.now()}`,
      userName: user?.name || 'Art Patron',
      userAvatar: undefined,
      text: commentInput.trim(),
      createdAt: 'Just now',
    };

    setComments((prev) => [...prev, newComment]);
    setCommentInput('');
    setShowComments(true);
  };

  const modalDetail: FeedArtworkDetail = {
    id: post.id,
    title: post.title,
    artistName: post.artistName,
    artistRegion: post.artistRegion,
    artistAvatar: post.artistAvatar,
    artistBio: post.artistBio,
    medium: post.medium,
    style: post.style,
    description: post.description,
    dimensions: post.dimensions,
    weight: post.weight,
    price: post.price,
    imageUrl: post.imageUrl,
    availability: post.availability,
    likesCount: likes,
  };

  return (
    <article
      id={`feed-post-${post.id}`}
      className="bg-surface-container-lowest rounded-2xl border border-outline/20 ambient-shadow overflow-hidden mb-6 transition-all"
    >
      {/* 1. Post Header: Artisan Identity */}
      <div className="p-4 flex items-center justify-between border-b border-outline/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={post.artistAvatar}
              alt={post.artistName}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/20"
            />
            <div className="absolute -bottom-1 -right-1 bg-surface-container-lowest rounded-full p-0.5">
              <CheckCircle className="w-4 h-4 text-status-valid fill-white" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-on-surface hover:text-primary transition-colors cursor-pointer">
                {post.artistName}
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {post.medium}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              <MapPin className="w-3 h-3 text-outline" />
              <span>{post.artistRegion}</span>
              <span>•</span>
              <span className="text-on-surface-variant/75">{post.timeAgo}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowDetailModal(true)}
          className="p-2 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container transition-colors"
          aria-label="Post options"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Visual Media: Artwork Image with Instagram Double-Click Like */}
      <div
        className="relative w-full bg-surface-container-high overflow-hidden select-none cursor-pointer"
        onDoubleClick={handleDoubleClick}
      >
        <img
          src={post.imageUrl}
          alt={post.title}
          className="w-full max-h-[580px] object-cover"
        />

        {/* Double-tap Floating Heart Burst Animation */}
        {showHeartBurst && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="animate-ping duration-700 bg-white/30 p-8 rounded-full">
              <Heart className="w-20 h-20 text-white fill-primary filter drop-shadow-xl" />
            </div>
          </div>
        )}

        {/* Corner Overlay Chips */}
        <div className="absolute top-3 left-3 pointer-events-none">
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase backdrop-blur-md border pointer-events-auto shadow-xs ${
              post.availability === 'AVAILABLE'
                ? 'bg-surface-container-lowest/90 text-status-valid border-status-valid/30'
                : 'bg-surface-container-lowest/90 text-on-surface-variant border-outline/20'
            }`}
          >
            {post.availability}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 pointer-events-none">
          <div className="px-3 py-1.5 bg-black/75 backdrop-blur-md rounded-full text-white text-xs font-semibold flex items-center gap-1.5 shadow-md pointer-events-auto">
            <span className="text-[10px] uppercase tracking-wider text-white/70">
              Valuation:
            </span>
            <span className="font-serif font-bold text-primary-fixed">
              {post.price.toFixed(2)} Credits
            </span>
          </div>
        </div>
      </div>

      {/* 3. Action Buttons Bar (Instagram / Facebook styled) */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          {/* Left Action Icons */}
          <div className="flex items-center gap-4">
            {/* Like */}
            <button
              onClick={handleLike}
              disabled={isSubmittingLike}
              className="flex items-center gap-1.5 text-on-surface hover:text-primary transition-colors focus:outline-none cursor-pointer group"
              aria-label="Like artwork"
            >
              <Heart
                className={`w-6 h-6 transition-all duration-200 group-active:scale-125 ${
                  isLiked
                    ? 'fill-primary text-primary scale-110'
                    : 'text-on-surface hover:text-primary'
                }`}
              />
            </button>

            {/* Comment */}
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-on-surface hover:text-primary transition-colors focus:outline-none cursor-pointer"
              aria-label="Comment on artwork"
            >
              <MessageCircle className="w-6 h-6" />
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-on-surface hover:text-primary transition-colors focus:outline-none cursor-pointer"
              aria-label="Share artwork link"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Right Action Icons: Bookmark & Details CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleSave}
              className="text-on-surface hover:text-primary transition-colors focus:outline-none cursor-pointer"
              aria-label="Save to collection"
            >
              <Bookmark
                className={`w-5 h-5 ${
                  isSaved ? 'fill-primary text-primary' : ''
                }`}
              />
            </button>

            <button
              onClick={() => setShowDetailModal(true)}
              className="px-3.5 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold uppercase tracking-wider rounded-full border border-outline/20 hover:border-outline/40 transition-colors cursor-pointer"
            >
              Details
            </button>
          </div>
        </div>

        {/* Share Link Toast Feedback */}
        {showShareToast && (
          <div className="py-1 px-3 mb-2 bg-primary/10 text-primary border border-primary/20 rounded-md text-xs font-medium animate-in fade-in flex items-center justify-between">
            <span>Link copied to clipboard! Share this craft heritage.</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        )}

        {/* 4. Social Proof & Likes Count */}
        <div className="mb-2">
          <p className="text-xs font-semibold text-on-surface">
            {likes.toLocaleString()} {likes === 1 ? 'admirer' : 'admirers'} appreciated this
          </p>
        </div>

        {/* 5. Artwork Title & Storytelling Caption */}
        <div className="text-xs text-on-surface leading-relaxed mb-3">
          <h4 className="font-serif font-bold text-base text-on-surface mb-1">
            {post.title}
          </h4>
          <p className={`text-on-surface-variant ${!isExpandedCaption ? 'line-clamp-2' : ''}`}>
            <span className="font-semibold text-on-surface mr-1.5">
              {post.artistName}:
            </span>
            {post.description}
          </p>
          {post.description.length > 120 && (
            <button
              onClick={() => setIsExpandedCaption(!isExpandedCaption)}
              className="text-[11px] font-semibold text-primary mt-1 hover:underline cursor-pointer"
            >
              {isExpandedCaption ? 'Show less' : 'Read more story'}
            </button>
          )}

          {/* Hashtags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 6. Comments Summary Toggle */}
        {comments.length > 0 && !showComments && (
          <button
            onClick={() => setShowComments(true)}
            className="text-xs text-on-surface-variant/80 hover:text-on-surface font-medium mb-2 cursor-pointer"
          >
            View all {comments.length} {comments.length === 1 ? 'inquiry' : 'inquiries & comments'}
          </button>
        )}

        {/* 7. Expanded Comments Thread */}
        {showComments && (
          <div className="pt-2 border-t border-outline/10 space-y-2 mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Patron Inquiries & Appreciation
              </span>
              <button
                onClick={() => setShowComments(false)}
                className="text-[11px] text-primary hover:underline"
              >
                Hide
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {comments.map((comment) => (
                <div key={comment.id} className="text-xs bg-surface-container-low p-2.5 rounded-lg">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-on-surface">
                      {comment.userName}
                    </span>
                    <span className="text-[10px] text-on-surface-variant/70">
                      {comment.createdAt}
                    </span>
                  </div>
                  <p className="text-on-surface-variant leading-relaxed">
                    {comment.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. Inline Comment Composer */}
        <form
          onSubmit={handleAddComment}
          className="flex items-center gap-2 pt-2 border-t border-outline/10"
        >
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder={`Add an inquiry for ${post.artistName}...`}
            className="flex-1 bg-surface-container-low border border-outline/15 rounded-full px-4 py-2 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary transition-colors"
          />
          <button
            type="submit"
            disabled={!commentInput.trim()}
            className="p-2 text-primary hover:text-surface-tint disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Post comment"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Artwork Full Detail Modal */}
      {showDetailModal && (
        <ArtworkDetailModal
          artwork={modalDetail}
          onClose={() => setShowDetailModal(false)}
          onLike={handleLike}
          isLiked={isLiked}
        />
      )}
    </article>
  );
};
