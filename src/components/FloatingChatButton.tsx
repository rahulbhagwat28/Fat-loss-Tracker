"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import SmallChatWindow from "./SmallChatWindow";

const POLL_UNREAD_MS = 10_000;

type OpenChatWindowDetail = {
  fromUserId: string;
  actorName?: string;
  actorAvatarUrl?: string | null;
};

export default function FloatingChatButton() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [smallWindowOpen, setSmallWindowOpen] = useState(false);
  const [smallWindowUserId, setSmallWindowUserId] = useState<string | null>(null);
  const [smallWindowName, setSmallWindowName] = useState<string>("");
  const [smallWindowAvatar, setSmallWindowAvatar] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnread = () => {
      fetch("/api/messages/unread-count", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => data && typeof data.count === "number" && setUnreadCount(data.count))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, POLL_UNREAD_MS);
    const onFocus = () => fetchUnread();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    const openSmallWindow = (e: Event) => {
      const ev = e as CustomEvent<OpenChatWindowDetail>;
      const d = ev.detail;
      if (d?.fromUserId) {
        setSmallWindowUserId(d.fromUserId);
        setSmallWindowName(d.actorName ?? "User");
        setSmallWindowAvatar(d.actorAvatarUrl ?? null);
        setSmallWindowOpen(true);
      }
    };
    window.addEventListener("open-chat-window", openSmallWindow);
    return () => window.removeEventListener("open-chat-window", openSmallWindow);
  }, []);

  if (!user) return null;
  if (pathname.startsWith("/chat")) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSmallWindowUserId(null);
          setSmallWindowOpen(true);
        }}
        className="fixed z-[60] flex items-center justify-center w-14 h-14 rounded-full bg-brand-500 text-white shadow-lg hover:bg-brand-400 active:scale-95 transition-all right-4 md:right-6 bottom-[calc(56px+env(safe-area-inset-bottom,0px))] md:bottom-6"
        aria-label={unreadCount > 0 ? `Chat, ${unreadCount} unread` : "Chat"}
      >
        <span className="relative inline-block text-2xl leading-none select-none">💬</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold px-1 ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      <SmallChatWindow
        open={smallWindowOpen}
        onClose={() => {
          setSmallWindowOpen(false);
          setSmallWindowUserId(null);
          setSmallWindowName("");
          setSmallWindowAvatar(null);
        }}
        withUserId={smallWindowUserId}
        otherName={smallWindowName}
        otherAvatarUrl={smallWindowAvatar}
      />
    </>
  );
}
