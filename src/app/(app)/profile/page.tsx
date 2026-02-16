"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getMaintenanceCalories } from "@/lib/maintenance";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [age, setAge] = useState(user?.age != null ? String(user.age) : "");
  const [sex, setSex] = useState(user?.sex ?? "");
  const [heightFeet, setHeightFeet] = useState(
    user?.heightInches != null ? String(Math.floor(user.heightInches / 12)) : ""
  );
  const [heightInches, setHeightInches] = useState(
    user?.heightInches != null ? String(Math.round(user.heightInches % 12)) : ""
  );
  const [weightLbs, setWeightLbs] = useState(
    user?.weightLbs != null ? String(user.weightLbs) : ""
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showStatsForm, setShowStatsForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasStats =
    user?.age != null &&
    user?.sex != null &&
    user?.heightInches != null &&
    user?.weightLbs != null;
  const maintenance =
    getMaintenanceCalories(
      user?.age ?? null,
      user?.sex ?? null,
      user?.heightInches ?? null,
      user?.weightLbs ?? null
    );

  useEffect(() => {
    setAvatarUrl(user?.avatarUrl ?? "");
  }, [user?.avatarUrl]);

  useEffect(() => {
    setAge(user?.age != null ? String(user.age) : "");
    setSex(user?.sex ?? "");
    if (user?.heightInches != null) {
      setHeightFeet(String(Math.floor(user.heightInches / 12)));
      setHeightInches(String(Math.round(user.heightInches % 12)));
    } else {
      setHeightFeet("");
      setHeightInches("");
    }
    setWeightLbs(user?.weightLbs != null ? String(user.weightLbs) : "");
  }, [user?.age, user?.sex, user?.heightInches, user?.weightLbs]);

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

  const saveProfileStats = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: age === "" ? null : Number(age),
          sex: sex === "" ? null : sex,
          heightInches:
            heightFeet !== "" && heightInches !== ""
              ? Number(heightFeet) * 12 + Number(heightInches)
              : null,
          weightLbs: weightLbs === "" ? null : Number(weightLbs),
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      await refreshUser();
      setMessage("Profile updated!");
      setShowStatsForm(false);
    } catch {
      setMessage("Failed to save");
    } finally {
      setSaving(false);
    }
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

      <div className="mt-6 space-y-4">
        {hasStats && !showStatsForm ? (
          <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="font-display text-lg font-semibold text-white">
                Your stats
              </h2>
              <button
                type="button"
                onClick={() => setShowStatsForm(true)}
                className="px-4 py-2 rounded-xl bg-surface-dark border border-surface-border text-slate-300 hover:text-white hover:border-brand-500/50 text-sm font-medium transition"
              >
                Edit
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between sm:block gap-2">
                <span className="text-slate-500">Age</span>
                <span className="text-white font-medium">{user.age} years</span>
              </div>
              <div className="flex justify-between sm:block gap-2">
                <span className="text-slate-500">Sex</span>
                <span className="text-white font-medium capitalize">{user.sex}</span>
              </div>
              <div className="flex justify-between sm:block gap-2">
                <span className="text-slate-500">Height</span>
                <span className="text-white font-medium">
                  {user.heightInches != null && (
                    <>
                      {Math.floor(user.heightInches / 12)} ft {Math.round(user.heightInches % 12)} in
                    </>
                  )}
                </span>
              </div>
              <div className="flex justify-between sm:block gap-2">
                <span className="text-slate-500">Weight</span>
                <span className="text-white font-medium">{user.weightLbs} lbs</span>
              </div>
            </div>
            {maintenance != null && (
              <div className="mt-4 pt-4 border-t border-surface-border">
                <span className="text-slate-500 text-sm">Maintenance calories</span>
                <p className="text-xl font-semibold text-brand-400 mt-0.5">{maintenance} cal / day</p>
                <p className="text-slate-500 text-xs mt-1">Based on Mifflin-St Jeor (sedentary)</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold text-white mb-4">
              {hasStats ? "Edit stats" : "Stats (for maintenance calories)"}
            </h2>
            {hasStats && (
              <button
                type="button"
                onClick={() => setShowStatsForm(false)}
                className="text-slate-400 hover:text-white text-sm mb-4"
              >
                ← Back to summary
              </button>
            )}
        <form onSubmit={saveProfileStats} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Age (years)</label>
            <input
              type="number"
              min="1"
              max="120"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 30"
              className="w-full px-4 py-2 rounded-xl bg-surface-dark border border-surface-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Sex</label>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-surface-dark border border-surface-border text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">—</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Height (ft and in)
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="0"
                max="8"
                value={heightFeet}
                onChange={(e) => setHeightFeet(e.target.value)}
                placeholder="ft"
                className="w-20 px-4 py-2 rounded-xl bg-surface-dark border border-surface-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-slate-500">ft</span>
              <input
                type="number"
                min="0"
                max="11"
                value={heightInches}
                onChange={(e) => setHeightInches(e.target.value)}
                placeholder="in"
                className="w-20 px-4 py-2 rounded-xl bg-surface-dark border border-surface-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-slate-500">in</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Weight (lbs)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={weightLbs}
              onChange={(e) => setWeightLbs(e.target.value)}
              placeholder="e.g. 160"
              className="w-full px-4 py-2 rounded-xl bg-surface-dark border border-surface-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          {message && (
            <p
              className={`text-sm ${
                message === "Profile updated!" || message.startsWith("Profile photo")
                  ? "text-green-400"
                  : message === "Failed to save" || message === "Failed to update"
                    ? "text-red-400"
                    : "text-slate-400"
              }`}
            >
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save stats"}
          </button>
        </form>
          </div>
        )}
      </div>
    </div>
  );
}
