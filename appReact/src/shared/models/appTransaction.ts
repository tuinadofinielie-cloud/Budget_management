export type TransactionType = 'income' | 'expense' | 'transfer';

export interface AppTransaction {
  id: number;
  type: TransactionType;
  amount: number;
  categoryId: number | null;
  accountId: number;
  toAccountId: number | null;
  description: string | null;
  date: string;
}

export function appTransactionFromJson(json: any): AppTransaction {
  return {
    id: json.id,
    type: json.type,
    amount: json.amount,
    categoryId: json.category_id,
    accountId: json.account_id,
    toAccountId: json.to_account_id,
    description: json.description,
    date: json.date,
  };
}
