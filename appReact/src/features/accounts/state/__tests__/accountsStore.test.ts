import { createAccountsStore } from '../accountsStore';
import { AccountsRepository } from '../../data/accountsRepository';
import { AppAccount } from '../../../../shared/models/appAccount';

function makeRepository(overrides: Partial<AccountsRepository> = {}): AccountsRepository {
  return {
    getCached: jest.fn().mockResolvedValue([]),
    refresh: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    ...overrides,
  } as unknown as AccountsRepository;
}

const account: AppAccount = { id: 1, name: 'Cash', type: 'cash', balance: 1000, currency: 'XOF' };

describe('accountsStore', () => {
  it('loadCached populates accounts from the repository cache', async () => {
    const repository = makeRepository({ getCached: jest.fn().mockResolvedValue([account]) });
    const store = createAccountsStore(repository);

    await store.getState().loadCached();

    expect(store.getState().accounts).toEqual([account]);
  });

  it('refresh replaces accounts on success', async () => {
    const repository = makeRepository({ refresh: jest.fn().mockResolvedValue([account]) });
    const store = createAccountsStore(repository);

    await store.getState().refresh();

    expect(store.getState().accounts).toEqual([account]);
    expect(store.getState().isLoading).toBe(false);
  });

  it('refresh surfaces an error on failure', async () => {
    const repository = makeRepository({ refresh: jest.fn().mockRejectedValue(new Error('Hors ligne.')) });
    const store = createAccountsStore(repository);

    await expect(store.getState().refresh()).rejects.toThrow();

    expect(store.getState().error).toBe('Hors ligne.');
    expect(store.getState().isLoading).toBe(false);
  });

  it('create appends the new account', async () => {
    const repository = makeRepository({ create: jest.fn().mockResolvedValue(account) });
    const store = createAccountsStore(repository);

    await store.getState().create({ name: 'Cash', type: 'cash' });

    expect(store.getState().accounts).toEqual([account]);
    expect(store.getState().isSubmitting).toBe(false);
  });

  it('remove drops the account from state', async () => {
    const repository = makeRepository({
      getCached: jest.fn().mockResolvedValue([account]),
      remove: jest.fn().mockResolvedValue(undefined),
    });
    const store = createAccountsStore(repository);
    await store.getState().loadCached();

    await store.getState().remove(account.id);

    expect(store.getState().accounts).toEqual([]);
  });
});
