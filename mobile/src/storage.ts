import { Platform } from "react-native";

const SESSION_KEY = "session_id";

function isWeb(): boolean {
  return Platform.OS === "web";
}

export async function getStoredSessionId(): Promise<string | null> {
  if (isWeb()) {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(SESSION_KEY);
  }
  const SecureStore = await import("expo-secure-store");
  return SecureStore.getItemAsync(SESSION_KEY);
}

export async function setStoredSessionId(sessionId: string): Promise<void> {
  if (isWeb()) {
    if (typeof localStorage !== "undefined") localStorage.setItem(SESSION_KEY, sessionId);
    return;
  }
  const SecureStore = await import("expo-secure-store");
  await SecureStore.setItemAsync(SESSION_KEY, sessionId);
}

export async function clearStoredSession(): Promise<void> {
  if (isWeb()) {
    if (typeof localStorage !== "undefined") localStorage.removeItem(SESSION_KEY);
    return;
  }
  const SecureStore = await import("expo-secure-store");
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
