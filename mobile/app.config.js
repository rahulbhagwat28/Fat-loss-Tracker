export default {
  expo: {
    name: "Fat Loss Tracker",
    slug: "fat-loss-tracker",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "dark",
    splash: { resizeMode: "contain", backgroundColor: "#0f172a" },
    assetBundlePatterns: ["**/*"],
    ios: { supportsTablet: true, bundleIdentifier: "com.fatlosstracker.app" },
    android: {
      adaptiveIcon: { backgroundColor: "#0f172a" },
      package: "com.fatlosstracker.app",
    },
    scheme: "fatlosstracker",
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
    },
  },
};
