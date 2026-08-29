import { AxiosInstance } from 'axios';
import { toApiError } from '../../../core/services/apiError';

export class AccountsApi {
  constructor(private http: AxiosInstance) {}

  async list(): Promise<any[]> {
    try {
      const response = await this.http.get('/accounts');
      return response.data?.data ?? [];
    } catch (err) {
      throw toApiError(err);
    }
  }

  async create(params: { name: string; type: string; balance?: number }): Promise<any> {
    try {
      const response = await this.http.post('/accounts', params);
      return response.data?.data;
    } catch (err) {
      throw toApiError(err);
    }
  }

  async update(id: number, params: { name?: string; type?: string }): Promise<any> {
    try {
      const response = await this.http.put(`/accounts/${id}`, params);
      return response.data?.data;
    } catch (err) {
      throw toApiError(err);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.http.delete(`/accounts/${id}`);
    } catch (err) {
      throw toApiError(err);
    }
  }
}
