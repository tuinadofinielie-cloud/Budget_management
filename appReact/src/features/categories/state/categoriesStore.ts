import { create, StoreApi, UseBoundStore } from 'zustand';
import { AppCategory } from '../../../shared/models/appCategory';
import { CategoriesRepository } from '../data/categoriesRepository';

export interface CategoriesState {
  categories: AppCategory[];
  isLoading: boolean;
  error: string | null;
  loadCached: () => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function createCategoriesStore(repository: CategoriesRepository): UseBoundStore<StoreApi<CategoriesState>> {
  return create<CategoriesState>((set) => ({
    categories: [],
    isLoading: false,
    error: null,

    loadCached: async () => {
      const categories = await repository.getCached();
      set({ categories });
    },

    refresh: async () => {
      set({ isLoading: true, error: null });
      try {
        const categories = await repository.refresh();
        set({ categories, isLoading: false });
      } catch (err) {
        set({ isLoading: false, error: err instanceof Error ? err.message : 'Une erreur est survenue.' });
        throw err;
      }
    },

    clearError: () => set({ error: null }),
  }));
}
