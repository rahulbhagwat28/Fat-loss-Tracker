"use client";

import { useSearchParams } from "next/navigation";
import ChatPanel from "@/components/ChatPanel";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const withUserId = searchParams.get("with");

  return (
    <div className="flex flex-col min-h-[50vh] sm:h-[calc(100vh-8rem)]">
      <h1 className="font-display text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
        Messages
      </h1>
      <div className="flex-1 flex min-h-0 rounded-xl sm:rounded-2xl border border-surface-border overflow-hidden bg-surface-card">
        <ChatPanel initialWithUserId={withUserId} />
      </div>
    </div>
  );
}
