import { computeMonthlySummary } from '../monthlySummary';
import { AppTransaction } from '../../../../shared/models/appTransaction';

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

describe('computeMonthlySummary', () => {
  it('sums income and expense separately for the current month', () => {
    const transactions = [
      makeTransaction({ id: 1, type: 'expense', amount: 2500 }),
      makeTransaction({ id: 2, type: 'expense', amount: 1000 }),
      makeTransaction({ id: 3, type: 'income', amount: 50000 }),
    ];

    expect(computeMonthlySummary(transactions, referenceDate)).toEqual({ income: 50000, expense: 3500 });
  });

  it('excludes transfers from both totals', () => {
    const transactions = [makeTransaction({ id: 1, type: 'transfer', amount: 20000 })];

    expect(computeMonthlySummary(transactions, referenceDate)).toEqual({ income: 0, expense: 0 });
  });

  it('excludes transactions outside the current month', () => {
    const transactions = [
      makeTransaction({ id: 1, type: 'expense', amount: 2500, date: '2026-08-15' }),
      makeTransaction({ id: 2, type: 'expense', amount: 9000, date: '2026-07-31' }),
      makeTransaction({ id: 3, type: 'income', amount: 50000, date: '2026-09-01' }),
    ];

    expect(computeMonthlySummary(transactions, referenceDate)).toEqual({ income: 0, expense: 2500 });
  });

  it('returns zeros for an empty list', () => {
    expect(computeMonthlySummary([], referenceDate)).toEqual({ income: 0, expense: 0 });
  });
});
