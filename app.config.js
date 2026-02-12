export default {
  expo: {
    name: "local-travel-app",
    slug: "local-travel-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "localtravelapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.seonghwanyun.localtravelapp",
      buildNumber: "1",
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "앱에서 주변 장소를 찾기 위해 위치 정보를 사용합니다.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "앱에서 주변 장소를 찾기 위해 위치 정보를 사용합니다.",
        NSLocationAlwaysUsageDescription: "앱에서 주변 장소를 찾기 위해 위치 정보를 사용합니다.",
        NSUserNotificationsUsageDescription: "주변 장소 추천 알림을 보내기 위해 알림 권한이 필요합니다.",
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.seonghwanyun.localtravelapp",
      versionCode: 1,
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        }
      }
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-notifications",
        {
          icon: "./assets/images/icon.png",
          color: "#007AFF",
          sounds: [],
        },
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "앱에서 주변 장소를 찾기 위해 위치 정보를 사용합니다.",
          locationAlwaysPermission: "앱에서 주변 장소를 찾기 위해 위치 정보를 사용합니다.",
          locationWhenInUsePermission: "앱에서 주변 장소를 찾기 위해 위치 정보를 사용합니다.",
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: "35.0.0",
          },
          ios: {
            deploymentTarget: "15.1",
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
