import { useState } from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../src/core/theme/colors';
import { Typography } from '../src/core/theme/typography';
import { AppTextField } from '../src/shared/components/AppTextField';
import { PrimaryButton } from '../src/shared/components/PrimaryButton';
import { useBudgetsStore } from '../src/features/budgets/state/budgetsStoreInstance';
import { useCategoriesStore } from '../src/features/categories/state/categoriesStoreInstance';

export default function SetBudgetScreen() {
  const params = useLocalSearchParams<{ id?: string; categoryId?: string }>();
  const budgetId = params.id ? Number(params.id) : null;
  const categoryIdParam = params.categoryId ? Number(params.categoryId) : null;

  const budgets = useBudgetsStore((state) => state.budgets);
  const create = useBudgetsStore((state) => state.create);
  const update = useBudgetsStore((state) => state.update);
  const remove = useBudgetsStore((state) => state.remove);
  const isSubmitting = useBudgetsStore((state) => state.isSubmitting);
  const error = useBudgetsStore((state) => state.error);
  const clearError = useBudgetsStore((state) => state.clearError);
  const categories = useCategoriesStore((state) => state.categories);

  const existingBudget =
    (budgetId ? budgets.find((budget) => budget.id === budgetId) : null) ??
    (budgetId === null && categoryIdParam === null ? budgets.find((budget) => budget.categoryId === null) : null) ??
    null;

  const targetCategoryId = existingBudget ? existingBudget.categoryId : categoryIdParam;
  const category = targetCategoryId !== null ? categories.find((c) => c.id === targetCategoryId) : null;
  const isEditing = !!existingBudget;
  const title = isEditing
    ? `Modifier — ${category?.name ?? 'Budget global'}`
    : category
      ? `Budget ${category.name}`
      : 'Définir un budget';

  const [amount, setAmount] = useState(existingBudget ? String(existingBudget.amount) : '');
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
      if (existingBudget) {
        await update(existingBudget.id, Math.round(parsedAmount));
      } else {
        await create({ amount: Math.round(parsedAmount), categoryId: targetCategoryId });
      }
      router.back();
    } catch {
      // error already surfaced via the store's `error` field
    }
  }

  function handleDelete() {
    if (!existingBudget) return;
    Alert.alert('Supprimer ce budget ?', 'Cette action est définitive.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await remove(existingBudget.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={Typography.titleLarge}>{title}</Text>
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
        <PrimaryButton label={isEditing ? 'Enregistrer' : 'Définir le budget'} onPress={handleSubmit} isLoading={isSubmitting} />

        {isEditing && (
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteLabel}>Supprimer ce budget</Text>
          </Pressable>
        )}
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
