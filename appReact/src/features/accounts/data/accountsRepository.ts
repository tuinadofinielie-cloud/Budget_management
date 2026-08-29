import { AppDatabase } from '../../../core/database/appDatabase';
import { AppAccount, AccountType, appAccountFromJson } from '../../../shared/models/appAccount';
import { AccountsApi } from './accountsApi';

export class AccountsRepository {
  constructor(
    private api: AccountsApi,
    private getDatabase: () => Promise<AppDatabase>
  ) {}

  async getCached(): Promise<AppAccount[]> {
    const database = await this.getDatabase();
    const rows = await database.getCachedAccounts();
    return rows.map((row) => ({ ...row, type: row.type as AccountType }));
  }

  async refresh(): Promise<AppAccount[]> {
    const raw = await this.api.list();
    const accounts = raw.map(appAccountFromJson);
    const database = await this.getDatabase();
    await database.replaceAccounts(accounts);
    return accounts;
  }

  async create(params: { name: string; type: AccountType; balance?: number }): Promise<AppAccount> {
    const raw = await this.api.create(params);
    const account = appAccountFromJson(raw);
    const database = await this.getDatabase();
    await database.upsertAccount(account);
    return account;
  }

  async update(id: number, params: { name?: string; type?: AccountType }): Promise<AppAccount> {
    const raw = await this.api.update(id, params);
    const account = appAccountFromJson(raw);
    const database = await this.getDatabase();
    await database.upsertAccount(account);
    return account;
  }

  async remove(id: number): Promise<void> {
    await this.api.remove(id);
    const database = await this.getDatabase();
    await database.deleteAccount(id);
  }
}
