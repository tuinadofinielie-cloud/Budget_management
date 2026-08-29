import { create, StoreApi, UseBoundStore } from 'zustand';
import { AppBudget } from '../../../shared/models/appBudget';
import { BudgetsRepository } from '../data/budgetsRepository';
import { BudgetParams } from '../data/budgetsApi';

export interface BudgetsState {
  budgets: AppBudget[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  loadCached: () => Promise<void>;
  refresh: () => Promise<void>;
  create: (params: BudgetParams) => Promise<void>;
  update: (id: number, amount: number) => Promise<void>;
  remove: (id: number) => Promise<void>;
  clearError: () => void;
}

export function createBudgetsStore(repository: BudgetsRepository): UseBoundStore<StoreApi<BudgetsState>> {
  return create<BudgetsState>((set, get) => ({
    budgets: [],
    isLoading: false,
    isSubmitting: false,
    error: null,

    loadCached: async () => {
      const budgets = await repository.getCached();
      set({ budgets });
    },

    refresh: async () => {
      set({ isLoading: true, error: null });
      try {
        const budgets = await repository.refresh();
        set({ budgets, isLoading: false });
      } catch (err) {
        set({ isLoading: false, error: err instanceof Error ? err.message : 'Une erreur est survenue.' });
        throw err;
      }
    },

    create: async (params) => {
      set({ isSubmitting: true, error: null });
      try {
        const budget = await repository.create(params);
        set({ budgets: [...get().budgets, budget], isSubmitting: false });
      } catch (err) {
        set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Une erreur est survenue.' });
        throw err;
      }
    },

    update: async (id, amount) => {
      set({ isSubmitting: true, error: null });
      try {
        const budget = await repository.update(id, amount);
        set({
          budgets: get().budgets.map((existing) => (existing.id === id ? budget : existing)),
          isSubmitting: false,
        });
      } catch (err) {
        set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Une erreur est survenue.' });
        throw err;
      }
    },

    remove: async (id) => {
      set({ isSubmitting: true, error: null });
      try {
        await repository.remove(id);
        set({ budgets: get().budgets.filter((existing) => existing.id !== id), isSubmitting: false });
      } catch (err) {
        set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Une erreur est survenue.' });
        throw err;
      }
    },

    clearError: () => set({ error: null }),
  }));
}
