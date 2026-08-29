import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../src/core/theme/colors';
import { Typography } from '../src/core/theme/typography';
import { AppTextField } from '../src/shared/components/AppTextField';
import { PrimaryButton } from '../src/shared/components/PrimaryButton';
import { useBudgetsStore } from '../src/features/budgets/state/budgetsStoreInstance';

export default function SetBudgetScreen() {
  const budgets = useBudgetsStore((state) => state.budgets);
  const create = useBudgetsStore((state) => state.create);
  const update = useBudgetsStore((state) => state.update);
  const isSubmitting = useBudgetsStore((state) => state.isSubmitting);
  const error = useBudgetsStore((state) => state.error);
  const clearError = useBudgetsStore((state) => state.clearError);

  const globalBudget = budgets.find((budget) => budget.categoryId === null) ?? null;

  const [amount, setAmount] = useState(globalBudget ? String(globalBudget.amount) : '');
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit() {
    setFormError(null);
    clearError();

    const parsedAmount = Number(amount.replace(',', '.'));
    if (!parsedAmount || parsedAmount <= 0) {
      setFormError('Entrez un montant valide.');
      return;
    }

    try {
      if (globalBudget) {
        await update(globalBudget.id, Math.round(parsedAmount));
      } else {
        await create({ amount: Math.round(parsedAmount) });
      }
      router.back();
    } catch {
      // error already surfaced via the store's `error` field
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={Typography.titleLarge}>{globalBudget ? 'Modifier le budget' : 'Définir un budget'}</Text>
        <Pressable onPress={() => router.back()} accessibilityLabel="Fermer">
          <Ionicons name="close" size={24} color={Colors.text} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.hint}>Fixez la limite de dépenses que vous ne voulez pas dépasser ce mois-ci.</Text>
        <AppTextField
          label="Montant du budget (F)"
          value={amount}
          onChangeText={(value) => {
            setAmount(value);
            setFormError(null);
          }}
          keyboardType="numeric"
        />
        {(formError || error) && <Text style={styles.error}>{formError ?? error}</Text>}
        <PrimaryButton
          label={globalBudget ? 'Enregistrer' : 'Définir le budget'}
          onPress={handleSubmit}
          isLoading={isSubmitting}
        />
      </View>
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
  hint: {
    color: Colors.secondary,
    marginBottom: 20,
  },
  error: {
    color: Colors.danger,
    marginBottom: 16,
  },
});
