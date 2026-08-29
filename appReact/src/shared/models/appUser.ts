export interface AppUser {
  id: number;
  name: string;
  email: string;
  currency: string;
  avatar: string | null;
}

export function appUserFromJson(json: any): AppUser {
  return {
    id: json.id,
    name: json.name,
    email: json.email,
    currency: json.currency,
    avatar: json.avatar ?? null,
  };
}
