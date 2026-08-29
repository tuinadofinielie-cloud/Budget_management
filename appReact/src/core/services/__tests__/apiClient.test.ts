import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { createApiClient } from '../apiClient';
import { SecureStorageService } from '../secureStorageService';
import { API_BASE_URL } from '../../constants/appConstants';

function createMockStorage() {
  return {
    setItemAsync: jest.fn().mockResolvedValue(undefined),
    getItemAsync: jest.fn().mockResolvedValue(null),
    deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  };
}

describe('createApiClient', () => {
  it('targets the configured base URL', () => {
    const secureStorage = new SecureStorageService(createMockStorage());
    const client = createApiClient(secureStorage);

    expect(client.defaults.baseURL).toBe(API_BASE_URL);
  });

  it('attaches the bearer token to outgoing requests when one is stored', async () => {
    const storage = createMockStorage();
    storage.getItemAsync.mockResolvedValue('token-123');
    const secureStorage = new SecureStorageService(storage);
    const http = axios.create({ baseURL: API_BASE_URL });
    const mock = new MockAdapter(http);
    mock.onGet('/ping').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer token-123');
      return [200, { data: null, message: 'ok' }];
    });

    const client = createApiClient(secureStorage, http);
    await client.get('/ping');
  });

  it('clears the stored token when a request comes back 401', async () => {
    const secureStorage = new SecureStorageService(createMockStorage());
    const http = axios.create({ baseURL: API_BASE_URL });
    const mock = new MockAdapter(http);
    mock.onGet('/protected').reply(401, { message: 'Non authentifié.' });

    const client = createApiClient(secureStorage, http);
    await expect(client.get('/protected')).rejects.toBeTruthy();
    expect((secureStorage as any).storage.deleteItemAsync).toHaveBeenCalledWith('auth_token');
  });
});
