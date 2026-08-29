import { AxiosInstance } from 'axios';
import { toApiError } from '../../../core/services/apiError';

export class CategoriesApi {
  constructor(private http: AxiosInstance) {}

  async list(): Promise<any[]> {
    try {
      const response = await this.http.get('/categories');
      return response.data?.data ?? [];
    } catch (err) {
      throw toApiError(err);
    }
  }
}
