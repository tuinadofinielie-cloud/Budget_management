import { createApiClient } from '../../../core/services/apiClient';
import { secureStorageService } from '../../auth/state/authStoreInstance';
import { openAppDatabase } from '../../../core/database/openAppDatabase';
import { TransactionsApi } from '../data/transactionsApi';
import { TransactionsRepository } from '../data/transactionsRepository';
import { createTransactionsStore } from './transactionsStore';

const apiClient = createApiClient(secureStorageService);
const transactionsApi = new TransactionsApi(apiClient);

let databasePromise: ReturnType<typeof openAppDatabase> | null = null;
function getDatabase() {
  if (!databasePromise) {
    databasePromise = openAppDatabase();
  }
  return databasePromise;
}

const transactionsRepository = new TransactionsRepository(transactionsApi, getDatabase);

export const useTransactionsStore = createTransactionsStore(transactionsRepository);
