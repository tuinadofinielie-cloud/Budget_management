import { AppDatabase } from '../../../core/database/appDatabase';
import { AppBudget, BudgetPeriod, appBudgetFromJson } from '../../../shared/models/appBudget';
import { BudgetsApi, BudgetParams } from './budgetsApi';

export class BudgetsRepository {
  constructor(
    private api: BudgetsApi,
    private getDatabase: () => Promise<AppDatabase>
  ) {}

  async getCached(): Promise<AppBudget[]> {
    const database = await this.getDatabase();
    const rows = await database.getCachedBudgets();
    return rows.map((row) => ({
      id: row.id,
      categoryId: row.category_id,
      amount: row.amount,
      period: row.period as BudgetPeriod,
    }));
  }

  async refresh(): Promise<AppBudget[]> {
    const raw = await this.api.list();
    const budgets = raw.map(appBudgetFromJson);
    const database = await this.getDatabase();
    await database.replaceBudgets(
      budgets.map((budget) => ({ id: budget.id, category_id: budget.categoryId, amount: budget.amount, period: budget.period }))
    );
    return budgets;
  }

  async create(params: BudgetParams): Promise<AppBudget> {
    const raw = await this.api.create(params);
    const budget = appBudgetFromJson(raw);
    const database = await this.getDatabase();
    await database.upsertBudget({ id: budget.id, category_id: budget.categoryId, amount: budget.amount, period: budget.period });
    return budget;
  }

  async update(id: number, amount: number): Promise<AppBudget> {
    const raw = await this.api.update(id, amount);
    const budget = appBudgetFromJson(raw);
    const database = await this.getDatabase();
    await database.upsertBudget({ id: budget.id, category_id: budget.categoryId, amount: budget.amount, period: budget.period });
    return budget;
  }

  async remove(id: number): Promise<void> {
    await this.api.remove(id);
    const database = await this.getDatabase();
    await database.deleteBudget(id);
  }
}
