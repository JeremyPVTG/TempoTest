import type { ExpoConfig } from "@expo/config";

const config: ExpoConfig = {
  name: "Habituals",
  slug: "habituals",
  scheme: "habituals",
  version: "0.1.0",
  orientation: "portrait",
  platforms: ["ios", "android"],
  newArchEnabled: true,
  experiments: { typedRoutes: true },
  plugins: [],
  ios: { 
    bundleIdentifier: "com.pivot.habituals", 
    supportsTablet: true 
  },
  android: { 
    package: "com.pivot.habituals", 
    permissions: [] 
  },
  extra: {
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    EXPO_PUBLIC_RC_API_KEY_IOS: process.env.EXPO_PUBLIC_RC_API_KEY_IOS,
    EXPO_PUBLIC_RC_API_KEY_ANDROID: process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID
  }
};

export default config;