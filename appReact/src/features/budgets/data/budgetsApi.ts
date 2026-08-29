import { AxiosInstance } from 'axios';
import { toApiError } from '../../../core/services/apiError';

export interface BudgetParams {
  categoryId?: number | null;
  amount: number;
  period?: 'monthly';
}

function toPayload(params: BudgetParams) {
  return {
    category_id: params.categoryId ?? null,
    amount: params.amount,
    period: params.period ?? 'monthly',
  };
}

export class BudgetsApi {
  constructor(private http: AxiosInstance) {}

  async list(): Promise<any[]> {
    try {
      const response = await this.http.get('/budgets');
      return response.data?.data ?? [];
    } catch (err) {
      throw toApiError(err);
    }
  }

  async create(params: BudgetParams): Promise<any> {
    try {
      const response = await this.http.post('/budgets', toPayload(params));
      return response.data?.data;
    } catch (err) {
      throw toApiError(err);
    }
  }

  async update(id: number, amount: number): Promise<any> {
    try {
      const response = await this.http.put(`/budgets/${id}`, { amount });
      return response.data?.data;
    } catch (err) {
      throw toApiError(err);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.http.delete(`/budgets/${id}`);
    } catch (err) {
      throw toApiError(err);
    }
  }
}
