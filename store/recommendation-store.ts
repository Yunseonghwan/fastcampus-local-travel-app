import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** 하루 무료 추천 횟수 */
const FREE_DAILY_LIMIT = 2;

/** 오늘 날짜 문자열 (YYYY-MM-DD) */
const getTodayString = () => new Date().toISOString().split("T")[0];

interface RecommendationStore {
  /** 사용한 추천 횟수 */
  usedCount: number;
  /** 마지막으로 카운트를 기록한 날짜 (YYYY-MM-DD) */
  lastDate: string;

  /** 날짜가 바뀌었으면 카운트 초기화 */
  resetIfNewDay: () => void;
  /** 무료 추천 가능 여부 */
  canRecommendFree: () => boolean;
  /** 추천 횟수 1 증가 */
  incrementCount: () => void;
}

export const useRecommendationStore = create<RecommendationStore>()(
  persist(
    (set, get) => ({
      usedCount: 0,
      lastDate: getTodayString(),

      resetIfNewDay: () => {
        const today = getTodayString();
        if (get().lastDate !== today) {
          set({ usedCount: 0, lastDate: today });
        }
      },

      canRecommendFree: () => {
        const state = get();
        const today = getTodayString();
        // 날짜가 다르면 아직 초기화 전이므로 무료 가능
        if (state.lastDate !== today) return true;
        return state.usedCount < FREE_DAILY_LIMIT;
      },

      incrementCount: () => {
        const today = getTodayString();
        set((state) => ({
          usedCount: state.lastDate !== today ? 1 : state.usedCount + 1,
          lastDate: today,
        }));
      },
    }),
    {
      name: "recommendation-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
