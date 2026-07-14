// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'contact_confiance.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

ContactConfiance _$ContactConfianceFromJson(Map<String, dynamic> json) {
  return _ContactConfiance.fromJson(json);
}

/// @nodoc
mixin _$ContactConfiance {
  @JsonKey(name: 'id_contact')
  String get idContact => throw _privateConstructorUsedError;
  @JsonKey(name: 'id_user')
  String get idUtilisateur => throw _privateConstructorUsedError;
  String get nom => throw _privateConstructorUsedError;
  String get prenom => throw _privateConstructorUsedError;
  @JsonKey(name: 'country_code')
  String get countryCode => throw _privateConstructorUsedError;
  String get phone => throw _privateConstructorUsedError;
  String get relation => throw _privateConstructorUsedError;
  @JsonKey(name: 'createdAt')
  DateTime? get createdAt => throw _privateConstructorUsedError;
  @JsonKey(name: 'updatedAt')
  DateTime? get updatedAt => throw _privateConstructorUsedError;

  /// Serializes this ContactConfiance to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of ContactConfiance
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $ContactConfianceCopyWith<ContactConfiance> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ContactConfianceCopyWith<$Res> {
  factory $ContactConfianceCopyWith(
    ContactConfiance value,
    $Res Function(ContactConfiance) then,
  ) = _$ContactConfianceCopyWithImpl<$Res, ContactConfiance>;
  @useResult
  $Res call({
    @JsonKey(name: 'id_contact') String idContact,
    @JsonKey(name: 'id_user') String idUtilisateur,
    String nom,
    String prenom,
    @JsonKey(name: 'country_code') String countryCode,
    String phone,
    String relation,
    @JsonKey(name: 'createdAt') DateTime? createdAt,
    @JsonKey(name: 'updatedAt') DateTime? updatedAt,
  });
}

/// @nodoc
class _$ContactConfianceCopyWithImpl<$Res, $Val extends ContactConfiance>
    implements $ContactConfianceCopyWith<$Res> {
  _$ContactConfianceCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of ContactConfiance
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? idContact = null,
    Object? idUtilisateur = null,
    Object? nom = null,
    Object? prenom = null,
    Object? countryCode = null,
    Object? phone = null,
    Object? relation = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
  }) {
    return _then(
      _value.copyWith(
            idContact: null == idContact
                ? _value.idContact
                : idContact // ignore: cast_nullable_to_non_nullable
                      as String,
            idUtilisateur: null == idUtilisateur
                ? _value.idUtilisateur
                : idUtilisateur // ignore: cast_nullable_to_non_nullable
                      as String,
            nom: null == nom
                ? _value.nom
                : nom // ignore: cast_nullable_to_non_nullable
                      as String,
            prenom: null == prenom
                ? _value.prenom
                : prenom // ignore: cast_nullable_to_non_nullable
                      as String,
            countryCode: null == countryCode
                ? _value.countryCode
                : countryCode // ignore: cast_nullable_to_non_nullable
                      as String,
            phone: null == phone
                ? _value.phone
                : phone // ignore: cast_nullable_to_non_nullable
                      as String,
            relation: null == relation
                ? _value.relation
                : relation // ignore: cast_nullable_to_non_nullable
                      as String,
            createdAt: freezed == createdAt
                ? _value.createdAt
                : createdAt // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
            updatedAt: freezed == updatedAt
                ? _value.updatedAt
                : updatedAt // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$ContactConfianceImplCopyWith<$Res>
    implements $ContactConfianceCopyWith<$Res> {
  factory _$$ContactConfianceImplCopyWith(
    _$ContactConfianceImpl value,
    $Res Function(_$ContactConfianceImpl) then,
  ) = __$$ContactConfianceImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    @JsonKey(name: 'id_contact') String idContact,
    @JsonKey(name: 'id_user') String idUtilisateur,
    String nom,
    String prenom,
    @JsonKey(name: 'country_code') String countryCode,
    String phone,
    String relation,
    @JsonKey(name: 'createdAt') DateTime? createdAt,
    @JsonKey(name: 'updatedAt') DateTime? updatedAt,
  });
}

/// @nodoc
class __$$ContactConfianceImplCopyWithImpl<$Res>
    extends _$ContactConfianceCopyWithImpl<$Res, _$ContactConfianceImpl>
    implements _$$ContactConfianceImplCopyWith<$Res> {
  __$$ContactConfianceImplCopyWithImpl(
    _$ContactConfianceImpl _value,
    $Res Function(_$ContactConfianceImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of ContactConfiance
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? idContact = null,
    Object? idUtilisateur = null,
    Object? nom = null,
    Object? prenom = null,
    Object? countryCode = null,
    Object? phone = null,
    Object? relation = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
  }) {
    return _then(
      _$ContactConfianceImpl(
        idContact: null == idContact
            ? _value.idContact
            : idContact // ignore: cast_nullable_to_non_nullable
                  as String,
        idUtilisateur: null == idUtilisateur
            ? _value.idUtilisateur
            : idUtilisateur // ignore: cast_nullable_to_non_nullable
                  as String,
        nom: null == nom
            ? _value.nom
            : nom // ignore: cast_nullable_to_non_nullable
                  as String,
        prenom: null == prenom
            ? _value.prenom
            : prenom // ignore: cast_nullable_to_non_nullable
                  as String,
        countryCode: null == countryCode
            ? _value.countryCode
            : countryCode // ignore: cast_nullable_to_non_nullable
                  as String,
        phone: null == phone
            ? _value.phone
            : phone // ignore: cast_nullable_to_non_nullable
                  as String,
        relation: null == relation
            ? _value.relation
            : relation // ignore: cast_nullable_to_non_nullable
                  as String,
        createdAt: freezed == createdAt
            ? _value.createdAt
            : createdAt // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
        updatedAt: freezed == updatedAt
            ? _value.updatedAt
            : updatedAt // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$ContactConfianceImpl implements _ContactConfiance {
  const _$ContactConfianceImpl({
    @JsonKey(name: 'id_contact') required this.idContact,
    @JsonKey(name: 'id_user') required this.idUtilisateur,
    required this.nom,
    required this.prenom,
    @JsonKey(name: 'country_code') required this.countryCode,
    required this.phone,
    required this.relation,
    @JsonKey(name: 'createdAt') this.createdAt,
    @JsonKey(name: 'updatedAt') this.updatedAt,
  });

  factory _$ContactConfianceImpl.fromJson(Map<String, dynamic> json) =>
      _$$ContactConfianceImplFromJson(json);

  @override
  @JsonKey(name: 'id_contact')
  final String idContact;
  @override
  @JsonKey(name: 'id_user')
  final String idUtilisateur;
  @override
  final String nom;
  @override
  final String prenom;
  @override
  @JsonKey(name: 'country_code')
  final String countryCode;
  @override
  final String phone;
  @override
  final String relation;
  @override
  @JsonKey(name: 'createdAt')
  final DateTime? createdAt;
  @override
  @JsonKey(name: 'updatedAt')
  final DateTime? updatedAt;

  @override
  String toString() {
    return 'ContactConfiance(idContact: $idContact, idUtilisateur: $idUtilisateur, nom: $nom, prenom: $prenom, countryCode: $countryCode, phone: $phone, relation: $relation, createdAt: $createdAt, updatedAt: $updatedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ContactConfianceImpl &&
            (identical(other.idContact, idContact) ||
                other.idContact == idContact) &&
            (identical(other.idUtilisateur, idUtilisateur) ||
                other.idUtilisateur == idUtilisateur) &&
            (identical(other.nom, nom) || other.nom == nom) &&
            (identical(other.prenom, prenom) || other.prenom == prenom) &&
            (identical(other.countryCode, countryCode) ||
                other.countryCode == countryCode) &&
            (identical(other.phone, phone) || other.phone == phone) &&
            (identical(other.relation, relation) ||
                other.relation == relation) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    idContact,
    idUtilisateur,
    nom,
    prenom,
    countryCode,
    phone,
    relation,
    createdAt,
    updatedAt,
  );

  /// Create a copy of ContactConfiance
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ContactConfianceImplCopyWith<_$ContactConfianceImpl> get copyWith =>
      __$$ContactConfianceImplCopyWithImpl<_$ContactConfianceImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$ContactConfianceImplToJson(this);
  }
}

abstract class _ContactConfiance implements ContactConfiance {
  const factory _ContactConfiance({
    @JsonKey(name: 'id_contact') required final String idContact,
    @JsonKey(name: 'id_user') required final String idUtilisateur,
    required final String nom,
    required final String prenom,
    @JsonKey(name: 'country_code') required final String countryCode,
    required final String phone,
    required final String relation,
    @JsonKey(name: 'createdAt') final DateTime? createdAt,
    @JsonKey(name: 'updatedAt') final DateTime? updatedAt,
  }) = _$ContactConfianceImpl;

  factory _ContactConfiance.fromJson(Map<String, dynamic> json) =
      _$ContactConfianceImpl.fromJson;

  @override
  @JsonKey(name: 'id_contact')
  String get idContact;
  @override
  @JsonKey(name: 'id_user')
  String get idUtilisateur;
  @override
  String get nom;
  @override
  String get prenom;
  @override
  @JsonKey(name: 'country_code')
  String get countryCode;
  @override
  String get phone;
  @override
  String get relation;
  @override
  @JsonKey(name: 'createdAt')
  DateTime? get createdAt;
  @override
  @JsonKey(name: 'updatedAt')
  DateTime? get updatedAt;

  /// Create a copy of ContactConfiance
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ContactConfianceImplCopyWith<_$ContactConfianceImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
