import { SecureStorageService } from '../secureStorageService';

function createMockStorage() {
  return {
    setItemAsync: jest.fn().mockResolvedValue(undefined),
    getItemAsync: jest.fn().mockResolvedValue(null),
    deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  };
}

describe('SecureStorageService', () => {
  it('saveToken writes the auth_token key', async () => {
    const storage = createMockStorage();
    const service = new SecureStorageService(storage);

    await service.saveToken('abc123');

    expect(storage.setItemAsync).toHaveBeenCalledWith('auth_token', 'abc123');
  });

  it('readToken returns null when nothing is stored', async () => {
    const storage = createMockStorage();
    const service = new SecureStorageService(storage);

    expect(await service.readToken()).toBeNull();
  });

  it('hasCompletedOnboarding returns false when the flag is absent', async () => {
    const storage = createMockStorage();
    const service = new SecureStorageService(storage);

    expect(await service.hasCompletedOnboarding()).toBe(false);
  });

  it('hasCompletedOnboarding returns true when the flag is set', async () => {
    const storage = createMockStorage();
    storage.getItemAsync.mockResolvedValue('true');
    const service = new SecureStorageService(storage);

    expect(await service.hasCompletedOnboarding()).toBe(true);
  });
});
