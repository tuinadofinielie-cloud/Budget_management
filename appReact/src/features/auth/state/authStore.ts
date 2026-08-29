import { create, StoreApi, UseBoundStore } from 'zustand';
import { AppUser } from '../../../shared/models/appUser';
import { AuthRepository } from '../data/authRepository';

export type AuthStatus = 'unknown' | 'unauthenticated' | 'authenticated';

export interface AuthState {
  status: AuthStatus;
  user: AppUser | null;
  isSubmitting: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  register: (params: { name: string; email: string; password: string; passwordConfirmation: string }) => Promise<void>;
  login: (params: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

export function createAuthStore(repository: AuthRepository): UseBoundStore<StoreApi<AuthState>> {
  return create<AuthState>((set) => ({
    status: 'unknown',
    user: null,
    isSubmitting: false,
    error: null,

    bootstrap: async () => {
      const hasSession = await repository.hasValidSession();
      if (!hasSession) {
        set({ status: 'unauthenticated', user: null });
        return;
      }
      const cached = await repository.cachedUser();
      if (!cached) {
        set({ status: 'unauthenticated', user: null });
        return;
      }
      set({ status: 'authenticated', user: cached });
    },

    register: async (params) => {
      set({ isSubmitting: true, error: null });
      try {
        const user = await repository.register(params);
        set({ status: 'authenticated', user, isSubmitting: false });
      } catch (err) {
        set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Une erreur est survenue.' });
        throw err;
      }
    },

    login: async (params) => {
      set({ isSubmitting: true, error: null });
      try {
        const user = await repository.login(params);
        set({ status: 'authenticated', user, isSubmitting: false });
      } catch (err) {
        set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Une erreur est survenue.' });
        throw err;
      }
    },

    logout: async () => {
      await repository.logout();
      set({ status: 'unauthenticated', user: null });
    },

    forgotPassword: async (email) => {
      set({ isSubmitting: true, error: null });
      try {
        await repository.forgotPassword(email);
        set({ isSubmitting: false });
      } catch (err) {
        set({ isSubmitting: false, error: err instanceof Error ? err.message : 'Une erreur est survenue.' });
        throw err;
      }
    },

    clearError: () => set({ error: null }),
  }));
}
