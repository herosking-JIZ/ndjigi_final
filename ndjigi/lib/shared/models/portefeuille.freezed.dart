// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'portefeuille.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

Portefeuille _$PortefeuilleFromJson(Map<String, dynamic> json) {
  return _Portefeuille.fromJson(json);
}

/// @nodoc
mixin _$Portefeuille {
  @JsonKey(name: 'id_portefeuille')
  String get idPortefeuille => throw _privateConstructorUsedError;
  @JsonKey(name: 'id_utilisateur')
  String get idUtilisateur => throw _privateConstructorUsedError;
  @JsonKey(name: 'solde', fromJson: _soldeFromJson)
  double get solde => throw _privateConstructorUsedError;
  @JsonKey(name: 'dette_commission', fromJson: _detteFromJson)
  double? get detteCommission => throw _privateConstructorUsedError;
  String get devise => throw _privateConstructorUsedError;
  String get statut => throw _privateConstructorUsedError;

  /// Serializes this Portefeuille to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Portefeuille
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $PortefeuilleCopyWith<Portefeuille> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PortefeuilleCopyWith<$Res> {
  factory $PortefeuilleCopyWith(
    Portefeuille value,
    $Res Function(Portefeuille) then,
  ) = _$PortefeuilleCopyWithImpl<$Res, Portefeuille>;
  @useResult
  $Res call({
    @JsonKey(name: 'id_portefeuille') String idPortefeuille,
    @JsonKey(name: 'id_utilisateur') String idUtilisateur,
    @JsonKey(name: 'solde', fromJson: _soldeFromJson) double solde,
    @JsonKey(name: 'dette_commission', fromJson: _detteFromJson)
    double? detteCommission,
    String devise,
    String statut,
  });
}

/// @nodoc
class _$PortefeuilleCopyWithImpl<$Res, $Val extends Portefeuille>
    implements $PortefeuilleCopyWith<$Res> {
  _$PortefeuilleCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Portefeuille
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? idPortefeuille = null,
    Object? idUtilisateur = null,
    Object? solde = null,
    Object? detteCommission = freezed,
    Object? devise = null,
    Object? statut = null,
  }) {
    return _then(
      _value.copyWith(
            idPortefeuille: null == idPortefeuille
                ? _value.idPortefeuille
                : idPortefeuille // ignore: cast_nullable_to_non_nullable
                      as String,
            idUtilisateur: null == idUtilisateur
                ? _value.idUtilisateur
                : idUtilisateur // ignore: cast_nullable_to_non_nullable
                      as String,
            solde: null == solde
                ? _value.solde
                : solde // ignore: cast_nullable_to_non_nullable
                      as double,
            detteCommission: freezed == detteCommission
                ? _value.detteCommission
                : detteCommission // ignore: cast_nullable_to_non_nullable
                      as double?,
            devise: null == devise
                ? _value.devise
                : devise // ignore: cast_nullable_to_non_nullable
                      as String,
            statut: null == statut
                ? _value.statut
                : statut // ignore: cast_nullable_to_non_nullable
                      as String,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$PortefeuilleImplCopyWith<$Res>
    implements $PortefeuilleCopyWith<$Res> {
  factory _$$PortefeuilleImplCopyWith(
    _$PortefeuilleImpl value,
    $Res Function(_$PortefeuilleImpl) then,
  ) = __$$PortefeuilleImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    @JsonKey(name: 'id_portefeuille') String idPortefeuille,
    @JsonKey(name: 'id_utilisateur') String idUtilisateur,
    @JsonKey(name: 'solde', fromJson: _soldeFromJson) double solde,
    @JsonKey(name: 'dette_commission', fromJson: _detteFromJson)
    double? detteCommission,
    String devise,
    String statut,
  });
}

/// @nodoc
class __$$PortefeuilleImplCopyWithImpl<$Res>
    extends _$PortefeuilleCopyWithImpl<$Res, _$PortefeuilleImpl>
    implements _$$PortefeuilleImplCopyWith<$Res> {
  __$$PortefeuilleImplCopyWithImpl(
    _$PortefeuilleImpl _value,
    $Res Function(_$PortefeuilleImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of Portefeuille
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? idPortefeuille = null,
    Object? idUtilisateur = null,
    Object? solde = null,
    Object? detteCommission = freezed,
    Object? devise = null,
    Object? statut = null,
  }) {
    return _then(
      _$PortefeuilleImpl(
        idPortefeuille: null == idPortefeuille
            ? _value.idPortefeuille
            : idPortefeuille // ignore: cast_nullable_to_non_nullable
                  as String,
        idUtilisateur: null == idUtilisateur
            ? _value.idUtilisateur
            : idUtilisateur // ignore: cast_nullable_to_non_nullable
                  as String,
        solde: null == solde
            ? _value.solde
            : solde // ignore: cast_nullable_to_non_nullable
                  as double,
        detteCommission: freezed == detteCommission
            ? _value.detteCommission
            : detteCommission // ignore: cast_nullable_to_non_nullable
                  as double?,
        devise: null == devise
            ? _value.devise
            : devise // ignore: cast_nullable_to_non_nullable
                  as String,
        statut: null == statut
            ? _value.statut
            : statut // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$PortefeuilleImpl implements _Portefeuille {
  const _$PortefeuilleImpl({
    @JsonKey(name: 'id_portefeuille') required this.idPortefeuille,
    @JsonKey(name: 'id_utilisateur') required this.idUtilisateur,
    @JsonKey(name: 'solde', fromJson: _soldeFromJson) required this.solde,
    @JsonKey(name: 'dette_commission', fromJson: _detteFromJson)
    this.detteCommission,
    this.devise = 'XOF',
    this.statut = 'actif',
  });

  factory _$PortefeuilleImpl.fromJson(Map<String, dynamic> json) =>
      _$$PortefeuilleImplFromJson(json);

  @override
  @JsonKey(name: 'id_portefeuille')
  final String idPortefeuille;
  @override
  @JsonKey(name: 'id_utilisateur')
  final String idUtilisateur;
  @override
  @JsonKey(name: 'solde', fromJson: _soldeFromJson)
  final double solde;
  @override
  @JsonKey(name: 'dette_commission', fromJson: _detteFromJson)
  final double? detteCommission;
  @override
  @JsonKey()
  final String devise;
  @override
  @JsonKey()
  final String statut;

  @override
  String toString() {
    return 'Portefeuille(idPortefeuille: $idPortefeuille, idUtilisateur: $idUtilisateur, solde: $solde, detteCommission: $detteCommission, devise: $devise, statut: $statut)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PortefeuilleImpl &&
            (identical(other.idPortefeuille, idPortefeuille) ||
                other.idPortefeuille == idPortefeuille) &&
            (identical(other.idUtilisateur, idUtilisateur) ||
                other.idUtilisateur == idUtilisateur) &&
            (identical(other.solde, solde) || other.solde == solde) &&
            (identical(other.detteCommission, detteCommission) ||
                other.detteCommission == detteCommission) &&
            (identical(other.devise, devise) || other.devise == devise) &&
            (identical(other.statut, statut) || other.statut == statut));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    idPortefeuille,
    idUtilisateur,
    solde,
    detteCommission,
    devise,
    statut,
  );

  /// Create a copy of Portefeuille
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$PortefeuilleImplCopyWith<_$PortefeuilleImpl> get copyWith =>
      __$$PortefeuilleImplCopyWithImpl<_$PortefeuilleImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$PortefeuilleImplToJson(this);
  }
}

abstract class _Portefeuille implements Portefeuille {
  const factory _Portefeuille({
    @JsonKey(name: 'id_portefeuille') required final String idPortefeuille,
    @JsonKey(name: 'id_utilisateur') required final String idUtilisateur,
    @JsonKey(name: 'solde', fromJson: _soldeFromJson)
    required final double solde,
    @JsonKey(name: 'dette_commission', fromJson: _detteFromJson)
    final double? detteCommission,
    final String devise,
    final String statut,
  }) = _$PortefeuilleImpl;

  factory _Portefeuille.fromJson(Map<String, dynamic> json) =
      _$PortefeuilleImpl.fromJson;

  @override
  @JsonKey(name: 'id_portefeuille')
  String get idPortefeuille;
  @override
  @JsonKey(name: 'id_utilisateur')
  String get idUtilisateur;
  @override
  @JsonKey(name: 'solde', fromJson: _soldeFromJson)
  double get solde;
  @override
  @JsonKey(name: 'dette_commission', fromJson: _detteFromJson)
  double? get detteCommission;
  @override
  String get devise;
  @override
  String get statut;

  /// Create a copy of Portefeuille
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$PortefeuilleImplCopyWith<_$PortefeuilleImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
