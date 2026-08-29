export type CategoryType = 'income' | 'expense';

export interface AppCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
}

export function appCategoryFromJson(json: any): AppCategory {
  return {
    id: json.id,
    name: json.name,
    icon: json.icon,
    color: json.color,
    type: json.type,
  };
}
