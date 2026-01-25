import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function MemoScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('알림', '제목과 내용을 모두 입력해주세요.');
      return;
    }

    // 여기에 메모 저장 로직 추가
    Alert.alert('저장 완료', '메모가 저장되었습니다.', [
      { text: '확인', onPress: () => router.back() },
    ]);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>제목</Text>
          <TextInput
            style={styles.input}
            placeholder="메모 제목을 입력하세요"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>내용</Text>
          <TextInput
            style={[styles.input, styles.contentInput]}
            placeholder="메모 내용을 입력하세요"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>저장하기</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contentInput: {
    height: 200,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
