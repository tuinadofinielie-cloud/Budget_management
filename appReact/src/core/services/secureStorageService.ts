import * as SecureStore from 'expo-secure-store';
import { SECURE_STORAGE_TOKEN_KEY, SECURE_STORAGE_ONBOARDING_KEY } from '../constants/appConstants';

export interface SecureStoreAdapter {
  setItemAsync(key: string, value: string): Promise<void>;
  getItemAsync(key: string): Promise<string | null>;
  deleteItemAsync(key: string): Promise<void>;
}

export class SecureStorageService {
  private storage: SecureStoreAdapter;

  constructor(storage: SecureStoreAdapter = SecureStore) {
    this.storage = storage;
  }

  saveToken(token: string): Promise<void> {
    return this.storage.setItemAsync(SECURE_STORAGE_TOKEN_KEY, token);
  }

  readToken(): Promise<string | null> {
    return this.storage.getItemAsync(SECURE_STORAGE_TOKEN_KEY);
  }

  clearToken(): Promise<void> {
    return this.storage.deleteItemAsync(SECURE_STORAGE_TOKEN_KEY);
  }

  async hasCompletedOnboarding(): Promise<boolean> {
    const value = await this.storage.getItemAsync(SECURE_STORAGE_ONBOARDING_KEY);
    return value === 'true';
  }

  markOnboardingComplete(): Promise<void> {
    return this.storage.setItemAsync(SECURE_STORAGE_ONBOARDING_KEY, 'true');
  }
}
