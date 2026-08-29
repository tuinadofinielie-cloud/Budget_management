import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../../shared/components/GlassCard';
import { Colors } from '../../../core/theme/colors';
import { formatMoney } from '../../../shared/utils/formatMoney';

interface StatSummaryCardProps {
  label: string;
  amount: number;
  tone: 'income' | 'expense';
}

export function StatSummaryCard({ label, amount, tone }: StatSummaryCardProps) {
  const color = tone === 'income' ? Colors.success : Colors.danger;
  const icon = tone === 'income' ? 'trending-up' : 'trending-down';

  return (
    <GlassCard style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.amount, { color }]}>{formatMoney(amount)}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '500',
  },
  amount: {
    fontSize: 19,
    fontWeight: '700',
  },
});
