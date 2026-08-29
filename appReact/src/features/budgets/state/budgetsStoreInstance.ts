import { createApiClient } from '../../../core/services/apiClient';
import { secureStorageService } from '../../auth/state/authStoreInstance';
import { openAppDatabase } from '../../../core/database/openAppDatabase';
import { BudgetsApi } from '../data/budgetsApi';
import { BudgetsRepository } from '../data/budgetsRepository';
import { createBudgetsStore } from './budgetsStore';

const apiClient = createApiClient(secureStorageService);
const budgetsApi = new BudgetsApi(apiClient);

let databasePromise: ReturnType<typeof openAppDatabase> | null = null;
function getDatabase() {
  if (!databasePromise) {
    databasePromise = openAppDatabase();
  }
  return databasePromise;
}

const budgetsRepository = new BudgetsRepository(budgetsApi, getDatabase);

export const useBudgetsStore = createBudgetsStore(budgetsRepository);
