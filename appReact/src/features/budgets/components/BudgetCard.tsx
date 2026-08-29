import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../../shared/components/GlassCard';
import { Colors } from '../../../core/theme/colors';
import { AppBudget } from '../../../shared/models/appBudget';
import { AppTransaction } from '../../../shared/models/appTransaction';
import { computeBudgetProgress, BudgetStatus } from '../domain/budgetProgress';
import { formatMoney } from '../../../shared/utils/formatMoney';

const STATUS_COLOR: Record<BudgetStatus, string> = {
  normal: Colors.success,
  attention: Colors.warning,
  depassement: Colors.danger,
};

interface BudgetCardProps {
  title: string;
  icon?: string;
  budget: AppBudget;
  transactions: AppTransaction[];
  referenceDate: Date;
  onPress: () => void;
}

export function BudgetCard({ title, icon, budget, transactions, referenceDate, onPress }: BudgetCardProps) {
  const { spent, remaining, percent, status } = computeBudgetProgress(budget, transactions, referenceDate);
  const barWidth = `${Math.min(Math.max(percent, 0), 100)}%` as const;

  return (
    <Pressable onPress={onPress} testID="budget-card">
      <GlassCard style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.identity}>
            {icon ? <Text style={styles.icon}>{icon}</Text> : null}
            <Text style={styles.title}>{title}</Text>
          </View>
          <Text style={[styles.percent, { color: STATUS_COLOR[status] }]}>{percent}%</Text>
        </View>
        <Text style={styles.amount}>{formatMoney(budget.amount)}</Text>

        <View style={styles.track}>
          <View style={[styles.fill, { width: barWidth, backgroundColor: STATUS_COLOR[status] }]} />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>{formatMoney(spent)} dépensés</Text>
          <View style={styles.footerRight}>
            <Text style={styles.footerText}>{formatMoney(Math.max(remaining, 0))} restants</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.secondary} />
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    fontSize: 14,
  },
  title: {
    fontSize: 13,
    color: Colors.secondary,
    fontWeight: '500',
  },
  percent: {
    fontSize: 13,
    fontWeight: '700',
  },
  amount: {
    fontSize: 22,
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
  footerText: {
    fontSize: 12,
    color: Colors.secondary,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
