import { createBudgetsStore } from '../budgetsStore';
import { BudgetsRepository } from '../../data/budgetsRepository';
import { AppBudget } from '../../../../shared/models/appBudget';

function makeRepository(overrides: Partial<BudgetsRepository> = {}): BudgetsRepository {
  return {
    getCached: jest.fn().mockResolvedValue([]),
    refresh: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    ...overrides,
  } as unknown as BudgetsRepository;
}

const budget: AppBudget = { id: 1, categoryId: null, amount: 50000, period: 'monthly' };

describe('budgetsStore', () => {
  it('loadCached populates budgets from the repository cache', async () => {
    const repository = makeRepository({ getCached: jest.fn().mockResolvedValue([budget]) });
    const store = createBudgetsStore(repository);

    await store.getState().loadCached();

    expect(store.getState().budgets).toEqual([budget]);
  });

  it('refresh replaces budgets on success', async () => {
    const repository = makeRepository({ refresh: jest.fn().mockResolvedValue([budget]) });
    const store = createBudgetsStore(repository);

    await store.getState().refresh();

    expect(store.getState().budgets).toEqual([budget]);
    expect(store.getState().isLoading).toBe(false);
  });

  it('refresh surfaces an error on failure', async () => {
    const repository = makeRepository({ refresh: jest.fn().mockRejectedValue(new Error('Hors ligne.')) });
    const store = createBudgetsStore(repository);

    await expect(store.getState().refresh()).rejects.toThrow();

    expect(store.getState().error).toBe('Hors ligne.');
    expect(store.getState().isLoading).toBe(false);
  });

  it('create appends the new budget', async () => {
    const repository = makeRepository({ create: jest.fn().mockResolvedValue(budget) });
    const store = createBudgetsStore(repository);

    await store.getState().create({ amount: 50000 });

    expect(store.getState().budgets).toEqual([budget]);
    expect(store.getState().isSubmitting).toBe(false);
  });

  it('update replaces the matching budget', async () => {
    const updated: AppBudget = { ...budget, amount: 65000 };
    const repository = makeRepository({
      getCached: jest.fn().mockResolvedValue([budget]),
      update: jest.fn().mockResolvedValue(updated),
    });
    const store = createBudgetsStore(repository);
    await store.getState().loadCached();

    await store.getState().update(budget.id, 65000);

    expect(store.getState().budgets).toEqual([updated]);
  });

  it('remove drops the budget from state', async () => {
    const repository = makeRepository({
      getCached: jest.fn().mockResolvedValue([budget]),
      remove: jest.fn().mockResolvedValue(undefined),
    });
    const store = createBudgetsStore(repository);
    await store.getState().loadCached();

    await store.getState().remove(budget.id);

    expect(store.getState().budgets).toEqual([]);
  });
});
