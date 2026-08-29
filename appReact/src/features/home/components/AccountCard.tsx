import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../../shared/components/GlassCard';
import { Colors } from '../../../core/theme/colors';
import { AppAccount, AccountType, ACCOUNT_TYPE_LABELS } from '../../../shared/models/appAccount';
import { formatMoney } from '../../../shared/utils/formatMoney';

const ACCOUNT_ICONS: Record<AccountType, keyof typeof Ionicons.glyphMap> = {
  cash: 'cash-outline',
  orange_money: 'phone-portrait-outline',
  moov_money: 'phone-portrait-outline',
  bank: 'business-outline',
  card: 'card-outline',
  other: 'wallet-outline',
};

interface AccountCardProps {
  account: AppAccount;
}

export function AccountCard({ account }: AccountCardProps) {
  return (
    <GlassCard radius={20} style={styles.card}>
      <View style={styles.iconCircle}>
        <Ionicons name={ACCOUNT_ICONS[account.type]} size={18} color={Colors.primary} />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {account.name}
      </Text>
      <Text style={styles.type}>{ACCOUNT_TYPE_LABELS[account.type]}</Text>
      <Text style={styles.balance}>{formatMoney(account.balance)}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 148,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(124,92,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  type: {
    fontSize: 11,
    color: Colors.secondary,
    marginTop: 1,
    marginBottom: 8,
  },
  balance: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
});
