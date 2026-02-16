"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Conv = {
  userId: string;
  user: { id: string; name: string; avatarUrl: string | null };
  lastAt: string;
  lastText: string;
};

type Message = {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  sender: { id: string; name: string; avatarUrl: string | null };
  receiver?: { id: string; name: string; avatarUrl: string | null };
};

export default function ChatPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const withUserId = searchParams.get("with");
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(withUserId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sharingLog, setSharingLog] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedUserInfo, setSelectedUserInfo] = useState<{ id: string; name: string; avatarUrl: string | null } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const today = () => new Date().toISOString().slice(0, 10);

  const formatLogForShare = (log: {
    logDate: string;
    weight?: number | null;
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fat?: number | null;
    sleepHours?: number | null;
    energyLevel?: number | null;
    steps?: number | null;
  }) => {
    const dateStr = new Date(log.logDate + "T12:00:00").toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const lines: string[] = [`📋 My log for ${dateStr}`, ""];
    if (log.weight != null) lines.push(`Weight: ${log.weight} lbs`);
    if (log.calories != null) lines.push(`Calories: ${log.calories}`);
    if (log.protein != null || log.carbs != null || log.fat != null) {
      lines.push(`Macros: P ${log.protein ?? "–"} / C ${log.carbs ?? "–"} / F ${log.fat ?? "–"} g`);
    }
    if (log.sleepHours != null) lines.push(`Sleep: ${log.sleepHours}h`);
    if (log.energyLevel != null) lines.push(`Energy: ${log.energyLevel}/10`);
    if (log.steps != null) lines.push(`Steps: ${log.steps.toLocaleString()}`);
    return lines.join("\n").trim() || "No data for this day.";
  };

  const shareTodaysLog = async () => {
    if (!selectedUserId) return;
    setSharingLog(true);
    try {
      const res = await fetch("/api/health?limit=30");
      const logs = await res.json();
      const todayLog = Array.isArray(logs)
        ? logs.find((l: { logDate: string }) => l.logDate === today())
        : null;
      const text = todayLog
        ? formatLogForShare(todayLog)
        : `📋 I don't have a log for today (${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} yet.`;
      const msgRes = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, receiverId: selectedUserId }),
      });
      const data = await msgRes.json();
      if (msgRes.ok) {
        setMessages((prev) => [...prev, data]);
        setConversations((prev) => {
          const other = prev.find((c) => c.userId === selectedUserId);
          const rest = prev.filter((c) => c.userId !== selectedUserId);
          const updated = other
            ? { ...other, lastAt: data.createdAt, lastText: "📋 Shared today's log" }
            : {
                userId: selectedUserId,
                user: data.receiver || selectedUserInfo || { id: selectedUserId, name: "User", avatarUrl: null },
                lastAt: data.createdAt,
                lastText: "📋 Shared today's log",
              };
          return [updated, ...rest];
        });
      }
    } finally {
      setSharingLog(false);
    }
  };

  const fetchConversations = async () => {
    const res = await fetch("/api/messages/conversations");
    if (res.ok) {
      const data = await res.json();
      setConversations(data);
    }
    setLoadingConvs(false);
  };

  const fetchMessages = async (withUserId: string) => {
    setLoadingMessages(true);
    const res = await fetch(`/api/messages?with=${withUserId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
    setLoadingMessages(false);
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (withUserId) setSelectedUserId(withUserId);
  }, [withUserId]);

  useEffect(() => {
    if (selectedUserId) {
      const inList = conversations.find((c) => c.userId === selectedUserId);
      if (inList) setSelectedUserInfo(inList.user);
      else fetch(`/api/users/${selectedUserId}`).then((r) => r.json()).then((u) => u.id && setSelectedUserInfo({ id: u.id, name: u.name, avatarUrl: u.avatarUrl }));
    } else setSelectedUserInfo(null);
  }, [selectedUserId, conversations]);

  useEffect(() => {
    if (selectedUserId) {
      fetchMessages(selectedUserId);
      pollRef.current = setInterval(() => {
        fetch(`/api/messages?with=${selectedUserId}`)
          .then((r) => r.json())
          .then((data) => setMessages(data))
          .catch(() => {});
      }, 3000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !input.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input.trim(), receiverId: selectedUserId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, data]);
        setInput("");
        setConversations((prev) => {
          const other = prev.find((c) => c.userId === selectedUserId);
          const rest = prev.filter((c) => c.userId !== selectedUserId);
          const updated = other
            ? { ...other, lastAt: data.createdAt, lastText: data.text }
            : {
                userId: selectedUserId,
                user: data.receiver || selectedConv?.user || { id: selectedUserId, name: "User", avatarUrl: null },
                lastAt: data.createdAt,
                lastText: data.text,
              };
          return [updated, ...rest];
        });
      }
    } finally {
      setSending(false);
    }
  };

  const selectedConv = selectedUserId
    ? conversations.find((c) => c.userId === selectedUserId)
    : null;
  const displayUser = selectedConv?.user || selectedUserInfo;

  const showListOnMobile = !selectedUserId;
  const listPanel = (
    <div className="w-full sm:w-80 border-r border-surface-border flex flex-col flex-shrink-0">
      <div className="p-2 border-b border-surface-border flex-shrink-0">
        <Link
          href="/friends"
          className="block text-center py-2 text-brand-400 hover:underline text-sm touch-manipulation"
        >
          New conversation (add friends first)
        </Link>
      </div>
      {loadingConvs ? (
        <div className="p-4 text-slate-500 text-sm">Loading...</div>
      ) : conversations.length === 0 ? (
        <div className="p-4 text-slate-500 text-sm">
          No conversations yet. Add friends and start chatting from their profile or here once they message you.
        </div>
      ) : (
        <ul className="overflow-y-auto scrollbar-thin flex-1">
          {conversations.map((c) => (
            <li key={c.userId}>
              <button
                type="button"
                onClick={() => setSelectedUserId(c.userId)}
                className={`w-full flex items-center gap-3 p-3 text-left hover:bg-surface-dark/50 active:bg-surface-dark/70 transition touch-manipulation ${
                  selectedUserId === c.userId ? "bg-brand-500/20 border-l-2 border-brand-500" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-surface-dark overflow-hidden flex-shrink-0">
                  {c.user.avatarUrl ? (
                    <img src={c.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 font-semibold">
                      {c.user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white truncate">{c.user.name}</p>
                  <p className="text-slate-500 text-xs truncate">{c.lastText}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const threadPanel = selectedUserId && (
    <div className="flex-1 flex flex-col min-w-0 min-h-0">
      <div className="p-3 border-b border-surface-border flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => setSelectedUserId(null)}
          className="sm:hidden p-1.5 -ml-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-dark"
          aria-label="Back to conversations"
        >
          ←
        </button>
        <div className="w-8 h-8 rounded-full bg-surface-dark overflow-hidden flex-shrink-0">
          {displayUser?.avatarUrl ? (
            <img src={displayUser.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm font-semibold">
              {displayUser?.name?.charAt(0) || "?"}
            </div>
          )}
        </div>
        <span className="font-medium text-white truncate">{displayUser?.name || "User"}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 scrollbar-thin min-h-0">
        {loadingMessages ? (
          <div className="text-slate-500 text-sm">Loading...</div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.senderId === user?.id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-2 ${
                  m.senderId === user?.id
                    ? "bg-brand-500 text-white rounded-br-md"
                    : "bg-surface-dark text-slate-200 rounded-bl-md"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{m.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(m.createdAt).toLocaleTimeString(undefined, { timeStyle: "short" })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-2 border-t border-surface-border/50 flex-shrink-0">
        <button
          type="button"
          onClick={shareTodaysLog}
          disabled={sharingLog || !selectedUserId}
          className="w-full py-2 rounded-lg border border-surface-border text-slate-400 hover:text-white hover:bg-surface-dark/50 text-sm font-medium transition disabled:opacity-50 touch-manipulation flex items-center justify-center gap-2"
        >
          <span>📋</span>
          {sharingLog ? "Sharing..." : "Share today's log"}
        </button>
      </div>
      <form
        onSubmit={sendMessage}
        className="p-3 border-t border-surface-border flex gap-2 flex-shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 min-w-0 px-4 py-2.5 sm:py-2 rounded-xl bg-surface-dark border border-surface-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-base sm:text-sm"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="px-4 py-2.5 sm:py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium disabled:opacity-50 flex-shrink-0 touch-manipulation"
        >
          Send
        </button>
      </form>
    </div>
  );

  return (
    <div className="flex flex-col min-h-[50vh] sm:h-[calc(100vh-8rem)]">
      <h1 className="font-display text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Messages</h1>

      <div className="flex-1 flex min-h-0 rounded-xl sm:rounded-2xl border border-surface-border overflow-hidden bg-surface-card">
        {/* Mobile: show list or thread (mutually exclusive) */}
        {showListOnMobile ? (
          <div className="sm:hidden flex flex-col w-full min-h-[40vh]">
            {listPanel}
          </div>
        ) : (
          <div className="sm:hidden flex flex-col w-full min-h-[40vh]">
            {threadPanel}
          </div>
        )}
        {/* Desktop: side-by-side */}
        <div className="hidden sm:flex flex-1 min-h-0 w-full">
          {listPanel}
          {threadPanel ?? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Select a conversation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
