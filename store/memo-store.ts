import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface MemoData {
  placeName: string;
  content: string;
  hashtags: string[];
  createdAt: number;
}

interface MemoStore {
  memos: Record<string, MemoData>; // key: placeName

  /** 메모 저장 (해시태그 포함) */
  saveMemo: (data: MemoData) => void;

  /** 장소명으로 메모 조회 */
  getMemo: (placeName: string) => MemoData | undefined;

  /** 장소명으로 해시태그만 조회 */
  getHashtags: (placeName: string) => string[];

  /** 메모 삭제 */
  removeMemo: (placeName: string) => void;
}

export const useMemoStore = create<MemoStore>()(
  persist(
    (set, get) => ({
      memos: {},

      saveMemo: (data) =>
        set((state) => ({
          memos: {
            ...state.memos,
            [data.placeName]: data,
          },
        })),

      getMemo: (placeName) => get().memos[placeName],

      getHashtags: (placeName) => get().memos[placeName]?.hashtags ?? [],

      removeMemo: (placeName) =>
        set((state) => {
          const { [placeName]: _, ...rest } = state.memos;
          return { memos: rest };
        }),
    }),
    {
      name: "memo-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
