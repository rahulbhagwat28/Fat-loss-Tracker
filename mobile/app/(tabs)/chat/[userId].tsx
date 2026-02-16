import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "../../../src/auth-context";
import { apiJson, apiFetch, getApiBase } from "../../../src/api";
import type { Message } from "../../../src/types";
import { theme } from "../../../src/theme";

export default function ChatThreadScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [otherName, setOtherName] = useState("User");
  const [otherAvatar, setOtherAvatar] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const base = getApiBase();

  const clearChat = () => {
    if (!userId) return;
    Alert.alert(
      "Clear chat",
      "Delete all messages with this person? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await apiFetch(`/api/messages?with=${encodeURIComponent(userId)}`, { method: "DELETE" });
              if (res.ok) setMessages([]);
              else Alert.alert("Error", "Could not clear chat. Try again.");
            } catch {
              Alert.alert("Error", "Could not clear chat. Try again.");
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    apiJson<Message[]>(`/api/messages?with=${userId}`)
      .then((d) => setMessages(Array.isArray(d) ? d : []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
    apiJson<{ userId: string; user: { name: string; avatarUrl: string | null } }[]>("/api/messages/conversations")
      .then((convs) => {
        const c = Array.isArray(convs) ? convs.find((x) => x.userId === userId) : null;
        if (c) {
          setOtherName(c.user.name);
          setOtherAvatar(c.user.avatarUrl);
        }
      })
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (messages.length) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!userId || !input.trim() || !user) return;
    setSending(true);
    try {
      const data = await apiJson<Message>("/api/messages", {
        method: "POST",
        body: JSON.stringify({ text: input.trim(), receiverId: userId }),
      });
      setMessages((prev) => [...prev, data]);
      setInput("");
    } finally {
      setSending(false);
    }
  };

  if (!userId) return <View style={styles.centered}><Text style={styles.muted}>Invalid conversation</Text></View>;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {loading ? (
        <ActivityIndicator color={theme.accent} style={styles.loader} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messagesContent}
          ListEmptyComponent={<Text style={styles.muted}>No messages yet. Say hi!</Text>}
          renderItem={({ item }) => (
            <View style={item.senderId === user?.id ? styles.msgRowRight : styles.msgRowLeft}>
              <View style={item.senderId === user?.id ? styles.bubbleSelf : styles.bubbleOther}>
                <Text style={styles.bubbleText}>{item.text}</Text>
                <Text style={styles.bubbleTime}>
                  {new Date(item.createdAt).toLocaleTimeString(undefined, { timeStyle: "short" })}
                </Text>
              </View>
            </View>
          )}
        />
      )}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor={theme.muted}
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
      <TouchableOpacity style={styles.clearChatBtn} onPress={clearChat}>
        <Text style={styles.clearChatBtnText}>Clear chat</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loader: { marginTop: 24 },
  muted: { color: theme.muted, textAlign: "center", padding: 16 },
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
    backgroundColor: theme.card,
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
  clearChatBtn: {
    alignSelf: "stretch",
    marginHorizontal: 12,
    marginBottom: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.6)",
    alignItems: "center",
  },
  clearChatBtnText: { color: theme.error, fontWeight: "600", fontSize: 14 },
});
