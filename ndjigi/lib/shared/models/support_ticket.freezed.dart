// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'support_ticket.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

SupportTicket _$SupportTicketFromJson(Map<String, dynamic> json) {
  return _SupportTicket.fromJson(json);
}

/// @nodoc
mixin _$SupportTicket {
  @JsonKey(name: 'id_ticket')
  String get idTicket => throw _privateConstructorUsedError;
  String get sujet => throw _privateConstructorUsedError;
  String get description => throw _privateConstructorUsedError;
  @JsonKey(name: 'id_utilisateur')
  String? get idUtilisateur => throw _privateConstructorUsedError;
  @JsonKey(name: 'id_trajet')
  String? get idTrajet => throw _privateConstructorUsedError;
  @JsonKey(name: 'id_paiement')
  String? get idPaiement => throw _privateConstructorUsedError;
  @JsonKey(name: 'id_location')
  String? get idLocation => throw _privateConstructorUsedError;
  String get statut => throw _privateConstructorUsedError;
  @JsonKey(name: 'eligible_remboursement')
  bool get eligibleRemboursement => throw _privateConstructorUsedError;
  @JsonKey(name: 'date_creation')
  DateTime? get dateCreation => throw _privateConstructorUsedError;
  @JsonKey(name: 'date_resolution')
  DateTime? get dateResolution => throw _privateConstructorUsedError;

  /// Serializes this SupportTicket to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of SupportTicket
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $SupportTicketCopyWith<SupportTicket> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SupportTicketCopyWith<$Res> {
  factory $SupportTicketCopyWith(
    SupportTicket value,
    $Res Function(SupportTicket) then,
  ) = _$SupportTicketCopyWithImpl<$Res, SupportTicket>;
  @useResult
  $Res call({
    @JsonKey(name: 'id_ticket') String idTicket,
    String sujet,
    String description,
    @JsonKey(name: 'id_utilisateur') String? idUtilisateur,
    @JsonKey(name: 'id_trajet') String? idTrajet,
    @JsonKey(name: 'id_paiement') String? idPaiement,
    @JsonKey(name: 'id_location') String? idLocation,
    String statut,
    @JsonKey(name: 'eligible_remboursement') bool eligibleRemboursement,
    @JsonKey(name: 'date_creation') DateTime? dateCreation,
    @JsonKey(name: 'date_resolution') DateTime? dateResolution,
  });
}

/// @nodoc
class _$SupportTicketCopyWithImpl<$Res, $Val extends SupportTicket>
    implements $SupportTicketCopyWith<$Res> {
  _$SupportTicketCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of SupportTicket
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? idTicket = null,
    Object? sujet = null,
    Object? description = null,
    Object? idUtilisateur = freezed,
    Object? idTrajet = freezed,
    Object? idPaiement = freezed,
    Object? idLocation = freezed,
    Object? statut = null,
    Object? eligibleRemboursement = null,
    Object? dateCreation = freezed,
    Object? dateResolution = freezed,
  }) {
    return _then(
      _value.copyWith(
            idTicket: null == idTicket
                ? _value.idTicket
                : idTicket // ignore: cast_nullable_to_non_nullable
                      as String,
            sujet: null == sujet
                ? _value.sujet
                : sujet // ignore: cast_nullable_to_non_nullable
                      as String,
            description: null == description
                ? _value.description
                : description // ignore: cast_nullable_to_non_nullable
                      as String,
            idUtilisateur: freezed == idUtilisateur
                ? _value.idUtilisateur
                : idUtilisateur // ignore: cast_nullable_to_non_nullable
                      as String?,
            idTrajet: freezed == idTrajet
                ? _value.idTrajet
                : idTrajet // ignore: cast_nullable_to_non_nullable
                      as String?,
            idPaiement: freezed == idPaiement
                ? _value.idPaiement
                : idPaiement // ignore: cast_nullable_to_non_nullable
                      as String?,
            idLocation: freezed == idLocation
                ? _value.idLocation
                : idLocation // ignore: cast_nullable_to_non_nullable
                      as String?,
            statut: null == statut
                ? _value.statut
                : statut // ignore: cast_nullable_to_non_nullable
                      as String,
            eligibleRemboursement: null == eligibleRemboursement
                ? _value.eligibleRemboursement
                : eligibleRemboursement // ignore: cast_nullable_to_non_nullable
                      as bool,
            dateCreation: freezed == dateCreation
                ? _value.dateCreation
                : dateCreation // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
            dateResolution: freezed == dateResolution
                ? _value.dateResolution
                : dateResolution // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$SupportTicketImplCopyWith<$Res>
    implements $SupportTicketCopyWith<$Res> {
  factory _$$SupportTicketImplCopyWith(
    _$SupportTicketImpl value,
    $Res Function(_$SupportTicketImpl) then,
  ) = __$$SupportTicketImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    @JsonKey(name: 'id_ticket') String idTicket,
    String sujet,
    String description,
    @JsonKey(name: 'id_utilisateur') String? idUtilisateur,
    @JsonKey(name: 'id_trajet') String? idTrajet,
    @JsonKey(name: 'id_paiement') String? idPaiement,
    @JsonKey(name: 'id_location') String? idLocation,
    String statut,
    @JsonKey(name: 'eligible_remboursement') bool eligibleRemboursement,
    @JsonKey(name: 'date_creation') DateTime? dateCreation,
    @JsonKey(name: 'date_resolution') DateTime? dateResolution,
  });
}

/// @nodoc
class __$$SupportTicketImplCopyWithImpl<$Res>
    extends _$SupportTicketCopyWithImpl<$Res, _$SupportTicketImpl>
    implements _$$SupportTicketImplCopyWith<$Res> {
  __$$SupportTicketImplCopyWithImpl(
    _$SupportTicketImpl _value,
    $Res Function(_$SupportTicketImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of SupportTicket
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? idTicket = null,
    Object? sujet = null,
    Object? description = null,
    Object? idUtilisateur = freezed,
    Object? idTrajet = freezed,
    Object? idPaiement = freezed,
    Object? idLocation = freezed,
    Object? statut = null,
    Object? eligibleRemboursement = null,
    Object? dateCreation = freezed,
    Object? dateResolution = freezed,
  }) {
    return _then(
      _$SupportTicketImpl(
        idTicket: null == idTicket
            ? _value.idTicket
            : idTicket // ignore: cast_nullable_to_non_nullable
                  as String,
        sujet: null == sujet
            ? _value.sujet
            : sujet // ignore: cast_nullable_to_non_nullable
                  as String,
        description: null == description
            ? _value.description
            : description // ignore: cast_nullable_to_non_nullable
                  as String,
        idUtilisateur: freezed == idUtilisateur
            ? _value.idUtilisateur
            : idUtilisateur // ignore: cast_nullable_to_non_nullable
                  as String?,
        idTrajet: freezed == idTrajet
            ? _value.idTrajet
            : idTrajet // ignore: cast_nullable_to_non_nullable
                  as String?,
        idPaiement: freezed == idPaiement
            ? _value.idPaiement
            : idPaiement // ignore: cast_nullable_to_non_nullable
                  as String?,
        idLocation: freezed == idLocation
            ? _value.idLocation
            : idLocation // ignore: cast_nullable_to_non_nullable
                  as String?,
        statut: null == statut
            ? _value.statut
            : statut // ignore: cast_nullable_to_non_nullable
                  as String,
        eligibleRemboursement: null == eligibleRemboursement
            ? _value.eligibleRemboursement
            : eligibleRemboursement // ignore: cast_nullable_to_non_nullable
                  as bool,
        dateCreation: freezed == dateCreation
            ? _value.dateCreation
            : dateCreation // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
        dateResolution: freezed == dateResolution
            ? _value.dateResolution
            : dateResolution // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$SupportTicketImpl implements _SupportTicket {
  const _$SupportTicketImpl({
    @JsonKey(name: 'id_ticket') required this.idTicket,
    required this.sujet,
    required this.description,
    @JsonKey(name: 'id_utilisateur') this.idUtilisateur,
    @JsonKey(name: 'id_trajet') this.idTrajet,
    @JsonKey(name: 'id_paiement') this.idPaiement,
    @JsonKey(name: 'id_location') this.idLocation,
    this.statut = 'ouvert',
    @JsonKey(name: 'eligible_remboursement') this.eligibleRemboursement = false,
    @JsonKey(name: 'date_creation') this.dateCreation,
    @JsonKey(name: 'date_resolution') this.dateResolution,
  });

  factory _$SupportTicketImpl.fromJson(Map<String, dynamic> json) =>
      _$$SupportTicketImplFromJson(json);

  @override
  @JsonKey(name: 'id_ticket')
  final String idTicket;
  @override
  final String sujet;
  @override
  final String description;
  @override
  @JsonKey(name: 'id_utilisateur')
  final String? idUtilisateur;
  @override
  @JsonKey(name: 'id_trajet')
  final String? idTrajet;
  @override
  @JsonKey(name: 'id_paiement')
  final String? idPaiement;
  @override
  @JsonKey(name: 'id_location')
  final String? idLocation;
  @override
  @JsonKey()
  final String statut;
  @override
  @JsonKey(name: 'eligible_remboursement')
  final bool eligibleRemboursement;
  @override
  @JsonKey(name: 'date_creation')
  final DateTime? dateCreation;
  @override
  @JsonKey(name: 'date_resolution')
  final DateTime? dateResolution;

  @override
  String toString() {
    return 'SupportTicket(idTicket: $idTicket, sujet: $sujet, description: $description, idUtilisateur: $idUtilisateur, idTrajet: $idTrajet, idPaiement: $idPaiement, idLocation: $idLocation, statut: $statut, eligibleRemboursement: $eligibleRemboursement, dateCreation: $dateCreation, dateResolution: $dateResolution)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SupportTicketImpl &&
            (identical(other.idTicket, idTicket) ||
                other.idTicket == idTicket) &&
            (identical(other.sujet, sujet) || other.sujet == sujet) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.idUtilisateur, idUtilisateur) ||
                other.idUtilisateur == idUtilisateur) &&
            (identical(other.idTrajet, idTrajet) ||
                other.idTrajet == idTrajet) &&
            (identical(other.idPaiement, idPaiement) ||
                other.idPaiement == idPaiement) &&
            (identical(other.idLocation, idLocation) ||
                other.idLocation == idLocation) &&
            (identical(other.statut, statut) || other.statut == statut) &&
            (identical(other.eligibleRemboursement, eligibleRemboursement) ||
                other.eligibleRemboursement == eligibleRemboursement) &&
            (identical(other.dateCreation, dateCreation) ||
                other.dateCreation == dateCreation) &&
            (identical(other.dateResolution, dateResolution) ||
                other.dateResolution == dateResolution));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    idTicket,
    sujet,
    description,
    idUtilisateur,
    idTrajet,
    idPaiement,
    idLocation,
    statut,
    eligibleRemboursement,
    dateCreation,
    dateResolution,
  );

  /// Create a copy of SupportTicket
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$SupportTicketImplCopyWith<_$SupportTicketImpl> get copyWith =>
      __$$SupportTicketImplCopyWithImpl<_$SupportTicketImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$SupportTicketImplToJson(this);
  }
}

