import { createAuthStore } from '../authStore';
import { AuthRepository } from '../../data/authRepository';
import { AppUser } from '../../../../shared/models/appUser';

function makeRepository(overrides: Partial<AuthRepository> = {}): AuthRepository {
  return {
    hasValidSession: jest.fn().mockResolvedValue(false),
    cachedUser: jest.fn().mockResolvedValue(null),
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn().mockResolvedValue(undefined),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    ...overrides,
  } as unknown as AuthRepository;
}

const user: AppUser = { id: 1, name: 'Jackson', email: 'jackson@example.com', currency: 'XOF', avatar: null };

describe('authStore', () => {
  it('bootstrap resolves to unauthenticated when there is no session', async () => {
    const store = createAuthStore(makeRepository());

    await store.getState().bootstrap();

    expect(store.getState().status).toBe('unauthenticated');
  });

  it('bootstrap resolves to authenticated when a session and cached user exist', async () => {
    const repository = makeRepository({
      hasValidSession: jest.fn().mockResolvedValue(true),
      cachedUser: jest.fn().mockResolvedValue(user),
    });
    const store = createAuthStore(repository);

    await store.getState().bootstrap();

    expect(store.getState().status).toBe('authenticated');
    expect(store.getState().user).toEqual(user);
  });

  it('login sets status to authenticated on success', async () => {
    const repository = makeRepository({ login: jest.fn().mockResolvedValue(user) });
    const store = createAuthStore(repository);

    await store.getState().login({ email: 'jackson@example.com', password: 'password123' });

    expect(store.getState().status).toBe('authenticated');
    expect(store.getState().isSubmitting).toBe(false);
  });

  it('login surfaces an error message and does not authenticate on failure', async () => {
    const repository = makeRepository({ login: jest.fn().mockRejectedValue(new Error('Identifiants invalides.')) });
    const store = createAuthStore(repository);

    await expect(store.getState().login({ email: 'x@x.com', password: 'wrong' })).rejects.toThrow();

    expect(store.getState().status).not.toBe('authenticated');
    expect(store.getState().error).toBe('Identifiants invalides.');
  });

  it('logout resets to unauthenticated', async () => {
    const repository = makeRepository({
      hasValidSession: jest.fn().mockResolvedValue(true),
      cachedUser: jest.fn().mockResolvedValue(user),
    });
    const store = createAuthStore(repository);
    await store.getState().bootstrap();

    await store.getState().logout();

    expect(store.getState().status).toBe('unauthenticated');
    expect(store.getState().user).toBeNull();
  });
});
