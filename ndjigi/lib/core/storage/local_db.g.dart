// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'local_db.dart';

// ignore_for_file: type=lint
class $CachedUsersTable extends CachedUsers
    with TableInfo<$CachedUsersTable, CachedUser> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedUsersTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _dataMeta = const VerificationMeta('data');
  @override
  late final GeneratedColumn<String> data = GeneratedColumn<String>(
    'data',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [id, data, updatedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_users';
  @override
  VerificationContext validateIntegrity(
    Insertable<CachedUser> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('data')) {
      context.handle(
        _dataMeta,
        this.data.isAcceptableOrUnknown(data['data']!, _dataMeta),
      );
    } else if (isInserting) {
      context.missing(_dataMeta);
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CachedUser map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedUser(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      data: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}data'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $CachedUsersTable createAlias(String alias) {
    return $CachedUsersTable(attachedDatabase, alias);
  }
}

class CachedUser extends DataClass implements Insertable<CachedUser> {
  final String id;
  final String data;
  final DateTime updatedAt;
  const CachedUser({
    required this.id,
    required this.data,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['data'] = Variable<String>(data);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  CachedUsersCompanion toCompanion(bool nullToAbsent) {
    return CachedUsersCompanion(
      id: Value(id),
      data: Value(data),
      updatedAt: Value(updatedAt),
    );
  }

  factory CachedUser.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedUser(
      id: serializer.fromJson<String>(json['id']),
      data: serializer.fromJson<String>(json['data']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'data': serializer.toJson<String>(data),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  CachedUser copyWith({String? id, String? data, DateTime? updatedAt}) =>
      CachedUser(
        id: id ?? this.id,
        data: data ?? this.data,
        updatedAt: updatedAt ?? this.updatedAt,
      );
  CachedUser copyWithCompanion(CachedUsersCompanion data) {
    return CachedUser(
      id: data.id.present ? data.id.value : this.id,
      data: data.data.present ? data.data.value : this.data,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedUser(')
          ..write('id: $id, ')
          ..write('data: $data, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, data, updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedUser &&
          other.id == this.id &&
          other.data == this.data &&
          other.updatedAt == this.updatedAt);
}

class CachedUsersCompanion extends UpdateCompanion<CachedUser> {
  final Value<String> id;
  final Value<String> data;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const CachedUsersCompanion({
    this.id = const Value.absent(),
    this.data = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedUsersCompanion.insert({
    required String id,
    required String data,
    required DateTime updatedAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       data = Value(data),
       updatedAt = Value(updatedAt);
  static Insertable<CachedUser> custom({
    Expression<String>? id,
    Expression<String>? data,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (data != null) 'data': data,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedUsersCompanion copyWith({
    Value<String>? id,
    Value<String>? data,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return CachedUsersCompanion(
      id: id ?? this.id,
      data: data ?? this.data,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (data.present) {
      map['data'] = Variable<String>(data.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedUsersCompanion(')
          ..write('id: $id, ')
          ..write('data: $data, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CachedRoutesTable extends CachedRoutes
    with TableInfo<$CachedRoutesTable, CachedRoute> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedRoutesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _originLatMeta = const VerificationMeta(
    'originLat',
  );
  @override
  late final GeneratedColumn<double> originLat = GeneratedColumn<double>(
    'origin_lat',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _originLngMeta = const VerificationMeta(
    'originLng',
  );
  @override
  late final GeneratedColumn<double> originLng = GeneratedColumn<double>(
    'origin_lng',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _destinationLatMeta = const VerificationMeta(
    'destinationLat',
  );
  @override
  late final GeneratedColumn<double> destinationLat = GeneratedColumn<double>(
    'destination_lat',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _destinationLngMeta = const VerificationMeta(
    'destinationLng',
  );
  @override
  late final GeneratedColumn<double> destinationLng = GeneratedColumn<double>(
    'destination_lng',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _polylineMeta = const VerificationMeta(
    'polyline',
  );
  @override
  late final GeneratedColumn<String> polyline = GeneratedColumn<String>(
    'polyline',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _distanceMeta = const VerificationMeta(
    'distance',
  );
  @override
  late final GeneratedColumn<double> distance = GeneratedColumn<double>(
    'distance',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _durationMeta = const VerificationMeta(
    'duration',
  );
  @override
  late final GeneratedColumn<int> duration = GeneratedColumn<int>(
    'duration',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    originLat,
    originLng,
    destinationLat,
    destinationLng,
    polyline,
    distance,
    duration,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_routes';
  @override
  VerificationContext validateIntegrity(
    Insertable<CachedRoute> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('origin_lat')) {
      context.handle(
        _originLatMeta,
        originLat.isAcceptableOrUnknown(data['origin_lat']!, _originLatMeta),
      );
    } else if (isInserting) {
      context.missing(_originLatMeta);
    }
    if (data.containsKey('origin_lng')) {
      context.handle(
        _originLngMeta,
        originLng.isAcceptableOrUnknown(data['origin_lng']!, _originLngMeta),
      );
    } else if (isInserting) {
      context.missing(_originLngMeta);
    }
    if (data.containsKey('destination_lat')) {
      context.handle(
        _destinationLatMeta,
        destinationLat.isAcceptableOrUnknown(
          data['destination_lat']!,
          _destinationLatMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_destinationLatMeta);
    }
    if (data.containsKey('destination_lng')) {
      context.handle(
        _destinationLngMeta,
        destinationLng.isAcceptableOrUnknown(
          data['destination_lng']!,
          _destinationLngMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_destinationLngMeta);
    }
    if (data.containsKey('polyline')) {
      context.handle(
        _polylineMeta,
        polyline.isAcceptableOrUnknown(data['polyline']!, _polylineMeta),
      );
    }
    if (data.containsKey('distance')) {
      context.handle(
        _distanceMeta,
        distance.isAcceptableOrUnknown(data['distance']!, _distanceMeta),
      );
    }
    if (data.containsKey('duration')) {
      context.handle(
        _durationMeta,
        duration.isAcceptableOrUnknown(data['duration']!, _durationMeta),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CachedRoute map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedRoute(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      originLat: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}origin_lat'],
      )!,
      originLng: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}origin_lng'],
      )!,
      destinationLat: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}destination_lat'],
      )!,
      destinationLng: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}destination_lng'],
      )!,
      polyline: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}polyline'],
      ),
      distance: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}distance'],
      ),
      duration: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}duration'],
      ),
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $CachedRoutesTable createAlias(String alias) {
    return $CachedRoutesTable(attachedDatabase, alias);
  }
}

class CachedRoute extends DataClass implements Insertable<CachedRoute> {
  final String id;
  final double originLat;
  final double originLng;
  final double destinationLat;
  final double destinationLng;
  final String? polyline;
  final double? distance;
  final int? duration;
  final DateTime updatedAt;
  const CachedRoute({
    required this.id,
    required this.originLat,
    required this.originLng,
    required this.destinationLat,
    required this.destinationLng,
    this.polyline,
    this.distance,
    this.duration,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['origin_lat'] = Variable<double>(originLat);
    map['origin_lng'] = Variable<double>(originLng);
    map['destination_lat'] = Variable<double>(destinationLat);
    map['destination_lng'] = Variable<double>(destinationLng);
    if (!nullToAbsent || polyline != null) {
      map['polyline'] = Variable<String>(polyline);
    }
    if (!nullToAbsent || distance != null) {
      map['distance'] = Variable<double>(distance);
    }
    if (!nullToAbsent || duration != null) {
      map['duration'] = Variable<int>(duration);
    }
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  CachedRoutesCompanion toCompanion(bool nullToAbsent) {
    return CachedRoutesCompanion(
      id: Value(id),
      originLat: Value(originLat),
      originLng: Value(originLng),
      destinationLat: Value(destinationLat),
      destinationLng: Value(destinationLng),
      polyline: polyline == null && nullToAbsent
          ? const Value.absent()
          : Value(polyline),
      distance: distance == null && nullToAbsent
          ? const Value.absent()
          : Value(distance),
      duration: duration == null && nullToAbsent
          ? const Value.absent()
          : Value(duration),
      updatedAt: Value(updatedAt),
    );
  }

  factory CachedRoute.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedRoute(
      id: serializer.fromJson<String>(json['id']),
      originLat: serializer.fromJson<double>(json['originLat']),
      originLng: serializer.fromJson<double>(json['originLng']),
      destinationLat: serializer.fromJson<double>(json['destinationLat']),
      destinationLng: serializer.fromJson<double>(json['destinationLng']),
      polyline: serializer.fromJson<String?>(json['polyline']),
      distance: serializer.fromJson<double?>(json['distance']),
      duration: serializer.fromJson<int?>(json['duration']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'originLat': serializer.toJson<double>(originLat),
      'originLng': serializer.toJson<double>(originLng),
      'destinationLat': serializer.toJson<double>(destinationLat),
      'destinationLng': serializer.toJson<double>(destinationLng),
      'polyline': serializer.toJson<String?>(polyline),
      'distance': serializer.toJson<double?>(distance),
      'duration': serializer.toJson<int?>(duration),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  CachedRoute copyWith({
    String? id,
    double? originLat,
    double? originLng,
    double? destinationLat,
    double? destinationLng,
    Value<String?> polyline = const Value.absent(),
    Value<double?> distance = const Value.absent(),
    Value<int?> duration = const Value.absent(),
    DateTime? updatedAt,
  }) => CachedRoute(
    id: id ?? this.id,
    originLat: originLat ?? this.originLat,
    originLng: originLng ?? this.originLng,
    destinationLat: destinationLat ?? this.destinationLat,
    destinationLng: destinationLng ?? this.destinationLng,
    polyline: polyline.present ? polyline.value : this.polyline,
    distance: distance.present ? distance.value : this.distance,
    duration: duration.present ? duration.value : this.duration,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  CachedRoute copyWithCompanion(CachedRoutesCompanion data) {
    return CachedRoute(
      id: data.id.present ? data.id.value : this.id,
      originLat: data.originLat.present ? data.originLat.value : this.originLat,
      originLng: data.originLng.present ? data.originLng.value : this.originLng,
      destinationLat: data.destinationLat.present
          ? data.destinationLat.value
          : this.destinationLat,
      destinationLng: data.destinationLng.present
          ? data.destinationLng.value
          : this.destinationLng,
      polyline: data.polyline.present ? data.polyline.value : this.polyline,
      distance: data.distance.present ? data.distance.value : this.distance,
      duration: data.duration.present ? data.duration.value : this.duration,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedRoute(')
          ..write('id: $id, ')
          ..write('originLat: $originLat, ')
          ..write('originLng: $originLng, ')
          ..write('destinationLat: $destinationLat, ')
          ..write('destinationLng: $destinationLng, ')
          ..write('polyline: $polyline, ')
          ..write('distance: $distance, ')
          ..write('duration: $duration, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    originLat,
    originLng,
    destinationLat,
    destinationLng,
    polyline,
    distance,
    duration,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedRoute &&
          other.id == this.id &&
          other.originLat == this.originLat &&
          other.originLng == this.originLng &&
          other.destinationLat == this.destinationLat &&
          other.destinationLng == this.destinationLng &&
          other.polyline == this.polyline &&
          other.distance == this.distance &&
          other.duration == this.duration &&
          other.updatedAt == this.updatedAt);
}

class CachedRoutesCompanion extends UpdateCompanion<CachedRoute> {
  final Value<String> id;
  final Value<double> originLat;
  final Value<double> originLng;
  final Value<double> destinationLat;
  final Value<double> destinationLng;
  final Value<String?> polyline;
  final Value<double?> distance;
  final Value<int?> duration;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const CachedRoutesCompanion({
    this.id = const Value.absent(),
    this.originLat = const Value.absent(),
    this.originLng = const Value.absent(),
    this.destinationLat = const Value.absent(),
    this.destinationLng = const Value.absent(),
    this.polyline = const Value.absent(),
    this.distance = const Value.absent(),
    this.duration = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedRoutesCompanion.insert({
    required String id,
    required double originLat,
    required double originLng,
    required double destinationLat,
    required double destinationLng,
    this.polyline = const Value.absent(),
    this.distance = const Value.absent(),
    this.duration = const Value.absent(),
    required DateTime updatedAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       originLat = Value(originLat),
       originLng = Value(originLng),
       destinationLat = Value(destinationLat),
       destinationLng = Value(destinationLng),
       updatedAt = Value(updatedAt);
  static Insertable<CachedRoute> custom({
    Expression<String>? id,
    Expression<double>? originLat,
    Expression<double>? originLng,
    Expression<double>? destinationLat,
    Expression<double>? destinationLng,
    Expression<String>? polyline,
    Expression<double>? distance,
    Expression<int>? duration,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (originLat != null) 'origin_lat': originLat,
      if (originLng != null) 'origin_lng': originLng,
      if (destinationLat != null) 'destination_lat': destinationLat,
      if (destinationLng != null) 'destination_lng': destinationLng,
      if (polyline != null) 'polyline': polyline,
      if (distance != null) 'distance': distance,
      if (duration != null) 'duration': duration,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedRoutesCompanion copyWith({
    Value<String>? id,
    Value<double>? originLat,
    Value<double>? originLng,
    Value<double>? destinationLat,
    Value<double>? destinationLng,
    Value<String?>? polyline,
    Value<double?>? distance,
    Value<int?>? duration,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return CachedRoutesCompanion(
      id: id ?? this.id,
      originLat: originLat ?? this.originLat,
      originLng: originLng ?? this.originLng,
      destinationLat: destinationLat ?? this.destinationLat,
      destinationLng: destinationLng ?? this.destinationLng,
      polyline: polyline ?? this.polyline,
      distance: distance ?? this.distance,
      duration: duration ?? this.duration,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (originLat.present) {
      map['origin_lat'] = Variable<double>(originLat.value);
    }
    if (originLng.present) {
      map['origin_lng'] = Variable<double>(originLng.value);
    }
    if (destinationLat.present) {
      map['destination_lat'] = Variable<double>(destinationLat.value);
    }
    if (destinationLng.present) {
      map['destination_lng'] = Variable<double>(destinationLng.value);
    }
    if (polyline.present) {
      map['polyline'] = Variable<String>(polyline.value);
    }
    if (distance.present) {
      map['distance'] = Variable<double>(distance.value);
    }
    if (duration.present) {
      map['duration'] = Variable<int>(duration.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedRoutesCompanion(')
          ..write('id: $id, ')
          ..write('originLat: $originLat, ')
          ..write('originLng: $originLng, ')
          ..write('destinationLat: $destinationLat, ')
          ..write('destinationLng: $destinationLng, ')
          ..write('polyline: $polyline, ')
          ..write('distance: $distance, ')
          ..write('duration: $duration, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $CachedUsersTable cachedUsers = $CachedUsersTable(this);
  late final $CachedRoutesTable cachedRoutes = $CachedRoutesTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    cachedUsers,
    cachedRoutes,
  ];
}

typedef $$CachedUsersTableCreateCompanionBuilder =
    CachedUsersCompanion Function({
      required String id,
      required String data,
      required DateTime updatedAt,
      Value<int> rowid,
    });
typedef $$CachedUsersTableUpdateCompanionBuilder =
    CachedUsersCompanion Function({
      Value<String> id,
      Value<String> data,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

class $$CachedUsersTableFilterComposer
    extends Composer<_$AppDatabase, $CachedUsersTable> {
  $$CachedUsersTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get data => $composableBuilder(
    column: $table.data,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$CachedUsersTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedUsersTable> {
  $$CachedUsersTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get data => $composableBuilder(
    column: $table.data,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$CachedUsersTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedUsersTable> {
  $$CachedUsersTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get data =>
      $composableBuilder(column: $table.data, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$CachedUsersTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $CachedUsersTable,
          CachedUser,
          $$CachedUsersTableFilterComposer,
          $$CachedUsersTableOrderingComposer,
          $$CachedUsersTableAnnotationComposer,
          $$CachedUsersTableCreateCompanionBuilder,
          $$CachedUsersTableUpdateCompanionBuilder,
          (
            CachedUser,
            BaseReferences<_$AppDatabase, $CachedUsersTable, CachedUser>,
          ),
          CachedUser,
          PrefetchHooks Function()
        > {
  $$CachedUsersTableTableManager(_$AppDatabase db, $CachedUsersTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedUsersTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedUsersTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedUsersTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> data = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CachedUsersCompanion(
                id: id,
                data: data,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String data,
                required DateTime updatedAt,
                Value<int> rowid = const Value.absent(),
              }) => CachedUsersCompanion.insert(
                id: id,
                data: data,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$CachedUsersTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $CachedUsersTable,
      CachedUser,
      $$CachedUsersTableFilterComposer,
      $$CachedUsersTableOrderingComposer,
      $$CachedUsersTableAnnotationComposer,
      $$CachedUsersTableCreateCompanionBuilder,
      $$CachedUsersTableUpdateCompanionBuilder,
      (
        CachedUser,
        BaseReferences<_$AppDatabase, $CachedUsersTable, CachedUser>,
      ),
      CachedUser,
      PrefetchHooks Function()
    >;
typedef $$CachedRoutesTableCreateCompanionBuilder =
    CachedRoutesCompanion Function({
      required String id,
      required double originLat,
      required double originLng,
      required double destinationLat,
      required double destinationLng,
      Value<String?> polyline,
      Value<double?> distance,
      Value<int?> duration,
      required DateTime updatedAt,
      Value<int> rowid,
    });
typedef $$CachedRoutesTableUpdateCompanionBuilder =
    CachedRoutesCompanion Function({
      Value<String> id,
      Value<double> originLat,
      Value<double> originLng,
      Value<double> destinationLat,
      Value<double> destinationLng,
      Value<String?> polyline,
      Value<double?> distance,
      Value<int?> duration,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

class $$CachedRoutesTableFilterComposer
    extends Composer<_$AppDatabase, $CachedRoutesTable> {
  $$CachedRoutesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get originLat => $composableBuilder(
    column: $table.originLat,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get originLng => $composableBuilder(
    column: $table.originLng,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get destinationLat => $composableBuilder(
    column: $table.destinationLat,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get destinationLng => $composableBuilder(
    column: $table.destinationLng,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get polyline => $composableBuilder(
    column: $table.polyline,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get distance => $composableBuilder(
    column: $table.distance,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get duration => $composableBuilder(
    column: $table.duration,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$CachedRoutesTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedRoutesTable> {
  $$CachedRoutesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get originLat => $composableBuilder(
    column: $table.originLat,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get originLng => $composableBuilder(
    column: $table.originLng,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get destinationLat => $composableBuilder(
    column: $table.destinationLat,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get destinationLng => $composableBuilder(
    column: $table.destinationLng,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get polyline => $composableBuilder(
    column: $table.polyline,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get distance => $composableBuilder(
    column: $table.distance,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get duration => $composableBuilder(
    column: $table.duration,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$CachedRoutesTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedRoutesTable> {
  $$CachedRoutesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<double> get originLat =>
      $composableBuilder(column: $table.originLat, builder: (column) => column);

  GeneratedColumn<double> get originLng =>
      $composableBuilder(column: $table.originLng, builder: (column) => column);

  GeneratedColumn<double> get destinationLat => $composableBuilder(
    column: $table.destinationLat,
    builder: (column) => column,
  );

  GeneratedColumn<double> get destinationLng => $composableBuilder(
    column: $table.destinationLng,
    builder: (column) => column,
  );

  GeneratedColumn<String> get polyline =>
      $composableBuilder(column: $table.polyline, builder: (column) => column);

  GeneratedColumn<double> get distance =>
      $composableBuilder(column: $table.distance, builder: (column) => column);

  GeneratedColumn<int> get duration =>
      $composableBuilder(column: $table.duration, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$CachedRoutesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $CachedRoutesTable,
          CachedRoute,
          $$CachedRoutesTableFilterComposer,
          $$CachedRoutesTableOrderingComposer,
          $$CachedRoutesTableAnnotationComposer,
          $$CachedRoutesTableCreateCompanionBuilder,
          $$CachedRoutesTableUpdateCompanionBuilder,
          (
            CachedRoute,
            BaseReferences<_$AppDatabase, $CachedRoutesTable, CachedRoute>,
          ),
          CachedRoute,
          PrefetchHooks Function()
        > {
  $$CachedRoutesTableTableManager(_$AppDatabase db, $CachedRoutesTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedRoutesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedRoutesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedRoutesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<double> originLat = const Value.absent(),
                Value<double> originLng = const Value.absent(),
                Value<double> destinationLat = const Value.absent(),
                Value<double> destinationLng = const Value.absent(),
                Value<String?> polyline = const Value.absent(),
                Value<double?> distance = const Value.absent(),
                Value<int?> duration = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CachedRoutesCompanion(
                id: id,
                originLat: originLat,
                originLng: originLng,
                destinationLat: destinationLat,
                destinationLng: destinationLng,
                polyline: polyline,
                distance: distance,
                duration: duration,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required double originLat,
                required double originLng,
                required double destinationLat,
                required double destinationLng,
                Value<String?> polyline = const Value.absent(),
                Value<double?> distance = const Value.absent(),
                Value<int?> duration = const Value.absent(),
                required DateTime updatedAt,
                Value<int> rowid = const Value.absent(),
              }) => CachedRoutesCompanion.insert(
                id: id,
                originLat: originLat,
                originLng: originLng,
                destinationLat: destinationLat,
                destinationLng: destinationLng,
                polyline: polyline,
                distance: distance,
                duration: duration,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$CachedRoutesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $CachedRoutesTable,
      CachedRoute,
      $$CachedRoutesTableFilterComposer,
      $$CachedRoutesTableOrderingComposer,
      $$CachedRoutesTableAnnotationComposer,
      $$CachedRoutesTableCreateCompanionBuilder,
      $$CachedRoutesTableUpdateCompanionBuilder,
      (
        CachedRoute,
        BaseReferences<_$AppDatabase, $CachedRoutesTable, CachedRoute>,
      ),
      CachedRoute,
      PrefetchHooks Function()
    >;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$CachedUsersTableTableManager get cachedUsers =>
      $$CachedUsersTableTableManager(_db, _db.cachedUsers);
  $$CachedRoutesTableTableManager get cachedRoutes =>
      $$CachedRoutesTableTableManager(_db, _db.cachedRoutes);
}
