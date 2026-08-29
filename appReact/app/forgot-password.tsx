import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../src/core/theme/colors';
import { Typography } from '../src/core/theme/typography';
import { AppTextField } from '../src/shared/components/AppTextField';
import { PrimaryButton } from '../src/shared/components/PrimaryButton';
import { useAuthStore } from '../src/features/auth/state/authStoreInstance';

export default function ForgotPasswordScreen() {
  const forgotPassword = useAuthStore((state) => state.forgotPassword);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      // error already surfaced via the store's `error` field
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={[Typography.headlineMedium, styles.title]}>Mot de passe oublié ?</Text>

      {sent ? (
        <View>
          <Text style={styles.confirmation}>Un lien de réinitialisation a été envoyé.</Text>
          <Text style={styles.link} onPress={() => router.replace('/login')}>
            Retour à la connexion
          </Text>
        </View>
      ) : (
        <>
          <AppTextField
            label="Email"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              clearError();
            }}
            keyboardType="email-address"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton label="Envoyer le lien de réinitialisation" onPress={handleSubmit} isLoading={isSubmitting} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.background, padding: 24, paddingTop: 96 },
  title: { marginBottom: 24 },
  error: { color: Colors.danger, marginBottom: 16 },
  confirmation: { color: Colors.success, marginBottom: 16, fontSize: 16 },
  link: { color: Colors.primary, textAlign: 'center', marginTop: 8, fontWeight: '600' },
});
