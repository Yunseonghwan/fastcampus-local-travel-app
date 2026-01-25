import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

// 임시 장소 상세 데이터
const PLACE_DETAILS: Record<string, { name: string; description: string; address: string; hours: string }> = {
  '1': {
    name: '서울숲',
    description: '서울의 대표적인 도시 숲으로, 다양한 생태 체험과 휴식을 즐길 수 있는 공간입니다. 가족 나들이, 데이트 코스로 인기가 많습니다.',
    address: '서울특별시 성동구 뚝섬로 273',
    hours: '상시 개방',
  },
  '2': {
    name: '북촌 한옥마을',
    description: '조선시대 양반들이 살던 한옥들이 밀집해 있는 전통 마을입니다. 골목골목 걸으며 한국의 전통 건축미를 느낄 수 있습니다.',
    address: '서울특별시 종로구 북촌로 일대',
    hours: '상시 개방 (일부 시설 제외)',
  },
  '3': {
    name: '익선동',
    description: '100년이 넘은 한옥들 사이에 트렌디한 카페와 음식점이 들어선 복합 문화 공간입니다. 레트로 감성과 현대적 감각이 조화를 이룹니다.',
    address: '서울특별시 종로구 익선동 일대',
    hours: '상시 개방',
  },
};

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const place = PLACE_DETAILS[id || '1'];

  if (!place) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>장소를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>📍</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.name}>{place.name}</Text>
        <Text style={styles.description}>{place.description}</Text>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>주소</Text>
            <Text style={styles.infoValue}>{place.address}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>운영시간</Text>
            <Text style={styles.infoValue}>{place.hours}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.memoButton}
          onPress={() => router.push('/memo')}
        >
          <Text style={styles.memoButtonText}>이 장소에 메모 남기기</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8e8e8',
  },
  imagePlaceholderText: {
    fontSize: 64,
  },
  content: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 20,
  },
  infoSection: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoItem: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
  },
  memoButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  memoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
});
