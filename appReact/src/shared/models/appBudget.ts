export type BudgetPeriod = 'monthly';

export interface AppBudget {
  id: number;
  categoryId: number | null;
  amount: number;
  period: BudgetPeriod;
}

export function appBudgetFromJson(json: any): AppBudget {
  return {
    id: json.id,
    categoryId: json.category_id,
    amount: json.amount,
    period: json.period,
  };
}
