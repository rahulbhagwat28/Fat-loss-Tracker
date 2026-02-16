import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  TextInput,
  Modal,
  Alert,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";
import { apiJson, apiFetch } from "../../src/api";
import { useAuth } from "../../src/auth-context";
import type { Post, PostComment } from "../../src/types";
import { getApiBase } from "../../src/api";
import { theme } from "../../src/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_HEIGHT = Math.min(220, Math.round(SCREEN_WIDTH * 0.5));
const AVATAR_SIZE = Math.min(40, Math.round(SCREEN_WIDTH * 0.1));

const isVideoUrl = (url: string) => /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url);

export default function FeedScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);
  const [showAddPost, setShowAddPost] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [pickedImageUri, setPickedImageUri] = useState<string | null>(null);
  const [pickedMediaType, setPickedMediaType] = useState<"image" | "video" | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await apiJson<Post[]>("/api/posts");
      const list = Array.isArray(data) ? data : [];
      setPosts(list.map((p) => ({
        ...p,
        liked: (p.likes ?? []).some((l) => l.userId === user?.id),
        _count: {
          likes: p._count?.likes ?? (p.likes?.length ?? 0),
          comments: p._count?.comments ?? (p.comments?.length ?? 0),
        },
      })));
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const like = async (postId: string) => {
    try {
      await apiJson(`/api/posts/${postId}/like`, { method: "POST", body: JSON.stringify({}) });
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const wasLiked = p.liked ?? false;
          const count = p._count?.likes ?? p.likes?.length ?? 0;
          return { ...p, liked: !wasLiked, _count: { ...p._count, likes: count + (wasLiked ? -1 : 1) } };
        })
      );
    } catch {}
  };

  const addComment = async (postId: string) => {
    const text = (commentText[postId] ?? "").trim();
    if (!text) return;
    setSubmittingComment(postId);
    try {
      const comment = await apiJson<PostComment>(`/api/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments: [...(p.comments ?? []), comment] } : p
        )
      );
      setCommentText((prev) => ({ ...prev, [postId]: "" }));
    } catch {}
    setSubmittingComment(null);
  };

  const pickAndUploadMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setCreateError("Gallery permission is required to add a photo or video.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.85,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const hasDuration = "duration" in asset && typeof (asset as { duration?: number }).duration === "number";
    const mimeVideo = typeof asset.mimeType === "string" && asset.mimeType.startsWith("video/");
    const nameVideo = /\.(mp4|mov|webm|m4v|avi)(\?|$)/i.test(asset.fileName ?? "");
    const isVideo = hasDuration || mimeVideo || nameVideo;
    const ext = asset.fileName?.match(/\.(\w+)$/)?.[1] ?? (isVideo ? "mp4" : "jpg");
    const name = asset.fileName ?? (isVideo ? "video.mp4" : "image.jpg");
    const mime = asset.mimeType ?? (isVideo ? "video/mp4" : "image/jpeg");
    setCreateError("");
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("type", "post");
      formData.append("file", {
        uri: asset.uri,
        name,
        type: mime,
      } as unknown as Blob);
      const res = await apiFetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Upload failed");
      setNewImageUrl((data as { url: string }).url);
      setPickedImageUri(asset.uri);
      setPickedMediaType(isVideo ? "video" : "image");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      setCreateError(
        msg === "Upload failed" || msg.includes("failed")
          ? `${msg}. If you chose a video, try a shorter clip (under 1 min) or a smaller file.`
          : msg
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const clearMedia = () => {
    setNewImageUrl("");
    setPickedImageUri(null);
    setPickedMediaType(null);
  };

  const createPost = async () => {
    if (!newTitle.trim() && !newImageUrl.trim() && !newCaption.trim()) return;
    setCreateError("");
    setCreating(true);
    try {
      const post = await apiJson<Post>("/api/posts", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle.trim() || null,
          imageUrl: newImageUrl.trim() || null,
          caption: newCaption.trim() || null,
        }),
      });
      setPosts((prev) => [{
        ...post,
        liked: false,
        _count: { likes: 0, comments: post.comments?.length ?? 0 },
      }, ...prev]);
      setShowAddPost(false);
      setNewTitle("");
      setNewImageUrl("");
      setNewCaption("");
      setPickedImageUri(null);
      setPickedMediaType(null);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to post");
    } finally {
      setCreating(false);
    }
  };

  const canPost = newTitle.trim() || newImageUrl.trim() || newCaption.trim();

  const deletePost = (postId: string) => {
    Alert.alert("Delete post", "Remove this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeletingId(postId);
          try {
            await apiFetch(`/api/posts/${postId}`, { method: "DELETE" });
            setPosts((prev) => prev.filter((p) => p.id !== postId));
          } catch {}
          setDeletingId(null);
        },
      },
    ]);
  };

  if (loading && posts.length === 0) {
    return <View style={styles.centered}><Text style={styles.muted}>Loading feed...</Text></View>;
  }

  const base = getApiBase();
  const comments = (item: Post) => item.comments ?? [];
  const renderItem = ({ item }: { item: Post }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.row}>
          {item.user.avatarUrl ? (
            <Image source={{ uri: item.user.avatarUrl.startsWith("http") ? item.user.avatarUrl : `${base}${item.user.avatarUrl}` }} style={[styles.avatar, { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }]} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }]}><Text style={styles.avatarLetter}>{item.user.name.charAt(0)}</Text></View>
          )}
          <Text style={styles.name}>{item.user.name}</Text>
        </View>
        {item.user.id === user?.id && (
          <TouchableOpacity
            onPress={() => deletePost(item.id)}
            disabled={deletingId === item.id}
            style={styles.deleteBtn}
          >
            <Text style={styles.deleteBtnText}>{deletingId === item.id ? "..." : "Delete"}</Text>
          </TouchableOpacity>
        )}
      </View>
      {item.title ? <Text style={styles.title}>{item.title}</Text> : null}
      {item.imageUrl ? (
        isVideoUrl(item.imageUrl) ? (
          <Video
            source={{ uri: item.imageUrl.startsWith("http") ? item.imageUrl : `${base}${item.imageUrl}` }}
            style={[styles.image, styles.video, { height: IMAGE_HEIGHT }]}
            useNativeControls
            resizeMode="contain"
            shouldPlay={false}
            isLooping
          />
        ) : (
          <Image source={{ uri: item.imageUrl.startsWith("http") ? item.imageUrl : `${base}${item.imageUrl}` }} style={[styles.image, { height: IMAGE_HEIGHT }]} resizeMode="cover" />
        )
      ) : null}
      {item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null}
      <TouchableOpacity onPress={() => like(item.id)} style={styles.likeBtn}>
        <Text style={styles.likeText}>{item.liked ? "❤️" : "🤍"} {item._count?.likes ?? item.likes?.length ?? 0}</Text>
      </TouchableOpacity>

      <View style={styles.commentsSection}>
        <Text style={styles.commentsHeading}>Comments ({comments(item).length})</Text>
        {comments(item).map((c) => (
          <View key={c.id} style={styles.commentRow}>
            <Text style={styles.commentName}>{c.user.name}</Text>
            <Text style={styles.commentText}>{c.text}</Text>
            <Text style={styles.commentTime}>{new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</Text>
          </View>
        ))}
        <View style={styles.commentInputRow}>
          <TextInput
            style={styles.commentInput}
            value={commentText[item.id] ?? ""}
            onChangeText={(t) => setCommentText((prev) => ({ ...prev, [item.id]: t }))}
            placeholder="Add a comment..."
            placeholderTextColor="#64748b"
            returnKeyType="send"
            onSubmitEditing={() => addComment(item.id)}
          />
          <TouchableOpacity
            style={[styles.commentSubmit, (!(commentText[item.id] ?? "").trim() || submittingComment === item.id) && styles.commentSubmitDisabled]}
            onPress={() => addComment(item.id)}
            disabled={!(commentText[item.id] ?? "").trim() || submittingComment === item.id}
          >
            <Text style={styles.commentSubmitText}>{submittingComment === item.id ? "..." : "Post"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.addPostBarWrap}>
        <TouchableOpacity style={styles.addPostBar} onPress={() => setShowAddPost(true)} activeOpacity={0.8}>
          <Text style={styles.addPostBarText}>+ New post</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
        ListEmptyComponent={<Text style={styles.muted}>No posts yet. Tap "New post" above to add one.</Text>}
      />

      <Modal visible={showAddPost} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAddPost(false)} />
        <View style={styles.modalContent} pointerEvents="box-none">
          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalInner}>
              <Text style={styles.modalTitle}>New post</Text>
              <Text style={styles.modalHint}>Add at least one: title, photo/video/GIF, or description.</Text>
              {createError ? <Text style={styles.createError}>{createError}</Text> : null}

              <Text style={styles.label}>Title (optional)</Text>
              <TextInput
                style={styles.input}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="e.g. Week 3 progress"
                placeholderTextColor="#64748b"
              />

              <Text style={styles.label}>Photo, video or GIF (optional)</Text>
              <TouchableOpacity style={styles.addPhotoBtn} onPress={pickAndUploadMedia} disabled={uploadingImage}>
                <Text style={styles.addPhotoBtnText}>{uploadingImage ? "Uploading..." : "📷 Choose photo, video or GIF"}</Text>
              </TouchableOpacity>
              {(pickedImageUri || newImageUrl) ? (
                <View style={styles.imagePreviewRow}>
                  {pickedMediaType === "video" || (newImageUrl.trim() && isVideoUrl(newImageUrl)) ? (
                    <Video
                      source={{ uri: pickedImageUri ?? newImageUrl }}
                      style={styles.imagePreview}
                      useNativeControls
                      resizeMode="contain"
                      shouldPlay={false}
                    />
                  ) : (
                    <Image
                      source={{ uri: pickedImageUri ?? newImageUrl }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                  )}
                  <TouchableOpacity style={styles.removeImageBtn} onPress={clearMedia}>
                    <Text style={styles.removeImageBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              <Text style={styles.label}>Or paste image/video URL</Text>
              <TextInput
                style={styles.input}
                value={newImageUrl}
                onChangeText={(t) => { setNewImageUrl(t); if (!t) { setPickedImageUri(null); setPickedMediaType(null); } }}
                placeholder="https://..."
                placeholderTextColor={theme.muted}
                autoCapitalize="none"
              />

              <Text style={styles.label}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={newCaption}
                onChangeText={setNewCaption}
                placeholder="What's on your mind?"
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddPost(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.postBtn, (creating || !canPost) && styles.postBtnDisabled]}
                  onPress={createPost}
                  disabled={creating || !canPost}
                >
                  <Text style={styles.postBtnText}>{creating ? "Posting..." : "Post"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  addPostBarWrap: { flexDirection: "row", justifyContent: "flex-end", marginHorizontal: 16, marginTop: 12, marginBottom: 8 },
  addPostBar: { backgroundColor: theme.accent, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, alignItems: "center" },
  addPostBarText: { color: theme.foreground, fontWeight: "600", fontSize: 14 },
  list: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: theme.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center" },
  deleteBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "rgba(239,68,68,0.5)" },
  deleteBtnText: { color: theme.error, fontSize: 13 },
  avatar: {},
  avatarPlaceholder: { backgroundColor: theme.placeholder, justifyContent: "center", alignItems: "center" },
  avatarLetter: { color: theme.muted, fontWeight: "600" },
  name: { color: theme.foreground, fontWeight: "600", marginLeft: 10 },
  title: { color: theme.foreground, fontSize: 16, marginBottom: 8 },
  image: { width: "100%", borderRadius: 8, marginBottom: 8, height: IMAGE_HEIGHT },
  video: { overflow: "hidden" as const },
  caption: { color: theme.muted, marginBottom: 8 },
  likeBtn: { alignSelf: "flex-start", marginBottom: 12 },
  likeText: { color: theme.accent },
  commentsSection: { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12, marginTop: 4 },
  commentsHeading: { color: theme.muted, fontSize: 13, fontWeight: "600", marginBottom: 8 },
  commentRow: { marginBottom: 6 },
  commentName: { color: theme.accent, fontWeight: "600", fontSize: 13 },
  commentText: { color: theme.foreground, fontSize: 14, marginTop: 1 },
  commentTime: { color: theme.muted, fontSize: 11, marginTop: 2 },
  commentInputRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  commentInput: {
    flex: 1,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: theme.foreground,
    fontSize: 14,
  },
  commentSubmit: { backgroundColor: theme.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  commentSubmitDisabled: { opacity: 0.5 },
  commentSubmitText: { color: theme.foreground, fontWeight: "600", fontSize: 14 },
  muted: { color: theme.muted, textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: theme.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: 1, borderColor: theme.border, minHeight: "70%", maxHeight: "90%" },
  modalScroll: { flex: 1 },
  modalInner: { padding: 20, paddingBottom: 32 },
  modalTitle: { color: theme.foreground, fontSize: 18, fontWeight: "700", marginBottom: 4 },
  modalHint: { color: theme.muted, fontSize: 12, marginBottom: 12 },
  createError: { color: theme.error, marginBottom: 8 },
  label: { color: theme.muted, fontSize: 12, marginBottom: 4 },
  input: { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: theme.foreground, marginBottom: 12 },
  addPhotoBtn: { backgroundColor: theme.placeholder, borderRadius: 10, paddingVertical: 12, marginBottom: 8, alignItems: "center" },
  addPhotoBtnText: { color: theme.foreground, fontWeight: "600" },
  imagePreviewRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 12 },
  imagePreview: { width: 72, height: 72, borderRadius: 8, backgroundColor: theme.placeholder },
  removeImageBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: "rgba(239,68,68,0.5)" },
  removeImageBtnText: { color: theme.error, fontSize: 13 },
  inputMultiline: { minHeight: 72 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 16 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelBtnText: { color: theme.muted },
  postBtn: { backgroundColor: theme.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { color: theme.foreground, fontWeight: "600" },
});
