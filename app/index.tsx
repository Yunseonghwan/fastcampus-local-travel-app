import { getPlaceRecommendations, PlaceRecommendationType } from "@/lib/gemini";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

const LOCATION_INTERVAL = 3000;
const RECOMMENDATION_INTERVAL = 600000; // 10분

// 카테고리 → Ionicons 아이콘 매핑
const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
  const lower = category.toLowerCase();

  if (
    lower.includes("카페") ||
    lower.includes("coffee") ||
    lower.includes("cafe")
  )
    return "cafe";
  if (
    lower.includes("음식") ||
    lower.includes("식당") ||
    lower.includes("레스토랑") ||
    lower.includes("restaurant") ||
    lower.includes("food")
  )
    return "restaurant";
  if (
    lower.includes("공원") ||
    lower.includes("자연") ||
    lower.includes("park") ||
    lower.includes("nature")
  )
    return "leaf";
  if (
    lower.includes("쇼핑") ||
    lower.includes("마트") ||
    lower.includes("shop") ||
    lower.includes("mall")
  )
    return "cart";
  if (
    lower.includes("문화") ||
    lower.includes("박물관") ||
    lower.includes("미술관") ||
    lower.includes("museum") ||
    lower.includes("gallery")
  )
    return "color-palette";
  if (
    lower.includes("관광") ||
    lower.includes("명소") ||
    lower.includes("tourist") ||
    lower.includes("landmark")
  )
    return "camera";
  if (
    lower.includes("숙소") ||
    lower.includes("호텔") ||
    lower.includes("hotel") ||
    lower.includes("accommodation")
  )
    return "bed";
  if (
    lower.includes("바") ||
    lower.includes("술") ||
    lower.includes("bar") ||
    lower.includes("pub")
  )
    return "beer";
  if (
    lower.includes("운동") ||
    lower.includes("스포츠") ||
    lower.includes("sport") ||
    lower.includes("fitness")
  )
    return "fitness";
  if (
    lower.includes("병원") ||
    lower.includes("약국") ||
    lower.includes("medical") ||
    lower.includes("hospital")
  )
    return "medkit";
  if (
    lower.includes("종교") ||
    lower.includes("사찰") ||
    lower.includes("성당") ||
    lower.includes("교회") ||
    lower.includes("temple")
  )
    return "globe";

  return "location";
};

export default function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [isRecommending, setIsRecommending] = useState(false);
  const [recommendedPlaces, setRecommendedPlaces] = useState<
    PlaceRecommendationType[]
  >([]);
  const [recommendationResult, setRecommendationResult] = useState<{
    success: boolean;
    place: PlaceRecommendationType | null;
  } | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const mapRef = useRef<MapView>(null);
  const locationRef = useRef<Location.LocationObject | null>(null);

  // 위치 갱신 시 ref도 함께 업데이트
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  // 위치 추적
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }

      // 최초 위치 가져오기
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      // 3초 간격으로 위치 갱신
      intervalId = setInterval(async () => {
        const newLocation = await Location.getCurrentPositionAsync({});
        setLocation(newLocation);

        // 지도 중앙을 내 위치로 이동
        mapRef.current?.animateToRegion(
          {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          500,
        );
      }, LOCATION_INTERVAL);
    })();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // 1분 간격 장소 추천
  const hasLocation = location !== null;

  useEffect(() => {
    if (!hasLocation) return;

    let recommendationIntervalId: ReturnType<typeof setInterval>;

    const fetchRecommendation = async () => {
      console.log("hasLocation", "asdadsd");
      const loc = locationRef.current;
      if (!loc) return;

      setIsRecommending(true);
      setRecommendationResult(null);

      const recommendation = await getPlaceRecommendations(
        loc.coords.latitude,
        loc.coords.longitude,
      );
      console.log("장소 추천 결과:", recommendation);

      setIsRecommending(false);

      // 추천 성공 시 장소 목록에 추가 (중복 방지)
      if (recommendation) {
        setRecommendedPlaces((prev) => {
          const exists = prev.some((p) => p.name === recommendation.name);
          return exists ? prev : [...prev, recommendation];
        });
      }

      setRecommendationResult({
        success: recommendation !== null,
        place: recommendation,
      });

      // 토스트 페이드인 → 2초 유지 → 페이드아웃
      Animated.sequence([
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setRecommendationResult(null);
      });
    };

    // 최초 위치가 잡히면 바로 추천 + 1분 간격 반복
    fetchRecommendation();
    recommendationIntervalId = setInterval(
      fetchRecommendation,
      RECOMMENDATION_INTERVAL,
    );

    return () => {
      if (recommendationIntervalId) clearInterval(recommendationIntervalId);
    };
  }, [hasLocation, toastOpacity]);

  if (!location) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          title="내 위치"
        >
          <Ionicons name="location-sharp" size={36} color="#007AFF" />
        </Marker>

        {/* 추천 장소 마커 */}
        {recommendedPlaces.map((place, index) => (
          <Marker
            key={`${place.name}-${index}`}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            title={place.name}
            description={place.description}
          >
            <View style={styles.recommendMarker}>
              <View style={styles.recommendMarkerIcon}>
                <Ionicons
                  name={getCategoryIcon(place.category)}
                  size={18}
                  color="#fff"
                />
              </View>
              <View style={styles.recommendMarkerLabel}>
                <Text style={styles.recommendMarkerCategory} numberOfLines={1}>
                  {place.category}
                </Text>
                <Text style={styles.recommendMarkerName} numberOfLines={1}>
                  {place.name}
                </Text>
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* 장소 추천 로딩 표시 */}
      {isRecommending && (
        <View style={styles.recommendingOverlay}>
          <View style={styles.recommendingBox}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.recommendingText}>장소 추천 중...</Text>
          </View>
        </View>
      )}

      {/* 장소 추천 완료 토스트 */}
      {recommendationResult && (
        <Animated.View style={[styles.toastOverlay, { opacity: toastOpacity }]}>
          <View
            style={[
              styles.toastBox,
              recommendationResult.success
                ? styles.toastSuccess
                : styles.toastError,
            ]}
          >
            <Ionicons
              name={
                recommendationResult.success
                  ? "checkmark-circle"
                  : "alert-circle"
              }
              size={20}
              color="#fff"
            />
            <Text style={styles.toastText}>
              {recommendationResult.success
                ? `추천 완료: ${recommendationResult.place?.name}`
                : "추천 실패, 잠시 후 다시 시도합니다"}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    width: "100%",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  recommendingOverlay: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
  },
  recommendingBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
  },
  recommendingText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  toastOverlay: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
  },
  toastBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
  },
  toastSuccess: {
    backgroundColor: "rgba(34, 139, 34, 0.85)",
  },
  toastError: {
    backgroundColor: "rgba(220, 53, 69, 0.85)",
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    maxWidth: 250,
  },
  recommendMarker: {
    alignItems: "center",
  },
  recommendMarkerIcon: {
    backgroundColor: "#DC3545",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  recommendMarkerLabel: {
    backgroundColor: "rgba(220, 53, 69, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 2,
    maxWidth: 120,
    alignItems: "center",
  },
  recommendMarkerCategory: {
    color: "#FFD2D6",
    fontSize: 9,
    fontWeight: "600",
  },
  recommendMarkerName: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});
