import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { apiJson } from "../../src/api";
import { useAuth } from "../../src/auth-context";
import { getMaintenanceCalories } from "../../src/maintenance";
import type { HealthLog } from "../../src/types";
import { theme } from "../../src/theme";

type ProfileStats = { age: number | null; sex: string | null; heightInches: number | null; weightLbs: number | null };

const today = () => new Date().toISOString().slice(0, 10);

export default function HealthScreen() {
  const { user } = useAuth();
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const maintenance =
    (profileStats
      ? getMaintenanceCalories(
          profileStats.age,
          profileStats.sex,
          profileStats.heightInches,
          profileStats.weightLbs
        )
      : null) ??
    (user
      ? getMaintenanceCalories(
          user.age ?? null,
          user.sex ?? null,
          user.heightInches ?? null,
          user.weightLbs ?? null
        )
      : null);
  const [logDate, setLogDate] = useState(today());
  const [weight, setWeight] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [energyLevel, setEnergyLevel] = useState("");
  const [steps, setSteps] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadLogForDate = async (date: string) => {
    try {
      const logs = await apiJson<HealthLog[]>("/api/health?limit=90");
      const arr = Array.isArray(logs) ? logs : [];
      const log = arr.find((l: HealthLog) => l.logDate === date);
      if (log) {
        setWeight(log.weight != null ? String(log.weight) : "");
        setCalories(log.calories != null ? String(log.calories) : "");
        setProtein(log.protein != null ? String(log.protein) : "");
        setCarbs(log.carbs != null ? String(log.carbs) : "");
        setFat(log.fat != null ? String(log.fat) : "");
        setSleepHours(log.sleepHours != null ? String(log.sleepHours) : "");
        setEnergyLevel(log.energyLevel != null ? String(log.energyLevel) : "");
        setSteps(log.steps != null ? String(log.steps) : "");
      } else {
        setWeight("");
        setCalories("");
        setProtein("");
        setCarbs("");
        setFat("");
        setSleepHours("");
        setEnergyLevel("");
        setSteps("");
      }
    } catch {}
  };

  const loadProfileStats = async () => {
    try {
      const stats = await apiJson<ProfileStats>("/api/profile");
      setProfileStats(stats);
    } catch {
      setProfileStats(null);
    }
  };

  useEffect(() => {
    loadProfileStats();
  }, []);

  useEffect(() => {
    loadLogForDate(logDate);
  }, [logDate]);

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        logDate,
        weight: weight.trim() ? Number(weight) : null,
        calories: calories.trim() ? Number(calories) : null,
        protein: protein.trim() ? Number(protein) : null,
        carbs: carbs.trim() ? Number(carbs) : null,
        fat: fat.trim() ? Number(fat) : null,
        sleepHours: sleepHours.trim() ? Number(sleepHours) : null,
        energyLevel: energyLevel.trim() ? Number(energyLevel) : null,
        steps: steps.trim() ? Number(steps) : null,
      };
      const saved = await apiJson<HealthLog>("/api/health", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setWeight(saved.weight != null ? String(saved.weight) : "");
      setCalories(saved.calories != null ? String(saved.calories) : "");
      setProtein(saved.protein != null ? String(saved.protein) : "");
      setCarbs(saved.carbs != null ? String(saved.carbs) : "");
      setFat(saved.fat != null ? String(saved.fat) : "");
      setSleepHours(saved.sleepHours != null ? String(saved.sleepHours) : "");
      setEnergyLevel(saved.energyLevel != null ? String(saved.energyLevel) : "");
      setSteps(saved.steps != null ? String(saved.steps) : "");
      setMessage("Saved!");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const calNum = calories.trim() ? Number(calories) : 0;
  const showCalorieSummary = calNum > 0;
  const showOverUnder = maintenance != null && calNum > 0;
  const overMaintenance = showOverUnder && calNum > maintenance;
  const underMaintenance = showOverUnder && calNum < maintenance;
  const atMaintenance = showOverUnder && calNum === maintenance;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Add today's log</Text>

        {maintenance != null && (
          <View style={styles.maintenanceRow}>
            <Text style={styles.maintenanceLabel}>
              Your maintenance: <Text style={styles.maintenanceValue}>{maintenance} cal</Text>/day
            </Text>
            <TouchableOpacity onPress={() => router.push("/more/profile")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.profileLink}>Profile to update</Text>
            </TouchableOpacity>
          </View>
        )}
        {maintenance == null && (
          <TouchableOpacity style={styles.maintenanceCta} onPress={() => router.push("/more/profile")} activeOpacity={0.8}>
            <Text style={styles.maintenanceCtaTitle}>Show maintenance calories</Text>
            <Text style={styles.maintenanceCtaText}>Tap here → go to Profile, enter Age, Sex, Height & Weight, then Save.</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.label}>Date</Text>
        <TextInput style={styles.input} value={logDate} onChangeText={setLogDate} placeholder="YYYY-MM-DD" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Weight (lbs)</Text>
        <TextInput style={styles.input} value={weight} onChangeText={setWeight} placeholder="e.g. 165" keyboardType="decimal-pad" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Calories</Text>
        <TextInput style={styles.input} value={calories} onChangeText={setCalories} placeholder="e.g. 2000" keyboardType="number-pad" placeholderTextColor="#64748b" />

        {showCalorieSummary && (
          <View style={[styles.calorieBox, overMaintenance && styles.calorieBoxOver]}>
            <Text style={styles.calorieExact}>{calNum} cal today</Text>
            {maintenance != null && (
              <>
                {overMaintenance && (
                  <Text style={styles.calorieOver}>{calNum - maintenance} over maintenance</Text>
                )}
                {underMaintenance && (
                  <Text style={styles.calorieUnder}>{maintenance - calNum} under maintenance</Text>
                )}
                {atMaintenance && (
                  <Text style={styles.calorieAt}>At maintenance</Text>
                )}
              </>
            )}
          </View>
        )}
        <Text style={styles.label}>Protein (g)</Text>
        <TextInput style={styles.input} value={protein} onChangeText={setProtein} placeholder="e.g. 120" keyboardType="number-pad" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Carbs (g)</Text>
        <TextInput style={styles.input} value={carbs} onChangeText={setCarbs} placeholder="e.g. 200" keyboardType="number-pad" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Fat (g)</Text>
        <TextInput style={styles.input} value={fat} onChangeText={setFat} placeholder="e.g. 65" keyboardType="number-pad" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Sleep (hours)</Text>
        <TextInput style={styles.input} value={sleepHours} onChangeText={setSleepHours} placeholder="e.g. 7" keyboardType="decimal-pad" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Energy level (1-10)</Text>
        <TextInput style={styles.input} value={energyLevel} onChangeText={setEnergyLevel} placeholder="e.g. 7" keyboardType="number-pad" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Steps</Text>
        <TextInput style={styles.input} value={steps} onChangeText={setSteps} placeholder="e.g. 8000" keyboardType="number-pad" placeholderTextColor="#64748b" />
        {message ? <Text style={message === "Saved!" ? styles.success : styles.error}>{message}</Text> : null}
        <TouchableOpacity style={[styles.button, saving && styles.buttonDisabled]} onPress={save} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? "Saving..." : "Save log"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scroll: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: "700", color: theme.foreground, marginBottom: 16 },
  maintenanceRow: { marginBottom: 12 },
  maintenanceLabel: { color: theme.muted, fontSize: 14 },
  maintenanceValue: { color: theme.foreground, fontWeight: "600" },
  profileLink: { color: theme.accent, fontSize: 13, marginTop: 2 },
  maintenanceCta: { backgroundColor: "rgba(52,211,153,0.2)", borderWidth: 1, borderColor: theme.accent, borderRadius: 12, padding: 16, marginBottom: 16 },
  maintenanceCtaTitle: { color: theme.accent, fontWeight: "700", fontSize: 16 },
  maintenanceCtaText: { color: theme.muted, fontSize: 13, marginTop: 6 },
  label: { color: theme.muted, marginBottom: 6 },
  input: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 14,
    color: theme.foreground,
    fontSize: 16,
    marginBottom: 12,
  },
  calorieBox: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  calorieBoxOver: { borderColor: "rgba(239,68,68,0.6)", backgroundColor: "rgba(239,68,68,0.1)" },
  calorieExact: { color: theme.foreground, fontWeight: "700", fontSize: 18 },
  calorieOver: { color: theme.error, fontWeight: "600", fontSize: 15, marginTop: 4 },
  calorieUnder: { color: theme.accent, fontWeight: "600", fontSize: 15, marginTop: 4 },
  calorieAt: { color: theme.muted, fontWeight: "600", fontSize: 15, marginTop: 4 },
  button: { backgroundColor: theme.accent, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 12 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: theme.foreground, fontWeight: "600" },
  success: { color: theme.accent, marginTop: 8 },
  error: { color: theme.error, marginTop: 8 },
});
