import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { apiJson, apiFetch } from "../../../src/api";
import type { HealthLog } from "../../../src/types";
import { theme } from "../../../src/theme";

const PER_PAGE = 25;

export default function HistoryScreen() {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  const fetchLogs = async () => {
    try {
      const data = await apiJson<HealthLog[]>("/api/health?limit=500");
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const totalPages = Math.max(1, Math.ceil(logs.length / PER_PAGE));
  const start = (page - 1) * PER_PAGE;
  const paginatedLogs = logs.slice(start, start + PER_PAGE);

  const handleDelete = (id: string) => {
    Alert.alert("Delete entry", "Remove this log entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const res = await apiFetch(`/api/health/${id}`, { method: "DELETE" });
          if (res.ok) {
            setLogs((prev) => {
              const next = prev.filter((l) => l.id !== id);
              const newTotalPages = Math.max(1, Math.ceil(next.length / PER_PAGE));
              if (page > newTotalPages) setPage(newTotalPages);
              return next;
            });
          }
        },
      },
    ]);
  };

  const formatDate = (logDate: string) =>
    new Date(logDate + "T12:00:00").toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const handleEdit = (logDate: string) => {
    router.push({ pathname: "/(tabs)/health", params: { date: logDate } });
  };

  const renderItem = ({ item }: { item: HealthLog }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>{formatDate(item.logDate)}</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => handleEdit(item.logDate)} style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.delBtn}>
            <Text style={styles.delBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.row}>
        {item.weight != null && <Text style={styles.label}>Weight: <Text style={styles.value}>{item.weight} lbs</Text></Text>}
        {item.calories != null && <Text style={styles.label}>Cal: <Text style={styles.value}>{item.calories}</Text></Text>}
        {item.protein != null && <Text style={styles.label}>Protein: <Text style={styles.value}>{item.protein}g</Text></Text>}
        {item.sleepHours != null && <Text style={styles.label}>Sleep: <Text style={styles.value}>{item.sleepHours}h</Text></Text>}
        {item.steps != null && <Text style={styles.label}>Steps: <Text style={styles.value}>{item.steps}</Text></Text>}
        {item.energyLevel != null && <Text style={styles.label}>Energy: <Text style={styles.value}>{item.energyLevel}/10</Text></Text>}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#22c55e" size="large" />
      </View>
    );
  }

  if (logs.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>No log entries yet.</Text>
        <TouchableOpacity style={styles.linkBtn} onPress={() => router.replace("/(tabs)/health")}>
          <Text style={styles.linkBtnText}>Add your first log in Health</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={paginatedLogs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        ListFooterComponent={
          totalPages > 1 ? (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <Text style={styles.pageBtnText}>Previous</Text>
              </TouchableOpacity>
              <Text style={styles.pageInfo}>Page {page} of {totalPages}</Text>
              <TouchableOpacity
                style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <Text style={styles.pageBtnText}>Next</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  list: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: theme.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.border },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  date: { color: theme.foreground, fontWeight: "600", fontSize: 15 },
  cardActions: { flexDirection: "row", gap: 8 },
  editBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: theme.accent },
  editBtnText: { color: theme.accent, fontSize: 12 },
  delBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: "rgba(239,68,68,0.5)" },
  delBtnText: { color: theme.error, fontSize: 12 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  label: { color: theme.muted, fontSize: 13 },
  value: { color: theme.foreground },
  muted: { color: theme.muted, textAlign: "center", marginBottom: 12 },
  linkBtn: { padding: 12, backgroundColor: theme.accent, borderRadius: 12 },
  linkBtnText: { color: theme.foreground, fontWeight: "600" },
  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 16, marginBottom: 24 },
  pageBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: theme.card, borderRadius: 10, borderWidth: 1, borderColor: theme.border },
  pageBtnDisabled: { opacity: 0.5 },
  pageBtnText: { color: theme.foreground },
  pageInfo: { color: theme.muted, fontSize: 14 },
});
