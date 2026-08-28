import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:finance_app/core/constants/app_constants.dart';
import 'package:finance_app/core/services/api_client.dart';
import 'package:finance_app/core/services/secure_storage_service.dart';

class MockFlutterSecureStorage extends Mock implements FlutterSecureStorage {}

void main() {
  test('ApiClient targets the configured base URL and registers an interceptor', () {
    final storage = SecureStorageService(storage: MockFlutterSecureStorage());
    final client = ApiClient(secureStorage: storage);

    expect(client.dio.options.baseUrl, AppConstants.apiBaseUrl);
    expect(client.dio.interceptors, isNotEmpty);
  });
}
