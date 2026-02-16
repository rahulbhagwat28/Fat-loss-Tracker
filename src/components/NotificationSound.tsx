"use client";

import { useEffect, useRef } from "react";

import { playNotificationSound, prepareNotificationSound } from "@/lib/notificationSound";

const POLL_INTERVAL_MS = 12_000;
const NOTIFICATION_TYPES_TO_SOUND = new Set(["message", "comment", "like"]);

export default function NotificationSound() {
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isFirstFetchRef = useRef(true);

  useEffect(() => {
    const onFirstInteraction = () => prepareNotificationSound();
    document.addEventListener("click", onFirstInteraction, { once: true });
    document.addEventListener("touchstart", onFirstInteraction, { once: true });
    document.addEventListener("keydown", onFirstInteraction, { once: true });
  }, []);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/notifications", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        const notifications: Array<{
          id: string;
          type: string;
          actorId?: string;
          actor?: { id: string; name: string; avatarUrl: string | null };
        }> = data.notifications || [];

        if (isFirstFetchRef.current) {
          isFirstFetchRef.current = false;
          notifications.forEach((n) => seenIdsRef.current.add(n.id));
          return;
        }

        const newMessageNotif = notifications.find(
          (n) => n.type === "message" && !seenIdsRef.current.has(n.id)
        );
        const hasNewMessageOrComment = notifications.some(
          (n) => NOTIFICATION_TYPES_TO_SOUND.has(n.type) && !seenIdsRef.current.has(n.id)
        );

        if (hasNewMessageOrComment) {
          playNotificationSound();
          notifications.forEach((n) => seenIdsRef.current.add(n.id));
          if (newMessageNotif) {
            const fromUserId = newMessageNotif.actor?.id ?? newMessageNotif.actorId;
            if (fromUserId) {
              window.dispatchEvent(
                new CustomEvent("open-chat-window", {
                  detail: {
                    fromUserId,
                    actorName: newMessageNotif.actor?.name,
                    actorAvatarUrl: newMessageNotif.actor?.avatarUrl ?? null,
                  },
                })
              );
            }
          }
        }
      } catch {
        // ignore
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return null;
}
