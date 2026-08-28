import 'package:dio/dio.dart';

import '../constants/app_constants.dart';
import 'secure_storage_service.dart';

class ApiClient {
  ApiClient({required SecureStorageService secureStorage, Dio? dio})
      : _secureStorage = secureStorage,
        dio = dio ?? Dio(BaseOptions(baseUrl: AppConstants.apiBaseUrl)) {
    this.dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          options.headers['Accept'] = 'application/json';
          final token = await _secureStorage.readToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            await _secureStorage.clearToken();
          }
          handler.next(error);
        },
      ),
    );
  }

  final Dio dio;
  final SecureStorageService _secureStorage;
}
