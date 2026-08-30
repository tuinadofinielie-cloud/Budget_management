import { Stack } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { View } from 'react-native';
import { Colors } from '../src/core/theme/colors';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: Colors.background }} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add-transaction" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="set-budget" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="create-account" options={{ presentation: 'modal', headerShown: false }} />
    </Stack>
  );
}
