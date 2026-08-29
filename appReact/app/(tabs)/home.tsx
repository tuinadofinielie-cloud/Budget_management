import { useCallback, useEffect, useState } from 'react';
import { ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../src/core/theme/colors';
import { LoadingState } from '../../src/shared/components/LoadingState';
import { ErrorState } from '../../src/shared/components/ErrorState';
import { useAuthStore } from '../../src/features/auth/state/authStoreInstance';
import { useAccountsStore } from '../../src/features/accounts/state/accountsStoreInstance';
import { useCategoriesStore } from '../../src/features/categories/state/categoriesStoreInstance';
import { useTransactionsStore } from '../../src/features/transactions/state/transactionsStoreInstance';
import { useBudgetsStore } from '../../src/features/budgets/state/budgetsStoreInstance';
import { computeMonthlySummary } from '../../src/features/transactions/domain/monthlySummary';
import { HomeHeader } from '../../src/features/home/components/HomeHeader';
import { BalanceHero } from '../../src/features/home/components/BalanceHero';
import { QuickActions } from '../../src/features/home/components/QuickActions';
import { AccountsSection } from '../../src/features/home/components/AccountsSection';
import { BudgetSummary } from '../../src/features/home/components/BudgetSummary';
import { RecentTransactions } from '../../src/features/home/components/RecentTransactions';

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);

  const accounts = useAccountsStore((state) => state.accounts);
  const loadCachedAccounts = useAccountsStore((state) => state.loadCached);
  const refreshAccounts = useAccountsStore((state) => state.refresh);

  const categories = useCategoriesStore((state) => state.categories);
  const loadCachedCategories = useCategoriesStore((state) => state.loadCached);
  const refreshCategories = useCategoriesStore((state) => state.refresh);

  const transactions = useTransactionsStore((state) => state.transactions);
  const loadCachedTransactions = useTransactionsStore((state) => state.loadCached);
  const refreshTransactions = useTransactionsStore((state) => state.refresh);

  const budgets = useBudgetsStore((state) => state.budgets);
  const loadCachedBudgets = useBudgetsStore((state) => state.loadCached);
  const refreshBudgets = useBudgetsStore((state) => state.refresh);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAll = useCallback(
    async (isPullToRefresh: boolean) => {
      if (isPullToRefresh) setIsRefreshing(true);
      try {
        await Promise.all([refreshAccounts(), refreshCategories(), refreshTransactions(), refreshBudgets()]);
        setError(null);
      } catch (err) {
        // Offline-first: cached data (loaded below) stays on screen even if the refresh fails.
        setError(err instanceof Error ? err.message : 'Impossible de synchroniser vos données.');
      } finally {
        if (isPullToRefresh) setIsRefreshing(false);
      }
    },
    [refreshAccounts, refreshCategories, refreshTransactions, refreshBudgets]
  );

  useEffect(() => {
    Promise.all([loadCachedAccounts(), loadCachedCategories(), loadCachedTransactions(), loadCachedBudgets()])
      .then(() => setIsLoading(false))
      .then(() => refreshAll(false));
    // Runs once on mount: load the local cache first, then sync with the server.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasAnyData = accounts.length > 0 || transactions.length > 0 || budgets.length > 0;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState message="Chargement de votre tableau de bord..." />
      </SafeAreaView>
    );
  }

  if (error && !hasAnyData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState message={error} onRetry={() => refreshAll(true)} />
      </SafeAreaView>
    );
  }

  const totalBalance = accounts.reduce((total, account) => total + account.balance, 0);
  const referenceDate = new Date();
  const { income, expense } = computeMonthlySummary(transactions, referenceDate);
  const primaryBudget = budgets.find((budget) => budget.categoryId === null) ?? budgets[0] ?? null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => refreshAll(true)} tintColor={Colors.primary} />}
      >
        <HomeHeader name={user?.name ?? ''} avatar={user?.avatar ?? null} />
        <BalanceHero totalBalance={totalBalance} income={income} expense={expense} />
        <QuickActions />
        <AccountsSection accounts={accounts} />
        <BudgetSummary
          budget={primaryBudget}
          transactions={transactions}
          referenceDate={referenceDate}
          onCreateBudget={() => router.push('/set-budget')}
        />
        <RecentTransactions transactions={transactions} categories={categories} />
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
    paddingBottom: 140,
    gap: 24,
  },
});
