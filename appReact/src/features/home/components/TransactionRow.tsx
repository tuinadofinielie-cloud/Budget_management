import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../../core/theme/colors';
import { AppTransaction } from '../../../shared/models/appTransaction';
import { AppCategory } from '../../../shared/models/appCategory';
import { formatMoney } from '../../../shared/utils/formatMoney';

const MONTHS = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

function formatTransactionDate(dateIso: string): string {
  const date = new Date(dateIso);
  const today = new Date();
  const isSameDay =
    date.getUTCFullYear() === today.getUTCFullYear() &&
    date.getUTCMonth() === today.getUTCMonth() &&
    date.getUTCDate() === today.getUTCDate();

  if (isSameDay) return "Aujourd'hui";
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

interface TransactionRowProps {
  transaction: AppTransaction;
  category?: AppCategory;
}

export function TransactionRow({ transaction, category }: TransactionRowProps) {
  const isExpense = transaction.type === 'expense';
  const label = transaction.description || category?.name || (isExpense ? 'Dépense' : 'Revenu');
  const amountColor = isExpense ? Colors.danger : Colors.success;
  const sign = isExpense ? '-' : '+';

  return (
    <View style={styles.row}>
      <View style={[styles.iconCircle, { backgroundColor: `${category?.color ?? Colors.primary}22` }]}>
        <Text style={styles.icon}>{category?.icon ?? (isExpense ? '💸' : '💰')}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.date}>{formatTransactionDate(transaction.date)}</Text>
      </View>
      <Text style={[styles.amount, { color: amountColor }]}>
        {sign}
        {formatMoney(transaction.amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  date: {
    fontSize: 12,
    color: Colors.secondary,
    marginTop: 1,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
  },
});
