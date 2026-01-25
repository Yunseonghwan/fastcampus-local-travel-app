import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

// 임시 장소 데이터
const SAMPLE_PLACES = [
  { id: '1', name: '서울숲', description: '도심 속 힐링 공간' },
  { id: '2', name: '북촌 한옥마을', description: '전통과 현대가 공존하는 곳' },
  { id: '3', name: '익선동', description: '레트로 감성 가득한 골목' },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>장소 추천</Text>
        <Text style={styles.subtitle}>당신을 위한 특별한 장소를 발견하세요</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>추천 장소</Text>
        {SAMPLE_PLACES.map((place) => (
          <TouchableOpacity
            key={place.id}
            style={styles.placeCard}
            onPress={() => router.push(`/place/${place.id}`)}
          >
            <Text style={styles.placeName}>{place.name}</Text>
            <Text style={styles.placeDescription}>{place.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.memoButton}
        onPress={() => router.push('/memo')}
      >
        <Text style={styles.memoButtonText}>메모 작성하기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  placeCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  placeDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  memoButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  memoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
