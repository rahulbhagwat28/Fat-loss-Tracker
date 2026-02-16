"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Notification = {
  id: string;
  type: string;
  refId: string | null;
  postId: string | null;
  read: boolean;
  createdAt: string;
  actor: { id: string; name: string; avatarUrl: string | null } | null;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount ?? 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const label = (n: Notification) => {
    const name = n.actor?.name ?? "Someone";
    switch (n.type) {
      case "friend_request":
        return `${name} sent you a friend request`;
      case "friend_accepted":
        return `${name} accepted your friend request`;
      case "comment":
        return `${name} commented on your photo`;
      case "message":
        return `${name} sent you a message`;
      case "like":
        return `${name} liked your photo`;
      default:
        return name ? `${name} — new activity` : "New activity";
    }
  };

  const href = (n: Notification) => {
    switch (n.type) {
      case "friend_request":
      case "friend_accepted":
        return "/friends";
      case "comment":
      case "like":
        return "/feed";
      case "message":
        return n.actor?.id ? `/chat?with=${encodeURIComponent(n.actor.id)}` : "/chat";
      default:
        return "/feed";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-white">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-brand-400 hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>
      {loading ? (
        <div className="text-slate-500 text-center py-8">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="text-slate-500 text-center py-12">No notifications yet</div>
      ) : (
        <ul className="space-y-1">
          {notifications.map((n) => (
            <li key={n.id}>
              <Link
                href={href(n)}
                onClick={() => !n.read && markRead(n.id)}
                className={`flex gap-3 p-4 rounded-xl border transition block ${
                  n.read
                    ? "bg-surface-card border-surface-border hover:border-surface-border"
                    : "bg-brand-500/10 border-brand-500/30"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-surface-dark overflow-hidden flex-shrink-0">
                  {n.actor?.avatarUrl ? (
                    <img
                      src={n.actor.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 font-semibold">
                      {n.actor?.name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-slate-200">{label(n)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(n.createdAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
