import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

part 'app_database.g.dart';

class LocalUsers extends Table {
  IntColumn get id => integer()();
  TextColumn get name => text()();
  TextColumn get email => text()();
  TextColumn get currency => text()();
  TextColumn get avatar => text().nullable()();
  TextColumn get syncState => text().withDefault(const Constant('synced'))();

  @override
  Set<Column> get primaryKey => {id};
}

@DriftDatabase(tables: [LocalUsers])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  AppDatabase.forTesting(super.executor);

  @override
  int get schemaVersion => 1;

  Future<void> cacheUser({
    required int id,
    required String name,
    required String email,
    required String currency,
    String? avatar,
  }) async {
    await into(localUsers).insertOnConflictUpdate(
      LocalUsersCompanion.insert(
        id: Value(id),
        name: name,
        email: email,
        currency: currency,
        avatar: Value(avatar),
      ),
    );
  }

  Future<LocalUser?> get cachedUser => select(localUsers).getSingleOrNull();

  Stream<LocalUser?> watchCachedUser() => select(localUsers).watchSingleOrNull();

  Future<void> clearCachedUser() => delete(localUsers).go();
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'finance_app.sqlite'));
    return NativeDatabase.createInBackground(file);
  });
}
