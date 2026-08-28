import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:finance_app/core/services/secure_storage_service.dart';

class MockFlutterSecureStorage extends Mock implements FlutterSecureStorage {}

void main() {
  late MockFlutterSecureStorage mockStorage;
  late SecureStorageService service;

  setUp(() {
    mockStorage = MockFlutterSecureStorage();
    service = SecureStorageService(storage: mockStorage);
  });

  test('saveToken writes the auth_token key', () async {
    when(() => mockStorage.write(key: any(named: 'key'), value: any(named: 'value')))
        .thenAnswer((_) async {});

    await service.saveToken('abc123');

    verify(() => mockStorage.write(key: 'auth_token', value: 'abc123')).called(1);
  });

  test('readToken returns null when nothing is stored', () async {
    when(() => mockStorage.read(key: any(named: 'key'))).thenAnswer((_) async => null);

    expect(await service.readToken(), isNull);
  });

  test('hasCompletedOnboarding returns false when the flag is absent', () async {
    when(() => mockStorage.read(key: any(named: 'key'))).thenAnswer((_) async => null);

    expect(await service.hasCompletedOnboarding(), isFalse);
  });

  test('hasCompletedOnboarding returns true when the flag is set', () async {
    when(() => mockStorage.read(key: any(named: 'key'))).thenAnswer((_) async => 'true');

    expect(await service.hasCompletedOnboarding(), isTrue);
  });
}
