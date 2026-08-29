import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../constants/appConstants';
import { SecureStorageService } from './secureStorageService';

export function createApiClient(secureStorage: SecureStorageService, http?: AxiosInstance): AxiosInstance {
  const client = http ?? axios.create({ baseURL: API_BASE_URL });

  client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    config.headers.set('Accept', 'application/json');
    const token = await secureStorage.readToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        await secureStorage.clearToken();
      }
      return Promise.reject(error);
    }
  );

  return client;
}
