import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../../shared/components/GlassCard';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Typography } from '../../../core/theme/typography';
import { Colors } from '../../../core/theme/colors';
import { AppBudget } from '../../../shared/models/appBudget';
import { AppTransaction } from '../../../shared/models/appTransaction';
import { computeBudgetProgress, BudgetStatus } from '../../../features/budgets/domain/budgetProgress';
import { formatMoney } from '../../../shared/utils/formatMoney';

const STATUS_COLOR: Record<BudgetStatus, string> = {
  normal: Colors.success,
  attention: Colors.warning,
  depassement: Colors.danger,
};

interface BudgetSummaryProps {
  budget: AppBudget | null;
  transactions: AppTransaction[];
  referenceDate: Date;
  onCreateBudget: () => void;
}

export function BudgetSummary({ budget, transactions, referenceDate, onCreateBudget }: BudgetSummaryProps) {
  return (
    <View>
      <Text style={[Typography.titleLarge, styles.title]}>Budget</Text>
      {!budget ? (
        <GlassCard>
          <EmptyState
            title="Aucun budget défini"
            message="Fixez une limite de dépenses pour suivre votre progression."
            actionLabel="Définir un budget"
            onAction={onCreateBudget}
          />
        </GlassCard>
      ) : (
        <BudgetSummaryCard budget={budget} transactions={transactions} referenceDate={referenceDate} />
      )}
    </View>
  );
}

function BudgetSummaryCard({
  budget,
  transactions,
  referenceDate,
}: {
  budget: AppBudget;
  transactions: AppTransaction[];
  referenceDate: Date;
}) {
  const { spent, remaining, percent, status } = computeBudgetProgress(budget, transactions, referenceDate);
  const barWidth = `${Math.min(Math.max(percent, 0), 100)}%` as const;

  return (
    <GlassCard>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Budget du mois</Text>
        <Text style={[styles.percent, { color: STATUS_COLOR[status] }]}>{percent}%</Text>
      </View>
      <Text style={styles.amount}>{formatMoney(budget.amount)}</Text>

      <View style={styles.track}>
        <View style={[styles.fill, { width: barWidth, backgroundColor: STATUS_COLOR[status] }]} />
      </View>

      <View style={styles.footerRow}>
        <View style={styles.footerItem}>
          <Ionicons name="arrow-up-circle-outline" size={14} color={Colors.secondary} />
          <Text style={styles.footerText}>{formatMoney(spent)} dépensés</Text>
        </View>
        <Text style={[styles.footerText, styles.remaining]}>{formatMoney(Math.max(remaining, 0))} restants</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    color: Colors.secondary,
    fontWeight: '500',
  },
  percent: {
    fontSize: 13,
    fontWeight: '700',
  },
  amount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
    marginBottom: 14,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(124,92,255,0.12)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    fontSize: 12,
    color: Colors.secondary,
  },
  remaining: {
    fontWeight: '600',
    color: Colors.text,
  },
});
