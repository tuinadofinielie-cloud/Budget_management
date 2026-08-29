import { createCategoriesStore } from '../categoriesStore';
import { CategoriesRepository } from '../../data/categoriesRepository';
import { AppCategory } from '../../../../shared/models/appCategory';

function makeRepository(overrides: Partial<CategoriesRepository> = {}): CategoriesRepository {
  return {
    getCached: jest.fn().mockResolvedValue([]),
    refresh: jest.fn(),
    ...overrides,
  } as unknown as CategoriesRepository;
}

const category: AppCategory = { id: 1, name: 'Nourriture', icon: 'food', color: '#FF0000', type: 'expense' };

describe('categoriesStore', () => {
  it('loadCached populates categories from the repository cache', async () => {
    const repository = makeRepository({ getCached: jest.fn().mockResolvedValue([category]) });
    const store = createCategoriesStore(repository);

    await store.getState().loadCached();

    expect(store.getState().categories).toEqual([category]);
  });

  it('refresh replaces categories on success', async () => {
    const repository = makeRepository({ refresh: jest.fn().mockResolvedValue([category]) });
    const store = createCategoriesStore(repository);

    await store.getState().refresh();

    expect(store.getState().categories).toEqual([category]);
    expect(store.getState().isLoading).toBe(false);
  });

  it('refresh surfaces an error on failure', async () => {
    const repository = makeRepository({ refresh: jest.fn().mockRejectedValue(new Error('Hors ligne.')) });
    const store = createCategoriesStore(repository);

    await expect(store.getState().refresh()).rejects.toThrow();

    expect(store.getState().error).toBe('Hors ligne.');
    expect(store.getState().isLoading).toBe(false);
  });
});
