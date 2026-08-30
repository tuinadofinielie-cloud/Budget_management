import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../src/core/theme/colors';
import { Typography } from '../src/core/theme/typography';
import { AppTextField } from '../src/shared/components/AppTextField';
import { PrimaryButton } from '../src/shared/components/PrimaryButton';
import { EmptyState } from '../src/shared/components/EmptyState';
import { useAccountsStore } from '../src/features/accounts/state/accountsStoreInstance';
import { useCategoriesStore } from '../src/features/categories/state/categoriesStoreInstance';
import { useTransactionsStore } from '../src/features/transactions/state/transactionsStoreInstance';
import { AccountPicker } from '../src/features/transactions/components/AccountPicker';
import { CategoryPicker } from '../src/features/transactions/components/CategoryPicker';

type TransactionKind = 'expense' | 'income' | 'transfer';

const TITLES: Record<TransactionKind, string> = {
  expense: 'Ajouter une dépense',
  income: 'Ajouter un revenu',
  transfer: 'Virement entre comptes',
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AddTransactionScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const type: TransactionKind =
    params.type === 'income' || params.type === 'transfer' ? params.type : 'expense';

  const accounts = useAccountsStore((state) => state.accounts);
  const refreshAccounts = useAccountsStore((state) => state.refresh);
  const categories = useCategoriesStore((state) => state.categories);
  const create = useTransactionsStore((state) => state.create);
  const isSubmitting = useTransactionsStore((state) => state.isSubmitting);
  const error = useTransactionsStore((state) => state.error);
  const clearError = useTransactionsStore((state) => state.clearError);

  const relevantCategories = useMemo(
    () => categories.filter((category) => category.type === (type === 'income' ? 'income' : 'expense')),
    [categories, type]
  );

  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState<number | null>(accounts[0]?.id ?? null);
  const [toAccountId, setToAccountId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const otherAccounts = accounts.filter((account) => account.id !== accountId);

  async function handleSubmit() {
    setFormError(null);
    clearError();

    const parsedAmount = Number(amount.replace(',', '.'));
    if (!parsedAmount || parsedAmount <= 0) {
      setFormError('Entrez un montant valide.');
      return;
    }
    if (!accountId) {
      setFormError('Choisissez un compte.');
      return;
    }
    if (type === 'transfer' && !toAccountId) {
      setFormError('Choisissez le compte destination.');
      return;
    }
    if (type !== 'transfer' && !categoryId) {
      setFormError('Choisissez une catégorie.');
      return;
    }

    try {
      await create({
        type,
        amount: Math.round(parsedAmount),
        accountId,
        categoryId: type === 'transfer' ? null : categoryId,
        toAccountId: type === 'transfer' ? toAccountId : null,
        description: description.trim() || null,
        date: todayIso(),
      });
      // A transaction changes account balances server-side; refresh so Home/Budget/Statistics
      // reflect the new balance immediately instead of waiting for the next pull-to-refresh.
      refreshAccounts().catch(() => {});
      router.back();
    } catch {
      // error already surfaced via the store's `error` field
    }
  }

  if (accounts.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={Typography.titleLarge}>{TITLES[type]}</Text>
          <Pressable onPress={() => router.back()} accessibilityLabel="Fermer">
            <Ionicons name="close" size={24} color={Colors.text} />
          </Pressable>
        </View>
        <View style={styles.emptyWrap}>
          <EmptyState
            title="Aucun compte pour le moment"
            message="Chaque transaction doit être rattachée à un compte pour que votre solde soit calculé correctement. Créez d'abord un compte."
            actionLabel="Créer un compte"
            onAction={() => router.push('/create-account')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={[Typography.titleLarge]}>{TITLES[type]}</Text>
        <Pressable onPress={() => router.back()} accessibilityLabel="Fermer">
          <Ionicons name="close" size={24} color={Colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppTextField
          label="Montant (F)"
          value={amount}
          onChangeText={(value) => {
            setAmount(value);
            setFormError(null);
          }}
          keyboardType="numeric"
        />

        <AccountPicker
          label={type === 'transfer' ? 'Depuis' : 'Compte'}
          accounts={accounts}
          selectedId={accountId}
          onSelect={setAccountId}
        />

        {type === 'transfer' ? (
          <AccountPicker label="Vers" accounts={otherAccounts} selectedId={toAccountId} onSelect={setToAccountId} />
        ) : (
          <CategoryPicker categories={relevantCategories} selectedId={categoryId} onSelect={setCategoryId} />
        )}

        <AppTextField label="Note (optionnel)" value={description} onChangeText={setDescription} />

        {(formError || error) && <Text style={styles.error}>{formError ?? error}</Text>}

        <PrimaryButton label={TITLES[type]} onPress={handleSubmit} isLoading={isSubmitting} />
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
    gap: 4,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  error: {
    color: Colors.danger,
    marginBottom: 16,
  },
});
