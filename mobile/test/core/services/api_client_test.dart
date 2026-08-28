import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:finance_app/core/constants/app_constants.dart';
import 'package:finance_app/core/services/api_client.dart';
import 'package:finance_app/core/services/secure_storage_service.dart';

class MockFlutterSecureStorage extends Mock implements FlutterSecureStorage {}

/// Fake HTTP adapter that captures request options and simulates responses.
class FakeHttpClientAdapter implements HttpClientAdapter {
  late RequestOptions capturedOptions;
  int responseStatusCode = 200;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    capturedOptions = options;

    final responseStream = Stream.fromIterable([
      utf8.encode('{"success": true}')
    ]);

    return ResponseBody(responseStream, responseStatusCode);
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  late MockFlutterSecureStorage mockStorage;

  setUp(() {
    mockStorage = MockFlutterSecureStorage();
  });

  test('ApiClient targets the configured base URL and registers an interceptor', () {
    final storage = SecureStorageService(storage: mockStorage);
    final client = ApiClient(secureStorage: storage);

    expect(client.dio.options.baseUrl, AppConstants.apiBaseUrl);
    expect(client.dio.interceptors, isNotEmpty);
  });

  test('adds Authorization header when token is available', () async {
    when(() => mockStorage.read(key: 'auth_token'))
        .thenAnswer((_) async => 'test_token_123');

    final storage = SecureStorageService(storage: mockStorage);

    final fakeAdapter = FakeHttpClientAdapter();
    final dioClient = Dio(BaseOptions(baseUrl: AppConstants.apiBaseUrl));
    dioClient.httpClientAdapter = fakeAdapter;

    final client = ApiClient(secureStorage: storage, dio: dioClient);

    try {
      await client.dio.get('/test');
    } catch (_) {
      // Expected - fake adapter returns incomplete response
    }

    expect(
      fakeAdapter.capturedOptions.headers['Authorization'],
      'Bearer test_token_123',
    );
  });

  test('clears token on 401 response', () async {
    when(() => mockStorage.read(key: any(named: 'key')))
        .thenAnswer((_) async => null);
    when(() => mockStorage.delete(key: 'auth_token'))
        .thenAnswer((_) async {});

    final storage = SecureStorageService(storage: mockStorage);

    final fakeAdapter = FakeHttpClientAdapter();
    fakeAdapter.responseStatusCode = 401;

    final dioClient = Dio(BaseOptions(baseUrl: AppConstants.apiBaseUrl));
    dioClient.httpClientAdapter = fakeAdapter;

    final client = ApiClient(secureStorage: storage, dio: dioClient);

    try {
      await client.dio.get('/test');
    } catch (_) {
      // Expected - 401 response triggers onError
    }

    verify(() => mockStorage.delete(key: 'auth_token')).called(1);
  });
}
