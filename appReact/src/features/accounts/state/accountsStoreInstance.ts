import { createApiClient } from '../../../core/services/apiClient';
import { secureStorageService } from '../../auth/state/authStoreInstance';
import { openAppDatabase } from '../../../core/database/openAppDatabase';
import { AccountsApi } from '../data/accountsApi';
import { AccountsRepository } from '../data/accountsRepository';
import { createAccountsStore } from './accountsStore';

const apiClient = createApiClient(secureStorageService);
const accountsApi = new AccountsApi(apiClient);

let databasePromise: ReturnType<typeof openAppDatabase> | null = null;
function getDatabase() {
  if (!databasePromise) {
    databasePromise = openAppDatabase();
  }
  return databasePromise;
}

const accountsRepository = new AccountsRepository(accountsApi, getDatabase);

export const useAccountsStore = createAccountsStore(accountsRepository);
