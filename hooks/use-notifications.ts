import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import type { EventSubscription } from "expo-modules-core";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, Platform, Linking as RNLinking } from "react-native";

// 포그라운드에서 알림을 표시하기 위한 핸들러
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 백그라운드 알림 메시지 목록
const BACKGROUND_MESSAGES = [
  "주변에 숨겨진 맛집이 있을지도 몰라요!",
  "지금 근처에 가볼 만한 카페가 있어요!",
  "산책하기 좋은 공원이 가까이 있어요!",
  "새로운 장소를 발견해보세요!",
  "오늘의 추천 장소를 확인해보세요!",
  "근처에 인기 있는 명소가 있어요!",
  "잠깐 쉬어갈 수 있는 장소를 찾았어요!",
  "주변 맛집 정보가 업데이트되었어요!",
];

/** 백그라운드 알림 최대 예약 개수 (20초 × 50개 = ~16분) */
const BACKGROUND_NOTIFICATION_COUNT = 50;
/** 백그라운드 알림 간격 (초) */
const BACKGROUND_NOTIFICATION_INTERVAL = 20;

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
        { text: "설정으로 이동", onPress: () => RNLinking.openSettings() },
      ],
    );
  }, []);

  /**
   * 알림 권한 요청
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
        if (hasRequestedOnce.current) {
          showPermissionAlert();
        }
        hasRequestedOnce.current = true;
        setPermissionGranted(false);
        return;
      }

      hasRequestedOnce.current = true;
      setPermissionGranted(true);
    } catch (error) {
      console.error("알림 권한 요청 중 오류:", error);
    }
  }, [showPermissionAlert]);

  /**
   * 백그라운드 진입 시 20초 간격으로 로컬 알림을 예약한다.
   * iOS에서 repeats: true 는 최소 60초 제한이 있으므로,
   * 개별 알림을 20초 간격으로 다수 예약하는 방식을 사용한다.
   */
  const scheduleBackgroundNotifications = useCallback(async () => {
    try {
      // 기존 예약된 알림 모두 취소
      await Notifications.cancelAllScheduledNotificationsAsync();

      for (let i = 1; i <= BACKGROUND_NOTIFICATION_COUNT; i++) {
        const message =
          BACKGROUND_MESSAGES[
            Math.floor(Math.random() * BACKGROUND_MESSAGES.length)
          ];
        const googleMapUrl = "https://www.google.com/maps/search/nearby";
        const deepLinkUrl = Linking.createURL("/webview", {
          queryParams: {
            url: googleMapUrl,
            title: "주변 장소 탐색",
          },
        });

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "📍 주변 장소 알림",
            body: message,
            sound: true,
            data: {
              type: "background_recommendation",
              deepLinkUrl,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: BACKGROUND_NOTIFICATION_INTERVAL * i,
            repeats: false,
          },
        });
      }

      console.log(
        `백그라운드 알림 ${BACKGROUND_NOTIFICATION_COUNT}개 예약 완료 (${BACKGROUND_NOTIFICATION_INTERVAL}초 간격)`,
      );
    } catch (error) {
      console.error("백그라운드 알림 예약 실패:", error);
    }
  }, []);

  /**
   * 포그라운드 복귀 시 예약된 백그라운드 알림을 모두 취소한다.
   */
  const cancelBackgroundNotifications = useCallback(async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("예약된 백그라운드 알림 모두 취소");
    } catch (error) {
      console.error("알림 취소 실패:", error);
    }
  }, []);

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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log("알림 수신:", notification);
      });

    // 알림 탭 리스너
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        console.log("알림 탭:", response);
        const data = response.notification.request.content.data;
        if (data?.deepLinkUrl) {
          Linking.openURL(data.deepLinkUrl as string);
        }
      });

    // 앱 상태 변화 감지 (백그라운드 ↔ 포그라운드)
    const appStateSubscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        const prevState = appState.current;

        // 포그라운드 → 백그라운드: 알림 예약
        if (
          prevState === "active" &&
          nextAppState.match(/inactive|background/)
        ) {
          console.log("앱이 백그라운드로 전환됨 → 알림 예약 시작");
          await scheduleBackgroundNotifications();
        }

        // 백그라운드 → 포그라운드: 알림 취소 + 권한 재확인
        if (
          prevState.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          console.log("앱이 포그라운드로 복귀 → 예약 알림 취소");
          await cancelBackgroundNotifications();
          await checkPermissionOnResume();
        }

        appState.current = nextAppState;
      },
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
      appStateSubscription.remove();
    };
  }, [
    requestPermission,
    checkPermissionOnResume,
    scheduleBackgroundNotifications,
    cancelBackgroundNotifications,
  ]);

  return { permissionGranted };
}
