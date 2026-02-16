import { useEffect, useState } from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, RefreshControl, TextInput, Dimensions, Alert } from "react-native";
import { router } from "expo-router";
import { apiJson, getApiBase } from "../../src/api";
import type { Friend, FriendRequest } from "../../src/types";
import { theme } from "../../src/theme";

const { width: SW } = Dimensions.get("window");
const AVATAR_SIZE = Math.min(48, Math.round(SW * 0.12));
const AVATAR_SMALL = Math.min(36, Math.round(SW * 0.09));

type SearchUser = Friend & { isFriend: boolean; pendingRequest: boolean; sentRequestId?: string | null };

export default function FriendsScreen() {
  const [activeTab, setActiveTab] = useState<"friends" | "find">("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    try {
      const [fr, req] = await Promise.all([
        apiJson<Friend[]>("/api/friends"),
        apiJson<FriendRequest[]>("/api/friends/requests"),
      ]);
      setFriends(Array.isArray(fr) ? fr : []);
      setRequests(Array.isArray(req) ? req : []);
    } catch {
      setFriends([]);
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  useEffect(() => {
    if (!search.trim() || search.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      apiJson<SearchUser[]>(`/api/users/search?q=${encodeURIComponent(search)}`)
        .then((data) => setSearchResults(Array.isArray(data) ? data : []))
        .catch(() => setSearchResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const sendRequest = async (toId: string) => {
    setBusy(toId);
    try {
      const data = await apiJson<{ requestId?: string }>("/api/friends/requests", {
        method: "POST",
        body: JSON.stringify({ toId }),
      });
      setSearchResults((prev) => prev.map((u) => (u.id === toId ? { ...u, pendingRequest: true, sentRequestId: data?.requestId ?? undefined } : u)));
    } catch {}
    setBusy(null);
  };

  const respondRequest = async (requestId: string, action: "accept" | "reject") => {
    setBusy(requestId);
    try {
      await apiJson(`/api/friends/requests/${requestId}`, { method: "POST", body: JSON.stringify({ action }) });
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } finally {
      setBusy(null);
    }
  };

  const unfriend = (friendId: string, friendName: string) => {
    Alert.alert("Unfriend", `Remove ${friendName} from your friends?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unfriend",
        style: "destructive",
        onPress: async () => {
          setBusy(friendId);
          try {
            await apiJson(`/api/friends/${friendId}`, { method: "DELETE" });
            setFriends((prev) => prev.filter((f) => f.id !== friendId));
          } catch {
            Alert.alert("Error", "Could not remove friend. Try again.");
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  };

  const base = getApiBase();
  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === "friends" && styles.tabActive]} onPress={() => setActiveTab("friends")}>
          <Text style={[styles.tabText, activeTab === "friends" && styles.tabTextActive]}>Your friends</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === "find" && styles.tabActive]} onPress={() => setActiveTab("find")}>
          <Text style={[styles.tabText, activeTab === "find" && styles.tabTextActive]}>Find people</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "friends" && (
        <>
          {requests.length > 0 && (
            <View style={styles.requestBanner}>
              <Text style={styles.requestBannerText}>You have {requests.length} friend request(s). Accept below.</Text>
            </View>
          )}
          {requests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Friend requests</Text>
              {requests.map((r) => (
                <View key={r.id} style={styles.requestRow}>
                  <Text style={styles.name}>{r.from.name}</Text>
                  <View style={styles.requestActions}>
                    <TouchableOpacity style={styles.acceptBtn} onPress={() => respondRequest(r.id, "accept")} disabled={busy === r.id}>
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.declineBtn} onPress={() => respondRequest(r.id, "reject")} disabled={busy === r.id}>
                      <Text style={styles.declineBtnText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.muted}>No friends yet. Add friends from Find people.</Text>}
            renderItem={({ item }) => (
              <View style={styles.card}>
                {item.avatarUrl ? (
                  <Image source={{ uri: item.avatarUrl.startsWith("http") ? item.avatarUrl : `${base}${item.avatarUrl}` }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}><Text style={styles.avatarLetter}>{item.name.charAt(0)}</Text></View>
                )}
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.chatBtn, busy === item.id && styles.btnDisabled]}
                    onPress={() => router.push({ pathname: "/chat/[userId]", params: { userId: item.id } })}
                    disabled={busy === item.id}
                  >
                    <Text style={styles.chatBtnText}>Chat</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.unfriendBtn, busy === item.id && styles.btnDisabled]}
                    onPress={() => unfriend(item.id, item.name)}
                    disabled={busy === item.id}
                  >
                    <Text style={styles.unfriendBtnText}>{busy === item.id ? "..." : "Unfriend"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </>
      )}
      {activeTab === "find" && (
        <View style={styles.findContainer}>
          <Text style={styles.label}>Search by name</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Type a name..."
            placeholderTextColor="#64748b"
          />
          {searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              style={styles.searchList}
              renderItem={({ item }) => (
                <View style={styles.searchRow}>
                  {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl.startsWith("http") ? item.avatarUrl : `${base}${item.avatarUrl}` }} style={styles.avatarSmall} />
                  ) : (
                    <View style={[styles.avatarSmall, styles.avatarPlaceholder]}><Text style={styles.avatarLetter}>{item.name.charAt(0)}</Text></View>
                  )}
                  <Text style={[styles.name, { flex: 1 }]}>{item.name}</Text>
                  {item.isFriend ? <Text style={styles.muted}>Friends</Text> : item.pendingRequest ? <Text style={styles.muted}>Request sent</Text> : (
                    <TouchableOpacity style={styles.addBtn} onPress={() => sendRequest(item.id)} disabled={busy === item.id}>
                      <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          )}
          {search.trim().length >= 2 && searchResults.length === 0 && !loading && <Text style={styles.muted}>No one found.</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: theme.border, paddingHorizontal: 16 },
  tab: { paddingVertical: 12, paddingHorizontal: 16, marginRight: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: theme.accent },
  tabText: { color: theme.muted },
  tabTextActive: { color: theme.accent, fontWeight: "600" },
  requestBanner: { backgroundColor: "rgba(52,211,153,0.2)", padding: 12, margin: 16, borderRadius: 8, borderWidth: 1, borderColor: "rgba(52,211,153,0.5)" },
  requestBannerText: { color: theme.foreground },
  section: { padding: 16 },
  sectionTitle: { color: theme.foreground, fontWeight: "600", marginBottom: 12 },
  requestRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  requestActions: { flexDirection: "row", gap: 8 },
  acceptBtn: { backgroundColor: theme.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  acceptBtnText: { color: theme.foreground, fontWeight: "600" },
  declineBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.border },
  declineBtnText: { color: theme.muted },
  list: { padding: 16, paddingBottom: 40 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: theme.card, padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.border },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 },
  avatarPlaceholder: { backgroundColor: theme.placeholder, justifyContent: "center", alignItems: "center" },
  avatarLetter: { color: theme.muted, fontWeight: "600" },
  name: { flex: 1, color: theme.foreground, marginLeft: 12, fontWeight: "500" },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  chatBtn: { backgroundColor: theme.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  chatBtnText: { color: theme.foreground, fontWeight: "600" },
  unfriendBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "rgba(239,68,68,0.6)" },
  unfriendBtnText: { color: theme.error, fontWeight: "600", fontSize: 13 },
  btnDisabled: { opacity: 0.5 },
  centered: { flex: 1, justifyContent: "center", padding: 24 },
  findContainer: { flex: 1, padding: 16 },
  label: { color: theme.muted, marginBottom: 8 },
  searchInput: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 14,
    color: theme.foreground,
    fontSize: 16,
    marginBottom: 16,
  },
  searchList: { flex: 1 },
  searchRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  avatarSmall: { width: AVATAR_SMALL, height: AVATAR_SMALL, borderRadius: AVATAR_SMALL / 2 },
  addBtn: { backgroundColor: theme.accent, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  addBtnText: { color: theme.foreground, fontWeight: "600" },
  muted: { color: theme.muted, textAlign: "center" },
});
