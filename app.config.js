import 'dotenv/config';

const IS_DEV = process.env.APP_VARIANT === 'dev';

export default {
  expo: {
    name: IS_DEV ? "SportBuddy Dev" : "SportBuddy",
    slug: IS_DEV ? "sportbuddy-dev" : "SportBuddy",
    version: "1.0.8",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: IS_DEV ? "sportbuddydev" : "sportbuddy",
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_DEV ? "com.yane31.SportBuddyDev" : "com.yane31.SportBuddy",
      usesAppleSignIn: true,
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
      googleServicesFile: IS_DEV ? "./google-services-dev.json" : "./google-services.json",
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
          data: [{ scheme: IS_DEV ? "sportbuddydev" : "sportbuddy" }],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ],
      adaptiveIcon: {
        foregroundImage: "./assets/images/android-icon.png",
        backgroundColor: IS_DEV ? "#E85D04" : "#1D9E75"
      },
      predictiveBackGestureEnabled: false,
      package: IS_DEV ? "com.yane31.SportBuddyDev" : "com.yane31.SportBuddy"
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
          backgroundColor: IS_DEV ? "#E85D04" : "#0F1923",
          dark: { backgroundColor: IS_DEV ? "#E85D04" : "#0F1923" }
        }
      ],
      "@react-native-community/datetimepicker",
      "expo-web-browser",
      "expo-apple-authentication",
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
        projectId: IS_DEV
          ? '0936013b-5797-45ac-b1cb-6f6e3134d385'
          : 'e7709b1f-aabd-49a4-86c9-f6c7ae3b16db'
      }
    },
    owner: "yane31",
    runtimeVersion: {
      policy: "appVersion"
    },
    updates: {
      url: IS_DEV
        ? "https://u.expo.dev/0936013b-5797-45ac-b1cb-6f6e3134d385"
        : "https://u.expo.dev/e7709b1f-aabd-49a4-86c9-f6c7ae3b16db"
    }
  }
};