import { AppDatabase, SqliteExecutor, CachedUser } from '../../../../core/database/appDatabase';
import { SecureStorageService } from '../../../../core/services/secureStorageService';
import { AuthApi, AuthApiError } from '../authApi';
import { AuthRepository } from '../authRepository';

class InMemorySqliteExecutor implements SqliteExecutor {
  private row: CachedUser | null = null;
  async execAsync(): Promise<void> {}
  async runAsync(sql: string, params: unknown[] = []): Promise<void> {
    if (sql.startsWith('INSERT')) {
      const [id, name, email, currency, avatar] = params as [number, string, string, string, string | null];
      this.row = { id, name, email, currency, avatar };
    } else if (sql.startsWith('DELETE')) {
      this.row = null;
    }
  }
  async getFirstAsync<T>(): Promise<T | null> {
    return this.row as T | null;
  }
  async getAllAsync<T>(): Promise<T[]> {
    return this.row ? [this.row as unknown as T] : [];
  }
}

function createMockStorage() {
  return {
    setItemAsync: jest.fn().mockResolvedValue(undefined),
    getItemAsync: jest.fn().mockResolvedValue(null),
    deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  };
}

describe('AuthRepository', () => {
  it('login persists the token and caches the user locally', async () => {
    const storage = createMockStorage();
    const secureStorage = new SecureStorageService(storage);
    const database = new AppDatabase(new InMemorySqliteExecutor());
    const authApi = { login: jest.fn(), register: jest.fn(), logout: jest.fn(), forgotPassword: jest.fn(), resetPassword: jest.fn() } as unknown as AuthApi;
    (authApi.login as jest.Mock).mockResolvedValue({
      token: 'token-123',
      user: { id: 1, name: 'Jackson', email: 'jackson@example.com', currency: 'XOF', avatar: null },
    });
    const repository = new AuthRepository(authApi, secureStorage, async () => database);

    const user = await repository.login({ email: 'jackson@example.com', password: 'password123' });

    expect(user.name).toBe('Jackson');
    expect(storage.setItemAsync).toHaveBeenCalledWith('auth_token', 'token-123');
    const cached = await database.getCachedUser();
    expect(cached?.email).toBe('jackson@example.com');
  });

  it('hasValidSession reflects whether a token is stored', async () => {
    const storage = createMockStorage();
    const secureStorage = new SecureStorageService(storage);
    const database = new AppDatabase(new InMemorySqliteExecutor());
    const authApi = {} as AuthApi;
    const repository = new AuthRepository(authApi, secureStorage, async () => database);

    expect(await repository.hasValidSession()).toBe(false);

    storage.getItemAsync.mockResolvedValue('a-token');
    expect(await repository.hasValidSession()).toBe(true);
  });

  it('logout clears the token and cached user even if the API call fails', async () => {
    const storage = createMockStorage();
    const secureStorage = new SecureStorageService(storage);
    const database = new AppDatabase(new InMemorySqliteExecutor());
    await database.cacheUser({ id: 1, name: 'Jackson', email: 'a@a.com', currency: 'XOF', avatar: null });
    const authApi = { logout: jest.fn().mockRejectedValue(new AuthApiError('network error')) } as unknown as AuthApi;
    const repository = new AuthRepository(authApi, secureStorage, async () => database);

    await expect(repository.logout()).rejects.toBeInstanceOf(AuthApiError);

    expect(storage.deleteItemAsync).toHaveBeenCalledWith('auth_token');
    expect(await database.getCachedUser()).toBeNull();
  });
});
