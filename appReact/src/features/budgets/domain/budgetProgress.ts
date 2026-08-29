import { AppBudget } from '../../../shared/models/appBudget';
import { AppTransaction } from '../../../shared/models/appTransaction';

export type BudgetStatus = 'normal' | 'attention' | 'depassement';

export interface BudgetProgress {
  spent: number;
  remaining: number;
  percent: number;
  status: BudgetStatus;
}

function isSameMonth(dateIso: string, reference: Date): boolean {
  const date = new Date(dateIso);
  return date.getUTCFullYear() === reference.getUTCFullYear() && date.getUTCMonth() === reference.getUTCMonth();
}

export function computeBudgetProgress(
  budget: AppBudget,
  transactions: AppTransaction[],
  referenceDate: Date
): BudgetProgress {
  const spent = transactions
    .filter((transaction) => transaction.type === 'expense')
    .filter((transaction) => isSameMonth(transaction.date, referenceDate))
    .filter((transaction) => budget.categoryId === null || transaction.categoryId === budget.categoryId)
    .reduce((total, transaction) => total + transaction.amount, 0);

  const remaining = budget.amount - spent;
  const ratio = spent / budget.amount;
  const percent = Math.round(ratio * 100);
  const status: BudgetStatus = ratio > 1 ? 'depassement' : ratio >= 0.8 ? 'attention' : 'normal';

  return { spent, remaining, percent, status };
}
