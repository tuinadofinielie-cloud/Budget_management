import { View, Text, StyleSheet } from 'react-native';
import { Typography } from '../../../core/theme/typography';
import { GlassCard } from '../../../shared/components/GlassCard';
import { EmptyState } from '../../../shared/components/EmptyState';
import { AppTransaction } from '../../../shared/models/appTransaction';
import { AppCategory } from '../../../shared/models/appCategory';
import { TransactionRow } from './TransactionRow';

const MAX_VISIBLE = 5;

interface RecentTransactionsProps {
  transactions: AppTransaction[];
  categories: AppCategory[];
}

export function RecentTransactions({ transactions, categories }: RecentTransactionsProps) {
  const recent = transactions.slice(0, MAX_VISIBLE);
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return (
    <View>
      <Text style={[Typography.titleLarge, styles.title]}>Transactions récentes</Text>
      {recent.length === 0 ? (
        <GlassCard>
          <EmptyState
            title="Aucune transaction pour le moment"
            message="Commencez à enregistrer vos dépenses et revenus pour les voir ici."
          />
        </GlassCard>
      ) : (
        <GlassCard style={styles.list}>
          {recent.map((transaction, index) => (
            <View key={transaction.id}>
              <TransactionRow
                transaction={transaction}
                category={transaction.categoryId ? categoryById.get(transaction.categoryId) : undefined}
              />
              {index < recent.length - 1 ? <View style={styles.separator} /> : null}
            </View>
          ))}
        </GlassCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 12,
  },
  list: {
    paddingVertical: 4,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(124,92,255,0.08)',
  },
});
