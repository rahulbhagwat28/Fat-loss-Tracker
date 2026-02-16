"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type User = { id: string; name: string; avatarUrl: string | null };
type Comment = {
  id: string;
  text: string;
  createdAt: string;
  user: User;
};

type Post = {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  user: User;
  comments: Comment[];
  likes?: { userId: string }[];
};

function getLikeCountAndLiked(post: Post, currentUserId: string | null | undefined): { count: number; likedByMe: boolean } {
  const likes = post.likes ?? [];
  const likedByMe = !!(currentUserId && likes.some((l) => l.userId === currentUserId));
  return { count: likes.length, likedByMe };
}

export default function PostCard({
  post,
  currentUserId,
  onComment,
  onDelete,
  onLike,
}: {
  post: Post;
  currentUserId?: string | null;
  onComment: (postId: string, text: string) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
  onLike?: (postId: string, liked: boolean) => Promise<void>;
}) {
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [likeState, setLikeState] = useState(() => getLikeCountAndLiked(post, currentUserId));
  const isOwner = currentUserId != null && post.user.id === currentUserId;

  useEffect(() => {
    setLikeState(getLikeCountAndLiked(post, currentUserId));
  }, [post.id, post.likes, currentUserId]);

  const handleLike = async () => {
    if (!onLike) return;
    setLiking(true);
    try {
      await onLike(post.id, likeState.likedByMe);
      setLikeState((prev) => ({
        count: prev.likedByMe ? prev.count - 1 : prev.count + 1,
        likedByMe: !prev.likedByMe,
      }));
    } finally {
      setLiking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await onComment(post.id, commentText.trim());
      setCommentText("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <article className="bg-surface-card border border-surface-border rounded-xl sm:rounded-2xl overflow-hidden mb-4 sm:mb-6 min-w-0">
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
        <Link href={`/profile/${post.user.id}`} className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-surface-dark border border-surface-border overflow-hidden">
            {post.user.avatarUrl ? (
              <img
                src={post.user.avatarUrl}
                alt={post.user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 font-semibold">
                {post.user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </Link>
        <div className="min-w-0">
          <Link
            href={`/profile/${post.user.id}`}
            className="font-semibold text-white hover:text-brand-400 block truncate"
          >
            {post.user.name}
          </Link>
          <p className="text-xs text-slate-500">
            {new Date(post.createdAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        </div>
        {isOwner && onDelete && (
          <button
            type="button"
            onClick={async () => {
              if (!confirm("Delete this post?")) return;
              setDeleting(true);
              try {
                await onDelete(post.id);
              } finally {
                setDeleting(false);
              }
            }}
            disabled={deleting}
            className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50 flex-shrink-0"
            title="Delete post"
          >
            🗑️
          </button>
        )}
      </div>
      <div className="aspect-square relative bg-surface-dark">
        <img
          src={post.imageUrl}
          alt={post.caption || "Post"}
          className="w-full h-full object-contain"
        />
      </div>
      <div className="px-4 py-2 flex items-center gap-2 border-b border-surface-border/50">
        {onLike && (
          <button
            type="button"
            onClick={handleLike}
            disabled={liking}
            className={`flex items-center gap-1.5 px-2 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 touch-manipulation ${
              likeState.likedByMe
                ? "text-red-400 hover:bg-red-500/10"
                : "text-slate-400 hover:text-red-400 hover:bg-red-500/10"
            }`}
            title={likeState.likedByMe ? "Unlike" : "Like"}
          >
            <span className="text-lg">{likeState.likedByMe ? "❤️" : "🤍"}</span>
            {likeState.count > 0 && <span>{likeState.count}</span>}
          </button>
        )}
      </div>
      {post.caption && (
        <div className="px-4 py-2">
          <p className="text-slate-300 text-sm whitespace-pre-wrap">{post.caption}</p>
        </div>
      )}
      <div className="px-4 pb-4">
        {post.comments.length > 0 && (
          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto scrollbar-thin">
            {post.comments.map((c) => (
              <div key={c.id} className="flex gap-2 text-sm">
                <Link
                  href={`/profile/${c.user.id}`}
                  className="font-medium text-brand-400 flex-shrink-0 hover:underline"
                >
                  {c.user.name}
                </Link>
                <span className="text-slate-400 break-words">{c.text}</span>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2 min-w-0">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-surface-dark border border-surface-border text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={submitting || !commentText.trim()}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium disabled:opacity-50 flex-shrink-0 touch-manipulation"
          >
            Post
          </button>
        </form>
      </div>
    </article>
  );
}
