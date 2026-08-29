import { View, Text, StyleSheet } from 'react-native';
import { GlassCard } from '../../../shared/components/GlassCard';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Colors } from '../../../core/theme/colors';
import { CategoryBreakdownEntry } from '../../transactions/domain/statistics';
import { formatMoney } from '../../../shared/utils/formatMoney';

interface CategoryBreakdownListProps {
  entries: CategoryBreakdownEntry[];
}

export function CategoryBreakdownList({ entries }: CategoryBreakdownListProps) {
  if (entries.length === 0) {
    return (
      <GlassCard>
        <EmptyState title="Aucune dépense" message="Aucune dépense sur cette période pour le moment." />
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      {entries.map((entry, index) => (
        <View key={entry.categoryId ?? 'uncategorized'} style={[styles.row, index > 0 && styles.rowSpacing]}>
          <View style={styles.header}>
            <View style={styles.identity}>
              <Text style={styles.emoji}>{entry.icon}</Text>
              <Text style={styles.name}>{entry.name}</Text>
            </View>
            <View style={styles.amountBlock}>
              <Text style={styles.amount}>{formatMoney(entry.amount)}</Text>
              <Text style={styles.percent}>{entry.percent}%</Text>
            </View>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${entry.percent}%`, backgroundColor: entry.color }]} />
          </View>
        </View>
      ))}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  row: {},
  rowSpacing: {
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 16,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  amountBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  amount: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  percent: {
    fontSize: 12,
    color: Colors.secondary,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(124,92,255,0.1)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
