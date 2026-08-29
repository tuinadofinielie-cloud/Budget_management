import { AxiosInstance, AxiosError } from 'axios';

export class AuthApiError extends Error {
  fieldErrors: Record<string, string[]>;

  constructor(message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'AuthApiError';
    this.fieldErrors = fieldErrors;
  }
}

interface AuthSessionPayload {
  token: string;
  user: any;
}

export class AuthApi {
  constructor(private http: AxiosInstance) {}

  register(params: { name: string; email: string; password: string; passwordConfirmation: string }): Promise<AuthSessionPayload> {
    return this.post('/register', {
      name: params.name,
      email: params.email,
      password: params.password,
      password_confirmation: params.passwordConfirmation,
    });
  }

  login(params: { email: string; password: string }): Promise<AuthSessionPayload> {
    return this.post('/login', { email: params.email, password: params.password });
  }

  async logout(): Promise<void> {
    await this.post('/logout', {});
  }

  async forgotPassword(email: string): Promise<void> {
    await this.post('/forgot-password', { email });
  }

  async resetPassword(params: { token: string; email: string; password: string; passwordConfirmation: string }): Promise<void> {
    await this.post('/reset-password', {
      token: params.token,
      email: params.email,
      password: params.password,
      password_confirmation: params.passwordConfirmation,
    });
  }

  private async post(path: string, data: Record<string, unknown>): Promise<any> {
    try {
      const response = await this.http.post(path, data);
      return response.data?.data;
    } catch (err) {
      const error = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
      const body = error.response?.data;
      if (body) {
        throw new AuthApiError(body.message ?? 'Une erreur est survenue.', body.errors ?? {});
      }
      throw new AuthApiError('Impossible de contacter le serveur. Vérifiez votre connexion Internet.');
    }
  }
}
