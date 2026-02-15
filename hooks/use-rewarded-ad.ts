import { useCallback, useEffect, useRef } from "react";
import {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from "react-native-google-mobile-ads";

const adUnitId = TestIds.REWARDED;

/**
 * 리워드 광고를 관리하는 커스텀 훅
 * - ref 기반으로 stale closure 문제를 방지
 */
export function useRewardedAd() {
  const rewardedRef = useRef<RewardedAd | null>(null);
  const isLoadedRef = useRef(false);
  const onRewardEarnedRef = useRef<(() => void) | null>(null);
  const unsubscribesRef = useRef<(() => void)[]>([]);

  /** 리스너 정리 */
  const cleanupListeners = useCallback(() => {
    unsubscribesRef.current.forEach((unsub) => unsub());
    unsubscribesRef.current = [];
  }, []);

  /** 새 광고 인스턴스를 생성하고 로드 */
  const loadAd = useCallback(() => {
    cleanupListeners();
    isLoadedRef.current = false;

    const rewarded = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubs: (() => void)[] = [];

    unsubs.push(
      rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        isLoadedRef.current = true;
        console.log("리워드 광고 로드 완료");
      }),
    );

    unsubs.push(
      rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        console.log("리워드 획득!");
        onRewardEarnedRef.current?.();
        onRewardEarnedRef.current = null;
      }),
    );

    unsubs.push(
      rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        isLoadedRef.current = false;
        // 다음 광고를 미리 로드
        setTimeout(() => loadAd(), 1000);
      }),
    );

    unsubs.push(
      rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
        console.warn("리워드 광고 로드/표시 실패:", error);
        isLoadedRef.current = false;
        // 실패 시 재시도
        setTimeout(() => loadAd(), 5000);
      }),
    );

    unsubscribesRef.current = unsubs;
    rewardedRef.current = rewarded;
    rewarded.load();
  }, [cleanupListeners]);

  useEffect(() => {
    loadAd();
    return () => cleanupListeners();
  }, [loadAd, cleanupListeners]);

  /**
   * 리워드 광고를 표시하고, 리워드 획득 시 콜백 실행
   * ref 기반이므로 stale closure 없음
   */
  const showAd = useCallback((onRewardEarned: () => void): boolean => {
    if (!isLoadedRef.current || !rewardedRef.current) {
      console.warn("리워드 광고가 아직 로드되지 않았습니다.");
      return false;
    }

    onRewardEarnedRef.current = onRewardEarned;
    rewardedRef.current.show();
    return true;
  }, []);

  return { showAd };
}
