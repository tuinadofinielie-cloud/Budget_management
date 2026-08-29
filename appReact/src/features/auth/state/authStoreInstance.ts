import { createApiClient } from '../../../core/services/apiClient';
import { SecureStorageService } from '../../../core/services/secureStorageService';
import { openAppDatabase } from '../../../core/database/openAppDatabase';
import { AuthApi } from '../data/authApi';
import { AuthRepository } from '../data/authRepository';
import { createAuthStore } from './authStore';

export const secureStorageService = new SecureStorageService();
const apiClient = createApiClient(secureStorageService);
const authApi = new AuthApi(apiClient);

let databasePromise: ReturnType<typeof openAppDatabase> | null = null;
function getDatabase() {
  if (!databasePromise) {
    databasePromise = openAppDatabase();
  }
  return databasePromise;
}

const authRepository = new AuthRepository(authApi, secureStorageService, getDatabase);

export const useAuthStore = createAuthStore(authRepository);
