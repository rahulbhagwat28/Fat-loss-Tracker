"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PostCard from "@/components/PostCard";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

type Post = {
  id: string;
  title: string | null;
  imageUrl: string | null;
  caption: string | null;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null };
  comments: Array<{
    id: string;
    text: string;
    createdAt: string;
    user: { id: string; name: string; avatarUrl: string | null };
  }>;
  likes?: { userId: string }[];
};

export default function FeedPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const postIdFromUrl = searchParams.get("postId");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [createError, setCreateError] = useState("");

  const fetchPosts = async () => {
    const res = await fetch("/api/posts");
    if (res.ok) {
      const data = await res.json();
      setPosts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (!postIdFromUrl || posts.length === 0) return;
    const el = document.getElementById(`post-${postIdFromUrl}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [postIdFromUrl, posts]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() && !newImageUrl.trim() && !newCaption.trim()) return;
    setCreateError("");
    setUploading(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim() || null,
          imageUrl: newImageUrl.trim() || null,
          caption: newCaption.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post");
      setPosts((prev) => [{ ...data, likes: [] }, ...prev]);
      setShowCreate(false);
      setNewTitle("");
      setNewImageUrl("");
      setNewCaption("");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed");
    } finally {
      setUploading(false);
    }
  };

  const handleComment = async (postId: string, text: string) => {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to comment");
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comments: [...p.comments, data] }
          : p
      )
    );
  };

  const handleDeletePost = async (postId: string) => {
    const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to delete");
    }
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleLike = async (postId: string, currentlyLiked: boolean) => {
    const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to like");
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const likes = p.likes ?? [];
        if (currentlyLiked) {
          return { ...p, likes: likes.filter((l) => l.userId !== user?.id) };
        }
        return { ...p, likes: [...likes, { userId: user!.id }] };
      })
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    form.append("type", "post");
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    if (res.ok) setNewImageUrl(data.url);
    else setCreateError(data.error || "Upload failed");
  };

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Feed</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium touch-manipulation min-h-[44px]"
        >
          {showCreate ? "Cancel" : "New post"}
        </button>
      </div>

      {showCreate && (
        <div className="bg-surface-card border border-surface-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-white mb-4">Create post</h2>
          {createError && (
            <p className="text-red-400 text-sm mb-2">{createError}</p>
          )}
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Title (optional)</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Post title"
                className="w-full px-3 py-2 rounded-lg bg-surface-dark border border-surface-border text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Content (optional)</label>
              <textarea
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                placeholder="What's on your mind?"
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-surface-dark border border-surface-border text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Photo (optional)</label>
              <div className="flex gap-2 items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="text-sm text-slate-400 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-500 file:text-white file:font-medium"
                />
                {newImageUrl && (
                  <img
                    src={newImageUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
              </div>
              <input
                type="text"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Or paste image URL"
                className="mt-2 w-full px-3 py-2 rounded-lg bg-surface-dark border border-surface-border text-white text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={uploading || (!newTitle.trim() && !newImageUrl.trim() && !newCaption.trim())}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium disabled:opacity-50"
            >
              {uploading ? "Posting..." : "Post"}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-slate-500 text-center py-12">Loading feed...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="mb-4">No posts yet. Be the first to share!</p>
          <button
            onClick={() => setShowCreate(true)}
            className="text-brand-400 hover:underline"
          >
            Create a post
          </button>
        </div>
      ) : (
        posts.map((post) => (
          <div key={post.id} id={`post-${post.id}`}>
            <PostCard
              post={post}
              currentUserId={user?.id}
              onComment={handleComment}
              onDelete={handleDeletePost}
              onLike={handleLike}
            />
          </div>
        ))
      )}
    </div>
  );
}
