import { AppTransaction } from '../../../shared/models/appTransaction';
import { isSameMonth } from '../../budgets/domain/budgetProgress';

export interface MonthlySummary {
  income: number;
  expense: number;
}

/** Sums income and expense transactions falling in the calendar month of `referenceDate`. Transfers never count. */
export function computeMonthlySummary(transactions: AppTransaction[], referenceDate: Date): MonthlySummary {
  return transactions
    .filter((transaction) => isSameMonth(transaction.date, referenceDate))
    .reduce<MonthlySummary>(
      (summary, transaction) => {
        if (transaction.type === 'income') {
          return { ...summary, income: summary.income + transaction.amount };
        }
        if (transaction.type === 'expense') {
          return { ...summary, expense: summary.expense + transaction.amount };
        }
        return summary;
      },
      { income: 0, expense: 0 }
    );
}
