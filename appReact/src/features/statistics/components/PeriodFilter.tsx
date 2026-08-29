import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors } from '../../../core/theme/colors';
import { StatsPeriod } from '../../transactions/domain/statistics';

const OPTIONS: { key: StatsPeriod; label: string }[] = [
  { key: 'week', label: 'Semaine' },
  { key: 'month', label: 'Mois' },
  { key: 'year', label: 'Année' },
];

interface PeriodFilterProps {
  value: StatsPeriod;
  onChange: (period: StatsPeriod) => void;
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            style={[styles.pill, selected && styles.pillSelected]}
            onPress={() => onChange(option.key)}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  pillSelected: {
    backgroundColor: Colors.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  labelSelected: {
    color: '#FFFFFF',
  },
});
