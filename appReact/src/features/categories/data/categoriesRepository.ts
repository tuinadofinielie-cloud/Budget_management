import { AppDatabase } from '../../../core/database/appDatabase';
import { AppCategory, CategoryType, appCategoryFromJson } from '../../../shared/models/appCategory';
import { CategoriesApi } from './categoriesApi';

export class CategoriesRepository {
  constructor(
    private api: CategoriesApi,
    private getDatabase: () => Promise<AppDatabase>
  ) {}

  async getCached(): Promise<AppCategory[]> {
    const database = await this.getDatabase();
    const rows = await database.getCachedCategories();
    return rows.map((row) => ({ ...row, type: row.type as CategoryType }));
  }

  async refresh(): Promise<AppCategory[]> {
    const raw = await this.api.list();
    const categories = raw.map(appCategoryFromJson);
    const database = await this.getDatabase();
    await database.replaceCategories(categories);
    return categories;
  }
}
