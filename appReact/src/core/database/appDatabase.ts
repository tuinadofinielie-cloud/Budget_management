export interface CachedUser {
  id: number;
  name: string;
  email: string;
  currency: string;
  avatar: string | null;
}

/** The minimal subset of expo-sqlite's async `SQLiteDatabase` API this class needs — kept narrow so a fake can implement it in tests without a native module. */
export interface SqliteExecutor {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: unknown[]): Promise<void>;
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
}

const CREATE_TABLE_SQL = `CREATE TABLE IF NOT EXISTS local_users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  currency TEXT NOT NULL,
  avatar TEXT,
  sync_state TEXT NOT NULL DEFAULT 'synced'
);`;

export class AppDatabase {
  private ready: Promise<void>;

  constructor(private db: SqliteExecutor) {
    this.ready = this.db.execAsync(CREATE_TABLE_SQL);
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
}
