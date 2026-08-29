import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../src/core/theme/colors';
import { Typography } from '../src/core/theme/typography';
import { useAuthStore, secureStorageService } from '../src/features/auth/state/authStoreInstance';

export default function SplashScreen() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const status = useAuthStore((state) => state.status);
  const [checkedOnboarding, setCheckedOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    bootstrap();
    secureStorageService.hasCompletedOnboarding().then((value) => {
      setOnboardingComplete(value);
      setCheckedOnboarding(true);
    });
  }, [bootstrap]);

  useEffect(() => {
    if (status === 'unknown' || !checkedOnboarding) return;

    if (status === 'authenticated') {
      router.replace('/(tabs)/home');
      return;
    }

    router.replace(onboardingComplete ? '/login' : '/onboarding');
  }, [status, checkedOnboarding, onboardingComplete]);

  return (
    <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoGlyph}>💜</Text>
      </View>
      <Text style={[Typography.headlineMedium, styles.title]}>Finance App</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoGlyph: { fontSize: 32 },
  title: { color: '#FFFFFF' },
});
