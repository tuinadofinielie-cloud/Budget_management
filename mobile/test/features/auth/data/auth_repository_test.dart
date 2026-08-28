import 'package:drift/native.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:finance_app/core/database/app_database.dart';
import 'package:finance_app/core/services/secure_storage_service.dart';
import 'package:finance_app/features/auth/data/auth_api.dart';
import 'package:finance_app/features/auth/data/auth_repository.dart';

class MockAuthApi extends Mock implements AuthApi {}

class MockFlutterSecureStorage extends Mock implements FlutterSecureStorage {}

void main() {
  late MockAuthApi authApi;
  late MockFlutterSecureStorage mockStorage;
  late SecureStorageService secureStorage;
  late AppDatabase database;
  late AuthRepository repository;

  setUp(() {
    authApi = MockAuthApi();
    mockStorage = MockFlutterSecureStorage();
    secureStorage = SecureStorageService(storage: mockStorage);
    database = AppDatabase.forTesting(NativeDatabase.memory());
    repository = AuthRepository(authApi: authApi, secureStorage: secureStorage, database: database);

    when(() => mockStorage.write(key: any(named: 'key'), value: any(named: 'value')))
        .thenAnswer((_) async {});
    when(() => mockStorage.delete(key: any(named: 'key'))).thenAnswer((_) async {});
  });

  tearDown(() => database.close());

  test('login persists the token and caches the user locally', () async {
    when(() => authApi.login(email: 'jackson@example.com', password: 'password123'))
        .thenAnswer((_) async => {
              'token': 'token-123',
              'user': {
                'id': 1,
                'name': 'Jackson',
                'email': 'jackson@example.com',
                'currency': 'XOF',
                'avatar': null,
              },
            });

    final user = await repository.login(email: 'jackson@example.com', password: 'password123');

    expect(user.name, 'Jackson');
    verify(() => mockStorage.write(key: 'auth_token', value: 'token-123')).called(1);

    final cached = await database.cachedUser;
    expect(cached, isNotNull);
    expect(cached!.email, 'jackson@example.com');
  });

  test('hasValidSession reflects whether a token is stored', () async {
    when(() => mockStorage.read(key: any(named: 'key'))).thenAnswer((_) async => null);
    expect(await repository.hasValidSession(), isFalse);

    when(() => mockStorage.read(key: any(named: 'key'))).thenAnswer((_) async => 'a-token');
    expect(await repository.hasValidSession(), isTrue);
  });

  test('logout clears the token and the cached user even if the API call fails', () async {
    await database.cacheUser(id: 1, name: 'Jackson', email: 'a@a.com', currency: 'XOF');
    when(() => authApi.logout()).thenThrow(AuthApiException('network error'));

    await expectLater(repository.logout(), throwsA(isA<AuthApiException>()));

    verify(() => mockStorage.delete(key: 'auth_token')).called(1);
    expect(await database.cachedUser, isNull);
  });
}
