import { getPlaceRecommendations, PlaceRecommendationType } from "@/lib/gemini";
import { useMemoStore } from "@/store/memo-store";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

const RECOMMENDATION_INTERVAL = 6000000; // 100분

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
  const router = useRouter();
  const memos = useMemoStore((s) => s.memos);
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
  const [selectedPlace, setSelectedPlace] =
    useState<PlaceRecommendationType | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const mapRef = useRef<MapView>(null);
  const locationRef = useRef<Location.LocationObject | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["45%", "80%"], []);
  const pendingPlaceRef = useRef<PlaceRecommendationType | null>(null);

  // 메모 페이지에서 돌아왔을 때 바텀시트 다시 열기
  useFocusEffect(
    useCallback(() => {
      if (pendingPlaceRef.current) {
        const place = pendingPlaceRef.current;
        pendingPlaceRef.current = null;
        // 약간의 딜레이를 줘야 시트가 제대로 열림
        setTimeout(() => {
          setSelectedPlace(place);
          bottomSheetRef.current?.snapToIndex(0);
        }, 300);
      }
    }, []),
  );

  // 마커 탭 시 BottomSheet 열기
  const handleMarkerPress = useCallback((place: PlaceRecommendationType) => {
    setSelectedPlace(place);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  // BottomSheet 닫기
  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) {
      setSelectedPlace(null);
    }
  }, []);

  // 별점 렌더링
  const renderStars = useCallback((rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={18} color="#FFB800" />);
      } else if (i === fullStars && hasHalf) {
        stars.push(
          <Ionicons key={i} name="star-half" size={18} color="#FFB800" />,
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={18} color="#CCC" />,
        );
      }
    }
    return stars;
  }, []);

  const [locationError, setLocationError] = useState<string | null>(null);

  // 위치 갱신 시 ref도 함께 업데이트
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  // 위치 추적
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    let isMounted = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (isMounted) setLocationError("위치 권한이 거부되었습니다.");
          return;
        }

        // 1단계: getLastKnownPositionAsync로 빠른 초기 위치 확보 (Android에서 중요)
        try {
          const lastKnown = await Location.getLastKnownPositionAsync();
          if (lastKnown && isMounted && !locationRef.current) {
            setLocation(lastKnown);
          }
        } catch {
          // lastKnown 실패는 무시하고 진행
        }

        // 2단계: getCurrentPositionAsync로 정확한 위치 확보
        try {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy:
              Platform.OS === "android"
                ? Location.Accuracy.Balanced
                : Location.Accuracy.High,
          });
          if (isMounted) {
            setLocation(currentLocation);
          }
        } catch (e) {
          console.warn("getCurrentPositionAsync 실패:", e);
        }

        // 3단계: 3초 간격으로 위치 갱신
        intervalId = setInterval(async () => {
          try {
            const newLocation = await Location.getCurrentPositionAsync({
              accuracy:
                Platform.OS === "android"
                  ? Location.Accuracy.Balanced
                  : Location.Accuracy.High,
            });
            if (!isMounted) return;
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
          } catch (e) {
            console.warn("위치 갱신 실패:", e);
          }
        }, 3000);
      } catch (e) {
        console.error("위치 추적 초기화 실패:", e);
        if (isMounted)
          setLocationError(
            "위치를 가져올 수 없습니다. 위치 서비스를 확인해주세요.",
          );
      }
    })();

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // 1분 간격 장소 추천
  const hasLocation = location !== null;

  useEffect(() => {
    if (!hasLocation) return;

    let recommendationIntervalId: ReturnType<typeof setInterval>;

    const fetchRecommendation = async () => {
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
        {locationError ? (
          <>
            <Ionicons name="location-outline" size={48} color="#999" />
            <Text style={styles.errorText}>{locationError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setLocationError(null);
                // 권한 재요청을 트리거하기 위해 컴포넌트를 다시 마운트
                Location.requestForegroundPermissionsAsync().then(
                  ({ status }) => {
                    if (status === "granted") {
                      Location.getCurrentPositionAsync({
                        accuracy:
                          Platform.OS === "android"
                            ? Location.Accuracy.Balanced
                            : Location.Accuracy.High,
                      })
                        .then(setLocation)
                        .catch(() => {
                          setLocationError("위치를 가져올 수 없습니다.");
                        });
                    } else {
                      setLocationError("위치 권한이 거부되었습니다.");
                    }
                  },
                );
              }}
            >
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>위치를 찾고 있습니다...</Text>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={Platform.OS === "android"}
        showsMyLocationButton={Platform.OS === "android"}
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
            onPress={() => handleMarkerPress(place)}
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

      {/* 추천 장소 BottomSheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onChange={handleSheetChange}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
      >
        {selectedPlace && (
          <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
            {/* 상단 이미지 */}
            <View style={styles.sheetImageContainer}>
              {selectedPlace.image_url ? (
                <Image
                  source={{ uri: selectedPlace.image_url }}
                  style={styles.sheetImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.sheetImagePlaceholder}>
                  <Ionicons
                    name={getCategoryIcon(selectedPlace.category)}
                    size={48}
                    color="#999"
                  />
                </View>
              )}
              {/* 카테고리 뱃지 */}
              <View style={styles.categoryBadge}>
                <Ionicons
                  name={getCategoryIcon(selectedPlace.category)}
                  size={14}
                  color="#fff"
                />
                <Text style={styles.categoryBadgeText}>
                  {selectedPlace.category}
                </Text>
              </View>
            </View>

            {/* 장소명 (탭하면 웹뷰로 이동) */}
            <Pressable
              onPress={() => {
                bottomSheetRef.current?.close();
                router.push({
                  pathname: "/webview",
                  params: {
                    title: selectedPlace.name,
                    url: `https://www.google.com/search?q=${encodeURIComponent(selectedPlace.name)}`,
                  },
                });
              }}
            >
              <View style={styles.sheetPlaceNameRow}>
                <Text style={styles.sheetPlaceName}>{selectedPlace.name}</Text>
                <Ionicons name="open-outline" size={18} color="#007AFF" />
              </View>
            </Pressable>

            {/* 별점 */}
            <View style={styles.ratingRow}>
              <View style={styles.starsRow}>
                {renderStars(selectedPlace.rating)}
              </View>
              <Text style={styles.ratingText}>
                {selectedPlace.rating.toFixed(1)}
              </Text>
            </View>

            {/* 해시태그 (메모에 저장된 경우 표시) */}
            {memos[selectedPlace.name]?.hashtags?.length > 0 && (
              <View style={styles.sheetHashtagList}>
                {memos[selectedPlace.name].hashtags.map((tag, i) => (
                  <View key={`${tag}-${i}`} style={styles.sheetHashtagChip}>
                    <Text style={styles.sheetHashtagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 설명 */}
            <Text style={styles.sheetDescription}>
              {selectedPlace.description}
            </Text>

            {/* 구분선 */}
            <View style={styles.divider} />

            {/* 메모 페이지 이동 버튼 */}
            <TouchableOpacity
              style={styles.memoButton}
              onPress={() => {
                pendingPlaceRef.current = selectedPlace;
                bottomSheetRef.current?.close();
                router.push({
                  pathname: "/memo",
                  params: { placeName: selectedPlace.name },
                });
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.memoButtonText}>이 장소에 메모 남기기</Text>
            </TouchableOpacity>
          </BottomSheetScrollView>
        )}
      </BottomSheet>
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
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: "#888",
    marginTop: 4,
  },
  errorText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
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
  // BottomSheet 스타일
  sheetBackground: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetHandle: {
    backgroundColor: "#DADADA",
    width: 40,
  },
  sheetContent: {
    paddingBottom: 40,
  },
  sheetImageContainer: {
    position: "relative",
    height: 200,
    backgroundColor: "#f0f0f0",
  },
  sheetImage: {
    width: "100%",
    height: "100%",
  },
  sheetImagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ECECEC",
  },
  categoryBadge: {
    position: "absolute",
    bottom: 12,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(220, 53, 69, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  categoryBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  sheetPlaceNameRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 6,
  },
  sheetPlaceName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1A1A",
    flexShrink: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 8,
    gap: 6,
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFB800",
    marginLeft: 4,
  },
  sheetHashtagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  sheetHashtagChip: {
    backgroundColor: "#E0F0FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sheetHashtagText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0066CC",
  },
  sheetDescription: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#EFEFEF",
    marginHorizontal: 20,
    marginVertical: 20,
  },
  memoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  memoButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
