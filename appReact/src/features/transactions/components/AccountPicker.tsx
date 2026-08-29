import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Colors } from '../../../core/theme/colors';
import { AppAccount } from '../../../shared/models/appAccount';

interface AccountPickerProps {
  label: string;
  accounts: AppAccount[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function AccountPicker({ label, accounts, selectedId, onSelect }: AccountPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {accounts.map((account) => {
          const selected = account.id === selectedId;
          return (
            <Pressable
              key={account.id}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => onSelect(account.id)}
            >
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{account.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: Colors.secondary,
    marginBottom: 8,
  },
  row: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.surface,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  chipLabelSelected: {
    color: '#FFFFFF',
  },
});
