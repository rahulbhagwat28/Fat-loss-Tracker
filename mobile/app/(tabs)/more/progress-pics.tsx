import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  TextInput,
  Alert,
  ScrollView,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { apiJson, apiFetch, getApiBase } from "../../../src/api";
import { theme } from "../../../src/theme";

const PER_PAGE = 24;
const { width: SW } = Dimensions.get("window");
const CARD_SIZE = (SW - 16 * 3) / 2;

type ProgressPic = { id: string; imageUrl: string; label: string | null; createdAt: string };
type ProgressPicsRes = { pics: ProgressPic[]; total: number; totalPages: number };

export default function ProgressPicsScreen() {
  const [pics, setPics] = useState<ProgressPic[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [label, setLabel] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const base = getApiBase();

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setError("Gallery permission is required to pick a photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setError("");
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("type", "progress");
      formData.append("file", {
        uri: asset.uri,
        name: asset.fileName ?? "progress.jpg",
        type: asset.mimeType ?? "image/jpeg",
      } as unknown as Blob);
      const res = await apiFetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Upload failed");
      setImageUrl((data as { url: string }).url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchPics = async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const data = await apiJson<ProgressPicsRes>(`/api/progress-pics?page=${pageNum}&limit=${PER_PAGE}`);
      setPics(data.pics || []);
      setTotal(data.total ?? 0);
      setTotalPages(Math.max(1, data.totalPages ?? 1));
    } catch {
      setPics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPics(page);
  }, [page]);

  const handleSubmit = async () => {
    if (!imageUrl.trim()) {
      setError("Enter an image URL");
      return;
    }
    setError("");
    setUploading(true);
    try {
      await apiJson("/api/progress-pics", {
        method: "POST",
        body: JSON.stringify({ imageUrl: imageUrl.trim(), label: label.trim() || null }),
      });
      setImageUrl("");
      setLabel("");
      setPage(1);
      fetchPics(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete", "Remove this progress pic?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const res = await apiFetch(`/api/progress-pics/${id}`, { method: "DELETE" });
          if (res.ok) {
            const newTotal = total - 1;
            const newTotalPages = Math.max(1, Math.ceil(newTotal / PER_PAGE));
            setPage((p) => (p > newTotalPages ? newTotalPages : p));
            fetchPics(page > newTotalPages ? newTotalPages : page);
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  const renderItem = ({ item }: { item: ProgressPic }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.imageUrl.startsWith("http") ? item.imageUrl : `${base}${item.imageUrl}` }}
        style={styles.thumb}
      />
      <Text style={styles.cardLabel} numberOfLines={1}>{item.label || formatDate(item.createdAt)}</Text>
      <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item.id)}>
        <Text style={styles.delBtnText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.form}>
        <Text style={styles.formHint}>Add a progress pic: pick from gallery or paste image URL</Text>
        {error ? <Text style={styles.err}>{error}</Text> : null}
        <TouchableOpacity
          style={[styles.galleryBtn, uploadingImage && styles.galleryBtnDisabled]}
          onPress={pickFromGallery}
          disabled={uploadingImage}
        >
          <Text style={styles.galleryBtnText}>{uploadingImage ? "Uploading..." : "📷 Pick from gallery"}</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={imageUrl}
          onChangeText={(t) => { setImageUrl(t); setError(""); }}
          placeholder="Or paste image URL"
          placeholderTextColor="#64748b"
        />
        <TextInput
          style={[styles.input, styles.inputShort]}
          value={label}
          onChangeText={setLabel}
          placeholder="Label (e.g. Week 1)"
          placeholderTextColor="#64748b"
        />
        <TouchableOpacity
          style={[styles.addBtn, (uploading || !imageUrl.trim()) && styles.addBtnDisabled]}
          onPress={handleSubmit}
          disabled={uploading || !imageUrl.trim()}
        >
          <Text style={styles.addBtnText}>{uploading ? "Adding..." : "Add"}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.accent} style={styles.loader} />
      ) : pics.length === 0 ? (
        <Text style={styles.muted}>No progress pics yet. Add one above.</Text>
      ) : (
        <>
          <View style={styles.grid}>
            {pics.map((pic) => (
              <View key={pic.id} style={styles.card}>
                <Image
                  source={{ uri: pic.imageUrl.startsWith("http") ? pic.imageUrl : `${base}${pic.imageUrl}` }}
                  style={styles.thumb}
                />
                <Text style={styles.cardLabel} numberOfLines={1}>{pic.label || formatDate(pic.createdAt)}</Text>
                <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(pic.id)}>
                  <Text style={styles.delBtnText}>Del</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          {totalPages > 1 && (
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
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scroll: { padding: 16, paddingBottom: 40 },
  form: { backgroundColor: theme.card, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
  formHint: { color: theme.muted, fontSize: 12, marginBottom: 8 },
  err: { color: theme.error, fontSize: 13, marginBottom: 8 },
  galleryBtn: { backgroundColor: theme.placeholder, borderRadius: 10, paddingVertical: 12, marginBottom: 10, alignItems: "center" },
  galleryBtnDisabled: { opacity: 0.6 },
  galleryBtnText: { color: theme.foreground, fontWeight: "600" },
  input: { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: theme.foreground, marginBottom: 8 },
  inputShort: { marginBottom: 10 },
  addBtn: { backgroundColor: theme.accent, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { color: theme.foreground, fontWeight: "600" },
  loader: { marginVertical: 24 },
  muted: { color: theme.muted, textAlign: "center", padding: 24 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { width: CARD_SIZE, marginBottom: 4 },
  thumb: { width: "100%", aspectRatio: 1, borderRadius: 10, backgroundColor: theme.placeholder },
  cardLabel: { color: theme.foreground, fontWeight: "600", fontSize: 13, marginTop: 4 },
  delBtn: { marginTop: 4 },
  delBtnText: { color: theme.error, fontSize: 12 },
  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 20 },
  pageBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: theme.card, borderRadius: 10, borderWidth: 1, borderColor: theme.border },
  pageBtnDisabled: { opacity: 0.5 },
  pageBtnText: { color: theme.foreground },
  pageInfo: { color: theme.muted, fontSize: 14 },
});
