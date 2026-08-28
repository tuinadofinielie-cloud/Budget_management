import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:finance_app/core/database/app_database.dart';

void main() {
  late AppDatabase database;

  setUp(() {
    database = AppDatabase.forTesting(NativeDatabase.memory());
  });

  tearDown(() => database.close());

  test('cacheUser inserts and cachedUser reads it back', () async {
    await database.cacheUser(id: 1, name: 'Jackson', email: 'jackson@example.com', currency: 'XOF');

    final user = await database.cachedUser;

    expect(user, isNotNull);
    expect(user!.name, 'Jackson');
    expect(user.currency, 'XOF');
    expect(user.avatar, isNull);
  });

  test('cacheUser overwrites the previous cached user on conflict', () async {
    await database.cacheUser(id: 1, name: 'Jackson', email: 'a@a.com', currency: 'XOF');
    await database.cacheUser(id: 1, name: 'Jackson Updated', email: 'a@a.com', currency: 'XOF');

    final user = await database.cachedUser;

    expect(user!.name, 'Jackson Updated');
  });

  test('clearCachedUser removes all rows', () async {
    await database.cacheUser(id: 1, name: 'Jackson', email: 'a@a.com', currency: 'XOF');
    await database.clearCachedUser();

    expect(await database.cachedUser, isNull);
  });
}
