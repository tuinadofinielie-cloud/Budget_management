import { AxiosInstance } from 'axios';
import { toApiError } from '../../../core/services/apiError';

export interface TransactionParams {
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  accountId: number;
  categoryId?: number | null;
  toAccountId?: number | null;
  description?: string | null;
  date: string;
}

function toPayload(params: TransactionParams) {
  return {
    type: params.type,
    amount: params.amount,
    account_id: params.accountId,
    category_id: params.categoryId ?? null,
    to_account_id: params.toAccountId ?? null,
    description: params.description ?? null,
    date: params.date,
  };
}

export class TransactionsApi {
  constructor(private http: AxiosInstance) {}

  async list(): Promise<any[]> {
    try {
      const response = await this.http.get('/transactions');
      return response.data?.data?.transactions ?? [];
    } catch (err) {
      throw toApiError(err);
    }
  }

  async create(params: TransactionParams): Promise<any> {
    try {
      const response = await this.http.post('/transactions', toPayload(params));
      return response.data?.data;
    } catch (err) {
      throw toApiError(err);
    }
  }

  async update(id: number, params: TransactionParams): Promise<any> {
    try {
      const response = await this.http.put(`/transactions/${id}`, toPayload(params));
      return response.data?.data;
    } catch (err) {
      throw toApiError(err);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.http.delete(`/transactions/${id}`);
    } catch (err) {
      throw toApiError(err);
    }
  }
}
