import { View, Text, StyleSheet } from 'react-native';
import { GlassCard } from '../../../shared/components/GlassCard';
import { Colors } from '../../../core/theme/colors';
import { TrendPoint } from '../../transactions/domain/statistics';

const CHART_HEIGHT = 110;

interface SpendingTrendChartProps {
  points: TrendPoint[];
}

export function SpendingTrendChart({ points }: SpendingTrendChartProps) {
  const maxExpense = Math.max(...points.map((point) => point.expense), 1);

  return (
    <GlassCard>
      <Text style={styles.title}>Évolution des dépenses</Text>
      <View style={styles.chart}>
        {points.map((point) => {
          const height = Math.max((point.expense / maxExpense) * CHART_HEIGHT, point.expense > 0 ? 6 : 2);
          return (
            <View key={`${point.year}-${point.month}`} style={styles.column}>
              <View style={styles.barTrack}>
                <View style={[styles.bar, { height }]} />
              </View>
              <Text style={styles.label}>{point.label}</Text>
            </View>
          );
        })}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: CHART_HEIGHT + 24,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  barTrack: {
    width: 18,
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  label: {
    fontSize: 10,
    color: Colors.secondary,
  },
});
