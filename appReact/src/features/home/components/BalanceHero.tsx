import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../../shared/components/GlassCard';
import { formatMoney } from '../../../shared/utils/formatMoney';

interface BalanceHeroProps {
  totalBalance: number;
  income: number;
  expense: number;
}

export function BalanceHero({ totalBalance, income, expense }: BalanceHeroProps) {
  return (
    <GlassCard variant="hero" radius={28} style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.label}>Solde total</Text>
        <View style={styles.trendBadge}>
          <Ionicons name="trending-up" size={14} color="#FFFFFF" />
        </View>
      </View>
      <Text style={styles.balance}>{formatMoney(totalBalance)}</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <View style={styles.summaryLabelRow}>
            <Ionicons name="arrow-down-circle" size={14} color="#B9FFD8" />
            <Text style={styles.summaryLabel}>Revenus ce mois</Text>
          </View>
          <Text style={styles.summaryValue}>+{formatMoney(income)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <View style={styles.summaryLabelRow}>
            <Ionicons name="arrow-up-circle" size={14} color="#FFD1D9" />
            <Text style={styles.summaryLabel}>Dépenses ce mois</Text>
          </View>
          <Text style={styles.summaryValue}>-{formatMoney(expense)}</Text>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '600',
  },
  trendBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balance: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  summaryItem: {
    flex: 1,
    gap: 6,
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },
});
