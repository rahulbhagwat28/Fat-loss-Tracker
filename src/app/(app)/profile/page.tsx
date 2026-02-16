"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAvatarUrl(user?.avatarUrl ?? "");
  }, [user?.avatarUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    form.append("type", "avatar");
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    if (res.ok) {
      setAvatarUrl(data.url);
      await saveAvatar(data.url);
    } else {
      setMessage(data.error || "Upload failed");
    }
  };

  const saveAvatar = async (url: string) => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/profile/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
      });
      if (!res.ok) throw new Error("Failed to update");
      await refreshUser();
      setMessage("Profile photo updated!");
    } catch {
      setMessage("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avatarUrl.trim()) return;
    await saveAvatar(avatarUrl.trim());
  };

  if (!user) return null;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white mb-6">Profile</h1>
      <div className="bg-surface-card border border-surface-border rounded-2xl p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full bg-surface-dark border-2 border-surface-border overflow-hidden flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-slate-500 font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-sm font-medium transition disabled:opacity-50"
            >
              Change photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-semibold text-white">{user.name}</h2>
            <p className="text-slate-500 text-sm mt-1">{user.email}</p>
            {message && (
              <p className={`mt-2 text-sm ${message.startsWith("Profile") ? "text-green-400" : "text-red-400"}`}>
                {message}
              </p>
            )}
            <form onSubmit={handleSaveUrl} className="mt-4 flex flex-wrap gap-2">
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Or paste image URL"
                className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-surface-dark border border-surface-border text-white text-sm"
              />
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium disabled:opacity-50"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
