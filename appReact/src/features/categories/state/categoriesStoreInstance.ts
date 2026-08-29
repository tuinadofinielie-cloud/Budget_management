import { createApiClient } from '../../../core/services/apiClient';
import { secureStorageService } from '../../auth/state/authStoreInstance';
import { openAppDatabase } from '../../../core/database/openAppDatabase';
import { CategoriesApi } from '../data/categoriesApi';
import { CategoriesRepository } from '../data/categoriesRepository';
import { createCategoriesStore } from './categoriesStore';

const apiClient = createApiClient(secureStorageService);
const categoriesApi = new CategoriesApi(apiClient);

let databasePromise: ReturnType<typeof openAppDatabase> | null = null;
function getDatabase() {
  if (!databasePromise) {
    databasePromise = openAppDatabase();
  }
  return databasePromise;
}

const categoriesRepository = new CategoriesRepository(categoriesApi, getDatabase);

export const useCategoriesStore = createCategoriesStore(categoriesRepository);
