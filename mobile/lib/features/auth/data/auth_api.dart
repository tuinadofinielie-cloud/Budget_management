import 'package:dio/dio.dart';

class AuthApiException implements Exception {
  AuthApiException(this.message, {this.fieldErrors = const {}});

  final String message;
  final Map<String, List<String>> fieldErrors;
}

class AuthApi {
  AuthApi(this._dio);

  final Dio _dio;

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    required String passwordConfirmation,
  }) async {
    final response = await _post('/register', {
      'name': name,
      'email': email,
      'password': password,
      'password_confirmation': passwordConfirmation,
    });
    return response['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> login({required String email, required String password}) async {
    final response = await _post('/login', {'email': email, 'password': password});
    return response['data'] as Map<String, dynamic>;
  }

  Future<void> logout() => _post('/logout', const {});

  Future<void> forgotPassword(String email) => _post('/forgot-password', {'email': email});

  Future<void> resetPassword({
    required String token,
    required String email,
    required String password,
    required String passwordConfirmation,
  }) =>
      _post('/reset-password', {
        'token': token,
        'email': email,
        'password': password,
        'password_confirmation': passwordConfirmation,
      });

  Future<Map<String, dynamic>> _post(String path, Map<String, dynamic> data) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(path, data: data);
      return response.data ?? const {};
    } on DioException catch (e) {
      final body = e.response?.data;
      if (body is Map<String, dynamic>) {
        final errors = body['errors'];
        throw AuthApiException(
          body['message'] as String? ?? 'Une erreur est survenue.',
          fieldErrors: errors is Map
              ? errors.map(
                  (key, value) => MapEntry(
                    key as String,
                    (value as List).map((e) => e.toString()).toList(),
                  ),
                )
              : const {},
        );
      }
      throw AuthApiException('Impossible de contacter le serveur. Vérifiez votre connexion Internet.');
    }
  }
}
