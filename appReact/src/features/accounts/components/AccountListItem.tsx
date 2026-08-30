import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../../shared/components/GlassCard';
import { Colors } from '../../../core/theme/colors';
import { AppAccount, ACCOUNT_TYPE_LABELS } from '../../../shared/models/appAccount';
import { ACCOUNT_TYPE_ICONS } from '../constants';
import { formatMoney } from '../../../shared/utils/formatMoney';

interface AccountListItemProps {
  account: AppAccount;
  onEdit: () => void;
  onDelete: () => void;
}

export function AccountListItem({ account, onEdit, onDelete }: AccountListItemProps) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconCircle}>
          <Ionicons name={ACCOUNT_TYPE_ICONS[account.type]} size={20} color={Colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {account.name}
          </Text>
          <Text style={styles.type}>{ACCOUNT_TYPE_LABELS[account.type]}</Text>
        </View>
        <Text style={styles.balance}>{formatMoney(account.balance)}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={onEdit} accessibilityLabel={`Modifier ${account.name}`}>
          <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
          <Text style={styles.actionLabel}>Modifier</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={onDelete} accessibilityLabel={`Supprimer ${account.name}`}>
          <Ionicons name="trash-outline" size={16} color={Colors.danger} />
          <Text style={[styles.actionLabel, styles.deleteLabel]}>Supprimer</Text>
        </Pressable>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(124,92,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  type: {
    fontSize: 12,
    color: Colors.secondary,
    marginTop: 1,
  },
  balance: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(124,92,255,0.08)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  deleteLabel: {
    color: Colors.danger,
  },
});
