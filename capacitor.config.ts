import type { CapacitorConfig } from "@capacitor/cli";

// Set CAPACITOR_SERVER_URL to your Vercel URL (e.g. https://your-app.vercel.app)
// so the mobile app loads your live site. If unset, the app shows a placeholder.
const serverUrl =
  process.env.CAPACITOR_SERVER_URL || "https://bhagwats-projects.vercel.app";

const config: CapacitorConfig = {
  appId: "com.fatlosstracker.app",
  appName: "Fat Loss Fitness Tracker",
  webDir: "public",
  server: {
    url: serverUrl,
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
