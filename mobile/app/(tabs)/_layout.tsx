import { View, Text } from "react-native";
import { Tabs } from "expo-router";
import FloatingChatButton from "../../src/components/FloatingChatButton";
import { useAuth } from "../../src/auth-context";
import { usePushToken, useNotificationResponse } from "../../src/usePushToken";
import { useUnreadCounts } from "../../src/UnreadCountsContext";
import { theme } from "../../src/theme";

const tabIcons: Record<string, string> = {
  feed: "📷",
  health: "📝",
  friends: "👥",
  chat: "💬",
  more: "⋯",
};

function TabIcon({ name, color }: { name: string; color: string }) {
  return <Text style={{ fontSize: 22, color }}>{tabIcons[name] ?? "•"}</Text>;
}

export default function TabsLayout() {
  const { user } = useAuth();
  const { chatUnread, notificationUnread, refresh } = useUnreadCounts();
  usePushToken(user?.id ?? null);
  useNotificationResponse(refresh);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.foreground,
          tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.border },
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: theme.muted,
          tabBarIcon: ({ color }) => <TabIcon name={route.name} color={color} />,
          tabBarBadge:
            route.name === "chat" && chatUnread > 0
              ? chatUnread > 99
                ? "99+"
                : chatUnread
              : route.name === "more" && notificationUnread > 0
                ? notificationUnread > 99
                  ? "99+"
                  : notificationUnread
                : undefined,
        })}
      >
        <Tabs.Screen name="feed" options={{ title: "Feed" }} />
        <Tabs.Screen name="health" options={{ title: "Add Log" }} />
        <Tabs.Screen name="friends" options={{ title: "Friends" }} />
        <Tabs.Screen name="chat" options={{ title: "Chat" }} />
        <Tabs.Screen name="more" options={{ title: "More" }} />
      </Tabs>
      <FloatingChatButton />
    </View>
  );
}
