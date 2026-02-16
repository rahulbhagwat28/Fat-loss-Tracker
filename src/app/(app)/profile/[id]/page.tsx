"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

type UserProfile = { id: string; name: string; avatarUrl: string | null; createdAt: string };

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user: me } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (id === me?.id) {
      router.replace("/profile");
      return;
    }
    fetch(`/api/users/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setProfile(null);
        else setProfile(data);
      })
      .catch(() => setProfile(null));
  }, [id, me?.id, router]);

  useEffect(() => {
    if (!me || !id || id === me.id) return;
    Promise.all([
      fetch("/api/friends").then((r) => r.json()),
      fetch("/api/friends/requests").then((r) => r.json()),
    ]).then(([friends, requests]) => {
      const friendIds = (Array.isArray(friends) ? friends : []).map((f: { id: string }) => f.id);
      const pendingTo = (Array.isArray(requests) ? requests : []).map(
        (r: { from: { id: string } }) => r.from.id
      );
      setIsFriend(friendIds.includes(id));
      setPendingRequest(pendingTo.includes(id));
    });
  }, [me, id]);

  const sendFriendRequest = async () => {
    setBusy(true);
    try {
      await fetch("/api/friends/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toId: id }),
      });
      setPendingRequest(true);
    } finally {
      setBusy(false);
    }
  };

  const goToChat = () => {
    router.push(`/chat?with=${encodeURIComponent(id)}`);
  };

  const unfriend = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/friends/${id}`, { method: "DELETE" });
      if (res.ok) {
        setIsFriend(false);
      }
    } finally {
      setBusy(false);
    }
  };

  if (!profile) {
    return (
      <div className="text-center py-12 text-slate-500">
        User not found or you don’t have access.
      </div>
    );
  }

  return (
    <div>
      <div className="bg-surface-card border border-surface-border rounded-2xl p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-surface-dark border-2 border-surface-border overflow-hidden flex-shrink-0">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl text-slate-500 font-semibold">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
            {me?.id !== id && (
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-4">
                {isFriend ? (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-brand-400 font-medium">Friends</span>
                    <button
                      onClick={goToChat}
                      className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium"
                    >
                      Message
                    </button>
                    <button
                      onClick={unfriend}
                      disabled={busy}
                      className="px-4 py-2 rounded-xl border border-red-500/50 text-red-400 hover:bg-red-500/20 font-medium disabled:opacity-50"
                    >
                      Unfriend
                    </button>
                  </div>
                ) : pendingRequest ? (
                  <span className="px-4 py-2 rounded-xl bg-surface-dark text-slate-400 text-sm">
                    Friend request sent
                  </span>
                ) : (
                  <button
                    onClick={sendFriendRequest}
                    disabled={busy}
                    className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium disabled:opacity-50"
                  >
                    Add friend
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
