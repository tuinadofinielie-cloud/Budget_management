export interface CachedUser {
  id: number;
  name: string;
  email: string;
  currency: string;
  avatar: string | null;
}

export interface CachedAccount {
  id: number;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

export interface CachedCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  type: string;
}

export interface CachedTransaction {
  id: number;
  type: string;
  amount: number;
  category_id: number | null;
  account_id: number;
  to_account_id: number | null;
  description: string | null;
  date: string;
}

export interface CachedBudget {
  id: number;
  category_id: number | null;
  amount: number;
  period: string;
}

/** The minimal subset of expo-sqlite's async `SQLiteDatabase` API this class needs — kept narrow so a fake can implement it in tests without a native module. */
export interface SqliteExecutor {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: unknown[]): Promise<void>;
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>;
}

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS local_users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  currency TEXT NOT NULL,
  avatar TEXT,
  sync_state TEXT NOT NULL DEFAULT 'synced'
);
CREATE TABLE IF NOT EXISTS local_accounts (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  balance INTEGER NOT NULL,
  currency TEXT NOT NULL,
  sync_state TEXT NOT NULL DEFAULT 'synced'
);
CREATE TABLE IF NOT EXISTS local_categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  type TEXT NOT NULL,
  sync_state TEXT NOT NULL DEFAULT 'synced'
);
CREATE TABLE IF NOT EXISTS local_transactions (
  id INTEGER PRIMARY KEY,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  category_id INTEGER,
  account_id INTEGER NOT NULL,
  to_account_id INTEGER,
  description TEXT,
  date TEXT NOT NULL,
  sync_state TEXT NOT NULL DEFAULT 'synced'
);
CREATE TABLE IF NOT EXISTS local_budgets (
  id INTEGER PRIMARY KEY,
  category_id INTEGER,
  amount INTEGER NOT NULL,
  period TEXT NOT NULL DEFAULT 'monthly',
  sync_state TEXT NOT NULL DEFAULT 'synced'
);
`;

export class AppDatabase {
  private ready: Promise<void>;

  constructor(private db: SqliteExecutor) {
    this.ready = this.db.execAsync(CREATE_TABLES_SQL);
  }

  async cacheUser(user: CachedUser): Promise<void> {
    await this.ready;
    await this.db.runAsync(
      `INSERT OR REPLACE INTO local_users (id, name, email, currency, avatar, sync_state) VALUES (?, ?, ?, ?, ?, 'synced');`,
      [user.id, user.name, user.email, user.currency, user.avatar]
    );
  }

  async getCachedUser(): Promise<CachedUser | null> {
    await this.ready;
    return this.db.getFirstAsync<CachedUser>(
      `SELECT id, name, email, currency, avatar FROM local_users LIMIT 1;`
    );
  }

  async clearCachedUser(): Promise<void> {
    await this.ready;
    await this.db.runAsync(`DELETE FROM local_users;`);
  }

  async replaceAccounts(accounts: CachedAccount[]): Promise<void> {
    await this.ready;
    await this.db.runAsync(`DELETE FROM local_accounts;`);
    for (const account of accounts) {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO local_accounts (id, name, type, balance, currency, sync_state) VALUES (?, ?, ?, ?, ?, 'synced');`,
        [account.id, account.name, account.type, account.balance, account.currency]
      );
    }
  }

  async upsertAccount(account: CachedAccount): Promise<void> {
    await this.ready;
    await this.db.runAsync(
      `INSERT OR REPLACE INTO local_accounts (id, name, type, balance, currency, sync_state) VALUES (?, ?, ?, ?, ?, 'synced');`,
      [account.id, account.name, account.type, account.balance, account.currency]
    );
  }

  async deleteAccount(id: number): Promise<void> {
    await this.ready;
    await this.db.runAsync(`DELETE FROM local_accounts WHERE id = ?;`, [id]);
  }

  async getCachedAccounts(): Promise<CachedAccount[]> {
    await this.ready;
    return this.db.getAllAsync<CachedAccount>(
      `SELECT id, name, type, balance, currency FROM local_accounts ORDER BY name;`
    );
  }

  async replaceCategories(categories: CachedCategory[]): Promise<void> {
    await this.ready;
    await this.db.runAsync(`DELETE FROM local_categories;`);
    for (const category of categories) {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO local_categories (id, name, icon, color, type, sync_state) VALUES (?, ?, ?, ?, ?, 'synced');`,
        [category.id, category.name, category.icon, category.color, category.type]
      );
    }
  }

  async getCachedCategories(): Promise<CachedCategory[]> {
    await this.ready;
    return this.db.getAllAsync<CachedCategory>(
      `SELECT id, name, icon, color, type FROM local_categories ORDER BY name;`
    );
  }

  async replaceTransactions(transactions: CachedTransaction[]): Promise<void> {
    await this.ready;
    await this.db.runAsync(`DELETE FROM local_transactions;`);
    for (const transaction of transactions) {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO local_transactions (id, type, amount, category_id, account_id, to_account_id, description, date, sync_state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced');`,
        [
          transaction.id,
          transaction.type,
          transaction.amount,
          transaction.category_id,
          transaction.account_id,
          transaction.to_account_id,
          transaction.description,
          transaction.date,
        ]
      );
    }
  }

  async upsertTransaction(transaction: CachedTransaction): Promise<void> {
    await this.ready;
    await this.db.runAsync(
      `INSERT OR REPLACE INTO local_transactions (id, type, amount, category_id, account_id, to_account_id, description, date, sync_state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced');`,
      [
        transaction.id,
        transaction.type,
        transaction.amount,
        transaction.category_id,
        transaction.account_id,
        transaction.to_account_id,
        transaction.description,
        transaction.date,
      ]
    );
  }

  async deleteTransaction(id: number): Promise<void> {
    await this.ready;
    await this.db.runAsync(`DELETE FROM local_transactions WHERE id = ?;`, [id]);
  }

  async getCachedTransactions(): Promise<CachedTransaction[]> {
    await this.ready;
    return this.db.getAllAsync<CachedTransaction>(
      `SELECT id, type, amount, category_id, account_id, to_account_id, description, date FROM local_transactions ORDER BY date DESC, id DESC;`
    );
  }

  async replaceBudgets(budgets: CachedBudget[]): Promise<void> {
    await this.ready;
    await this.db.runAsync(`DELETE FROM local_budgets;`);
    for (const budget of budgets) {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO local_budgets (id, category_id, amount, period, sync_state) VALUES (?, ?, ?, ?, 'synced');`,
        [budget.id, budget.category_id, budget.amount, budget.period]
      );
    }
  }

  async upsertBudget(budget: CachedBudget): Promise<void> {
    await this.ready;
    await this.db.runAsync(
      `INSERT OR REPLACE INTO local_budgets (id, category_id, amount, period, sync_state) VALUES (?, ?, ?, ?, 'synced');`,
      [budget.id, budget.category_id, budget.amount, budget.period]
    );
  }

  async deleteBudget(id: number): Promise<void> {
    await this.ready;
    await this.db.runAsync(`DELETE FROM local_budgets WHERE id = ?;`, [id]);
  }

  async getCachedBudgets(): Promise<CachedBudget[]> {
    await this.ready;
    return this.db.getAllAsync<CachedBudget>(
      `SELECT id, category_id, amount, period FROM local_budgets ORDER BY id DESC;`
    );
  }
}
