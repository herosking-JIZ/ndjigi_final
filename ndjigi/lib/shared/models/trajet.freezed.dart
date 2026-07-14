// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'trajet.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

Trajet _$TrajetFromJson(Map<String, dynamic> json) {
  return _Trajet.fromJson(json);
}

/// @nodoc
mixin _$Trajet {
  String get id => throw _privateConstructorUsedError;
  String get passagerId => throw _privateConstructorUsedError;
  String? get chauffeurId => throw _privateConstructorUsedError;
  Location get depart => throw _privateConstructorUsedError;
  Location get arrivee => throw _privateConstructorUsedError;
  String get statut => throw _privateConstructorUsedError;
  String? get distanceKm => throw _privateConstructorUsedError;
  String? get dureeMinutes => throw _privateConstructorUsedError;
  String? get tarifEstime => throw _privateConstructorUsedError;
  String? get tarifFinal => throw _privateConstructorUsedError;
  DateTime? get dateCreation => throw _privateConstructorUsedError;
  DateTime? get dateDebut => throw _privateConstructorUsedError;
  DateTime? get dateFin => throw _privateConstructorUsedError;

  /// Serializes this Trajet to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Trajet
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $TrajetCopyWith<Trajet> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $TrajetCopyWith<$Res> {
  factory $TrajetCopyWith(Trajet value, $Res Function(Trajet) then) =
      _$TrajetCopyWithImpl<$Res, Trajet>;
  @useResult
  $Res call({
    String id,
    String passagerId,
    String? chauffeurId,
    Location depart,
    Location arrivee,
    String statut,
    String? distanceKm,
    String? dureeMinutes,
    String? tarifEstime,
    String? tarifFinal,
    DateTime? dateCreation,
    DateTime? dateDebut,
    DateTime? dateFin,
  });

  $LocationCopyWith<$Res> get depart;
  $LocationCopyWith<$Res> get arrivee;
}

/// @nodoc
class _$TrajetCopyWithImpl<$Res, $Val extends Trajet>
    implements $TrajetCopyWith<$Res> {
  _$TrajetCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Trajet
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? passagerId = null,
    Object? chauffeurId = freezed,
    Object? depart = null,
    Object? arrivee = null,
    Object? statut = null,
    Object? distanceKm = freezed,
    Object? dureeMinutes = freezed,
    Object? tarifEstime = freezed,
    Object? tarifFinal = freezed,
    Object? dateCreation = freezed,
    Object? dateDebut = freezed,
    Object? dateFin = freezed,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as String,
            passagerId: null == passagerId
                ? _value.passagerId
                : passagerId // ignore: cast_nullable_to_non_nullable
                      as String,
            chauffeurId: freezed == chauffeurId
                ? _value.chauffeurId
                : chauffeurId // ignore: cast_nullable_to_non_nullable
                      as String?,
            depart: null == depart
                ? _value.depart
                : depart // ignore: cast_nullable_to_non_nullable
                      as Location,
            arrivee: null == arrivee
                ? _value.arrivee
                : arrivee // ignore: cast_nullable_to_non_nullable
                      as Location,
            statut: null == statut
                ? _value.statut
                : statut // ignore: cast_nullable_to_non_nullable
                      as String,
            distanceKm: freezed == distanceKm
                ? _value.distanceKm
                : distanceKm // ignore: cast_nullable_to_non_nullable
                      as String?,
            dureeMinutes: freezed == dureeMinutes
                ? _value.dureeMinutes
                : dureeMinutes // ignore: cast_nullable_to_non_nullable
                      as String?,
            tarifEstime: freezed == tarifEstime
                ? _value.tarifEstime
                : tarifEstime // ignore: cast_nullable_to_non_nullable
                      as String?,
            tarifFinal: freezed == tarifFinal
                ? _value.tarifFinal
                : tarifFinal // ignore: cast_nullable_to_non_nullable
                      as String?,
            dateCreation: freezed == dateCreation
                ? _value.dateCreation
                : dateCreation // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
            dateDebut: freezed == dateDebut
                ? _value.dateDebut
                : dateDebut // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
            dateFin: freezed == dateFin
                ? _value.dateFin
                : dateFin // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
          )
          as $Val,
    );
  }

  /// Create a copy of Trajet
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $LocationCopyWith<$Res> get depart {
    return $LocationCopyWith<$Res>(_value.depart, (value) {
      return _then(_value.copyWith(depart: value) as $Val);
    });
  }

  /// Create a copy of Trajet
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $LocationCopyWith<$Res> get arrivee {
    return $LocationCopyWith<$Res>(_value.arrivee, (value) {
      return _then(_value.copyWith(arrivee: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$TrajetImplCopyWith<$Res> implements $TrajetCopyWith<$Res> {
  factory _$$TrajetImplCopyWith(
    _$TrajetImpl value,
    $Res Function(_$TrajetImpl) then,
  ) = __$$TrajetImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String id,
    String passagerId,
    String? chauffeurId,
    Location depart,
    Location arrivee,
    String statut,
    String? distanceKm,
    String? dureeMinutes,
    String? tarifEstime,
    String? tarifFinal,
    DateTime? dateCreation,
    DateTime? dateDebut,
    DateTime? dateFin,
  });

  @override
  $LocationCopyWith<$Res> get depart;
  @override
  $LocationCopyWith<$Res> get arrivee;
}

/// @nodoc
class __$$TrajetImplCopyWithImpl<$Res>
    extends _$TrajetCopyWithImpl<$Res, _$TrajetImpl>
    implements _$$TrajetImplCopyWith<$Res> {
  __$$TrajetImplCopyWithImpl(
    _$TrajetImpl _value,
    $Res Function(_$TrajetImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of Trajet
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? passagerId = null,
    Object? chauffeurId = freezed,
    Object? depart = null,
    Object? arrivee = null,
    Object? statut = null,
    Object? distanceKm = freezed,
    Object? dureeMinutes = freezed,
    Object? tarifEstime = freezed,
    Object? tarifFinal = freezed,
    Object? dateCreation = freezed,
    Object? dateDebut = freezed,
    Object? dateFin = freezed,
  }) {
    return _then(
      _$TrajetImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as String,
        passagerId: null == passagerId
            ? _value.passagerId
            : passagerId // ignore: cast_nullable_to_non_nullable
                  as String,
        chauffeurId: freezed == chauffeurId
            ? _value.chauffeurId
            : chauffeurId // ignore: cast_nullable_to_non_nullable
                  as String?,
        depart: null == depart
            ? _value.depart
            : depart // ignore: cast_nullable_to_non_nullable
                  as Location,
        arrivee: null == arrivee
            ? _value.arrivee
            : arrivee // ignore: cast_nullable_to_non_nullable
                  as Location,
        statut: null == statut
            ? _value.statut
            : statut // ignore: cast_nullable_to_non_nullable
                  as String,
        distanceKm: freezed == distanceKm
            ? _value.distanceKm
            : distanceKm // ignore: cast_nullable_to_non_nullable
                  as String?,
        dureeMinutes: freezed == dureeMinutes
            ? _value.dureeMinutes
            : dureeMinutes // ignore: cast_nullable_to_non_nullable
                  as String?,
        tarifEstime: freezed == tarifEstime
            ? _value.tarifEstime
            : tarifEstime // ignore: cast_nullable_to_non_nullable
                  as String?,
        tarifFinal: freezed == tarifFinal
            ? _value.tarifFinal
            : tarifFinal // ignore: cast_nullable_to_non_nullable
                  as String?,
        dateCreation: freezed == dateCreation
            ? _value.dateCreation
            : dateCreation // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
        dateDebut: freezed == dateDebut
            ? _value.dateDebut
            : dateDebut // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
        dateFin: freezed == dateFin
            ? _value.dateFin
            : dateFin // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$TrajetImpl implements _Trajet {
  const _$TrajetImpl({
    required this.id,
    required this.passagerId,
    required this.chauffeurId,
    required this.depart,
    required this.arrivee,
    required this.statut,
    this.distanceKm,
    this.dureeMinutes,
    this.tarifEstime,
    this.tarifFinal,
    this.dateCreation,
    this.dateDebut,
    this.dateFin,
  });

  factory _$TrajetImpl.fromJson(Map<String, dynamic> json) =>
      _$$TrajetImplFromJson(json);

  @override
  final String id;
  @override
  final String passagerId;
  @override
  final String? chauffeurId;
  @override
  final Location depart;
  @override
  final Location arrivee;
  @override
  final String statut;
  @override
  final String? distanceKm;
  @override
  final String? dureeMinutes;
  @override
  final String? tarifEstime;
  @override
  final String? tarifFinal;
  @override
  final DateTime? dateCreation;
  @override
  final DateTime? dateDebut;
  @override
  final DateTime? dateFin;

  @override
  String toString() {
    return 'Trajet(id: $id, passagerId: $passagerId, chauffeurId: $chauffeurId, depart: $depart, arrivee: $arrivee, statut: $statut, distanceKm: $distanceKm, dureeMinutes: $dureeMinutes, tarifEstime: $tarifEstime, tarifFinal: $tarifFinal, dateCreation: $dateCreation, dateDebut: $dateDebut, dateFin: $dateFin)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TrajetImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.passagerId, passagerId) ||
                other.passagerId == passagerId) &&
            (identical(other.chauffeurId, chauffeurId) ||
                other.chauffeurId == chauffeurId) &&
            (identical(other.depart, depart) || other.depart == depart) &&
            (identical(other.arrivee, arrivee) || other.arrivee == arrivee) &&
            (identical(other.statut, statut) || other.statut == statut) &&
            (identical(other.distanceKm, distanceKm) ||
                other.distanceKm == distanceKm) &&
            (identical(other.dureeMinutes, dureeMinutes) ||
                other.dureeMinutes == dureeMinutes) &&
            (identical(other.tarifEstime, tarifEstime) ||
                other.tarifEstime == tarifEstime) &&
            (identical(other.tarifFinal, tarifFinal) ||
                other.tarifFinal == tarifFinal) &&
            (identical(other.dateCreation, dateCreation) ||
                other.dateCreation == dateCreation) &&
            (identical(other.dateDebut, dateDebut) ||
                other.dateDebut == dateDebut) &&
            (identical(other.dateFin, dateFin) || other.dateFin == dateFin));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    passagerId,
    chauffeurId,
    depart,
    arrivee,
    statut,
    distanceKm,
    dureeMinutes,
    tarifEstime,
    tarifFinal,
    dateCreation,
    dateDebut,
    dateFin,
  );

  /// Create a copy of Trajet
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TrajetImplCopyWith<_$TrajetImpl> get copyWith =>
      __$$TrajetImplCopyWithImpl<_$TrajetImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$TrajetImplToJson(this);
  }
}

abstract class _Trajet implements Trajet {
  const factory _Trajet({
    required final String id,
    required final String passagerId,
    required final String? chauffeurId,
    required final Location depart,
    required final Location arrivee,
    required final String statut,
    final String? distanceKm,
    final String? dureeMinutes,
    final String? tarifEstime,
    final String? tarifFinal,
    final DateTime? dateCreation,
    final DateTime? dateDebut,
    final DateTime? dateFin,
  }) = _$TrajetImpl;

  factory _Trajet.fromJson(Map<String, dynamic> json) = _$TrajetImpl.fromJson;

  @override
  String get id;
  @override
  String get passagerId;
  @override
  String? get chauffeurId;
  @override
  Location get depart;
  @override
  Location get arrivee;
  @override
  String get statut;
  @override
  String? get distanceKm;
  @override
  String? get dureeMinutes;
  @override
  String? get tarifEstime;
  @override
  String? get tarifFinal;
  @override
  DateTime? get dateCreation;
  @override
  DateTime? get dateDebut;
  @override
  DateTime? get dateFin;

  /// Create a copy of Trajet
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TrajetImplCopyWith<_$TrajetImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
