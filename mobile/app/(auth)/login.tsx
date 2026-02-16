import { router } from "expo-router";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../src/auth-context";
import { theme } from "../../src/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, user } = useAuth();

  useEffect(() => {
    if (user) router.replace("/(tabs)/feed");
  }, [user]);

  if (user) return null;

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Fat Loss Tracker</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#64748b"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor="#64748b"
          secureTextEntry
        />
        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign in</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/(auth)/register")} style={styles.link}>
          <Text style={styles.linkText}>Don't have an account? Sign up</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: theme.background },
  card: { backgroundColor: theme.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: theme.border },
  title: { fontSize: 24, fontWeight: "700", color: theme.foreground, textAlign: "center" },
  subtitle: { color: theme.muted, textAlign: "center", marginTop: 8, marginBottom: 24 },
  errorBox: { backgroundColor: theme.errorBg, padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: "#fca5a5", fontSize: 14 },
  label: { color: theme.muted, fontSize: 14, marginBottom: 6 },
  input: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 14,
    color: theme.foreground,
    fontSize: 16,
    marginBottom: 16,
  },
  button: { backgroundColor: theme.accent, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: theme.foreground, fontWeight: "600", fontSize: 16 },
  link: { marginTop: 20, alignItems: "center" },
  linkText: { color: theme.accent, fontSize: 14 },
});
