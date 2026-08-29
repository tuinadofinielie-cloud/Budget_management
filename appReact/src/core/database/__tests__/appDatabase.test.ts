import { AppDatabase, SqliteExecutor } from '../appDatabase';

/** A small in-memory stand-in for expo-sqlite, keyed by table + id, so tests don't need a native module. */
class InMemorySqliteExecutor implements SqliteExecutor {
  private tables: Record<string, Map<number, any>> = {
    local_users: new Map(),
    local_accounts: new Map(),
    local_categories: new Map(),
    local_transactions: new Map(),
  };

  private static COLUMNS: Record<string, string[]> = {
    local_users: ['id', 'name', 'email', 'currency', 'avatar'],
    local_accounts: ['id', 'name', 'type', 'balance', 'currency'],
    local_categories: ['id', 'name', 'icon', 'color', 'type'],
    local_transactions: ['id', 'type', 'amount', 'category_id', 'account_id', 'to_account_id', 'description', 'date'],
  };

  async execAsync(): Promise<void> {}

  async runAsync(sql: string, params: unknown[] = []): Promise<void> {
    const table = this.tableFromSql(sql);
    if (sql.startsWith('DELETE') && sql.includes('WHERE id')) {
      this.tables[table]?.delete(params[0] as number);
    } else if (sql.startsWith('DELETE')) {
      this.tables[table]?.clear();
    } else if (sql.startsWith('INSERT')) {
      const columns = InMemorySqliteExecutor.COLUMNS[table] ?? [];
      const row: Record<string, unknown> = {};
      columns.forEach((column, index) => {
        row[column] = params[index];
      });
      this.tables[table]?.set(row.id as number, row);
    }
  }

  async getFirstAsync<T>(sql: string): Promise<T | null> {
    const table = this.tableFromSql(sql);
    const rows = [...(this.tables[table]?.values() ?? [])];
    return (rows[0] as T) ?? null;
  }

  async getAllAsync<T>(sql: string): Promise<T[]> {
    const table = this.tableFromSql(sql);
    return [...(this.tables[table]?.values() ?? [])] as T[];
  }

  private tableFromSql(sql: string): string {
    return sql.match(/(?:FROM|INTO)\s+(\w+)/i)?.[1] ?? '';
  }
}

describe('AppDatabase — cached user', () => {
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

describe('AppDatabase — accounts', () => {
  it('replaceAccounts clears and repopulates the local cache', async () => {
    const database = new AppDatabase(new InMemorySqliteExecutor());

    await database.replaceAccounts([{ id: 1, name: 'Cash', type: 'cash', balance: 5000, currency: 'XOF' }]);
    await database.replaceAccounts([{ id: 2, name: 'Orange Money', type: 'orange_money', balance: 1000, currency: 'XOF' }]);

    const accounts = await database.getCachedAccounts();
    expect(accounts).toHaveLength(1);
    expect(accounts[0].name).toBe('Orange Money');
  });

  it('upsertAccount adds a single account without clearing the rest', async () => {
    const database = new AppDatabase(new InMemorySqliteExecutor());
    await database.replaceAccounts([{ id: 1, name: 'Cash', type: 'cash', balance: 0, currency: 'XOF' }]);

    await database.upsertAccount({ id: 2, name: 'Bank', type: 'bank', balance: 20000, currency: 'XOF' });

    const accounts = await database.getCachedAccounts();
    expect(accounts).toHaveLength(2);
  });

  it('deleteAccount removes a single account', async () => {
    const database = new AppDatabase(new InMemorySqliteExecutor());
    await database.replaceAccounts([{ id: 1, name: 'Cash', type: 'cash', balance: 0, currency: 'XOF' }]);

    await database.deleteAccount(1);

    expect(await database.getCachedAccounts()).toHaveLength(0);
  });
});

describe('AppDatabase — categories', () => {
  it('replaceCategories clears and repopulates the local cache', async () => {
    const database = new AppDatabase(new InMemorySqliteExecutor());

    await database.replaceCategories([
      { id: 1, name: 'Nourriture', icon: '🍚', color: '#FF9F71', type: 'expense' },
      { id: 2, name: 'Salaire', icon: '💰', color: '#5B3FD4', type: 'income' },
    ]);

    const categories = await database.getCachedCategories();
    expect(categories).toHaveLength(2);
  });
});

describe('AppDatabase — transactions', () => {
  it('replaceTransactions clears and repopulates the local cache', async () => {
    const database = new AppDatabase(new InMemorySqliteExecutor());

    await database.replaceTransactions([
      {
        id: 1,
        type: 'expense',
        amount: 2500,
        category_id: 3,
        account_id: 1,
        to_account_id: null,
        description: 'Déjeuner',
        date: '2026-08-29',
      },
    ]);

    const transactions = await database.getCachedTransactions();
    expect(transactions).toHaveLength(1);
    expect(transactions[0].amount).toBe(2500);
  });

  it('upsertTransaction adds a single transaction without clearing the rest', async () => {
    const database = new AppDatabase(new InMemorySqliteExecutor());
    await database.replaceTransactions([
      { id: 1, type: 'expense', amount: 1000, category_id: 1, account_id: 1, to_account_id: null, description: null, date: '2026-08-29' },
    ]);

    await database.upsertTransaction({
      id: 2,
      type: 'income',
      amount: 50000,
      category_id: 2,
      account_id: 1,
      to_account_id: null,
      description: null,
      date: '2026-08-29',
    });

    expect(await database.getCachedTransactions()).toHaveLength(2);
  });

  it('deleteTransaction removes a single transaction', async () => {
    const database = new AppDatabase(new InMemorySqliteExecutor());
    await database.replaceTransactions([
      { id: 1, type: 'expense', amount: 1000, category_id: 1, account_id: 1, to_account_id: null, description: null, date: '2026-08-29' },
    ]);

    await database.deleteTransaction(1);

    expect(await database.getCachedTransactions()).toHaveLength(0);
  });
});
