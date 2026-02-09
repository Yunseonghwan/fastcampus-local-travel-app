import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { getPlaceRecommendations } from '@/lib/gemini';

const LOCATION_INTERVAL = 3000;

export default function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      // 최초 위치 가져오기
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      // 최초 접속 시 장소 추천 조회
      const recommendation = await getPlaceRecommendations(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
      );
      console.log('장소 추천 결과:', recommendation);

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
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    width: '100%',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
