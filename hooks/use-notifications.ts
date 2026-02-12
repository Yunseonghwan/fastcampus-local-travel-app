import type { EventSubscription } from "expo-modules-core";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, Linking, Platform } from "react-native";

// 포그라운드에서 알림을 표시하기 위한 핸들러
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function useNotifications() {
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const notificationListener = useRef<EventSubscription | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);
  const appState = useRef(AppState.currentState);
  const hasRequestedOnce = useRef(false);

  // 설정 이동 안내 Alert
  const showPermissionAlert = useCallback(() => {
    Alert.alert(
      "알림 권한 필요",
      "장소 추천 알림을 받기 위해 알림 권한이 필요합니다. 설정에서 알림 권한을 허용해주세요.",
      [
        { text: "나중에", style: "cancel" },
        { text: "설정으로 이동", onPress: () => Linking.openSettings() },
      ],
    );
  }, []);

  /**
   * 알림 권한 요청
   * - Device.isDevice 체크를 하지 않아 에뮬레이터/시뮬레이터에서도 권한 다이얼로그가 표시됨
   * - Push Token 발급은 에뮬레이터에서 실패할 수 있으므로 별도 try-catch 처리
   */
  const requestPermission = useCallback(async () => {
    try {
      // Android 8.0+ 알림 채널 설정 (필수)
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "기본 알림",
          description: "장소 추천 및 일반 알림",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#007AFF",
        });
      }

      // 현재 권한 상태 확인
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // 권한이 부여되지 않은 경우 요청
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        // 최초 요청이 아닌 경우에만 설정 이동 안내 (첫 거부 시에는 조용히 처리)
        if (hasRequestedOnce.current) {
          showPermissionAlert();
        }
        hasRequestedOnce.current = true;
        setPermissionGranted(false);
        return;
      }

      hasRequestedOnce.current = true;
      setPermissionGranted(true);

      // Expo Push Token 가져오기
      // 에뮬레이터/시뮬레이터에서는 실패할 수 있으므로 별도 try-catch
    } catch (error) {
      console.error("알림 권한 요청 중 오류:", error);
    }
  }, [showPermissionAlert]);

  // 설정에서 복귀 시 권한 상태 재확인
  const checkPermissionOnResume = useCallback(async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === "granted") {
        setPermissionGranted(true);
      } else {
        setPermissionGranted(false);
        showPermissionAlert();
      }
    } catch (error) {
      console.error("알림 권한 확인 오류:", error);
    }
  }, [showPermissionAlert]);

  useEffect(() => {
    // 앱 시작 시 알림 권한 요청
    requestPermission();

    // 포그라운드 알림 수신 리스너
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("알림 수신:", notification);
      });

    // 알림 탭 리스너
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("알림 탭:", response);
      });

    // 백그라운드 → 포그라운드 복귀 시 권한 재확인
    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          checkPermissionOnResume();
        }
        appState.current = nextAppState;
      },
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
      appStateSubscription.remove();
    };
  }, [requestPermission, checkPermissionOnResume]);

  return { permissionGranted };
}
