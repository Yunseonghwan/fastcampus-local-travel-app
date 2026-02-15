import { generateHashTags } from "@/lib/gemini";
import { useMemoStore } from "@/store/memo-store";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MemoScreen() {
  const router = useRouter();
  const { placeName } = useLocalSearchParams<{ placeName: string }>();
  const saveMemo = useMemoStore((s) => s.saveMemo);
  const existingMemo = useMemoStore((s) =>
    placeName ? s.getMemo(placeName) : undefined,
  );

  const [content, setContent] = useState(existingMemo?.content ?? "");
  const [hashtags, setHashtags] = useState<string[]>(
    existingMemo?.hashtags ?? [],
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateHashtags = async () => {
    if (!content.trim()) {
      Alert.alert("알림", "메모 내용을 먼저 입력해주세요.");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateHashTags(content, placeName || "");
      if (result && result.length > 0) {
        // 해시태그 생성 성공 → 자동 저장 후 뒤로 이동
        saveMemo({
          placeName: placeName || "",
          content: content.trim(),
          hashtags: result,
          createdAt: Date.now(),
        });
        router.back();
        return;
      } else {
        Alert.alert("알림", "해시태그 생성에 실패했습니다. 다시 시도해주세요.");
      }
    } catch {
      Alert.alert("오류", "해시태그 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemoveHashtag = (index: number) => {
    setHashtags((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView edges={["bottom"]} style={styles.inner}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 장소명 표시 */}
          {placeName && (
            <View style={styles.placeNameRow}>
              <Ionicons name="location" size={16} color="#007AFF" />
              <Text style={styles.placeName}>{placeName}</Text>
            </View>
          )}

          <Text style={styles.label}>이 장소는 어땠는지 적어주세요!</Text>

          <TextInput
            style={[styles.input, styles.contentInput]}
            placeholder="메모 내용을 입력하세요"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            placeholderTextColor="#999"
          />

          {/* 해시태그 목록 */}
          {hashtags.length > 0 && (
            <View style={styles.hashtagSection}>
              <Text style={styles.hashtagSectionTitle}>생성된 해시태그</Text>
              <View style={styles.hashtagList}>
                {hashtags.map((tag, index) => (
                  <View key={`${tag}-${index}`} style={styles.hashtagChip}>
                    <Text style={styles.hashtagText}>{tag}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveHashtag(index)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={16} color="#8EAFC5" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* 저장 버튼 */}
        <View style={styles.bottomBar}>
          <Pressable style={styles.saveButton} onPress={handleGenerateHashtags}>
            {isGenerating ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="pricetag-outline" size={18} color="#007AFF" />
            )}
            <Text style={styles.hashtagButtonText}>
              {isGenerating ? "해시태그 생성 중..." : "저장하기"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  inner: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 8,
  },
  placeNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
    backgroundColor: "#EAF4FF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  placeName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#007AFF",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  contentInput: {
    height: 200,
    textAlignVertical: "top",
  },
  hashtagButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#007AFF",
    backgroundColor: "#F0F8FF",
  },
  hashtagButtonDisabled: {
    opacity: 0.6,
  },
  hashtagButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  hashtagSection: {
    marginTop: 20,
  },
  hashtagSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    marginBottom: 10,
  },
  hashtagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  hashtagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E0F0FF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  hashtagText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0066CC",
  },
  bottomBar: {
    padding: 20,
    paddingTop: 12,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
