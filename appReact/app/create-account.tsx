import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../src/core/theme/colors';
import { Typography } from '../src/core/theme/typography';
import { AppTextField } from '../src/shared/components/AppTextField';
import { PrimaryButton } from '../src/shared/components/PrimaryButton';
import { useAccountsStore } from '../src/features/accounts/state/accountsStoreInstance';
import { AccountType, ACCOUNT_TYPE_LABELS } from '../src/shared/models/appAccount';

const ACCOUNT_TYPES: AccountType[] = ['cash', 'orange_money', 'moov_money', 'bank', 'card', 'other'];

export default function CreateAccountScreen() {
  const create = useAccountsStore((state) => state.create);
  const isSubmitting = useAccountsStore((state) => state.isSubmitting);
  const error = useAccountsStore((state) => state.error);
  const clearError = useAccountsStore((state) => state.clearError);

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('cash');
  const [balance, setBalance] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit() {
    setFormError(null);
    clearError();

    if (!name.trim()) {
      setFormError('Entrez un nom pour ce compte.');
      return;
    }

    const parsedBalance = balance.trim() ? Number(balance.replace(',', '.')) : 0;
    if (Number.isNaN(parsedBalance) || parsedBalance < 0) {
      setFormError('Le solde initial doit être un nombre positif.');
      return;
    }

    try {
      await create({ name: name.trim(), type, balance: Math.round(parsedBalance) });
      router.back();
    } catch {
      // error already surfaced via the store's `error` field
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={Typography.titleLarge}>Créer un compte</Text>
        <Pressable onPress={() => router.back()} accessibilityLabel="Fermer">
          <Ionicons name="close" size={24} color={Colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppTextField
          label="Nom du compte"
          value={name}
          onChangeText={(value) => {
            setName(value);
            setFormError(null);
          }}
        />

        <Text style={styles.label}>Type de compte</Text>
        <View style={styles.typeWrap}>
          {ACCOUNT_TYPES.map((accountType) => {
            const selected = accountType === type;
            return (
              <Pressable
                key={accountType}
                style={[styles.typeChip, selected && styles.typeChipSelected]}
                onPress={() => setType(accountType)}
              >
                <Text style={[styles.typeLabel, selected && styles.typeLabelSelected]}>
                  {ACCOUNT_TYPE_LABELS[accountType]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <AppTextField label="Solde initial (F, optionnel)" value={balance} onChangeText={setBalance} keyboardType="numeric" />

        {(formError || error) && <Text style={styles.error}>{formError ?? error}</Text>}

        <PrimaryButton label="Créer le compte" onPress={handleSubmit} isLoading={isSubmitting} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  content: {
    padding: 20,
    paddingTop: 4,
  },
  label: {
    fontSize: 13,
    color: Colors.secondary,
    marginBottom: 8,
  },
  typeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.surface,
  },
  typeChipSelected: {
    backgroundColor: Colors.primary,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  typeLabelSelected: {
    color: '#FFFFFF',
  },
  error: {
    color: Colors.danger,
    marginBottom: 16,
  },
});
