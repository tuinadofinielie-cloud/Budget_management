export type AccountType = 'cash' | 'orange_money' | 'moov_money' | 'bank' | 'card' | 'other';

export interface AppAccount {
  id: number;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
}

export function appAccountFromJson(json: any): AppAccount {
  return {
    id: json.id,
    name: json.name,
    type: json.type,
    balance: json.balance,
    currency: json.currency,
  };
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: 'Espèces',
  orange_money: 'Orange Money',
  moov_money: 'Moov Money',
  bank: 'Banque',
  card: 'Carte',
  other: 'Autre',
};
