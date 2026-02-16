import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../auth-context";
import { apiJson, getApiBase } from "../api";
import type { Conversation, Message } from "../types";
import { theme } from "../theme";

const POLL_UNREAD_MS = 10000;

export default function FloatingChatButton() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState("User");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (messages.length && selectedUserId) scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, selectedUserId]);

  useEffect(() => {
    const fetchUnread = () => {
      apiJson<{ count: number }>("/api/messages/unread-count")
        .then((d) => setUnreadCount(d.count ?? 0))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, POLL_UNREAD_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    setLoadingConvs(true);
    apiJson<Conversation[]>("/api/messages/conversations")
      .then((d) => setConversations(Array.isArray(d) ? d : []))
      .catch(() => setConversations([]))
      .finally(() => setLoadingConvs(false));
  }, [modalOpen]);

  useEffect(() => {
    if (!modalOpen || !selectedUserId) return;
    setLoadingMessages(true);
    apiJson<Message[]>(`/api/messages?with=${selectedUserId}`)
      .then((d) => setMessages(Array.isArray(d) ? d : []))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false));
    const conv = conversations.find((c) => c.userId === selectedUserId);
    if (conv) {
      setSelectedName(conv.user.name);
      setSelectedAvatar(conv.user.avatarUrl);
    }
  }, [modalOpen, selectedUserId]);

  const openModal = () => {
    setSelectedUserId(null);
    setModalOpen(true);
  };

  const sendMessage = async () => {
    if (!selectedUserId || !input.trim()) return;
    setSending(true);
    try {
      const data = await apiJson<Message>("/api/messages", {
        method: "POST",
        body: JSON.stringify({ text: input.trim(), receiverId: selectedUserId }),
      });
      setMessages((prev) => [...prev, data]);
      setInput("");
    } finally {
      setSending(false);
    }
  };

  const base = getApiBase();
  const showList = !selectedUserId;

  if (!user) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.fab}
        onPress={openModal}
        activeOpacity={0.9}
      >
        <Text style={styles.fabIcon}>💬</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setModalOpen(false)} activeOpacity={1} />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalContent}
          >
            <View style={styles.chatPanel}>
              <View style={styles.header}>
                {showList ? (
                  <Text style={styles.headerTitle}>Chat</Text>
                ) : (
                  <>
                    <TouchableOpacity onPress={() => setSelectedUserId(null)} style={styles.backBtn}>
                      <Text style={styles.backBtnText}>←</Text>
                    </TouchableOpacity>
                    {selectedAvatar ? (
                      <Image source={{ uri: selectedAvatar.startsWith("http") ? selectedAvatar : `${base}${selectedAvatar}` }} style={styles.headerAvatar} />
                    ) : (
                      <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarLetter}>{selectedName.charAt(0)}</Text>
                      </View>
                    )}
                    <Text style={styles.headerTitle} numberOfLines={1}>{selectedName}</Text>
                  </>
                )}
                <TouchableOpacity onPress={() => setModalOpen(false)} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              {showList ? (
                <>
                  <Text style={styles.addFriendsHint}>Add friends to start chatting.</Text>
                  {loadingConvs ? (
                    <ActivityIndicator color="#22c55e" style={styles.loader} />
                  ) : (
                    <FlatList
                      data={conversations}
                      keyExtractor={(item) => item.userId}
                      style={styles.convList}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.convRow}
                          onPress={() => {
                            setSelectedUserId(item.userId);
                            setSelectedName(item.user.name);
                            setSelectedAvatar(item.user.avatarUrl);
                          }}
                        >
                          {item.user.avatarUrl ? (
                            <Image source={{ uri: item.user.avatarUrl.startsWith("http") ? item.user.avatarUrl : `${base}${item.user.avatarUrl}` }} style={styles.convAvatar} />
                          ) : (
                            <View style={[styles.convAvatar, styles.avatarPlaceholder]}>
                              <Text style={styles.avatarLetter}>{item.user.name.charAt(0)}</Text>
                            </View>
                          )}
                          <View style={styles.convInfo}>
                            <Text style={styles.convName}>{item.user.name}</Text>
                            <Text style={styles.convPreview} numberOfLines={1}>{item.lastText}</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                      ListEmptyComponent={<Text style={styles.muted}>No conversations yet.</Text>}
                    />
                  )}
                </>
              ) : (
                <>
                  <ScrollView
                    ref={scrollRef}
                    style={styles.messagesScroll}
                    contentContainerStyle={styles.messagesContent}
                  >
                    {loadingMessages ? (
                      <ActivityIndicator color="#22c55e" style={styles.loader} />
                    ) : (
                      messages.map((m) => (
                        <View key={m.id} style={m.senderId === user.id ? styles.msgRowRight : styles.msgRowLeft}>
                          <View style={m.senderId === user.id ? styles.bubbleSelf : styles.bubbleOther}>
                            <Text style={styles.bubbleText}>{m.text}</Text>
                            <Text style={styles.bubbleTime}>
                              {new Date(m.createdAt).toLocaleTimeString(undefined, { timeStyle: "short" })}
                            </Text>
                          </View>
                        </View>
                      ))
                    )}
                  </ScrollView>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.input}
                      value={input}
                      onChangeText={setInput}
                      placeholder="Type a message..."
                      placeholderTextColor="#64748b"
                      onSubmitEditing={sendMessage}
                      returnKeyType="send"
                    />
                    <TouchableOpacity
                      style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
                      onPress={sendMessage}
                      disabled={!input.trim() || sending}
                    >
                      <Text style={styles.sendBtnText}>Send</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 16,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.accent,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 100,
  },
  fabIcon: { fontSize: 26 },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.error,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: theme.foreground, fontSize: 11, fontWeight: "700" },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { maxHeight: "70%" },
  chatPanel: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: theme.border,
    overflow: "hidden",
    minHeight: 380,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.background,
  },
  backBtn: { padding: 8, marginRight: 4 },
  backBtnText: { color: theme.muted, fontSize: 18 },
  headerAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
  avatarPlaceholder: { backgroundColor: theme.placeholder, justifyContent: "center", alignItems: "center" },
  avatarLetter: { color: theme.muted, fontWeight: "600", fontSize: 14 },
  headerTitle: { flex: 1, color: theme.foreground, fontWeight: "600", fontSize: 16 },
  closeBtn: { padding: 8 },
  closeBtnText: { color: theme.muted, fontSize: 18 },
  addFriendsHint: { color: theme.accent, textAlign: "center", padding: 12, fontSize: 12 },
  loader: { marginVertical: 24 },
  convList: { maxHeight: 280 },
  convRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  convAvatar: { width: 40, height: 40, borderRadius: 20 },
  convInfo: { marginLeft: 12, flex: 1 },
  convName: { color: theme.foreground, fontWeight: "600", fontSize: 14 },
  convPreview: { color: theme.muted, fontSize: 12, marginTop: 2 },
  muted: { color: theme.muted, textAlign: "center", padding: 16 },
  messagesScroll: { maxHeight: 260 },
  messagesContent: { padding: 12, paddingBottom: 16 },
  msgRowLeft: { alignItems: "flex-start", marginBottom: 8 },
  msgRowRight: { alignItems: "flex-end", marginBottom: 8 },
  bubbleSelf: { maxWidth: "85%", backgroundColor: theme.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderBottomRightRadius: 4 },
  bubbleOther: { maxWidth: "85%", backgroundColor: theme.placeholder, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderBottomLeftRadius: 4 },
  bubbleText: { color: theme.foreground, fontSize: 14 },
  bubbleTime: { color: "rgba(236,253,245,0.8)", fontSize: 10, marginTop: 4 },
  inputRow: { flexDirection: "row", alignItems: "center", padding: 12, borderTopWidth: 1, borderTopColor: theme.border, gap: 8 },
  input: {
    flex: 1,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: theme.foreground,
    fontSize: 15,
  },
  sendBtn: { backgroundColor: theme.accent, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: theme.foreground, fontWeight: "600" },
});
