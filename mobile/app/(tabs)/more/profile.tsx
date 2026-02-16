import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../../src/auth-context";
import { apiJson, apiFetch, getApiBase } from "../../../src/api";
import { getMaintenanceCalories } from "../../../src/maintenance";
import { theme } from "../../../src/theme";

type ProfileStats = { age: number | null; sex: string | null; heightInches: number | null; weightLbs: number | null };

export default function ProfileScreen() {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [weightLbs, setWeightLbs] = useState("");

  const ageVal = stats?.age ?? (age.trim() ? Number(age) : null);
  const sexVal = stats?.sex ?? (sex.trim() ? sex.trim() : null);
  const heightInchesVal =
    stats?.heightInches ??
    (heightFeet.trim() && heightInches.trim()
      ? Number(heightFeet) * 12 + Number(heightInches)
      : null);
  const weightLbsVal = stats?.weightLbs ?? (weightLbs.trim() ? Number(weightLbs) : null);
  const maintenance = getMaintenanceCalories(ageVal, sexVal, heightInchesVal, weightLbsVal);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showStatsForm, setShowStatsForm] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const base = getApiBase();

  const changeProfilePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setMessage("Gallery permission is required to change photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploadingAvatar(true);
    setMessage("");
    setProfileError(null);
    try {
      const formData = new FormData();
      formData.append("type", "avatar");
      formData.append("file", {
        uri: asset.uri,
        name: asset.fileName ?? "avatar.jpg",
        type: asset.mimeType ?? "image/jpeg",
      } as unknown as Blob);
      const res = await apiFetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Upload failed");
      const url = (data as { url: string }).url;
      await apiJson("/api/profile/avatar", {
        method: "PATCH",
        body: JSON.stringify({ avatarUrl: url }),
      });
      await refreshUser();
      setMessage("Profile photo updated!");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to update photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const loadProfile = async () => {
    setLoadingStats(true);
    setProfileError(null);
    try {
      const data = await apiJson<ProfileStats>("/api/profile");
      setStats(data);
      setAge(data.age != null ? String(data.age) : "");
      setSex(data.sex ?? "");
      setHeightFeet(data.heightInches != null ? String(Math.floor(data.heightInches / 12)) : "");
      setHeightInches(data.heightInches != null ? String(Math.round(data.heightInches % 12)) : "");
      setWeightLbs(data.weightLbs != null ? String(data.weightLbs) : "");
    } catch (e) {
      setStats(null);
      const msg = e instanceof Error ? e.message : "Request failed";
      setProfileError(msg);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (user && !loadingStats && stats === null) {
      setAge(user.age != null ? String(user.age) : "");
      setSex(user.sex ?? "");
      setHeightFeet(user.heightInches != null ? String(Math.floor(user.heightInches / 12)) : "");
      setHeightInches(user.heightInches != null ? String(Math.round(user.heightInches % 12)) : "");
      setWeightLbs(user.weightLbs != null ? String(user.weightLbs) : "");
    }
  }, [user, loadingStats, stats]);

  const saveProfileStats = async () => {
    setSaving(true);
    setMessage("");
    try {
      await apiJson("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({
          age: age === "" ? null : Number(age),
          sex: sex === "" ? null : sex,
          heightInches:
            heightFeet !== "" && heightInches !== ""
              ? Number(heightFeet) * 12 + Number(heightInches)
              : null,
          weightLbs: weightLbs === "" ? null : Number(weightLbs),
        }),
      });
      await refreshUser();
      await loadProfile();
      setMessage("Profile updated!");
      setShowStatsForm(false);
    } catch {
      setMessage("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  if (loadingStats) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  const isLocalhost = base.includes("localhost") || base.includes("127.0.0.1");

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {profileError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Can't reach server</Text>
            <Text style={styles.errorText}>{profileError}</Text>
            {Platform.OS !== "web" && (
              <Text style={styles.errorHint}>
                1) Backend: in project root run "npm run dev" (must use --hostname 0.0.0.0).{"\n"}
                2) In mobile/.env set EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:3000{"\n"}
                3) Restart Expo (r in terminal) or rebuild the app.
              </Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={changeProfilePhoto}
            disabled={uploadingAvatar}
            activeOpacity={0.8}
          >
            {user.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl.startsWith("http") ? user.avatarUrl : `${base}${user.avatarUrl}` }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarLetter}>{user.name.charAt(0)}</Text>
                <Text style={styles.avatarAddPhotoHint}>Add photo</Text>
              </View>
            )}
            <View style={[styles.avatarBadge, uploadingAvatar && styles.avatarBadgeBusy]}>
              <Text style={styles.avatarBadgeText}>{uploadingAvatar ? "..." : "📷"}</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.tapToChangeHint}>Tap photo or button below to change</Text>
          <TouchableOpacity
            style={[styles.changePhotoBtn, uploadingAvatar && styles.changePhotoBtnDisabled]}
            onPress={changeProfilePhoto}
            disabled={uploadingAvatar}
            activeOpacity={0.8}
          >
            <Text style={styles.changePhotoBtnText}>
              {uploadingAvatar ? "Updating..." : user.avatarUrl ? "Change profile photo" : "Add profile photo"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        {maintenance != null ? (
          <View style={styles.maintenanceBox}>
            <Text style={styles.maintenanceLabel}>Maintenance calories</Text>
            <Text style={styles.maintenanceValue}>{maintenance} cal / day</Text>
            <Text style={styles.maintenanceSub}>Based on your age, sex, height & weight.</Text>
          </View>
        ) : (
          <View style={[styles.maintenanceBox, styles.maintenanceBoxEmpty]}>
            <Text style={styles.maintenanceLabel}>Maintenance calories</Text>
            <Text style={styles.maintenanceHint}>Fill in Age, Sex, Height & Weight below and tap Save to see your daily maintenance.</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.accordion}
          onPress={() => setShowStatsForm((v) => !v)}
        >
          <Text style={styles.accordionText}>Your stats (for maintenance calories)</Text>
          <Text style={styles.accordionChevron}>{showStatsForm ? "▼" : "▶"}</Text>
        </TouchableOpacity>

        {showStatsForm && (
          <View style={styles.form}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="25"
              placeholderTextColor="#64748b"
              keyboardType="number-pad"
            />
            <Text style={styles.label}>Sex</Text>
            <TextInput
              style={styles.input}
              value={sex}
              onChangeText={setSex}
              placeholder="e.g. male / female"
              placeholderTextColor="#64748b"
            />
            <Text style={styles.label}>Height (feet)</Text>
            <TextInput
              style={styles.input}
              value={heightFeet}
              onChangeText={setHeightFeet}
              placeholder="5"
              placeholderTextColor="#64748b"
              keyboardType="number-pad"
            />
            <Text style={styles.label}>Height (inches)</Text>
            <TextInput
              style={styles.input}
              value={heightInches}
              onChangeText={setHeightInches}
              placeholder="10"
              placeholderTextColor="#64748b"
              keyboardType="number-pad"
            />
            <Text style={styles.label}>Weight (lbs)</Text>
            <TextInput
              style={styles.input}
              value={weightLbs}
              onChangeText={setWeightLbs}
              placeholder="150"
              placeholderTextColor="#64748b"
              keyboardType="decimal-pad"
            />
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={saveProfileStats}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save"}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.statsRow}>
          {stats?.age != null && <Text style={styles.stat}>Age: {stats.age}</Text>}
          {stats?.sex && <Text style={styles.stat}>Sex: {stats.sex}</Text>}
          {stats?.heightInches != null && (
            <Text style={styles.stat}>
              Height: {Math.floor(stats.heightInches / 12)}'{stats.heightInches % 12}"
            </Text>
          )}
          {stats?.weightLbs != null && <Text style={styles.stat}>Weight: {stats.weightLbs} lbs</Text>}
        </View>

        {Platform.OS !== "web" && (
          <View style={styles.serverRow}>
            <Text style={styles.serverLabel}>Server: {base}</Text>
            {isLocalhost && (
              <Text style={styles.serverWarn}>Use your computer's IP on a real device</Text>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 16, paddingBottom: 40 },
  section: { alignItems: "center", marginBottom: 24 },
  avatarWrap: { marginBottom: 6, position: "relative" },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: { backgroundColor: theme.placeholder, justifyContent: "center", alignItems: "center" },
  avatarLetter: { color: theme.muted, fontSize: 36, fontWeight: "600" },
  avatarAddPhotoHint: { color: theme.muted, fontSize: 11, marginTop: 4 },
  avatarBadge: { position: "absolute", right: 0, bottom: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: theme.accent, justifyContent: "center", alignItems: "center" },
  avatarBadgeBusy: { backgroundColor: theme.muted },
  avatarBadgeText: { fontSize: 14 },
  tapToChangeHint: { color: theme.muted, fontSize: 13, marginBottom: 10 },
  changePhotoBtn: {
    alignSelf: "stretch",
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.accent,
    backgroundColor: "rgba(52,211,153,0.2)",
    alignItems: "center",
  },
  changePhotoBtnDisabled: { opacity: 0.6, borderColor: theme.muted, backgroundColor: "rgba(167,243,208,0.15)" },
  changePhotoBtnText: { color: theme.accent, fontWeight: "700", fontSize: 16 },
  name: { color: theme.foreground, fontSize: 22, fontWeight: "700" },
  email: { color: theme.muted, fontSize: 14, marginTop: 4 },
  message: { color: theme.accent, textAlign: "center", marginBottom: 12 },
  accordion: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
  accordionText: { color: theme.foreground, fontWeight: "500" },
  accordionChevron: { color: theme.muted },
  form: { marginBottom: 16 },
  label: { color: theme.muted, fontSize: 12, marginBottom: 4 },
  input: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: theme.foreground, marginBottom: 12 },
  saveBtn: { backgroundColor: theme.accent, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: theme.foreground, fontWeight: "600" },
  maintenanceBox: { backgroundColor: theme.card, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
  maintenanceBoxEmpty: { borderColor: theme.accent, backgroundColor: "rgba(52,211,153,0.12)" },
  maintenanceLabel: { color: theme.muted, fontSize: 12 },
  maintenanceValue: { color: theme.accent, fontSize: 22, fontWeight: "700", marginTop: 4 },
  maintenanceSub: { color: theme.muted, fontSize: 12, marginTop: 4 },
  maintenanceHint: { color: theme.foreground, fontSize: 14, marginTop: 6 },
  errorBox: { backgroundColor: theme.errorBg, borderWidth: 1, borderColor: theme.error, borderRadius: 12, padding: 14, marginBottom: 16 },
  errorTitle: { color: theme.error, fontWeight: "700", fontSize: 15 },
  errorText: { color: "#fca5a5", fontSize: 13, marginTop: 4 },
  errorHint: { color: "#fcd34d", fontSize: 12, marginTop: 8 },
  serverRow: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.border },
  serverLabel: { color: theme.muted, fontSize: 11 },
  serverWarn: { color: "#f59e0b", fontSize: 11, marginTop: 2 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stat: { color: theme.muted, fontSize: 14 },
});
