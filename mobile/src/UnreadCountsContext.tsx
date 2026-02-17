import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { apiJson } from "./api";

const POLL_MS = 8000;

type UnreadCountsContextType = {
  chatUnread: number;
  notificationUnread: number;
  refresh: () => void;
};

const UnreadCountsContext = createContext<UnreadCountsContextType | undefined>(undefined);

export function UnreadCountsProvider({ children }: { children: React.ReactNode }) {
  const [chatUnread, setChatUnread] = useState(0);
  const [notificationUnread, setNotificationUnread] = useState(0);

  const refresh = useCallback(() => {
    apiJson<{ count: number }>("/api/messages/unread-count")
      .then((d) => setChatUnread(d.count ?? 0))
      .catch(() => {});
    apiJson<{ count: number }>("/api/notifications/unread-count")
      .then((d) => setNotificationUnread(d.count ?? 0))
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <UnreadCountsContext.Provider value={{ chatUnread, notificationUnread, refresh }}>
      {children}
    </UnreadCountsContext.Provider>
  );
}

export function useUnreadCounts() {
  const ctx = useContext(UnreadCountsContext);
  if (ctx === undefined) throw new Error("useUnreadCounts must be used within UnreadCountsProvider");
  return ctx;
}
