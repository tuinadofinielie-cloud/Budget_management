import { AxiosError } from 'axios';

export class ApiError extends Error {
  fieldErrors: Record<string, string[]>;

  constructor(message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ApiError';
    this.fieldErrors = fieldErrors;
  }
}

/** Maps an Axios error (or anything else a request can throw) to an `ApiError` with a French, user-facing message. */
export function toApiError(err: unknown): ApiError {
  const error = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
  const body = error.response?.data;
  if (body) {
    return new ApiError(body.message ?? 'Une erreur est survenue.', body.errors ?? {});
  }
  return new ApiError('Impossible de contacter le serveur. Vérifiez votre connexion Internet.');
}
