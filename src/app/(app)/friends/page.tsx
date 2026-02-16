"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

type Friend = { id: string; name: string; avatarUrl: string | null };
type Request = {
  id: string;
  from: { id: string; name: string; avatarUrl: string | null };
};
type SearchUser = Friend & { isFriend: boolean; pendingRequest: boolean; sentRequestId?: string | null };

export default function FriendsPage() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [activeTab, setActiveTab] = useState<"find" | "friends">("friends");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchFriends = async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        fetch("/api/friends"),
        fetch("/api/friends/requests"),
      ]);
      if (friendsRes.ok) {
        const fr = await friendsRes.json();
        setFriends(Array.isArray(fr) ? fr : []);
      }
      if (requestsRes.ok) {
        const req = await requestsRes.json();
        setRequests(Array.isArray(req) ? req : []);
      }
    } catch (e) {
      console.error("Failed to fetch friends/requests", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  useEffect(() => {
    if (activeTab === "find" || activeTab === "friends") fetchFriends();
  }, [activeTab]);

  // Real-time: poll friends and requests every 4s when tab is visible
  useEffect(() => {
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchFriends();
      }
    };
    const interval = setInterval(tick, 4000);
    const onFocus = () => fetchFriends();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    if (!search.trim() || search.length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const sendRequest = async (toId: string) => {
    setMessage(null);
    setBusy(toId);
    try {
      const res = await fetch("/api/friends/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok !== false) {
        setSearchResults((prev) =>
          prev.map((u) => (u.id === toId ? { ...u, pendingRequest: true, sentRequestId: data?.requestId ?? undefined } : u))
        );
        setMessage({ type: "success", text: "Friend request sent." });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorText = typeof data?.error === "string" ? data.error : "Could not send request. Try again.";
        setMessage({ type: "error", text: errorText });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Something went wrong. Try again." });
    } finally {
      setBusy(null);
    }
  };

  const cancelRequest = async (requestId: string, toId: string) => {
    setMessage(null);
    setBusy(requestId);
    try {
      const res = await fetch(`/api/friends/requests/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (res.ok) {
        setSearchResults((prev) =>
          prev.map((u) => (u.id === toId ? { ...u, pendingRequest: false, sentRequestId: null } : u))
        );
        setMessage({ type: "success", text: "Request cancelled." });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: (data?.error as string) || "Could not cancel." });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Something went wrong. Try again." });
    } finally {
      setBusy(null);
    }
  };

  const respondRequest = async (requestId: string, action: "accept" | "reject") => {
    const acceptedFrom = requests.find((r) => r.id === requestId)?.from;
    setBusy(requestId);
    try {
      const res = await fetch(`/api/friends/requests/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
        if (action === "accept" && acceptedFrom) {
          setFriends((prev) => [...prev, acceptedFrom]);
        }
      }
    } finally {
      setBusy(null);
    }
  };

  const unfriend = async (friendId: string) => {
    setBusy(friendId);
    try {
      const res = await fetch(`/api/friends/${friendId}`, { method: "DELETE" });
      if (res.ok) setFriends((prev) => prev.filter((f) => f.id !== friendId));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-w-0">
      <h1 className="font-display text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Friends</h1>

      <div className="grid grid-cols-2 sm:flex sm:gap-2 border-b border-surface-border mb-4 sm:mb-6 -mx-3 sm:mx-0 px-3 sm:px-0">
        <button
          type="button"
          onClick={() => setActiveTab("find")}
          className={`px-3 sm:px-4 py-3 sm:py-2.5 rounded-t-lg font-medium transition touch-manipulation text-sm sm:text-base ${
            activeTab === "find"
              ? "bg-surface-card text-white border border-surface-border border-b-0 -mb-px"
              : "text-slate-500 hover:text-white"
          }`}
        >
          Find people
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("friends")}
          className={`px-3 sm:px-4 py-3 sm:py-2.5 rounded-t-lg font-medium transition touch-manipulation text-sm sm:text-base truncate ${
            activeTab === "friends"
              ? "bg-surface-card text-white border border-surface-border border-b-0 -mb-px"
              : "text-slate-500 hover:text-white"
          }`}
        >
          Your friends{friends.length > 0 ? ` (${friends.length})` : ""}
        </button>
      </div>

      {activeTab === "find" && (
        <>
          <div className="mb-6">
            {message && (
              <div
                className={`mb-4 px-4 py-3 rounded-xl ${
                  message.type === "success"
                    ? "bg-brand-500/20 border border-brand-500/50 text-brand-200"
                    : "bg-red-500/20 border border-red-500/50 text-red-200"
                }`}
              >
                {message.text}
              </div>
            )}
            <label className="block text-sm text-slate-400 mb-2">Search by name</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type a name to search..."
              className="w-full px-4 py-3 rounded-xl bg-surface-card border border-surface-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {searchResults.length > 0 && (
              <ul className="mt-2 rounded-xl border border-surface-border overflow-hidden divide-y divide-surface-border">
                {searchResults.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between gap-3 p-3 bg-surface-card hover:bg-surface-dark/50"
                  >
                    <span className="font-medium text-white truncate flex-1 min-w-0">{u.name}</span>
                    {u.isFriend ? (
                      <span className="text-slate-500 text-sm">Friends</span>
                    ) : u.pendingRequest ? (
                      <span className="flex items-center gap-2">
                        <span className="text-brand-400 text-sm font-medium">Friend request sent</span>
                        {u.sentRequestId && (
                          <button
                            onClick={() => cancelRequest(u.sentRequestId!, u.id)}
                            disabled={busy === u.sentRequestId}
                            className="px-2 py-1 rounded border border-surface-border text-slate-400 hover:text-white text-xs"
                          >
                            Cancel
                          </button>
                        )}
                      </span>
                    ) : (
                      <button
                        onClick={() => sendRequest(u.id)}
                        disabled={busy === u.id}
                        className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium disabled:opacity-50"
                      >
                        Add friend
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {search.trim().length >= 2 && searchResults.length === 0 && !loading && (
              <p className="mt-2 text-slate-500 text-sm">No one found. Try a different name.</p>
            )}
          </div>
        </>
      )}

      {activeTab === "friends" && (
        <section>
          {requests.length > 0 && (
            <div className="mb-4 p-4 rounded-xl bg-brand-500/20 border border-brand-500/50 text-white">
              <p className="font-semibold">You have {requests.length} friend request{requests.length !== 1 ? "s" : ""}</p>
              <p className="text-sm text-slate-300 mt-0.5">Accept or decline below. They'll appear in Your friends after you accept.</p>
            </div>
          )}
          <section className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-1">Friend requests</h2>
            <p className="text-sm text-slate-500 mb-3">
              When someone sends you a request you'll get a notification. Accept here — then they appear in Your friends.
            </p>
            {requests.length === 0 ? (
              <p className="text-slate-500 py-4">No pending requests.</p>
            ) : (
              <ul className="space-y-2">
                {requests.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between p-4 bg-surface-card border border-surface-border rounded-xl"
                  >
                    <span className="font-medium text-white">{r.from.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => respondRequest(r.id, "accept")}
                        disabled={busy === r.id}
                        className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respondRequest(r.id, "reject")}
                        disabled={busy === r.id}
                        className="px-3 py-1.5 rounded-lg bg-surface-dark border border-surface-border text-slate-400 hover:text-white text-sm disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-sm text-slate-500">Only people you accepted (or who accepted you) appear here.</p>
            <button
              type="button"
              onClick={() => { setLoading(true); fetchFriends(); }}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-surface-card border border-surface-border text-slate-400 hover:text-white text-sm disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
          {loading && friends.length === 0 ? (
            <p className="text-slate-500">Loading...</p>
          ) : friends.length === 0 ? (
            <div className="text-slate-500 space-y-2">
              <p>No friends yet. Go to <button type="button" onClick={() => setActiveTab("find")} className="text-brand-400 hover:underline">Find people</button> to send requests — when someone accepts, they’ll show here.</p>
            </div>
          ) : (
            <ul className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {friends.map((f) => (
                <li
                  key={f.id}
                  className="flex flex-col items-center bg-surface-card border border-surface-border rounded-2xl p-4 hover:border-brand-500/40 transition"
                >
                  <Link
                    href={`/profile/${f.id}`}
                    className="flex flex-col items-center w-full min-w-0"
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-surface-dark border-2 border-surface-border overflow-hidden flex-shrink-0 mb-3">
                      {f.avatarUrl ? (
                        <img
                          src={f.avatarUrl}
                          alt={f.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 font-semibold text-2xl">
                          {f.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="font-medium text-white text-center truncate w-full">
                      {f.name}
                    </span>
                  </Link>
                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/chat?with=${encodeURIComponent(f.id)}`}
                      className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium"
                    >
                      Chat
                    </Link>
                    <button
                      onClick={() => unfriend(f.id)}
                      disabled={busy === f.id}
                      className="px-3 py-1.5 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/20 text-xs font-medium disabled:opacity-50"
                    >
                      Unfriend
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
