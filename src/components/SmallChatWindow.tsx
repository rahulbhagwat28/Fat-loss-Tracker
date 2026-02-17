"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

type Message = {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  read?: boolean;
  sender: { id: string; name: string; avatarUrl: string | null };
};

type Conv = {
  userId: string;
  user: { id: string; name: string; avatarUrl: string | null };
  lastAt: string;
  lastText: string;
};

type SmallChatWindowProps = {
  open: boolean;
  onClose: () => void;
  withUserId: string | null;
  otherName?: string;
  otherAvatarUrl?: string | null;
};

const WINDOW_W = 320;
const WINDOW_H = 380;

export default function SmallChatWindow({
  open,
  onClose,
  withUserId,
  otherName = "User",
  otherAvatarUrl = null,
}: SmallChatWindowProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(withUserId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [name, setName] = useState(otherName);
  const [avatarUrl, setAvatarUrl] = useState(otherAvatarUrl);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const effectiveUserId = selectedUserId ?? withUserId;

  useEffect(() => {
    if (withUserId) {
      setSelectedUserId(withUserId);
      setName(otherName);
      setAvatarUrl(otherAvatarUrl);
    } else {
      setSelectedUserId(null);
    }
  }, [withUserId, otherName, otherAvatarUrl]);

  useEffect(() => {
    if (!open) return;
    if (!effectiveUserId) {
      setLoadingConvs(true);
      fetch("/api/messages/conversations", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          setConversations(Array.isArray(data) ? data : []);
        })
        .finally(() => setLoadingConvs(false));
      return;
    }
    setLoadingMessages(true);
    fetch(`/api/messages?with=${effectiveUserId}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setMessages(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoadingMessages(false));
    const conv = conversations.find((c) => c.userId === effectiveUserId);
    if (conv) {
      setName(conv.user.name);
      setAvatarUrl(conv.user.avatarUrl);
    } else if (!otherName || otherName === "User") {
      fetch(`/api/users/${effectiveUserId}`, { credentials: "include" })
        .then((r) => r.ok ? r.json() : null)
        .then((u) => {
          if (u?.name) setName(u.name);
          if (u?.avatarUrl != null) setAvatarUrl(u.avatarUrl);
        });
    }
  }, [open, effectiveUserId]);

  useEffect(() => {
    if (effectiveUserId && !conversations.find((c) => c.userId === effectiveUserId)) {
      if (!otherName || otherName === "User") {
        fetch(`/api/users/${effectiveUserId}`, { credentials: "include" })
          .then((r) => r.ok ? r.json() : null)
          .then((u) => {
            if (u?.name) setName(u.name);
            if (u?.avatarUrl != null) setAvatarUrl(u.avatarUrl);
          });
      }
    }
  }, [effectiveUserId, conversations, otherName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveUserId || !input.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input.trim(), receiverId: effectiveUserId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, data]);
        setInput("");
      }
    } finally {
      setSending(false);
    }
  };

  const displayName = selectedUserId ? name : "Chat";
  const showList = !effectiveUserId;

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="fixed z-50 flex flex-col rounded-xl border border-surface-border bg-surface-card shadow-2xl overflow-hidden right-4 md:right-6 bottom-[calc(5rem+3.5rem+env(safe-area-inset-bottom,0px))] md:bottom-[5.5rem]"
        style={{ width: WINDOW_W, height: WINDOW_H }}
        role="dialog"
        aria-label="Chat"
      >
        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-surface-border bg-surface-dark/80">
          {showList ? (
            <span className="font-medium text-white truncate flex-1 min-w-0">{displayName}</span>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-dark"
                aria-label="Back to conversations"
              >
                ←
              </button>
              <div className="w-8 h-8 rounded-full bg-surface-dark overflow-hidden flex-shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm font-semibold">
                    {name.charAt(0)}
                  </div>
                )}
              </div>
              <span className="font-medium text-white truncate flex-1 min-w-0">{name}</span>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-dark"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {showList ? (
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-2 border-b border-surface-border">
              <Link
                href="/friends"
                className="block text-center py-2 text-brand-400 hover:underline text-xs"
                onClick={onClose}
              >
                Add friends to chat
              </Link>
            </div>
            {loadingConvs ? (
              <div className="text-slate-500 text-sm p-3">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="text-slate-500 text-sm p-3">No conversations yet.</div>
            ) : (
              <ul className="py-1">
                {conversations.map((c) => (
                  <li key={c.userId}>
                    <button
                      type="button"
                      onClick={() => setSelectedUserId(c.userId)}
                      className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-surface-dark/50 active:bg-surface-dark/70"
                    >
                      <div className="w-9 h-9 rounded-full bg-surface-dark overflow-hidden flex-shrink-0">
                        {c.user.avatarUrl ? (
                          <img src={c.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-semibold">
                            {c.user.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white text-sm truncate">{c.user.name}</p>
                        <p className="text-slate-500 text-xs truncate">{c.lastText}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin min-h-0">
              {loadingMessages ? (
                <div className="text-slate-500 text-sm p-2">Loading...</div>
              ) : (
                messages.map((m) => {
                  const isSelf = m.senderId === user?.id;
                  const isNew = !isSelf && m.receiverId === user?.id && m.read === false;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-1.5 ${
                          isSelf
                            ? "bg-brand-500 text-white rounded-br-md"
                            : "bg-surface-dark text-slate-200 rounded-bl-md"
                        } ${isNew ? "ring-1 ring-brand-500/60 bg-brand-500/15" : ""}`}
                      >
                        {isNew && (
                          <span className="block text-[9px] font-bold text-brand-400 tracking-wide uppercase mb-0.5">New</span>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{m.text}</p>
                        <p className="text-[10px] opacity-70 mt-0.5">
                          {new Date(m.createdAt).toLocaleTimeString(undefined, { timeStyle: "short" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            <form
              onSubmit={sendMessage}
              className="flex-shrink-0 p-2 border-t border-surface-border flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-surface-dark border border-surface-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="px-3 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium disabled:opacity-50 flex-shrink-0"
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}
