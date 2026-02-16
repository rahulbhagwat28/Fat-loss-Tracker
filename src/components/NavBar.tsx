"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import NotificationDropdown from "./NotificationDropdown";

export default function NavBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

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
                className={`px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  pathname === href || (href === "/chat" && pathname.startsWith("/chat"))
                    ? "bg-brand-500/20 text-brand-400"
                    : "text-slate-400 hover:text-white hover:bg-surface-card"
                }`}
              >
                <span className="mr-1">{icon}</span>
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
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/15 transition"
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
        <div className="max-w-lg mx-auto px-2 flex items-center justify-around h-14">
          {mainNav.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-2 rounded-lg transition ${
                isActive(href)
                  ? "text-brand-400 bg-brand-500/15"
                  : "text-slate-400 hover:text-white active:bg-surface-card"
              }`}
              aria-label={label}
            >
              <span className="text-lg leading-none">{icon}</span>
              <span className="text-[10px] font-medium truncate w-full text-center">{label}</span>
            </Link>
          ))}
          <div className="relative flex-1 min-w-0" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              className={`w-full flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg transition ${
                moreNav.some(({ href }) => pathname === href)
                  ? "text-brand-400 bg-brand-500/15"
                  : "text-slate-400 hover:text-white active:bg-surface-card"
              }`}
              aria-label="More"
              aria-expanded={moreOpen}
            >
              <span className="text-lg leading-none">⋯</span>
              <span className="text-[10px] font-medium">More</span>
            </button>
            {moreOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 py-2 rounded-xl border border-surface-border bg-surface-card shadow-xl overflow-hidden">
                {moreNav.map(({ href, label, icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition ${
                      pathname === href ? "bg-brand-500/20 text-brand-400" : "text-slate-200 hover:bg-surface-dark/50"
                    }`}
                  >
                    <span>{icon}</span>
                    {label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    logout().then(() => window.location.assign("/login"));
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/15 transition text-left"
                >
                  <span>🚪</span>
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
