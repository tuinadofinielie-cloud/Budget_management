import { computePeriodSummary, computeCategoryBreakdown, computeMonthlyTrend } from '../statistics';
import { AppTransaction } from '../../../../shared/models/appTransaction';
import { AppCategory } from '../../../../shared/models/appCategory';

const referenceDate = new Date('2026-08-29T00:00:00Z');

function makeTransaction(overrides: Partial<AppTransaction>): AppTransaction {
  return {
    id: 1,
    type: 'expense',
    amount: 1000,
    categoryId: null,
    accountId: 1,
    toAccountId: null,
    description: null,
    date: '2026-08-15',
    ...overrides,
  };
}

describe('computePeriodSummary', () => {
  it('sums income and expense within the current month', () => {
    const transactions = [
      makeTransaction({ id: 1, type: 'expense', amount: 2500, date: '2026-08-10' }),
      makeTransaction({ id: 2, type: 'income', amount: 50000, date: '2026-08-01' }),
      makeTransaction({ id: 3, type: 'expense', amount: 9000, date: '2026-07-31' }),
    ];

    expect(computePeriodSummary(transactions, 'month', referenceDate)).toEqual({ income: 50000, expense: 2500 });
  });

  it('includes the current day for a week period', () => {
    const transactions = [makeTransaction({ id: 1, amount: 1000, date: '2026-08-29' })];

    expect(computePeriodSummary(transactions, 'week', referenceDate)).toEqual({ income: 0, expense: 1000 });
  });

  it('excludes transactions from the previous year for a year period', () => {
    const transactions = [
      makeTransaction({ id: 1, amount: 1000, date: '2026-01-05' }),
      makeTransaction({ id: 2, amount: 5000, date: '2025-12-31' }),
    ];

    expect(computePeriodSummary(transactions, 'year', referenceDate)).toEqual({ income: 0, expense: 1000 });
  });
});

describe('computeCategoryBreakdown', () => {
  const categories: AppCategory[] = [
    { id: 1, name: 'Nourriture', icon: '🍚', color: '#FF9F71', type: 'expense' },
    { id: 2, name: 'Transport', icon: '🚗', color: '#5D8CFF', type: 'expense' },
  ];

  it('groups expenses by category and computes percentages', () => {
    const transactions = [
      makeTransaction({ id: 1, categoryId: 1, amount: 3000 }),
      makeTransaction({ id: 2, categoryId: 2, amount: 1000 }),
    ];

    const breakdown = computeCategoryBreakdown(transactions, categories, 'month', referenceDate);

    expect(breakdown).toEqual([
      { categoryId: 1, name: 'Nourriture', icon: '🍚', color: '#FF9F71', amount: 3000, percent: 75 },
      { categoryId: 2, name: 'Transport', icon: '🚗', color: '#5D8CFF', amount: 1000, percent: 25 },
    ]);
  });

  it('falls back to Autres for a null category', () => {
    const transactions = [makeTransaction({ id: 1, categoryId: null, amount: 1000 })];

    const breakdown = computeCategoryBreakdown(transactions, categories, 'month', referenceDate);

    expect(breakdown).toEqual([{ categoryId: null, name: 'Autres', icon: '📦', color: '#77738A', amount: 1000, percent: 100 }]);
  });

  it('excludes income and transfer transactions', () => {
    const transactions = [
      makeTransaction({ id: 1, type: 'income', amount: 50000 }),
      makeTransaction({ id: 2, type: 'transfer', amount: 20000 }),
    ];

    expect(computeCategoryBreakdown(transactions, categories, 'month', referenceDate)).toEqual([]);
  });
});

describe('computeMonthlyTrend', () => {
  it('returns one point per month, oldest first, with independent income/expense totals', () => {
    const transactions = [
      makeTransaction({ id: 1, type: 'expense', amount: 2000, date: '2026-08-10' }),
      makeTransaction({ id: 2, type: 'income', amount: 50000, date: '2026-07-05' }),
    ];

    const trend = computeMonthlyTrend(transactions, 3, referenceDate);

    expect(trend).toHaveLength(3);
    expect(trend[0]).toEqual({ label: 'juin', year: 2026, month: 5, income: 0, expense: 0 });
    expect(trend[1]).toEqual({ label: 'juil.', year: 2026, month: 6, income: 50000, expense: 0 });
    expect(trend[2]).toEqual({ label: 'août', year: 2026, month: 7, income: 0, expense: 2000 });
  });
});
