import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../src/core/theme/colors';
import { Typography } from '../../src/core/theme/typography';
import { PrimaryButton } from '../../src/shared/components/PrimaryButton';
import { useAuthStore } from '../../src/features/auth/state/authStoreInstance';

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      router.replace('/login');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={Typography.headlineMedium}>Profil</Text>
      {user ? <Text style={[Typography.bodyMedium, styles.hint]}>{user.email}</Text> : null}
      <View style={styles.spacer} />
      <PrimaryButton label="Se déconnecter" onPress={handleLogout} isLoading={isLoggingOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 24, paddingTop: 72 },
  hint: { marginTop: 8 },
  spacer: { height: 24 },
});
