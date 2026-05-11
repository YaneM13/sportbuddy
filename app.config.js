import 'dotenv/config';

export default {
  expo: {
    name: "SportBuddy",
    slug: "SportBuddy",
    version: "1.0.4",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "sportbuddy",
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yane31.SportBuddy",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription: "SportBuddy uses your location to find sports events within 20km of your current position.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "SportBuddy uses your location to find sports events within 20km of your current position.",
        NSLocationAlwaysUsageDescription: "SportBuddy uses your location to find sports events within 20km of your current position.",
        NSPhotoLibraryUsageDescription: "SportBuddy uses your photo library to let you set a profile photo.",
        NSPhotoLibraryAddUsageDescription: "SportBuddy saves photos to your library."
      }
    },
    android: {
      googleServicesFile: "./google-services.json",
      notification: {
        icon: "./assets/images/icon.png",
        color: "#1D9E75"
      },
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
        foregroundImage: "./assets/images/android-icon.png",
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
      "@react-native-community/datetimepicker",
      "expo-web-browser",
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme: "com.googleusercontent.apps.657761128514-mgb5fbea2sv790f3gir1qrljb6a10j11"
        }
      ]
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