import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

const genAI = new GoogleGenAI({ apiKey: API_KEY });

export interface PlaceRecommendationType {
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  rating: number;
  image_url: string;
}

export const getPlaceRecommendations = async (
  latitude: number,
  longitude: number,
): Promise<PlaceRecommendationType | null> => {
  const prompt = `
    당신은 현지 여행 가이드입니다. 다음 위치 주변에서 가장 추천할 만한 장소 1곳을 알려주세요.
    현재 위치는 위도 ${latitude}, 경도 ${longitude} 입니다.
    
    주변 상황(시간대, 날씨)을 고려해서 지금 방문하기 좋은 장소를 추천해주세요.
    실제로 존재하는 장소를 추천하고, 해당 장소의 실제 좌표를 포함해주세요.

    다음 JSON형식으로만 응답해주세요.(다른 텍스트 없이):
    {
    "name": "장소 이름",
    "description": "장소 설명",
    "category": "장소 카테고리",
    "latitude": 장소 위도,
    "longitude": 장소 경도,
    "rating": 장소 평점,
    "image_url": 장소 이미지 URL
    (예시: "image_url": "https://images.insplash.com/photo-...형식")
    }
    `;
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/) || [];
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0] || "") as PlaceRecommendationType | null;
    }
    return null;
  } catch (error) {
    console.error("장소 추천 실패:", error);
    return null;
  }
};

export const generateHashTags = async (
  memoContent: string,
  placeName: string,
): Promise<string[] | null> => {
  const prompt = `다음은 "${placeName}" 장소에 대한 사용자 메모입니다: ${memoContent}
  이 메모 내용을 분속하여 핵심 키도르를 해시태그로 변환해 주세요.
  - 3~5개의 해시태그를 생성해주세요
  - 장소 특성, 감정, 분위기, 음식, 활동 들을 포함해주세요
  - 한국어로 작성해주세요
  - #을 폼한한 형대로 작성해주세요
  다음 JSON 배열 형식으로만 응답해주세요(다른 텍스트 없이):
  ['#해시태그1', '#해시태그2', '#해시태그3']
  `;
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/) || [];
    if (jsonMatch) {
      const hashTags = JSON.parse(jsonMatch[0] || "") as string[];
      return hashTags.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));
    }
    return [];
  } catch (error) {
    console.error("해시태그 생성 실패:", error);
    return [];
  }
};
