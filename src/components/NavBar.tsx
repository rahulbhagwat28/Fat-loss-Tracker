"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import NotificationDropdown from "./NotificationDropdown";

const CHAT_HREF = "/chat";
const POLL_UNREAD_MS = 10_000;

export default function NavBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const moreRef = useRef<HTMLDivElement>(null);

  const fetchUnread = () => {
    fetch("/api/messages/unread-count", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && typeof data.count === "number" && setUnreadMessages(data.count))
      .catch(() => {});
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, POLL_UNREAD_MS);
    const onFocus = () => fetchUnread();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // Refetch unread when viewing chat so badge updates after reading
  useEffect(() => {
    if (pathname.startsWith(CHAT_HREF)) fetchUnread();
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const chatBadge = unreadMessages > 0 ? (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 z-50 shadow ring-2 ring-surface-dark">
      {unreadMessages > 99 ? "99+" : unreadMessages}
    </span>
  ) : null;

  const navItems = [
    { href: "/feed", label: "Feed", icon: "📷" },
    { href: "/health", label: "Add Log", icon: "📝" },
    { href: "/history", label: "History", icon: "📋" },
    { href: "/weight-graph", label: "Weight Graph", icon: "📈" },
    { href: "/progress-pics", label: "Progress Pics", icon: "🖼️" },
    { href: "/friends", label: "Friends", icon: "👥" },
    { href: "/chat", label: "Messages", icon: "💬" },
    { href: "/notifications", label: "Notifications", icon: "🔔" },
  ];

  const mainNav = [
    { href: "/feed", label: "Feed", icon: "📷" },
    { href: "/health", label: "Add Log", icon: "📝" },
    { href: "/friends", label: "Friends", icon: "👥" },
    { href: "/chat", label: "Chat", icon: "💬" },
  ];

  const moreNav = [
    { href: "/history", label: "History", icon: "📋" },
    { href: "/weight-graph", label: "Weight Graph", icon: "📈" },
    { href: "/progress-pics", label: "Progress Pics", icon: "🖼️" },
    { href: "/notifications", label: "Notifications", icon: "🔔" },
    { href: "/profile", label: "Profile", icon: "👤" },
  ];

  const isActive = (href: string) => pathname === href || (href === "/chat" && pathname.startsWith("/chat"));

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-surface-border bg-surface-dark/95 backdrop-blur pt-safe-top">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 flex items-center justify-between h-12 sm:h-14">
          <Link
            href="/feed"
            className="font-display font-bold text-lg sm:text-xl text-white hover:text-brand-400 transition whitespace-nowrap min-w-0 truncate max-w-[140px] sm:max-w-none"
            title="Fat Loss Tracker"
          >
            <span className="sm:hidden">FLT</span>
            <span className="hidden sm:inline">Fat Loss Tracker</span>
          </Link>

          {/* Desktop: full nav */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                className={`relative px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  pathname === href || (href === CHAT_HREF && pathname.startsWith(CHAT_HREF))
                    ? "bg-brand-500/20 text-brand-400"
                    : "text-slate-400 hover:text-white hover:bg-surface-card"
                }`}
              >
                <span className="relative inline-block mr-1 overflow-visible">
                  {icon}
                  {href === CHAT_HREF && chatBadge}
                </span>
                {label}
              </Link>
            ))}
          </div>

          {/* Mobile: notifications + profile. Desktop: notifications + profile + logout */}
          <div className="flex items-center gap-1 sm:gap-2">
            <NotificationDropdown />
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-full hover:opacity-90 min-w-0 p-0.5"
              aria-label="Profile"
            >
              <div className="w-8 h-8 rounded-full bg-surface-card border border-surface-border overflow-hidden flex-shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-sm text-slate-300 hidden lg:inline max-w-[100px] truncate">
                {user.name}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => logout().then(() => window.location.assign("/login"))}
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/15 transition whitespace-nowrap"
              aria-label="Log out"
            >
              <span className="text-base">🚪</span>
              Log out
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-surface-border bg-surface-dark/95 backdrop-blur pb-safe-bottom">
        <div className="max-w-lg mx-auto px-1 flex items-stretch justify-around min-h-[56px] [padding-bottom:env(safe-area-inset-bottom)]">
          {mainNav.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-2 rounded-lg transition min-h-[44px] overflow-visible ${
                isActive(href)
                  ? "text-brand-400 bg-brand-500/15"
                  : "text-slate-400 hover:text-white active:bg-surface-card"
              }`}
              aria-label={label}
              aria-hidden={false}
            >
              <span className="relative inline-block text-xl leading-none select-none overflow-visible" aria-hidden>
                {icon}
                {href === CHAT_HREF && chatBadge}
              </span>
              <span className="text-[10px] font-medium truncate w-full text-center">{label}</span>
            </Link>
          ))}
          <div className="relative flex-1 min-w-0 flex flex-col" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg transition min-h-[44px] ${
                moreNav.some(({ href }) => pathname === href)
                  ? "text-brand-400 bg-brand-500/15"
                  : "text-slate-400 hover:text-white active:bg-surface-card"
              }`}
              aria-label="More"
              aria-expanded={moreOpen}
            >
              <span className="text-xl leading-none select-none" aria-hidden>⋯</span>
              <span className="text-[10px] font-medium">More</span>
            </button>
            {moreOpen && (
              <div className="absolute bottom-full right-0 left-auto mb-1 py-2 rounded-xl border border-surface-border bg-surface-card shadow-xl overflow-y-auto max-h-[70vh] min-w-[220px] w-max max-w-[min(100vw-2rem,320px)]">
                {moreNav.map(({ href, label, icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm font-medium transition touch-manipulation whitespace-nowrap ${
                      pathname === href ? "bg-brand-500/20 text-brand-400" : "text-slate-200 hover:bg-surface-dark/50"
                    }`}
                  >
                    <span aria-hidden>{icon}</span>
                    {label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    logout().then(() => window.location.assign("/login"));
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/15 transition text-left touch-manipulation whitespace-nowrap"
                >
                  <span aria-hidden>🚪</span>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
