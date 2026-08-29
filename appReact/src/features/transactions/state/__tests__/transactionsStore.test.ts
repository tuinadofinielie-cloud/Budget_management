import { createTransactionsStore } from '../transactionsStore';
import { TransactionsRepository } from '../../data/transactionsRepository';
import { AppTransaction } from '../../../../shared/models/appTransaction';
import { TransactionParams } from '../../data/transactionsApi';

function makeRepository(overrides: Partial<TransactionsRepository> = {}): TransactionsRepository {
  return {
    getCached: jest.fn().mockResolvedValue([]),
    refresh: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    ...overrides,
  } as unknown as TransactionsRepository;
}

const transaction: AppTransaction = {
  id: 1,
  type: 'expense',
  amount: 500,
  categoryId: 2,
  accountId: 1,
  toAccountId: null,
  description: 'Marché',
  date: '2026-08-29',
};

const params: TransactionParams = {
  type: 'expense',
  amount: 500,
  accountId: 1,
  categoryId: 2,
  date: '2026-08-29',
};

describe('transactionsStore', () => {
  it('loadCached populates transactions from the repository cache', async () => {
    const repository = makeRepository({ getCached: jest.fn().mockResolvedValue([transaction]) });
    const store = createTransactionsStore(repository);

    await store.getState().loadCached();

    expect(store.getState().transactions).toEqual([transaction]);
  });

  it('refresh replaces transactions on success', async () => {
    const repository = makeRepository({ refresh: jest.fn().mockResolvedValue([transaction]) });
    const store = createTransactionsStore(repository);

    await store.getState().refresh();

    expect(store.getState().transactions).toEqual([transaction]);
    expect(store.getState().isLoading).toBe(false);
  });

  it('refresh surfaces an error on failure', async () => {
    const repository = makeRepository({ refresh: jest.fn().mockRejectedValue(new Error('Hors ligne.')) });
    const store = createTransactionsStore(repository);

    await expect(store.getState().refresh()).rejects.toThrow();

    expect(store.getState().error).toBe('Hors ligne.');
    expect(store.getState().isLoading).toBe(false);
  });

  it('create prepends the new transaction', async () => {
    const repository = makeRepository({ create: jest.fn().mockResolvedValue(transaction) });
    const store = createTransactionsStore(repository);

    await store.getState().create(params);

    expect(store.getState().transactions).toEqual([transaction]);
    expect(store.getState().isSubmitting).toBe(false);
  });

  it('remove drops the transaction from state', async () => {
    const repository = makeRepository({
      getCached: jest.fn().mockResolvedValue([transaction]),
      remove: jest.fn().mockResolvedValue(undefined),
    });
    const store = createTransactionsStore(repository);
    await store.getState().loadCached();

    await store.getState().remove(transaction.id);

    expect(store.getState().transactions).toEqual([]);
  });
});
