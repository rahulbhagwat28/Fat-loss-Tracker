import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../../src/auth-context";
import { getApiBase } from "../../../src/api";
import { theme } from "../../../src/theme";

export default function MoreScreen() {
  const { user, logout } = useAuth();
  const base = getApiBase();

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: async () => { await logout(); router.replace("/(auth)/login"); } },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>More</Text>
      {user && (
        <View style={styles.userRow}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl.startsWith("http") ? user.avatarUrl : `${base}${user.avatarUrl}` }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}><Text style={styles.avatarLetter}>{user.name.charAt(0)}</Text></View>
          )}
          <Text style={styles.userName}>{user.name}</Text>
        </View>
      )}
      <TouchableOpacity style={styles.linkRow} onPress={() => router.push("/more/history")}>
        <Text style={styles.linkText}>History</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkRow} onPress={() => router.push("/more/weight-graph")}>
        <Text style={styles.linkText}>Weight Graph</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkRow} onPress={() => router.push("/more/progress-pics")}>
        <Text style={styles.linkText}>Progress Pics</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkRow} onPress={() => router.push("/more/notifications")}>
        <Text style={styles.linkText}>Notifications</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkRow} onPress={() => router.push("/more/profile")}>
        <Text style={styles.linkText}>Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.linkRow, styles.logoutRow]} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scroll: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: "700", color: theme.foreground, marginBottom: 20 },
  userRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.placeholder, justifyContent: "center", alignItems: "center" },
  avatarLetter: { color: theme.muted, fontWeight: "600", fontSize: 20 },
  userName: { color: theme.foreground, marginLeft: 12, fontWeight: "600" },
  linkRow: { backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.border },
  linkText: { color: theme.foreground },
  logoutRow: { marginTop: 16, borderColor: "rgba(239,68,68,0.5)" },
  logoutText: { color: theme.error, fontWeight: "600" },
});
