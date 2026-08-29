import { AppDatabase, SqliteExecutor, CachedUser } from '../appDatabase';

class InMemorySqliteExecutor implements SqliteExecutor {
  private row: CachedUser | null = null;

  async execAsync(_sql: string): Promise<void> {}

  async runAsync(sql: string, params: unknown[] = []): Promise<void> {
    if (sql.startsWith('INSERT')) {
      const [id, name, email, currency, avatar] = params as [number, string, string, string, string | null];
      this.row = { id, name, email, currency, avatar };
    } else if (sql.startsWith('DELETE')) {
      this.row = null;
    }
  }

  async getFirstAsync<T>(_sql: string): Promise<T | null> {
    return this.row as T | null;
  }
}

describe('AppDatabase', () => {
  it('cacheUser inserts and getCachedUser reads it back', async () => {
    const database = new AppDatabase(new InMemorySqliteExecutor());

    await database.cacheUser({ id: 1, name: 'Jackson', email: 'jackson@example.com', currency: 'XOF', avatar: null });
    const user = await database.getCachedUser();

    expect(user).not.toBeNull();
    expect(user?.name).toBe('Jackson');
    expect(user?.currency).toBe('XOF');
    expect(user?.avatar).toBeNull();
  });

  it('cacheUser overwrites the previous cached user', async () => {
    const database = new AppDatabase(new InMemorySqliteExecutor());

    await database.cacheUser({ id: 1, name: 'Jackson', email: 'a@a.com', currency: 'XOF', avatar: null });
    await database.cacheUser({ id: 1, name: 'Jackson Updated', email: 'a@a.com', currency: 'XOF', avatar: null });

    const user = await database.getCachedUser();
    expect(user?.name).toBe('Jackson Updated');
  });

  it('clearCachedUser removes the cached row', async () => {
    const database = new AppDatabase(new InMemorySqliteExecutor());

    await database.cacheUser({ id: 1, name: 'Jackson', email: 'a@a.com', currency: 'XOF', avatar: null });
    await database.clearCachedUser();

    expect(await database.getCachedUser()).toBeNull();
  });
});
