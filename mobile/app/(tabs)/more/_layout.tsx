import { Stack } from "expo-router";
import { theme } from "../../../src/theme";

export default function MoreLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.foreground,
      }}
    >
      <Stack.Screen name="index" options={{ title: "More" }} />
      <Stack.Screen name="history" options={{ title: "History" }} />
      <Stack.Screen name="weight-graph" options={{ title: "Weight Graph" }} />
      <Stack.Screen name="progress-pics" options={{ title: "Progress Pics" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen name="profile" options={{ title: "Profile" }} />
    </Stack>
  );
}
