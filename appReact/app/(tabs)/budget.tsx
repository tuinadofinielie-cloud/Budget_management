import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../src/core/theme/colors';
import { Typography } from '../../src/core/theme/typography';
import { LoadingState } from '../../src/shared/components/LoadingState';
import { ErrorState } from '../../src/shared/components/ErrorState';
import { EmptyState } from '../../src/shared/components/EmptyState';
import { GlassCard } from '../../src/shared/components/GlassCard';
import { useBudgetsStore } from '../../src/features/budgets/state/budgetsStoreInstance';
import { useTransactionsStore } from '../../src/features/transactions/state/transactionsStoreInstance';
import { useCategoriesStore } from '../../src/features/categories/state/categoriesStoreInstance';
import { BudgetCard } from '../../src/features/budgets/components/BudgetCard';

export default function BudgetScreen() {
  const budgets = useBudgetsStore((state) => state.budgets);
  const loadCachedBudgets = useBudgetsStore((state) => state.loadCached);
  const refreshBudgets = useBudgetsStore((state) => state.refresh);

  const transactions = useTransactionsStore((state) => state.transactions);
  const loadCachedTransactions = useTransactionsStore((state) => state.loadCached);
  const refreshTransactions = useTransactionsStore((state) => state.refresh);

  const categories = useCategoriesStore((state) => state.categories);
  const loadCachedCategories = useCategoriesStore((state) => state.loadCached);
  const refreshCategories = useCategoriesStore((state) => state.refresh);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickingCategory, setPickingCategory] = useState(false);

  const refreshAll = useCallback(
    async (isPullToRefresh: boolean) => {
      if (isPullToRefresh) setIsRefreshing(true);
      try {
        await Promise.all([refreshBudgets(), refreshTransactions(), refreshCategories()]);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Impossible de synchroniser vos données.');
      } finally {
        if (isPullToRefresh) setIsRefreshing(false);
      }
    },
    [refreshBudgets, refreshTransactions, refreshCategories]
  );

  useEffect(() => {
    Promise.all([loadCachedBudgets(), loadCachedTransactions(), loadCachedCategories()])
      .then(() => setIsLoading(false))
      .then(() => refreshAll(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState message="Chargement de votre budget..." />
      </SafeAreaView>
    );
  }

  if (error && budgets.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState message={error} onRetry={() => refreshAll(true)} />
      </SafeAreaView>
    );
  }

  const referenceDate = new Date();
  const globalBudget = budgets.find((budget) => budget.categoryId === null) ?? null;
  const categoryBudgets = budgets.filter((budget) => budget.categoryId !== null);
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const budgetedCategoryIds = new Set(categoryBudgets.map((budget) => budget.categoryId));
  const availableCategories = categories.filter(
    (category) => category.type === 'expense' && !budgetedCategoryIds.has(category.id)
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => refreshAll(true)} tintColor={Colors.primary} />}
      >
        <Text style={Typography.headlineMedium}>Budget</Text>

        <View>
          <Text style={[Typography.titleLarge, styles.sectionTitle]}>Budget global</Text>
          {globalBudget ? (
            <BudgetCard
              title="Budget du mois"
              budget={globalBudget}
              transactions={transactions}
              referenceDate={referenceDate}
              onPress={() => router.push(`/set-budget?id=${globalBudget.id}`)}
            />
          ) : (
            <GlassCard>
              <EmptyState
                title="Aucun budget défini"
                message="Fixez une limite de dépenses globale pour ce mois."
                actionLabel="Définir un budget"
                onAction={() => router.push('/set-budget')}
              />
            </GlassCard>
          )}
        </View>

        <View>
          <View style={styles.sectionHeaderRow}>
            <Text style={[Typography.titleLarge, styles.sectionTitle]}>Budgets par catégorie</Text>
            {availableCategories.length > 0 && (
              <Pressable
                style={styles.addButton}
                onPress={() => setPickingCategory((current) => !current)}
                accessibilityLabel="Ajouter un budget par catégorie"
              >
                <Ionicons name={pickingCategory ? 'close' : 'add'} size={18} color={Colors.primary} />
              </Pressable>
            )}
          </View>

          {pickingCategory && (
            <GlassCard style={styles.pickerCard}>
              <View style={styles.pickerWrap}>
                {availableCategories.map((category) => (
                  <Pressable
                    key={category.id}
                    style={styles.pickerChip}
                    onPress={() => {
                      setPickingCategory(false);
                      router.push(`/set-budget?categoryId=${category.id}`);
                    }}
                  >
                    <Text style={styles.pickerEmoji}>{category.icon}</Text>
                    <Text style={styles.pickerLabel}>{category.name}</Text>
                  </Pressable>
                ))}
              </View>
            </GlassCard>
          )}

          {categoryBudgets.length === 0 ? (
            <GlassCard>
              <EmptyState
                title="Aucun budget par catégorie"
                message="Ajoutez une limite pour une catégorie précise, comme Nourriture ou Transport."
              />
            </GlassCard>
          ) : (
            categoryBudgets.map((budget) => {
              const category = budget.categoryId !== null ? categoryById.get(budget.categoryId) : undefined;
              return (
                <BudgetCard
                  key={budget.id}
                  title={category?.name ?? 'Catégorie'}
                  icon={category?.icon}
                  budget={budget}
                  transactions={transactions}
                  referenceDate={referenceDate}
                  onPress={() => router.push(`/set-budget?id=${budget.id}`)}
                />
              );
            })
          )}
        </View>
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
    gap: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  pickerCard: {
    marginBottom: 12,
  },
  pickerWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(124,92,255,0.08)',
  },
  pickerEmoji: {
    fontSize: 14,
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
  },
});
