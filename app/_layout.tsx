import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown:false }} />
        <Stack.Screen name="place/[id]" options={{ title: '장소 상세' }} />
        <Stack.Screen name="memo" options={{ title: '메모 작성' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
