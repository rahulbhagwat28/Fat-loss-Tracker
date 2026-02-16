import { Stack } from "expo-router";
import { theme } from "../../../src/theme";

export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.foreground,
        headerBackTitle: "Chat",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Chat" }} />
      <Stack.Screen name="[userId]" options={{ title: "Chat" }} />
    </Stack>
  );
}
