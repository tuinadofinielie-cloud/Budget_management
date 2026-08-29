import { AppDatabase } from '../../../core/database/appDatabase';
import { AppTransaction, TransactionType, appTransactionFromJson } from '../../../shared/models/appTransaction';
import { TransactionsApi, TransactionParams } from './transactionsApi';

export class TransactionsRepository {
  constructor(
    private api: TransactionsApi,
    private getDatabase: () => Promise<AppDatabase>
  ) {}

  async getCached(): Promise<AppTransaction[]> {
    const database = await this.getDatabase();
    const rows = await database.getCachedTransactions();
    return rows.map((row) => ({
      id: row.id,
      type: row.type as TransactionType,
      amount: row.amount,
      categoryId: row.category_id,
      accountId: row.account_id,
      toAccountId: row.to_account_id,
      description: row.description,
      date: row.date,
    }));
  }

  async refresh(): Promise<AppTransaction[]> {
    const raw = await this.api.list();
    const transactions = raw.map(appTransactionFromJson);
    const database = await this.getDatabase();
    await database.replaceTransactions(transactions.map(this.toCachedRow));
    return transactions;
  }

  async create(params: TransactionParams): Promise<AppTransaction> {
    const raw = await this.api.create(params);
    const transaction = appTransactionFromJson(raw);
    const database = await this.getDatabase();
    await database.upsertTransaction(this.toCachedRow(transaction));
    return transaction;
  }

  async update(id: number, params: TransactionParams): Promise<AppTransaction> {
    const raw = await this.api.update(id, params);
    const transaction = appTransactionFromJson(raw);
    const database = await this.getDatabase();
    await database.upsertTransaction(this.toCachedRow(transaction));
    return transaction;
  }

  async remove(id: number): Promise<void> {
    await this.api.remove(id);
    const database = await this.getDatabase();
    await database.deleteTransaction(id);
  }

  private toCachedRow(transaction: AppTransaction) {
    return {
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      category_id: transaction.categoryId,
      account_id: transaction.accountId,
      to_account_id: transaction.toAccountId,
      description: transaction.description,
      date: transaction.date,
    };
  }
}
