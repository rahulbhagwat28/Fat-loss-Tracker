"use client";

import { useRef, useEffect } from "react";
import ChatPanel from "./ChatPanel";

type ChatDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export default function ChatDrawer({ open, onClose }: ChatDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        aria-hidden
        onClick={onClose}
      />
      <div
        ref={drawerRef}
        className="fixed left-0 right-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-surface-card border border-b-0 border-surface-border shadow-2xl overflow-hidden"
        style={{ height: "300px", maxHeight: "300px" }}
        role="dialog"
        aria-label="Chat"
      >
        {/* Handle bar + header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-surface-border bg-surface-dark/50">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-1 rounded-full bg-slate-500 flex-shrink-0" aria-hidden />
            <span className="font-medium text-white truncate">Chat</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-dark"
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <ChatPanel />
        </div>
      </div>
    </>
  );
}
