import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/auth-context";
import { UnreadCountsProvider } from "../src/UnreadCountsContext";
import { theme } from "../src/theme";

export default function RootLayout() {
  return (
    <AuthProvider>
      <UnreadCountsProvider>
        <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      </UnreadCountsProvider>
    </AuthProvider>
  );
}
