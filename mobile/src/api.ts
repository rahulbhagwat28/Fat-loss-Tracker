import Constants from "expo-constants";
import { Platform } from "react-native";
import { clearStoredSession as clearStorage, getStoredSessionId as getStorage, setStoredSessionId as setStorage } from "./storage";

const getApiUrl = (): string => {
  // When running in browser on localhost, always use local backend
  if (Platform.OS === "web" && typeof window !== "undefined" && /^https?:\/\/localhost(:\d+)?$/.test(window.location.origin)) {
    return "http://localhost:3000";
  }
  // Prefer explicit API URL (e.g. Vercel) so app works with deployed backend when using Expo Go
  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  const fromExtra = extra?.apiUrl ?? "";
  const envUrl = process.env.EXPO_PUBLIC_API_URL ?? "";
  const explicit = (fromExtra || envUrl).trim();
  if (explicit && !explicit.includes("your-app.vercel.app")) return explicit.replace(/\/$/, "");
  // When no env set: Expo Go / same machine – use dev server host and port 3000
  const hostUri = Constants.expoConfig?.hostUri as string | undefined;
  if (hostUri) {
    try {
      const match = hostUri.match(/^(?:exp|https?):\/\/([^:/]+)/);
      const host = match?.[1];
      if (host) return `http://${host}:3000`;
    } catch {}
  }
  return "http://localhost:3000";
};

export const getApiBase = getApiUrl;

export const getStoredSessionId = getStorage;
export const setStoredSessionId = setStorage;
export const clearStoredSession = clearStorage;

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const base = getApiUrl();
  const url = path.startsWith("http") ? path : `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const sessionId = await getStoredSessionId();
  const isFormData = options.body instanceof FormData;
  const headers: HeadersInit = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...(options.headers as Record<string, string>),
  };
  if (sessionId) {
    (headers as Record<string, string>)["Cookie"] = `session=${sessionId}`;
    (headers as Record<string, string>)["X-Session-Id"] = sessionId;
  }
  return fetch(url, {
    ...options,
    headers: { ...headers, ...options.headers },
    credentials: "include",
  });
}

export async function apiJson<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await apiFetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Request failed");
  return data as T;
}
