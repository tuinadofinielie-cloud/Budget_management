import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../../core/theme/colors';

interface QuickAction {
  key: 'expense' | 'income' | 'transfer';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const ACTIONS: QuickAction[] = [
  { key: 'expense', label: 'Dépense', icon: 'remove' },
  { key: 'income', label: 'Revenu', icon: 'add' },
  { key: 'transfer', label: 'Virement', icon: 'swap-horizontal' },
];

export function QuickActions() {
  return (
    <View style={styles.row}>
      {ACTIONS.map((action) => (
        <Pressable
          key={action.key}
          style={styles.action}
          onPress={() => router.push(`/add-transaction?type=${action.key}`)}
        >
          <View style={styles.iconCircle}>
            <Ionicons name={action.icon} size={20} color={Colors.primary} />
          </View>
          <Text style={styles.label}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  action: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  label: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
});
