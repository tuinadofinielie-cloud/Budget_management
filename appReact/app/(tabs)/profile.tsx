import { useState } from 'react';
import { View, Text, Image, Alert, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../src/core/theme/colors';
import { Typography } from '../../src/core/theme/typography';
import { useAuthStore } from '../../src/features/auth/state/authStoreInstance';
import { ProfileSection } from '../../src/features/profile/components/ProfileSection';
import { ProfileRow } from '../../src/features/profile/components/ProfileRow';

const APP_VERSION = '1.0.0';

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function confirmLogout() {
    Alert.alert('Se déconnecter ?', 'Vous devrez vous reconnecter pour accéder à votre compte.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await logout();
          } finally {
            router.replace('/login');
          }
        },
      },
    ]);
  }

  const firstName = (user?.name ?? '').trim().split(' ')[0] || '?';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={Typography.headlineMedium}>Profil</Text>

        <View style={styles.identity}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{firstName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View>
            <Text style={styles.name}>{user?.name ?? '—'}</Text>
            <Text style={styles.email}>{user?.email ?? '—'}</Text>
          </View>
        </View>

        <ProfileSection title="Compte">
          <ProfileRow icon="mail-outline" label="Email" value={user?.email ?? '—'} isLast />
        </ProfileSection>

        <ProfileSection title="Préférences">
          <ProfileRow icon="cash-outline" label="Devise" value={user?.currency ?? 'XOF'} isLast />
        </ProfileSection>

        <ProfileSection title="Sécurité">
          <ProfileRow
            icon="log-out-outline"
            label={isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
            tone="danger"
            onPress={isLoggingOut ? undefined : confirmLogout}
            isLast
          />
        </ProfileSection>

        <ProfileSection title="Support">
          <ProfileRow icon="information-circle-outline" label="Version de l'application" value={APP_VERSION} isLast />
        </ProfileSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: 20,
    paddingTop: 72,
    paddingBottom: 140,
    gap: 20,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  email: {
    fontSize: 13,
    color: Colors.secondary,
    marginTop: 2,
  },
});
