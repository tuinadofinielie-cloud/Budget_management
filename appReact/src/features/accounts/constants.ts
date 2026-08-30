import { Ionicons } from '@expo/vector-icons';
import { AccountType } from '../../shared/models/appAccount';

export const ACCOUNT_TYPE_ICONS: Record<AccountType, keyof typeof Ionicons.glyphMap> = {
  cash: 'cash-outline',
  orange_money: 'phone-portrait-outline',
  moov_money: 'phone-portrait-outline',
  bank: 'business-outline',
  card: 'card-outline',
  other: 'wallet-outline',
};

export const ACCOUNT_TYPES: AccountType[] = ['cash', 'orange_money', 'moov_money', 'bank', 'card', 'other'];
