import '../../../core/database/app_database.dart';
import '../../../core/services/secure_storage_service.dart';
import '../../../shared/models/app_user.dart';
import 'auth_api.dart';

class AuthRepository {
  AuthRepository({
    required AuthApi authApi,
    required SecureStorageService secureStorage,
    required AppDatabase database,
  })  : _authApi = authApi,
        _secureStorage = secureStorage,
        _database = database;

  final AuthApi _authApi;
  final SecureStorageService _secureStorage;
  final AppDatabase _database;

  Future<AppUser> register({
    required String name,
    required String email,
    required String password,
    required String passwordConfirmation,
  }) async {
    final result = await _authApi.register(
      name: name,
      email: email,
      password: password,
      passwordConfirmation: passwordConfirmation,
    );
    return _persistSession(result);
  }

  Future<AppUser> login({required String email, required String password}) async {
    final result = await _authApi.login(email: email, password: password);
    return _persistSession(result);
  }

  Future<void> logout() async {
    try {
      await _authApi.logout();
    } finally {
      await _secureStorage.clearToken();
      await _database.clearCachedUser();
    }
  }

  Future<void> forgotPassword(String email) => _authApi.forgotPassword(email);

  Future<void> resetPassword({
    required String token,
    required String email,
    required String password,
    required String passwordConfirmation,
  }) =>
      _authApi.resetPassword(
        token: token,
        email: email,
        password: password,
        passwordConfirmation: passwordConfirmation,
      );

  Future<bool> hasValidSession() async {
    final token = await _secureStorage.readToken();
    return token != null;
  }

  Future<AppUser?> cachedUser() async {
    final local = await _database.cachedUser;
    if (local == null) return null;
    return AppUser(
      id: local.id,
      name: local.name,
      email: local.email,
      currency: local.currency,
      avatar: local.avatar,
    );
  }

  Future<AppUser> _persistSession(Map<String, dynamic> result) async {
    final token = result['token'] as String;
    final user = AppUser.fromJson(result['user'] as Map<String, dynamic>);

    await _secureStorage.saveToken(token);
    await _database.cacheUser(
      id: user.id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      avatar: user.avatar,
    );

    return user;
  }
}
