import { create, StoreApi, UseBoundStore } from 'zustand';
import { AppTransaction } from '../../../shared/models/appTransaction';
import { TransactionsRepository } from '../data/transactionsRepository';
import { TransactionParams } from '../data/transactionsApi';

export interface TransactionsState {
  transactions: AppTransaction[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  loadCached: () => Promise<void>;
  refresh: () => Promise<void>;
  create: (params: TransactionParams) => Promise<void>;
  update: (id: number, params: TransactionParams) => Promise<void>;
  remove: (id: number) => Promise<void>;
  clearError: () => void;
}

export function createTransactionsStore(
  repository: TransactionsRepository
): UseBoundStore<StoreApi<TransactionsState>> {
  return create<TransactionsState>((set, get) => ({
    transactions: [],
    isLoading: false,
    isSubmitting: false,
    error: null,

    loadCached: async () => {
      const transactions = await repository.getCached();
      set({ transactions });
    },

    refresh: async () => {
      set({ isLoading: true, error: null });
      try {
        const transactions = await repository.refresh();
        set({ transactions, isLoading: false });
      } catch (err) {
        set({ isLoading: false, error: err instanceof Error ? err.message : 'Une erreur est survenue.' });
        throw err;
      }
    },

    create: async (params) => {
      set({ isSubmitting: true, error: null });
      try {
        const transaction = await repository.create(params);
        set({ transactions: [transaction, ...get().transactions], isSubmitting: false });
      } catch (err) {
        set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Une erreur est survenue.' });
        throw err;
      }
    },

    update: async (id, params) => {
      set({ isSubmitting: true, error: null });
      try {
        const transaction = await repository.update(id, params);
        set({
          transactions: get().transactions.map((existing) => (existing.id === id ? transaction : existing)),
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
        set({ transactions: get().transactions.filter((existing) => existing.id !== id), isSubmitting: false });
      } catch (err) {
        set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Une erreur est survenue.' });
        throw err;
      }
    },

    clearError: () => set({ error: null }),
  }));
}
