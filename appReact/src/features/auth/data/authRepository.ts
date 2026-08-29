import { AppDatabase } from '../../../core/database/appDatabase';
import { SecureStorageService } from '../../../core/services/secureStorageService';
import { AppUser, appUserFromJson } from '../../../shared/models/appUser';
import { AuthApi } from './authApi';

export class AuthRepository {
  constructor(
    private authApi: AuthApi,
    private secureStorage: SecureStorageService,
    private getDatabase: () => Promise<AppDatabase>
  ) {}

  async register(params: { name: string; email: string; password: string; passwordConfirmation: string }): Promise<AppUser> {
    const result = await this.authApi.register(params);
    return this.persistSession(result);
  }

  async login(params: { email: string; password: string }): Promise<AppUser> {
    const result = await this.authApi.login(params);
    return this.persistSession(result);
  }

  async logout(): Promise<void> {
    try {
      await this.authApi.logout();
    } finally {
      await this.secureStorage.clearToken();
      const database = await this.getDatabase();
      await database.clearCachedUser();
    }
  }

  forgotPassword(email: string): Promise<void> {
    return this.authApi.forgotPassword(email);
  }

  resetPassword(params: { token: string; email: string; password: string; passwordConfirmation: string }): Promise<void> {
    return this.authApi.resetPassword(params);
  }

  async hasValidSession(): Promise<boolean> {
    const token = await this.secureStorage.readToken();
    return token !== null;
  }

  async cachedUser(): Promise<AppUser | null> {
    const database = await this.getDatabase();
    return database.getCachedUser();
  }

  private async persistSession(result: { token: string; user: any }): Promise<AppUser> {
    const user = appUserFromJson(result.user);
    await this.secureStorage.saveToken(result.token);
    const database = await this.getDatabase();
    await database.cacheUser({ id: user.id, name: user.name, email: user.email, currency: user.currency, avatar: user.avatar });
    return user;
  }
}
