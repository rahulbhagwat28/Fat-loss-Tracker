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
import { useUnreadCounts } from "../../../src/UnreadCountsContext";
import { apiJson, apiFetch, getApiBase } from "../../../src/api";
import type { Message } from "../../../src/types";
import { theme } from "../../../src/theme";

export default function ChatThreadScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const { refresh } = useUnreadCounts();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sharingLog, setSharingLog] = useState(false);
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
      .finally(() => {
        setLoading(false);
        refresh();
      });
    apiJson<{ userId: string; user: { name: string; avatarUrl: string | null } }[]>("/api/messages/conversations")
      .then((convs) => {
        const c = Array.isArray(convs) ? convs.find((x) => x.userId === userId) : null;
        if (c) {
          setOtherName(c.user.name);
          setOtherAvatar(c.user.avatarUrl);
        }
      })
      .catch(() => {});
  }, [userId, refresh]);

  useEffect(() => {
    if (messages.length) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const today = () => new Date().toISOString().slice(0, 10);

  const formatLogForShare = (log: {
    logDate: string;
    weight?: number | null;
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fat?: number | null;
    sleepHours?: number | null;
    energyLevel?: number | null;
    steps?: number | null;
  }) => {
    const dateStr = new Date(log.logDate + "T12:00:00").toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const lines: string[] = [`📋 My log for ${dateStr}`, ""];
    if (log.weight != null) lines.push(`Weight: ${log.weight} lbs`);
    if (log.calories != null) lines.push(`Calories: ${log.calories}`);
    if (log.protein != null || log.carbs != null || log.fat != null) {
      lines.push(`Macros: P ${log.protein ?? "–"} / C ${log.carbs ?? "–"} / F ${log.fat ?? "–"} g`);
    }
    if (log.sleepHours != null) lines.push(`Sleep: ${log.sleepHours}h`);
    if (log.energyLevel != null) lines.push(`Energy: ${log.energyLevel}/10`);
    if (log.steps != null) lines.push(`Steps: ${log.steps.toLocaleString()}`);
    return lines.join("\n").trim() || "No data for this day.";
  };

  const shareTodaysLog = async () => {
    if (!userId) return;
    setSharingLog(true);
    try {
      const logs = await apiJson<{ logDate: string; weight?: number | null; calories?: number | null; protein?: number | null; carbs?: number | null; fat?: number | null; sleepHours?: number | null; energyLevel?: number | null; steps?: number | null }[]>("/api/health?limit=30");
      const arr = Array.isArray(logs) ? logs : [];
      const todayLog = arr.find((l) => l.logDate === today());
      const text = todayLog ? formatLogForShare(todayLog) : "📋 I have no updates";
      const data = await apiJson<Message>("/api/messages", {
        method: "POST",
        body: JSON.stringify({ text, receiverId: userId }),
      });
      setMessages((prev) => [...prev, data]);
      setInput("");
    } catch {
      // ignore
    } finally {
      setSharingLog(false);
    }
  };

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
          renderItem={({ item }) => {
            const isSelf = item.senderId === user?.id;
            const isNew = !isSelf && item.receiverId === user?.id && item.read === false;
            return (
              <View style={isSelf ? styles.msgRowRight : styles.msgRowLeft}>
                <View style={[
                  isSelf ? styles.bubbleSelf : styles.bubbleOther,
                  isNew && styles.bubbleNew,
                ]}>
                  {isNew && (
                    <Text style={styles.newLabel}>New</Text>
                  )}
                  <Text style={styles.bubbleText}>{item.text}</Text>
                  <Text style={[styles.bubbleTime, isSelf ? styles.bubbleTimeSelf : styles.bubbleTimeOther]}>
                    {new Date(item.createdAt).toLocaleTimeString(undefined, { timeStyle: "short" })}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
      <TouchableOpacity
        style={[styles.shareLogBtn, sharingLog && styles.shareLogBtnDisabled]}
        onPress={shareTodaysLog}
        disabled={sharingLog}
      >
        <Text style={styles.shareLogBtnText}>📋 {sharingLog ? "Sharing..." : "Share today's log"}</Text>
      </TouchableOpacity>
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
  bubbleNew: { borderWidth: 1, borderColor: "rgba(34,197,94,0.5)", backgroundColor: "rgba(34,197,94,0.15)" },
  newLabel: { color: theme.accent, fontSize: 10, fontWeight: "700", marginBottom: 2, letterSpacing: 0.5 },
  bubbleText: { color: theme.foreground, fontSize: 14 },
  bubbleTime: { fontSize: 10, marginTop: 4 },
  bubbleTimeSelf: { color: "rgba(236,253,245,0.8)" },
  bubbleTimeOther: { color: theme.muted },
  shareLogBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    alignItems: "center",
    backgroundColor: theme.card,
  },
  shareLogBtnDisabled: { opacity: 0.6 },
  shareLogBtnText: { color: theme.muted, fontSize: 14, fontWeight: "500" },
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
