import { computeBudgetProgress } from '../budgetProgress';
import { AppBudget } from '../../../../shared/models/appBudget';
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

describe('computeBudgetProgress', () => {
  it('sums all expense transactions in the current month for a global budget', () => {
    const budget: AppBudget = { id: 1, categoryId: null, amount: 50000, period: 'monthly' };
    const transactions = [
      makeTransaction({ id: 1, amount: 5000, categoryId: 1 }),
      makeTransaction({ id: 2, amount: 8000, categoryId: 2 }),
      makeTransaction({ id: 3, amount: 2500, categoryId: 3 }),
    ];

    const progress = computeBudgetProgress(budget, transactions, referenceDate);

    expect(progress.spent).toBe(15500);
    expect(progress.remaining).toBe(34500);
    expect(progress.percent).toBe(31);
    expect(progress.status).toBe('normal');
  });

  it('only sums transactions matching the category for a category budget', () => {
    const budget: AppBudget = { id: 2, categoryId: 5, amount: 20000, period: 'monthly' };
    const transactions = [
      makeTransaction({ id: 1, amount: 12500, categoryId: 5 }),
      makeTransaction({ id: 2, amount: 9000, categoryId: 6 }),
    ];

    const progress = computeBudgetProgress(budget, transactions, referenceDate);

    expect(progress.spent).toBe(12500);
    expect(progress.remaining).toBe(7500);
    expect(progress.percent).toBe(63);
  });

  it('excludes transactions from other months', () => {
    const budget: AppBudget = { id: 1, categoryId: null, amount: 50000, period: 'monthly' };
    const transactions = [
      makeTransaction({ id: 1, amount: 5000, date: '2026-08-15' }),
      makeTransaction({ id: 2, amount: 9000, date: '2026-07-31' }),
      makeTransaction({ id: 3, amount: 1000, date: '2026-09-01' }),
    ];

    const progress = computeBudgetProgress(budget, transactions, referenceDate);

    expect(progress.spent).toBe(5000);
  });

  it('excludes income and transfer transactions', () => {
    const budget: AppBudget = { id: 1, categoryId: null, amount: 50000, period: 'monthly' };
    const transactions = [
      makeTransaction({ id: 1, amount: 5000, type: 'expense' }),
      makeTransaction({ id: 2, amount: 50000, type: 'income' }),
      makeTransaction({ id: 3, amount: 20000, type: 'transfer' }),
    ];

    const progress = computeBudgetProgress(budget, transactions, referenceDate);

    expect(progress.spent).toBe(5000);
  });

  it('reports attention status between 80% and 100% usage', () => {
    const budget: AppBudget = { id: 1, categoryId: null, amount: 10000, period: 'monthly' };
    const transactions = [makeTransaction({ id: 1, amount: 8500 })];

    expect(computeBudgetProgress(budget, transactions, referenceDate).status).toBe('attention');
  });

  it('reports depassement status and a negative remaining amount when over budget', () => {
    const budget: AppBudget = { id: 1, categoryId: null, amount: 10000, period: 'monthly' };
    const transactions = [makeTransaction({ id: 1, amount: 12000 })];

    const progress = computeBudgetProgress(budget, transactions, referenceDate);

    expect(progress.status).toBe('depassement');
    expect(progress.remaining).toBe(-2000);
    expect(progress.percent).toBe(120);
  });

  describe('status boundary thresholds', () => {
    it('reports normal status at 79% usage', () => {
      const budget: AppBudget = { id: 1, categoryId: null, amount: 10000, period: 'monthly' };
      const transactions = [makeTransaction({ id: 1, amount: 7900 })];

      const progress = computeBudgetProgress(budget, transactions, referenceDate);

      expect(progress.percent).toBe(79);
      expect(progress.status).toBe('normal');
    });

    it('reports attention status at exactly 80% usage', () => {
      const budget: AppBudget = { id: 1, categoryId: null, amount: 10000, period: 'monthly' };
      const transactions = [makeTransaction({ id: 1, amount: 8000 })];

      const progress = computeBudgetProgress(budget, transactions, referenceDate);

      expect(progress.percent).toBe(80);
      expect(progress.status).toBe('attention');
    });

    it('reports attention status at exactly 100% usage', () => {
      const budget: AppBudget = { id: 1, categoryId: null, amount: 10000, period: 'monthly' };
      const transactions = [makeTransaction({ id: 1, amount: 10000 })];

      const progress = computeBudgetProgress(budget, transactions, referenceDate);

      expect(progress.percent).toBe(100);
      expect(progress.status).toBe('attention');
    });

    it('reports depassement status at 101% usage', () => {
      const budget: AppBudget = { id: 1, categoryId: null, amount: 10000, period: 'monthly' };
      const transactions = [makeTransaction({ id: 1, amount: 10100 })];

      const progress = computeBudgetProgress(budget, transactions, referenceDate);

      expect(progress.percent).toBe(101);
      expect(progress.status).toBe('depassement');
    });
  });
});
