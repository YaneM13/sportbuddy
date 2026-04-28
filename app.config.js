import 'dotenv/config';

export default {
  expo: {
    name: "SportBuddy",
    slug: "SportBuddy",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "sportbuddy",
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yane31.SportBuddy",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription: "SportBuddy uses your location to show you sports events within 20km of your current position, so you can find and join local games nearby.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "SportBuddy uses your location to show you sports events within 20km of your current position, so you can find and join local games nearby.",
        NSLocationAlwaysUsageDescription: "SportBuddy uses your location to show you sports events within 20km of your current position, so you can find and join local games nearby."
      }
    },
    android: {
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      },
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [{ scheme: "sportbuddy" }],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ],
      adaptiveIcon: {
        foregroundImage: "./assets/images/icon.png",
        backgroundColor: "#1D9E75"
      },
      predictiveBackGestureEnabled: false,
      package: "com.yane31.SportBuddy"
    },
    web: {
      output: "single",
      favicon: "./assets/images/icon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#0F1923",
          dark: { backgroundColor: "#0F1923" }
        }
      ],
      "@react-native-community/datetimepicker"
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "e7709b1f-aabd-49a4-86c9-f6c7ae3b16db"
      }
    },
    owner: "yane31",
    runtimeVersion: {
      policy: "appVersion"
    },
    updates: {
      url: "https://u.expo.dev/e7709b1f-aabd-49a4-86c9-f6c7ae3b16db"
    }
  }
};