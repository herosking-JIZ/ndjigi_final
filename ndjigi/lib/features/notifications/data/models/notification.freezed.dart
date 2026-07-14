// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'notification.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

AppNotification _$AppNotificationFromJson(Map<String, dynamic> json) {
  return _AppNotification.fromJson(json);
}

/// @nodoc
mixin _$AppNotification {
  @JsonKey(name: 'id_notification')
  String get idNotification => throw _privateConstructorUsedError;
  @JsonKey(name: 'id_utilisateur')
  String get idUtilisateur => throw _privateConstructorUsedError;
  String get type => throw _privateConstructorUsedError;
  String get titre => throw _privateConstructorUsedError;
  String get contenu => throw _privateConstructorUsedError;
  bool get lu => throw _privateConstructorUsedError;
  @JsonKey(name: 'date_creation')
  DateTime? get dateCreation => throw _privateConstructorUsedError;
  @JsonKey(name: 'date_lecture')
  DateTime? get dateLecture => throw _privateConstructorUsedError;
  @JsonKey(name: 'id_objet_lie')
  String? get idObjetLie => throw _privateConstructorUsedError;

  /// Serializes this AppNotification to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of AppNotification
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $AppNotificationCopyWith<AppNotification> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AppNotificationCopyWith<$Res> {
  factory $AppNotificationCopyWith(
    AppNotification value,
    $Res Function(AppNotification) then,
  ) = _$AppNotificationCopyWithImpl<$Res, AppNotification>;
  @useResult
  $Res call({
    @JsonKey(name: 'id_notification') String idNotification,
    @JsonKey(name: 'id_utilisateur') String idUtilisateur,
    String type,
    String titre,
    String contenu,
    bool lu,
    @JsonKey(name: 'date_creation') DateTime? dateCreation,
    @JsonKey(name: 'date_lecture') DateTime? dateLecture,
    @JsonKey(name: 'id_objet_lie') String? idObjetLie,
  });
}

/// @nodoc
class _$AppNotificationCopyWithImpl<$Res, $Val extends AppNotification>
    implements $AppNotificationCopyWith<$Res> {
  _$AppNotificationCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of AppNotification
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? idNotification = null,
    Object? idUtilisateur = null,
    Object? type = null,
    Object? titre = null,
    Object? contenu = null,
    Object? lu = null,
    Object? dateCreation = freezed,
    Object? dateLecture = freezed,
    Object? idObjetLie = freezed,
  }) {
    return _then(
      _value.copyWith(
            idNotification: null == idNotification
                ? _value.idNotification
                : idNotification // ignore: cast_nullable_to_non_nullable
                      as String,
            idUtilisateur: null == idUtilisateur
                ? _value.idUtilisateur
                : idUtilisateur // ignore: cast_nullable_to_non_nullable
                      as String,
            type: null == type
                ? _value.type
                : type // ignore: cast_nullable_to_non_nullable
                      as String,
            titre: null == titre
                ? _value.titre
                : titre // ignore: cast_nullable_to_non_nullable
                      as String,
            contenu: null == contenu
                ? _value.contenu
                : contenu // ignore: cast_nullable_to_non_nullable
                      as String,
            lu: null == lu
                ? _value.lu
                : lu // ignore: cast_nullable_to_non_nullable
                      as bool,
            dateCreation: freezed == dateCreation
                ? _value.dateCreation
                : dateCreation // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
            dateLecture: freezed == dateLecture
                ? _value.dateLecture
                : dateLecture // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
            idObjetLie: freezed == idObjetLie
                ? _value.idObjetLie
                : idObjetLie // ignore: cast_nullable_to_non_nullable
                      as String?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$AppNotificationImplCopyWith<$Res>
    implements $AppNotificationCopyWith<$Res> {
  factory _$$AppNotificationImplCopyWith(
    _$AppNotificationImpl value,
    $Res Function(_$AppNotificationImpl) then,
  ) = __$$AppNotificationImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    @JsonKey(name: 'id_notification') String idNotification,
    @JsonKey(name: 'id_utilisateur') String idUtilisateur,
    String type,
    String titre,
    String contenu,
    bool lu,
    @JsonKey(name: 'date_creation') DateTime? dateCreation,
    @JsonKey(name: 'date_lecture') DateTime? dateLecture,
    @JsonKey(name: 'id_objet_lie') String? idObjetLie,
  });
}

/// @nodoc
class __$$AppNotificationImplCopyWithImpl<$Res>
    extends _$AppNotificationCopyWithImpl<$Res, _$AppNotificationImpl>
    implements _$$AppNotificationImplCopyWith<$Res> {
  __$$AppNotificationImplCopyWithImpl(
    _$AppNotificationImpl _value,
    $Res Function(_$AppNotificationImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of AppNotification
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? idNotification = null,
    Object? idUtilisateur = null,
    Object? type = null,
    Object? titre = null,
    Object? contenu = null,
    Object? lu = null,
    Object? dateCreation = freezed,
    Object? dateLecture = freezed,
    Object? idObjetLie = freezed,
  }) {
    return _then(
      _$AppNotificationImpl(
        idNotification: null == idNotification
            ? _value.idNotification
            : idNotification // ignore: cast_nullable_to_non_nullable
                  as String,
        idUtilisateur: null == idUtilisateur
            ? _value.idUtilisateur
            : idUtilisateur // ignore: cast_nullable_to_non_nullable
                  as String,
        type: null == type
            ? _value.type
            : type // ignore: cast_nullable_to_non_nullable
                  as String,
        titre: null == titre
            ? _value.titre
            : titre // ignore: cast_nullable_to_non_nullable
                  as String,
        contenu: null == contenu
            ? _value.contenu
            : contenu // ignore: cast_nullable_to_non_nullable
                  as String,
        lu: null == lu
            ? _value.lu
            : lu // ignore: cast_nullable_to_non_nullable
                  as bool,
        dateCreation: freezed == dateCreation
            ? _value.dateCreation
            : dateCreation // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
        dateLecture: freezed == dateLecture
            ? _value.dateLecture
            : dateLecture // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
        idObjetLie: freezed == idObjetLie
            ? _value.idObjetLie
            : idObjetLie // ignore: cast_nullable_to_non_nullable
                  as String?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$AppNotificationImpl implements _AppNotification {
  const _$AppNotificationImpl({
    @JsonKey(name: 'id_notification') required this.idNotification,
    @JsonKey(name: 'id_utilisateur') required this.idUtilisateur,
    required this.type,
    required this.titre,
    required this.contenu,
    this.lu = false,
    @JsonKey(name: 'date_creation') this.dateCreation,
    @JsonKey(name: 'date_lecture') this.dateLecture,
    @JsonKey(name: 'id_objet_lie') this.idObjetLie,
  });

  factory _$AppNotificationImpl.fromJson(Map<String, dynamic> json) =>
      _$$AppNotificationImplFromJson(json);

  @override
  @JsonKey(name: 'id_notification')
  final String idNotification;
  @override
  @JsonKey(name: 'id_utilisateur')
  final String idUtilisateur;
  @override
  final String type;
  @override
  final String titre;
  @override
  final String contenu;
  @override
  @JsonKey()
  final bool lu;
  @override
  @JsonKey(name: 'date_creation')
  final DateTime? dateCreation;
  @override
  @JsonKey(name: 'date_lecture')
  final DateTime? dateLecture;
  @override
  @JsonKey(name: 'id_objet_lie')
  final String? idObjetLie;

  @override
  String toString() {
    return 'AppNotification(idNotification: $idNotification, idUtilisateur: $idUtilisateur, type: $type, titre: $titre, contenu: $contenu, lu: $lu, dateCreation: $dateCreation, dateLecture: $dateLecture, idObjetLie: $idObjetLie)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AppNotificationImpl &&
            (identical(other.idNotification, idNotification) ||
                other.idNotification == idNotification) &&
            (identical(other.idUtilisateur, idUtilisateur) ||
                other.idUtilisateur == idUtilisateur) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.titre, titre) || other.titre == titre) &&
            (identical(other.contenu, contenu) || other.contenu == contenu) &&
            (identical(other.lu, lu) || other.lu == lu) &&
            (identical(other.dateCreation, dateCreation) ||
                other.dateCreation == dateCreation) &&
            (identical(other.dateLecture, dateLecture) ||
                other.dateLecture == dateLecture) &&
            (identical(other.idObjetLie, idObjetLie) ||
                other.idObjetLie == idObjetLie));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    idNotification,
    idUtilisateur,
    type,
    titre,
    contenu,
    lu,
    dateCreation,
    dateLecture,
    idObjetLie,
  );

  /// Create a copy of AppNotification
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AppNotificationImplCopyWith<_$AppNotificationImpl> get copyWith =>
      __$$AppNotificationImplCopyWithImpl<_$AppNotificationImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$AppNotificationImplToJson(this);
  }
}

abstract class _AppNotification implements AppNotification {
  const factory _AppNotification({
    @JsonKey(name: 'id_notification') required final String idNotification,
    @JsonKey(name: 'id_utilisateur') required final String idUtilisateur,
    required final String type,
    required final String titre,
    required final String contenu,
    final bool lu,
    @JsonKey(name: 'date_creation') final DateTime? dateCreation,
    @JsonKey(name: 'date_lecture') final DateTime? dateLecture,
    @JsonKey(name: 'id_objet_lie') final String? idObjetLie,
  }) = _$AppNotificationImpl;

  factory _AppNotification.fromJson(Map<String, dynamic> json) =
      _$AppNotificationImpl.fromJson;

  @override
  @JsonKey(name: 'id_notification')
  String get idNotification;
  @override
  @JsonKey(name: 'id_utilisateur')
  String get idUtilisateur;
  @override
  String get type;
  @override
  String get titre;
  @override
  String get contenu;
  @override
  bool get lu;
  @override
  @JsonKey(name: 'date_creation')
  DateTime? get dateCreation;
  @override
  @JsonKey(name: 'date_lecture')
  DateTime? get dateLecture;
  @override
  @JsonKey(name: 'id_objet_lie')
  String? get idObjetLie;

  /// Create a copy of AppNotification
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AppNotificationImplCopyWith<_$AppNotificationImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
