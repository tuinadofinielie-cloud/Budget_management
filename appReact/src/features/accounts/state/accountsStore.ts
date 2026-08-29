import { create, StoreApi, UseBoundStore } from 'zustand';
import { AppAccount, AccountType } from '../../../shared/models/appAccount';
import { AccountsRepository } from '../data/accountsRepository';

export interface AccountsState {
  accounts: AppAccount[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  loadCached: () => Promise<void>;
  refresh: () => Promise<void>;
  create: (params: { name: string; type: AccountType; balance?: number }) => Promise<void>;
  update: (id: number, params: { name?: string; type?: AccountType }) => Promise<void>;
  remove: (id: number) => Promise<void>;
  clearError: () => void;
}

export function createAccountsStore(repository: AccountsRepository): UseBoundStore<StoreApi<AccountsState>> {
  return create<AccountsState>((set, get) => ({
    accounts: [],
    isLoading: false,
    isSubmitting: false,
    error: null,

    loadCached: async () => {
      const accounts = await repository.getCached();
      set({ accounts });
    },

    refresh: async () => {
      set({ isLoading: true, error: null });
      try {
        const accounts = await repository.refresh();
        set({ accounts, isLoading: false });
      } catch (err) {
        set({ isLoading: false, error: err instanceof Error ? err.message : 'Une erreur est survenue.' });
        throw err;
      }
    },

    create: async (params) => {
      set({ isSubmitting: true, error: null });
      try {
        const account = await repository.create(params);
        set({ accounts: [...get().accounts, account], isSubmitting: false });
      } catch (err) {
        set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Une erreur est survenue.' });
        throw err;
      }
    },

    update: async (id, params) => {
      set({ isSubmitting: true, error: null });
      try {
        const account = await repository.update(id, params);
        set({
          accounts: get().accounts.map((existing) => (existing.id === id ? account : existing)),
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
        set({ accounts: get().accounts.filter((existing) => existing.id !== id), isSubmitting: false });
      } catch (err) {
        set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Une erreur est survenue.' });
        throw err;
      }
    },

    clearError: () => set({ error: null }),
  }));
}
