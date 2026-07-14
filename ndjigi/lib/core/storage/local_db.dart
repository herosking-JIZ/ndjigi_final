import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

part 'local_db.g.dart';

@DataClassName('CachedUser')
class CachedUsers extends Table {
  TextColumn get id => text()();
  TextColumn get data => text()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

@DataClassName('CachedRoute')
class CachedRoutes extends Table {
  TextColumn get id => text()();
  RealColumn get originLat => real()();
  RealColumn get originLng => real()();
  RealColumn get destinationLat => real()();
  RealColumn get destinationLng => real()();
  TextColumn get polyline => text().nullable()();
  RealColumn get distance => real().nullable()();
  IntColumn get duration => integer().nullable()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

@DriftDatabase(tables: [CachedUsers, CachedRoutes])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 1;

  // CachedUsers operations
  Future<void> insertOrUpdateCachedUser(CachedUsersCompanion user) async {
    await into(cachedUsers).insertOnConflictUpdate(user);
  }

  Future<CachedUser?> getCachedUser(String userId) async {
    return await (select(cachedUsers)..where((t) => t.id.equals(userId)))
        .getSingleOrNull();
  }

  Future<void> deleteCachedUser(String userId) async {
    await (delete(cachedUsers)..where((t) => t.id.equals(userId))).go();
  }

  Future<void> clearCachedUsers() async {
    await delete(cachedUsers).go();
  }

  // CachedRoutes operations
  Future<void> insertOrUpdateCachedRoute(CachedRoutesCompanion route) async {
    await into(cachedRoutes).insertOnConflictUpdate(route);
  }

  Future<CachedRoute?> getCachedRoute(String routeId) async {
    return await (select(cachedRoutes)..where((t) => t.id.equals(routeId)))
        .getSingleOrNull();
  }

  Future<void> deleteCachedRoute(String routeId) async {
    await (delete(cachedRoutes)..where((t) => t.id.equals(routeId))).go();
  }

  Future<void> clearCachedRoutes() async {
    await delete(cachedRoutes).go();
  }

  Future<void> clearAllCache() async {
    await transaction(() async {
      await clearCachedUsers();
      await clearCachedRoutes();
    });
  }
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final documentsDir = await getApplicationDocumentsDirectory();
    final db = File(p.join(documentsDir.path, 'ndjigi.db'));

    return NativeDatabase(
      db,
      logStatements: true,
    );
  });
}
