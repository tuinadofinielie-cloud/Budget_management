import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../constants/app_constants.dart';

class SecureStorageService {
  SecureStorageService({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  Future<void> saveToken(String token) =>
      _storage.write(key: AppConstants.secureStorageTokenKey, value: token);

  Future<String?> readToken() => _storage.read(key: AppConstants.secureStorageTokenKey);

  Future<void> clearToken() => _storage.delete(key: AppConstants.secureStorageTokenKey);

  Future<bool> hasCompletedOnboarding() async {
    final value = await _storage.read(key: AppConstants.secureStorageOnboardingKey);
    return value == 'true';
  }

  Future<void> markOnboardingComplete() =>
      _storage.write(key: AppConstants.secureStorageOnboardingKey, value: 'true');
}
