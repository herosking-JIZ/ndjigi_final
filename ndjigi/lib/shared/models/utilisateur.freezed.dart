// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'utilisateur.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

Utilisateur _$UtilisateurFromJson(Map<String, dynamic> json) {
  return _Utilisateur.fromJson(json);
}

/// @nodoc
mixin _$Utilisateur {
  @JsonKey(name: 'id_utilisateur')
  String get idUtilisateur => throw _privateConstructorUsedError;
  String get email => throw _privateConstructorUsedError;
  String? get prenom => throw _privateConstructorUsedError;
  String? get nom => throw _privateConstructorUsedError;
  @JsonKey(name: 'numero_telephone')
  String? get numeroTelephone => throw _privateConstructorUsedError;
  @JsonKey(name: 'photo_profil')
  String? get photoProfil => throw _privateConstructorUsedError;
  @JsonKey(name: 'adresse')
  String? get adresse => throw _privateConstructorUsedError;
  List<String> get roles => throw _privateConstructorUsedError;
  @JsonKey(name: 'statut_compte')
  String get statutCompte => throw _privateConstructorUsedError;
  @JsonKey(name: 'deux_fa_activee')
  bool get deuxFaActivee => throw _privateConstructorUsedError;

  /// Serializes this Utilisateur to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Utilisateur
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $UtilisateurCopyWith<Utilisateur> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $UtilisateurCopyWith<$Res> {
  factory $UtilisateurCopyWith(
    Utilisateur value,
    $Res Function(Utilisateur) then,
  ) = _$UtilisateurCopyWithImpl<$Res, Utilisateur>;
  @useResult
  $Res call({
    @JsonKey(name: 'id_utilisateur') String idUtilisateur,
    String email,
    String? prenom,
    String? nom,
    @JsonKey(name: 'numero_telephone') String? numeroTelephone,
    @JsonKey(name: 'photo_profil') String? photoProfil,
    @JsonKey(name: 'adresse') String? adresse,
    List<String> roles,
    @JsonKey(name: 'statut_compte') String statutCompte,
    @JsonKey(name: 'deux_fa_activee') bool deuxFaActivee,
  });
}

/// @nodoc
class _$UtilisateurCopyWithImpl<$Res, $Val extends Utilisateur>
    implements $UtilisateurCopyWith<$Res> {
  _$UtilisateurCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Utilisateur
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? idUtilisateur = null,
    Object? email = null,
    Object? prenom = freezed,
    Object? nom = freezed,
    Object? numeroTelephone = freezed,
    Object? photoProfil = freezed,
    Object? adresse = freezed,
    Object? roles = null,
    Object? statutCompte = null,
    Object? deuxFaActivee = null,
  }) {
    return _then(
      _value.copyWith(
            idUtilisateur: null == idUtilisateur
                ? _value.idUtilisateur
                : idUtilisateur // ignore: cast_nullable_to_non_nullable
                      as String,
            email: null == email
                ? _value.email
                : email // ignore: cast_nullable_to_non_nullable
                      as String,
            prenom: freezed == prenom
                ? _value.prenom
                : prenom // ignore: cast_nullable_to_non_nullable
                      as String?,
            nom: freezed == nom
                ? _value.nom
                : nom // ignore: cast_nullable_to_non_nullable
                      as String?,
            numeroTelephone: freezed == numeroTelephone
                ? _value.numeroTelephone
                : numeroTelephone // ignore: cast_nullable_to_non_nullable
                      as String?,
            photoProfil: freezed == photoProfil
                ? _value.photoProfil
                : photoProfil // ignore: cast_nullable_to_non_nullable
                      as String?,
            adresse: freezed == adresse
                ? _value.adresse
                : adresse // ignore: cast_nullable_to_non_nullable
                      as String?,
            roles: null == roles
                ? _value.roles
                : roles // ignore: cast_nullable_to_non_nullable
                      as List<String>,
            statutCompte: null == statutCompte
                ? _value.statutCompte
                : statutCompte // ignore: cast_nullable_to_non_nullable
                      as String,
            deuxFaActivee: null == deuxFaActivee
                ? _value.deuxFaActivee
                : deuxFaActivee // ignore: cast_nullable_to_non_nullable
                      as bool,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$UtilisateurImplCopyWith<$Res>
    implements $UtilisateurCopyWith<$Res> {
  factory _$$UtilisateurImplCopyWith(
    _$UtilisateurImpl value,
    $Res Function(_$UtilisateurImpl) then,
  ) = __$$UtilisateurImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    @JsonKey(name: 'id_utilisateur') String idUtilisateur,
    String email,
    String? prenom,
    String? nom,
    @JsonKey(name: 'numero_telephone') String? numeroTelephone,
    @JsonKey(name: 'photo_profil') String? photoProfil,
    @JsonKey(name: 'adresse') String? adresse,
    List<String> roles,
    @JsonKey(name: 'statut_compte') String statutCompte,
    @JsonKey(name: 'deux_fa_activee') bool deuxFaActivee,
  });
}

/// @nodoc
class __$$UtilisateurImplCopyWithImpl<$Res>
    extends _$UtilisateurCopyWithImpl<$Res, _$UtilisateurImpl>
    implements _$$UtilisateurImplCopyWith<$Res> {
  __$$UtilisateurImplCopyWithImpl(
    _$UtilisateurImpl _value,
    $Res Function(_$UtilisateurImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of Utilisateur
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? idUtilisateur = null,
    Object? email = null,
    Object? prenom = freezed,
    Object? nom = freezed,
    Object? numeroTelephone = freezed,
    Object? photoProfil = freezed,
    Object? adresse = freezed,
    Object? roles = null,
    Object? statutCompte = null,
    Object? deuxFaActivee = null,
  }) {
    return _then(
      _$UtilisateurImpl(
        idUtilisateur: null == idUtilisateur
            ? _value.idUtilisateur
            : idUtilisateur // ignore: cast_nullable_to_non_nullable
                  as String,
        email: null == email
            ? _value.email
            : email // ignore: cast_nullable_to_non_nullable
                  as String,
        prenom: freezed == prenom
            ? _value.prenom
            : prenom // ignore: cast_nullable_to_non_nullable
                  as String?,
        nom: freezed == nom
            ? _value.nom
            : nom // ignore: cast_nullable_to_non_nullable
                  as String?,
        numeroTelephone: freezed == numeroTelephone
            ? _value.numeroTelephone
            : numeroTelephone // ignore: cast_nullable_to_non_nullable
                  as String?,
        photoProfil: freezed == photoProfil
            ? _value.photoProfil
            : photoProfil // ignore: cast_nullable_to_non_nullable
                  as String?,
        adresse: freezed == adresse
            ? _value.adresse
            : adresse // ignore: cast_nullable_to_non_nullable
                  as String?,
        roles: null == roles
            ? _value._roles
            : roles // ignore: cast_nullable_to_non_nullable
                  as List<String>,
        statutCompte: null == statutCompte
            ? _value.statutCompte
            : statutCompte // ignore: cast_nullable_to_non_nullable
                  as String,
        deuxFaActivee: null == deuxFaActivee
            ? _value.deuxFaActivee
            : deuxFaActivee // ignore: cast_nullable_to_non_nullable
                  as bool,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$UtilisateurImpl implements _Utilisateur {
  const _$UtilisateurImpl({
    @JsonKey(name: 'id_utilisateur') required this.idUtilisateur,
    required this.email,
    this.prenom,
    this.nom,
    @JsonKey(name: 'numero_telephone') this.numeroTelephone,
    @JsonKey(name: 'photo_profil') this.photoProfil,
    @JsonKey(name: 'adresse') this.adresse,
    final List<String> roles = const [],
    @JsonKey(name: 'statut_compte') this.statutCompte = 'actif',
    @JsonKey(name: 'deux_fa_activee') this.deuxFaActivee = false,
  }) : _roles = roles;

  factory _$UtilisateurImpl.fromJson(Map<String, dynamic> json) =>
      _$$UtilisateurImplFromJson(json);

  @override
  @JsonKey(name: 'id_utilisateur')
  final String idUtilisateur;
  @override
  final String email;
  @override
  final String? prenom;
  @override
  final String? nom;
  @override
  @JsonKey(name: 'numero_telephone')
  final String? numeroTelephone;
  @override
  @JsonKey(name: 'photo_profil')
  final String? photoProfil;
  @override
  @JsonKey(name: 'adresse')
  final String? adresse;
  final List<String> _roles;
  @override
  @JsonKey()
  List<String> get roles {
    if (_roles is EqualUnmodifiableListView) return _roles;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_roles);
  }

  @override
  @JsonKey(name: 'statut_compte')
  final String statutCompte;
  @override
  @JsonKey(name: 'deux_fa_activee')
  final bool deuxFaActivee;

  @override
  String toString() {
    return 'Utilisateur(idUtilisateur: $idUtilisateur, email: $email, prenom: $prenom, nom: $nom, numeroTelephone: $numeroTelephone, photoProfil: $photoProfil, adresse: $adresse, roles: $roles, statutCompte: $statutCompte, deuxFaActivee: $deuxFaActivee)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$UtilisateurImpl &&
            (identical(other.idUtilisateur, idUtilisateur) ||
                other.idUtilisateur == idUtilisateur) &&
            (identical(other.email, email) || other.email == email) &&
            (identical(other.prenom, prenom) || other.prenom == prenom) &&
            (identical(other.nom, nom) || other.nom == nom) &&
            (identical(other.numeroTelephone, numeroTelephone) ||
                other.numeroTelephone == numeroTelephone) &&
            (identical(other.photoProfil, photoProfil) ||
                other.photoProfil == photoProfil) &&
            (identical(other.adresse, adresse) || other.adresse == adresse) &&
            const DeepCollectionEquality().equals(other._roles, _roles) &&
            (identical(other.statutCompte, statutCompte) ||
                other.statutCompte == statutCompte) &&
            (identical(other.deuxFaActivee, deuxFaActivee) ||
                other.deuxFaActivee == deuxFaActivee));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    idUtilisateur,
    email,
    prenom,
    nom,
    numeroTelephone,
    photoProfil,
    adresse,
    const DeepCollectionEquality().hash(_roles),
    statutCompte,
    deuxFaActivee,
  );

  /// Create a copy of Utilisateur
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$UtilisateurImplCopyWith<_$UtilisateurImpl> get copyWith =>
      __$$UtilisateurImplCopyWithImpl<_$UtilisateurImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$UtilisateurImplToJson(this);
  }
}

abstract class _Utilisateur implements Utilisateur {
  const factory _Utilisateur({
    @JsonKey(name: 'id_utilisateur') required final String idUtilisateur,
    required final String email,
    final String? prenom,
    final String? nom,
    @JsonKey(name: 'numero_telephone') final String? numeroTelephone,
    @JsonKey(name: 'photo_profil') final String? photoProfil,
    @JsonKey(name: 'adresse') final String? adresse,
    final List<String> roles,
    @JsonKey(name: 'statut_compte') final String statutCompte,
    @JsonKey(name: 'deux_fa_activee') final bool deuxFaActivee,
  }) = _$UtilisateurImpl;

  factory _Utilisateur.fromJson(Map<String, dynamic> json) =
      _$UtilisateurImpl.fromJson;

  @override
  @JsonKey(name: 'id_utilisateur')
  String get idUtilisateur;
  @override
  String get email;
  @override
  String? get prenom;
  @override
  String? get nom;
  @override
  @JsonKey(name: 'numero_telephone')
  String? get numeroTelephone;
  @override
  @JsonKey(name: 'photo_profil')
  String? get photoProfil;
  @override
  @JsonKey(name: 'adresse')
  String? get adresse;
  @override
  List<String> get roles;
  @override
  @JsonKey(name: 'statut_compte')
  String get statutCompte;
  @override
  @JsonKey(name: 'deux_fa_activee')
  bool get deuxFaActivee;

  /// Create a copy of Utilisateur
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$UtilisateurImplCopyWith<_$UtilisateurImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
