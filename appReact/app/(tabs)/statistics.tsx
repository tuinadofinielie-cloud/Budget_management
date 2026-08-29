import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../src/core/theme/colors';
import { Typography } from '../../src/core/theme/typography';
import { LoadingState } from '../../src/shared/components/LoadingState';
import { ErrorState } from '../../src/shared/components/ErrorState';
import { useTransactionsStore } from '../../src/features/transactions/state/transactionsStoreInstance';
import { useCategoriesStore } from '../../src/features/categories/state/categoriesStoreInstance';
import {
  StatsPeriod,
  computePeriodSummary,
  computeCategoryBreakdown,
  computeMonthlyTrend,
} from '../../src/features/transactions/domain/statistics';
import { PeriodFilter } from '../../src/features/statistics/components/PeriodFilter';
import { StatSummaryCard } from '../../src/features/statistics/components/StatSummaryCard';
import { CategoryBreakdownList } from '../../src/features/statistics/components/CategoryBreakdownList';
import { SpendingTrendChart } from '../../src/features/statistics/components/SpendingTrendChart';

const TREND_MONTHS = 6;

export default function StatisticsScreen() {
  const transactions = useTransactionsStore((state) => state.transactions);
  const loadCachedTransactions = useTransactionsStore((state) => state.loadCached);
  const refreshTransactions = useTransactionsStore((state) => state.refresh);

  const categories = useCategoriesStore((state) => state.categories);
  const loadCachedCategories = useCategoriesStore((state) => state.loadCached);
  const refreshCategories = useCategoriesStore((state) => state.refresh);

  const [period, setPeriod] = useState<StatsPeriod>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAll = useCallback(
    async (isPullToRefresh: boolean) => {
      if (isPullToRefresh) setIsRefreshing(true);
      try {
        await Promise.all([refreshTransactions(), refreshCategories()]);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Impossible de synchroniser vos données.');
      } finally {
        if (isPullToRefresh) setIsRefreshing(false);
      }
    },
    [refreshTransactions, refreshCategories]
  );

  useEffect(() => {
    Promise.all([loadCachedTransactions(), loadCachedCategories()])
      .then(() => setIsLoading(false))
      .then(() => refreshAll(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState message="Chargement des statistiques..." />
      </SafeAreaView>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState message={error} onRetry={() => refreshAll(true)} />
      </SafeAreaView>
    );
  }

  const referenceDate = new Date();
  const { income, expense } = computePeriodSummary(transactions, period, referenceDate);
  const breakdown = computeCategoryBreakdown(transactions, categories, period, referenceDate);
  const trend = computeMonthlyTrend(transactions, TREND_MONTHS, referenceDate);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => refreshAll(true)} tintColor={Colors.primary} />}
      >
        <Text style={Typography.headlineMedium}>Statistiques</Text>

        <PeriodFilter value={period} onChange={setPeriod} />

        <View style={styles.summaryRow}>
          <StatSummaryCard label="Dépenses" amount={expense} tone="expense" />
          <StatSummaryCard label="Revenus" amount={income} tone="income" />
        </View>

        <CategoryBreakdownList entries={breakdown} />

        <SpendingTrendChart points={trend} />
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
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
