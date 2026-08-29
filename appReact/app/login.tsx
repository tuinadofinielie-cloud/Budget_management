import { useState } from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../src/core/theme/colors';
import { Typography } from '../src/core/theme/typography';
import { AppTextField } from '../src/shared/components/AppTextField';
import { PrimaryButton } from '../src/shared/components/PrimaryButton';
import { useAuthStore } from '../src/features/auth/state/authStoreInstance';

export default function LoginScreen() {
  const login = useAuthStore((state) => state.login);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit() {
    try {
      await login({ email, password });
      router.replace('/(tabs)/home');
    } catch {
      // error already surfaced via the store's `error` field
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={[Typography.headlineMedium, styles.title]}>Se connecter</Text>

      <AppTextField
        label="Email"
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          clearError();
        }}
        keyboardType="email-address"
      />
      <AppTextField
        label="Mot de passe"
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          clearError();
        }}
        secureTextEntry
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton label="Se connecter" onPress={handleSubmit} isLoading={isSubmitting} />

      <Text style={styles.link} onPress={() => router.push('/forgot-password')}>
        Mot de passe oublié ?
      </Text>
      <Text style={styles.link} onPress={() => router.push('/register')}>
        Créer un compte
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.background, padding: 24, paddingTop: 96 },
  title: { marginBottom: 24 },
  error: { color: Colors.danger, marginBottom: 16 },
  link: { color: Colors.primary, textAlign: 'center', marginTop: 16, fontWeight: '600' },
});
