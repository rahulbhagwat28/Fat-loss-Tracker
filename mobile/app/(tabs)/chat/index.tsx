import { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Dimensions, Alert, RefreshControl } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { apiJson, apiFetch, getApiBase } from "../../../src/api";
import { useUnreadCounts } from "../../../src/UnreadCountsContext";
import type { Conversation } from "../../../src/types";
import { theme } from "../../../src/theme";

const { width: SW } = Dimensions.get("window");
const AVATAR_SIZE = Math.min(48, Math.round(SW * 0.12));

export default function ChatListScreen() {
  const { refresh } = useUnreadCounts();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const loadConversations = () => {
    apiJson<Conversation[]>("/api/messages/conversations")
      .then((data) => setConversations(Array.isArray(data) ? data : []))
      .catch(() => setConversations([]))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
        refresh();
      });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadConversations();
    }, [])
  );

  const deleteAllChats = () => {
    Alert.alert(
      "Delete all chats",
      "Permanently delete all your conversations and messages? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete all",
          style: "destructive",
          onPress: async () => {
            setDeletingAll(true);
            try {
              const res = await apiFetch("/api/messages?all=true", { method: "DELETE" });
              if (res.ok) {
                setConversations([]);
              } else {
                Alert.alert("Error", "Could not delete chats. Try again.");
              }
            } catch {
              Alert.alert("Error", "Could not delete chats. Try again.");
            } finally {
              setDeletingAll(false);
            }
          },
        },
      ]
    );
  };

  const base = getApiBase();

  if (loading) return <View style={styles.centered}><Text style={styles.muted}>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      {conversations.length > 0 && (
        <TouchableOpacity
          style={[styles.deleteAllBtn, deletingAll && styles.deleteAllBtnDisabled]}
          onPress={deleteAllChats}
          disabled={deletingAll}
        >
          <Text style={styles.deleteAllBtnText}>{deletingAll ? "Deleting..." : "Delete all chats"}</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        ListEmptyComponent={<Text style={styles.muted}>No conversations yet. Add friends to start chatting.</Text>}
        renderItem={({ item }) => {
          const hasUnread = (item.unreadCount ?? 0) > 0;
          return (
            <TouchableOpacity
              style={[styles.row, hasUnread && styles.rowUnread]}
              onPress={() => router.push({ pathname: "/chat/[userId]", params: { userId: item.userId } })}
            >
              {item.user.avatarUrl ? (
                <Image source={{ uri: item.user.avatarUrl.startsWith("http") ? item.user.avatarUrl : `${base}${item.user.avatarUrl}` }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}><Text style={styles.avatarLetter}>{item.user.name.charAt(0)}</Text></View>
              )}
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, hasUnread && styles.nameUnread]}>{item.user.name}</Text>
                  {hasUnread && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{item.unreadCount! > 99 ? "99+" : item.unreadCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.preview, hasUnread && styles.previewUnread]} numberOfLines={1}>{item.lastText}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  deleteAllBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.6)",
    alignItems: "center",
  },
  deleteAllBtnDisabled: { opacity: 0.6 },
  deleteAllBtnText: { color: theme.error, fontWeight: "600", fontSize: 14 },
  list: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: theme.border },
  rowUnread: { backgroundColor: "rgba(52,211,153,0.08)" },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 },
  avatarPlaceholder: { backgroundColor: theme.placeholder, justifyContent: "center", alignItems: "center" },
  avatarLetter: { color: theme.muted, fontWeight: "600" },
  info: { marginLeft: 12, flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  name: { color: theme.foreground, fontWeight: "600", flex: 1 },
  nameUnread: { fontWeight: "700" },
  preview: { color: theme.muted, marginTop: 2 },
  previewUnread: { color: theme.foreground, fontWeight: "500" },
  unreadBadge: { backgroundColor: theme.accent, minWidth: 20, height: 20, borderRadius: 10, justifyContent: "center", alignItems: "center", paddingHorizontal: 6 },
  unreadBadgeText: { color: theme.background, fontSize: 11, fontWeight: "700" },
  muted: { color: theme.muted, textAlign: "center", padding: 24 },
});
