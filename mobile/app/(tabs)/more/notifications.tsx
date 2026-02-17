import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { apiJson, apiFetch, getApiBase } from "../../../src/api";
import { useUnreadCounts } from "../../../src/UnreadCountsContext";
import { theme } from "../../../src/theme";

type NotificationItem = {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  postId?: string | null;
  actor: { id: string; name: string; avatarUrl: string | null } | null;
};

type NotificationsRes = { notifications: NotificationItem[]; unreadCount: number };

function label(n: NotificationItem) {
  const name = n.actor?.name ?? "Someone";
  switch (n.type) {
    case "friend_request":
      return `${name} sent you a friend request`;
    case "friend_accepted":
      return `${name} accepted your friend request`;
    case "comment":
      return `${name} commented on your photo`;
    case "message":
      return `${name} sent you a message`;
    case "like":
      return `${name} liked your photo`;
    default:
      return name ? `${name} — new activity` : "New activity";
  }
}

export default function NotificationsScreen() {
  const { notificationUnread, refresh } = useUnreadCounts();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const base = getApiBase();

  const fetchNotifications = async () => {
    try {
      const data = await apiJson<NotificationsRes>("/api/notifications");
      setNotifications(data.notifications || []);
      refresh();
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markRead = async (id: string) => {
    await apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    refresh();
  };

  const markAllRead = async () => {
    await apiFetch("/api/notifications/read-all", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    refresh();
  };

  const onPress = (n: NotificationItem) => {
    if (!n.read) markRead(n.id);
    if (n.type === "friend_request" || n.type === "friend_accepted") router.push("/(tabs)/friends");
    else if (n.type === "message" && n.actor?.id) router.push({ pathname: "/chat/[userId]", params: { userId: n.actor.id } });
    else if (n.type === "comment" || n.type === "like") {
      if (n.postId) router.push({ pathname: "/(tabs)/feed", params: { postId: n.postId } });
      else router.push("/(tabs)/feed");
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[styles.row, !item.read && styles.rowUnread]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarWrap}>
        {item.actor?.avatarUrl ? (
          <Image
            source={{ uri: item.actor.avatarUrl.startsWith("http") ? item.actor.avatarUrl : `${base}${item.actor.avatarUrl}` }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarLetter}>{item.actor?.name?.charAt(0) ?? "?"}</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.label}>{label(item)}</Text>
        <Text style={styles.time}>
          {new Date(item.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#22c55e" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {notificationUnread > 0 && (
        <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.muted}>No notifications yet</Text>}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} colors={["#22c55e"]} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  markAllBtn: { padding: 12, alignItems: "flex-end" },
  markAllText: { color: theme.accent, fontSize: 14 },
  list: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: "row", alignItems: "center", padding: 14, marginBottom: 8, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.border },
  rowUnread: { borderColor: "rgba(52,211,153,0.4)", backgroundColor: "rgba(52,211,153,0.12)" },
  avatarWrap: { marginRight: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { backgroundColor: theme.placeholder, justifyContent: "center", alignItems: "center" },
  avatarLetter: { color: theme.muted, fontWeight: "600", fontSize: 18 },
  body: { flex: 1 },
  label: { color: theme.foreground, fontSize: 15 },
  time: { color: theme.muted, fontSize: 12, marginTop: 2 },
  muted: { color: theme.muted, textAlign: "center", padding: 24 },
});
