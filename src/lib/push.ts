import { prisma } from "@/lib/db";

/**
 * Send push notification via Expo Push API.
 * https://docs.expo.dev/push-notifications/sending-notifications/
 */
export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  if (!expoPushToken || !expoPushToken.startsWith("ExponentPushToken[")) {
    return false;
  }
  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: expoPushToken,
        title,
        body,
        data: data ?? {},
        sound: "default",
        channelId: "default",
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { data?: { status?: string }[] };
    const status = json.data?.[0]?.status;
    if (status === "error" || status === "DeviceNotRegistered") {
      return false;
    }
    return res.ok;
  } catch {
    return false;
  }
}

type NotificationType = "friend_request" | "friend_accepted" | "comment" | "message" | "like";

/** Send push to user's devices. Fire-and-forget. */
export async function sendPushToUser(
  userId: string,
  type: NotificationType,
  actorName: string,
  extra?: { postId?: string; refId?: string; actorId?: string }
): Promise<void> {
  const tokens = await prisma.pushToken.findMany({ where: { userId }, select: { token: true } });
  if (tokens.length === 0) return;

  const name = actorName || "Someone";
  let title = "Fat Loss Tracker";
  let body: string;
  switch (type) {
    case "friend_request":
      body = `${name} sent you a friend request`;
      break;
    case "friend_accepted":
      body = `${name} accepted your friend request`;
      break;
    case "comment":
      body = `${name} commented on your post`;
      break;
    case "message":
      body = `${name} sent you a message`;
      break;
    case "like":
      body = `${name} liked your post`;
      break;
    default:
      body = `${name} — new activity`;
  }

  const data = { type, ...extra } as Record<string, unknown>;
  await Promise.all(
    tokens.map((t) => sendPushNotification(t.token, title, body, data))
  );
}
