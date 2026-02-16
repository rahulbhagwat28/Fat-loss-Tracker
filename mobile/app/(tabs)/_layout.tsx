import { View, Text } from "react-native";
import { Tabs } from "expo-router";
import FloatingChatButton from "../../src/components/FloatingChatButton";
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
