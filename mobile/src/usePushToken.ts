import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { apiFetch } from "./api";
import { router } from "expo-router";

// Show notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/** Register push token with backend when user is logged in. */
export function usePushToken(userId: string | null) {
  const registered = useRef(false);

  useEffect(() => {
    if (!userId) {
      registered.current = false;
      return;
    }

    let cancelled = false;

    async function register() {
      try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let final = existing;
        if (existing !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          final = status;
        }
        if (final !== "granted" || cancelled) return;

        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: "64306aea-eb6c-4ebf-8d88-044325303cdd",
        });
        const token = tokenData?.data;
        if (!token || cancelled) return;

        await apiFetch("/api/push/token", {
          method: "POST",
          body: JSON.stringify({ token }),
        });
        if (!cancelled) registered.current = true;
      } catch {
        // Ignore - user may have denied or network issue
      }
    }

    register();
    return () => {
      cancelled = true;
    };
  }, [userId]);
}

/** Listen for notification taps and navigate. Auto-opens chat when new message. Refreshes badge. */
export function useNotificationResponse(onRefresh?: () => void) {
  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      onRefresh?.();
      const data = notification.request.content.data as { type?: string; actorId?: string; postId?: string };
      if (data?.type === "message" && data.actorId) {
        router.push({ pathname: "/chat/[userId]", params: { userId: data.actorId } });
      } else if ((data?.type === "comment" || data?.type === "like") && data.postId) {
        router.push({ pathname: "/(tabs)/feed", params: { postId: data.postId } });
      }
    });
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { type?: string; postId?: string; refId?: string; actorId?: string };
      if (data?.type === "friend_request" || data?.type === "friend_accepted") {
        router.push("/(tabs)/friends");
      } else if (data?.type === "message" && data.actorId) {
        router.push({ pathname: "/chat/[userId]", params: { userId: data.actorId as string } });
      } else if (data?.type === "comment" || data?.type === "like") {
        if (data.postId) {
          router.push({ pathname: "/(tabs)/feed", params: { postId: data.postId as string } });
        } else {
          router.push("/(tabs)/feed");
        }
      }
      onRefresh?.();
    });
    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [onRefresh]);
}
