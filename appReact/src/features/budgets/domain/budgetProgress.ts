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

function statusFor(percent: number): BudgetStatus {
  if (percent > 100) {
    return 'depassement';
  }
  if (percent >= 80) {
    return 'attention';
  }
  return 'normal';
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
  const percent = Math.round((spent / budget.amount) * 100);

  return { spent, remaining, percent, status: statusFor(percent) };
}
