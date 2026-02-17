export default {
  expo: {
    name: "Fat Loss Tracker",
    icon: "./assets/icon.png",
    plugins: [
      [
        "expo-notifications",
        {
          color: "#22c55e",
          defaultChannel: "default",
        },
      ],
    ],
    slug: "fat-loss-tracker",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0f172a",
    },
    assetBundlePatterns: ["**/*"],
    ios: { supportsTablet: true, bundleIdentifier: "com.fatlosstracker.app" },
    android: {
      icon: "./assets/icon.png",
      adaptiveIcon: {
        foregroundImage: "./assets/icon.png",
        backgroundColor: "#0f172a",
      },
      package: "com.fatlosstracker.app",
    },
    scheme: "fatlosstracker",
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
      eas: {
        projectId: "64306aea-eb6c-4ebf-8d88-044325303cdd",
      },
    },
  },
};
