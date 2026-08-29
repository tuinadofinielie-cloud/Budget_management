import * as SQLite from 'expo-sqlite';
import { AppDatabase, SqliteExecutor } from './appDatabase';

export async function openAppDatabase(): Promise<AppDatabase> {
  const db = await SQLite.openDatabaseAsync('finance_app.db');

  const executor: SqliteExecutor = {
    execAsync: (sql) => db.execAsync(sql),
    runAsync: async (sql, params = []) => {
      await db.runAsync(sql, params as SQLite.SQLiteBindParams);
    },
    getFirstAsync: (sql, params = []) => db.getFirstAsync(sql, params as SQLite.SQLiteBindParams),
    getAllAsync: (sql, params = []) => db.getAllAsync(sql, params as SQLite.SQLiteBindParams),
  };

  return new AppDatabase(executor);
}
