import { AppTransaction } from '../../../shared/models/appTransaction';
import { AppCategory } from '../../../shared/models/appCategory';
import { FRENCH_MONTH_LABELS } from '../../../shared/utils/frenchMonths';

export type StatsPeriod = 'week' | 'month' | 'year';

interface DateRange {
  start: Date;
  end: Date;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** `end` is exclusive (the day after `referenceDate`), so "today" is always fully included. */
export function getPeriodRange(period: StatsPeriod, referenceDate: Date): DateRange {
  const end = startOfUtcDay(referenceDate);
  end.setUTCDate(end.getUTCDate() + 1);

  if (period === 'week') {
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 7);
    return { start, end };
  }

  if (period === 'year') {
    return { start: new Date(Date.UTC(referenceDate.getUTCFullYear(), 0, 1)), end };
  }

  return { start: new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1)), end };
}

function isWithinRange(dateIso: string, range: DateRange): boolean {
  const time = new Date(dateIso).getTime();
  return time >= range.start.getTime() && time < range.end.getTime();
}

export interface PeriodSummary {
  income: number;
  expense: number;
}

export function computePeriodSummary(
  transactions: AppTransaction[],
  period: StatsPeriod,
  referenceDate: Date
): PeriodSummary {
  const range = getPeriodRange(period, referenceDate);
  return transactions
    .filter((transaction) => isWithinRange(transaction.date, range))
    .reduce<PeriodSummary>(
      (summary, transaction) => {
        if (transaction.type === 'income') return { ...summary, income: summary.income + transaction.amount };
        if (transaction.type === 'expense') return { ...summary, expense: summary.expense + transaction.amount };
        return summary;
      },
      { income: 0, expense: 0 }
    );
}

export interface CategoryBreakdownEntry {
  categoryId: number | null;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percent: number;
}

const UNCATEGORIZED_COLOR = '#77738A';

/** Expense-only breakdown by category for the period, sorted highest spend first. */
export function computeCategoryBreakdown(
  transactions: AppTransaction[],
  categories: AppCategory[],
  period: StatsPeriod,
  referenceDate: Date
): CategoryBreakdownEntry[] {
  const range = getPeriodRange(period, referenceDate);
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const totals = new Map<number | null, number>();

  transactions
    .filter((transaction) => transaction.type === 'expense' && isWithinRange(transaction.date, range))
    .forEach((transaction) => {
      totals.set(transaction.categoryId, (totals.get(transaction.categoryId) ?? 0) + transaction.amount);
    });

  const totalExpense = [...totals.values()].reduce((sum, amount) => sum + amount, 0);

  return [...totals.entries()]
    .map(([categoryId, amount]) => {
      const category = categoryId !== null ? categoryById.get(categoryId) : undefined;
      return {
        categoryId,
        name: category?.name ?? 'Autres',
        icon: category?.icon ?? '📦',
        color: category?.color ?? UNCATEGORIZED_COLOR,
        amount,
        percent: totalExpense === 0 ? 0 : Math.round((amount / totalExpense) * 100),
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

export interface TrendPoint {
  label: string;
  year: number;
  month: number;
  income: number;
  expense: number;
}

/** Income/expense totals for the last `monthsCount` calendar months, oldest first, `referenceDate`'s month last. */
export function computeMonthlyTrend(
  transactions: AppTransaction[],
  monthsCount: number,
  referenceDate: Date
): TrendPoint[] {
  const points: TrendPoint[] = [];

  for (let offset = monthsCount - 1; offset >= 0; offset -= 1) {
    const monthDate = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() - offset, 1));
    const monthTransactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return (
        transactionDate.getUTCFullYear() === monthDate.getUTCFullYear() &&
        transactionDate.getUTCMonth() === monthDate.getUTCMonth()
      );
    });

    points.push({
      label: FRENCH_MONTH_LABELS[monthDate.getUTCMonth()],
      year: monthDate.getUTCFullYear(),
      month: monthDate.getUTCMonth(),
      income: monthTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      expense: monthTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    });
  }

  return points;
}
