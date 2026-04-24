import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.dropfit.drop",
  appName: "DROP Fitness",
  webDir: "out",
  server: {
    url: "https://dropfit.app",
    cleartext: false,
  },
  ios: {
    scheme: "DROP Fitness",
    contentInset: "automatic",
    allowsLinkPreview: false,
    scrollEnabled: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#111111",
      showSpinner: false,
      launchAutoHide: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#111111",
    },
  },
};

export default config;
