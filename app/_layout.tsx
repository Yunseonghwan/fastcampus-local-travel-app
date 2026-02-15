import { useColorScheme } from "@/hooks/use-color-scheme";
import { useNotifications } from "@/hooks/use-notifications";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import * as Sentry from "@sentry/react-native";
import * as Location from "expo-location";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef } from "react";
import { Alert, AppState, Linking } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

Sentry.init({
  dsn: "",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export default Sentry.wrap(function RootLayout() {
  const colorScheme = useColorScheme();
  const appState = useRef(AppState.currentState);

  // 앱 시작 시 알림 권한 요청 및 리스너 등록
  useNotifications();

  const showPermissionAlert = useCallback(() => {
    Alert.alert(
      "위치 권한 필요",
      "주변 장소를 찾기 위해 위치 권한이 필요합니다. 설정에서 위치 권한을 허용해주세요.",
      [
        {
          text: "설정으로 이동",
          onPress: () => Linking.openSettings(),
        },
      ],
      { cancelable: false },
    );
  }, []);

  const checkPermissionStatus = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status === "granted") {
        return;
      } else {
        showPermissionAlert();
      }
    } catch (error) {
      console.error("위치 권한 확인 오류:", error);
    }
  }, [showPermissionAlert]);

  const checkAndRequestPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        return;
      } else {
        showPermissionAlert();
      }
    } catch (error) {
      console.error("위치 권한 요청 오류:", error);
      return;
    }
  }, [showPermissionAlert]);

  useEffect(() => {
    checkAndRequestPermission();

    const handleAppStateChange = async (nextAppState: string) => {
      // 백그라운드에서 포그라운드로 돌아왔을 때
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        await checkPermissionStatus();
      }
      appState.current = nextAppState as typeof appState.current;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [checkAndRequestPermission, checkPermissionStatus]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="place/[id]" options={{ title: "장소 상세" }} />
          <Stack.Screen name="memo" options={{ title: "메모 작성" }} />
          <Stack.Screen name="webview" options={{ title: "상세 정보" }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
});
