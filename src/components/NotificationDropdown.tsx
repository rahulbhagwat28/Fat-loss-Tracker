"use client";

import { useEffect, useState, useRef } from "react";
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

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount ?? 0);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    const onFocus = () => fetchNotifications();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchNotifications().finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-card transition"
        aria-label="Notifications"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 sm:right-0 left-0 sm:left-auto top-full mt-1 w-[calc(100vw-1.5rem)] sm:w-80 max-w-sm max-h-[70vh] flex flex-col bg-surface-card border border-surface-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b border-surface-border flex items-center justify-between">
            <span className="font-semibold text-white">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-brand-400 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="overflow-y-auto scrollbar-thin flex-1">
            {loading ? (
              <div className="p-4 text-slate-500 text-sm text-center">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-slate-500 text-sm text-center">No notifications yet</div>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={href(n)}
                      onClick={() => {
                        if (!n.read) markRead(n.id);
                        setOpen(false);
                      }}
                      className={`flex gap-3 p-3 min-h-[44px] hover:bg-surface-dark/50 active:bg-surface-dark/70 transition block border-b border-surface-border/50 touch-manipulation ${
                        !n.read ? "bg-brand-500/10" : ""
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-surface-dark overflow-hidden flex-shrink-0">
                        {n.actor?.avatarUrl ? (
                          <img
                            src={n.actor.avatarUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm font-semibold">
                            {n.actor?.name?.charAt(0) || "?"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-200">{label(n)}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(n.createdAt).toLocaleString(undefined, {
                            dateStyle: "short",
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
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="p-3 border-t border-surface-border text-center text-sm text-brand-400 hover:bg-surface-dark/50"
          >
            See all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