abstract class _SupportTicket implements SupportTicket {
  const factory _SupportTicket({
    @JsonKey(name: 'id_ticket') required final String idTicket,
    required final String sujet,
    required final String description,
    @JsonKey(name: 'id_utilisateur') final String? idUtilisateur,
    @JsonKey(name: 'id_trajet') final String? idTrajet,
    @JsonKey(name: 'id_paiement') final String? idPaiement,
    @JsonKey(name: 'id_location') final String? idLocation,
    final String statut,
    @JsonKey(name: 'eligible_remboursement') final bool eligibleRemboursement,
    @JsonKey(name: 'date_creation') final DateTime? dateCreation,
    @JsonKey(name: 'date_resolution') final DateTime? dateResolution,
  }) = _$SupportTicketImpl;

  factory _SupportTicket.fromJson(Map<String, dynamic> json) =
      _$SupportTicketImpl.fromJson;

  @override
  @JsonKey(name: 'id_ticket')
  String get idTicket;
  @override
  String get sujet;
  @override
  String get description;
  @override
  @JsonKey(name: 'id_utilisateur')
  String? get idUtilisateur;
  @override
  @JsonKey(name: 'id_trajet')
  String? get idTrajet;
  @override
  @JsonKey(name: 'id_paiement')
  String? get idPaiement;
  @override
  @JsonKey(name: 'id_location')
  String? get idLocation;
  @override
  String get statut;
  @override
  @JsonKey(name: 'eligible_remboursement')
  bool get eligibleRemboursement;
  @override
  @JsonKey(name: 'date_creation')
  DateTime? get dateCreation;
  @override
  @JsonKey(name: 'date_resolution')
  DateTime? get dateResolution;

  /// Create a copy of SupportTicket
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$SupportTicketImplCopyWith<_$SupportTicketImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
