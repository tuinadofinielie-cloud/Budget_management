import { useState } from 'react';
import { View, Text, Pressable, Alert, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../src/core/theme/colors';
import { Typography } from '../src/core/theme/typography';
import { AppTextField } from '../src/shared/components/AppTextField';
import { PrimaryButton } from '../src/shared/components/PrimaryButton';
import { useAccountsStore } from '../src/features/accounts/state/accountsStoreInstance';
import { AccountType, ACCOUNT_TYPE_LABELS } from '../src/shared/models/appAccount';
import { ACCOUNT_TYPES } from '../src/features/accounts/constants';

export default function CreateAccountScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const accountId = params.id ? Number(params.id) : null;

  const accounts = useAccountsStore((state) => state.accounts);
  const create = useAccountsStore((state) => state.create);
  const update = useAccountsStore((state) => state.update);
  const remove = useAccountsStore((state) => state.remove);
  const isSubmitting = useAccountsStore((state) => state.isSubmitting);
  const error = useAccountsStore((state) => state.error);
  const clearError = useAccountsStore((state) => state.clearError);

  const existingAccount = accountId ? (accounts.find((account) => account.id === accountId) ?? null) : null;
  const isEditing = !!existingAccount;

  const [name, setName] = useState(existingAccount?.name ?? '');
  const [type, setType] = useState<AccountType>(existingAccount?.type ?? 'cash');
  const [balance, setBalance] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit() {
    setFormError(null);
    clearError();

    if (!name.trim()) {
      setFormError('Entrez un nom pour ce compte.');
      return;
    }

    try {
      if (existingAccount) {
        await update(existingAccount.id, { name: name.trim(), type });
      } else {
        const parsedBalance = balance.trim() ? Number(balance.replace(',', '.')) : 0;
        if (Number.isNaN(parsedBalance) || parsedBalance < 0) {
          setFormError('Le solde initial doit être un nombre positif.');
          return;
        }
        await create({ name: name.trim(), type, balance: Math.round(parsedBalance) });
      }
      router.back();
    } catch {
      // error already surfaced via the store's `error` field
    }
  }

  function handleDelete() {
    if (!existingAccount) return;
    Alert.alert('Supprimer ce compte ?', `"${existingAccount.name}" sera définitivement supprimé.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          clearError();
          try {
            await remove(existingAccount.id);
            router.back();
          } catch {
            const message = useAccountsStore.getState().error ?? 'Impossible de supprimer ce compte.';
            Alert.alert('Suppression impossible', message);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={Typography.titleLarge}>{isEditing ? 'Modifier le compte' : 'Créer un compte'}</Text>
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

        {!isEditing && (
          <AppTextField label="Solde initial (F, optionnel)" value={balance} onChangeText={setBalance} keyboardType="numeric" />
        )}

        {(formError || error) && <Text style={styles.error}>{formError ?? error}</Text>}

        <PrimaryButton label={isEditing ? 'Enregistrer' : 'Créer le compte'} onPress={handleSubmit} isLoading={isSubmitting} />

        {isEditing && (
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteLabel}>Supprimer ce compte</Text>
          </Pressable>
        )}
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
  deleteButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
  },
  deleteLabel: {
    color: Colors.danger,
    fontWeight: '600',
    fontSize: 14,
  },
});
