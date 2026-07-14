// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'course.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

Course _$CourseFromJson(Map<String, dynamic> json) {
  return _Course.fromJson(json);
}

/// @nodoc
mixin _$Course {
  @JsonKey(name: 'id_trajet')
  String get idTrajet => throw _privateConstructorUsedError;
  @JsonKey(name: 'id_chauffeur')
  String? get idChauffeur => throw _privateConstructorUsedError;
  @JsonKey(name: 'adresse_depart')
  String get adresseDepart => throw _privateConstructorUsedError;
  @JsonKey(name: 'adresse_arrivee')
  String get adresseArrivee => throw _privateConstructorUsedError;
  @JsonKey(name: 'distance_km', fromJson: _parseDoubleNullable)
  double? get distanceKm => throw _privateConstructorUsedError;
  @JsonKey(name: 'duree_estimee_min')
  int? get dureeEstimeeMin => throw _privateConstructorUsedError;
  @JsonKey(name: 'date_heure_debut')
  DateTime? get dateHeureDebut => throw _privateConstructorUsedError;
  @JsonKey(name: 'date_heure_fin')
  DateTime? get dateHeureFin => throw _privateConstructorUsedError;
  String get statut => throw _privateConstructorUsedError;
  @JsonKey(name: 'type_trajet')
  String get typeTrajet => throw _privateConstructorUsedError;
  @JsonKey(name: 'tarif_final', fromJson: _parseDoubleNullable)
  double? get tarifFinal => throw _privateConstructorUsedError;
  @JsonKey(name: 'coordonnees_depart')
  Map<String, dynamic>? get coordonneesDepart =>
      throw _privateConstructorUsedError;
  @JsonKey(name: 'coordonnees_arrivee')
  Map<String, dynamic>? get coordonneesArrivee =>
      throw _privateConstructorUsedError;
  @JsonKey(name: 'polyline_trajet')
  String? get polylineTrajet => throw _privateConstructorUsedError;
  @JsonKey(name: 'confirmation_chauffeur')
  bool get confirmationChauffeur => throw _privateConstructorUsedError;
  @JsonKey(name: 'confirmation_passager')
  bool get confirmationPassager => throw _privateConstructorUsedError;
  @JsonKey(name: 'identite_confirmee')
  bool get identiteConfirmee => throw _privateConstructorUsedError;
  @JsonKey(name: 'motif_annulation')
  String? get motifAnnulation => throw _privateConstructorUsedError;
  @JsonKey(name: 'chauffeur_nom')
  String? get chauffeurNom => throw _privateConstructorUsedError;
  @JsonKey(name: 'chauffeur_photo')
  String? get chauffeurPhoto => throw _privateConstructorUsedError;
  @JsonKey(name: 'chauffeur_telephone')
  String? get chauffeurTelephone => throw _privateConstructorUsedError;
  @JsonKey(name: 'chauffeur_note', fromJson: _parseDoubleNullable)
  double? get chauffeurNote => throw _privateConstructorUsedError;
  @JsonKey(name: 'vehicule_marque')
  String? get vehiculeMarque => throw _privateConstructorUsedError;
  @JsonKey(name: 'vehicule_modele')
  String? get vehiculeModele => throw _privateConstructorUsedError;
  @JsonKey(name: 'vehicule_couleur')
  String? get vehiculeCouleur => throw _privateConstructorUsedError;
  @JsonKey(name: 'vehicule_immatriculation')
  String? get vehiculeImmatriculation => throw _privateConstructorUsedError;

  /// Serializes this Course to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Course
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $CourseCopyWith<Course> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CourseCopyWith<$Res> {
  factory $CourseCopyWith(Course value, $Res Function(Course) then) =
      _$CourseCopyWithImpl<$Res, Course>;
  @useResult
  $Res call({
    @JsonKey(name: 'id_trajet') String idTrajet,
    @JsonKey(name: 'id_chauffeur') String? idChauffeur,
    @JsonKey(name: 'adresse_depart') String adresseDepart,
    @JsonKey(name: 'adresse_arrivee') String adresseArrivee,
    @JsonKey(name: 'distance_km', fromJson: _parseDoubleNullable)
    double? distanceKm,
    @JsonKey(name: 'duree_estimee_min') int? dureeEstimeeMin,
    @JsonKey(name: 'date_heure_debut') DateTime? dateHeureDebut,
    @JsonKey(name: 'date_heure_fin') DateTime? dateHeureFin,
    String statut,
    @JsonKey(name: 'type_trajet') String typeTrajet,
    @JsonKey(name: 'tarif_final', fromJson: _parseDoubleNullable)
    double? tarifFinal,
    @JsonKey(name: 'coordonnees_depart')
    Map<String, dynamic>? coordonneesDepart,
    @JsonKey(name: 'coordonnees_arrivee')
    Map<String, dynamic>? coordonneesArrivee,
    @JsonKey(name: 'polyline_trajet') String? polylineTrajet,
    @JsonKey(name: 'confirmation_chauffeur') bool confirmationChauffeur,
    @JsonKey(name: 'confirmation_passager') bool confirmationPassager,
    @JsonKey(name: 'identite_confirmee') bool identiteConfirmee,
    @JsonKey(name: 'motif_annulation') String? motifAnnulation,
    @JsonKey(name: 'chauffeur_nom') String? chauffeurNom,
    @JsonKey(name: 'chauffeur_photo') String? chauffeurPhoto,
    @JsonKey(name: 'chauffeur_telephone') String? chauffeurTelephone,
    @JsonKey(name: 'chauffeur_note', fromJson: _parseDoubleNullable)
    double? chauffeurNote,
    @JsonKey(name: 'vehicule_marque') String? vehiculeMarque,
    @JsonKey(name: 'vehicule_modele') String? vehiculeModele,
    @JsonKey(name: 'vehicule_couleur') String? vehiculeCouleur,
    @JsonKey(name: 'vehicule_immatriculation') String? vehiculeImmatriculation,
  });
}

/// @nodoc
class _$CourseCopyWithImpl<$Res, $Val extends Course>
    implements $CourseCopyWith<$Res> {
  _$CourseCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Course
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? idTrajet = null,
    Object? idChauffeur = freezed,
    Object? adresseDepart = null,
    Object? adresseArrivee = null,
    Object? distanceKm = freezed,
    Object? dureeEstimeeMin = freezed,
    Object? dateHeureDebut = freezed,
    Object? dateHeureFin = freezed,
    Object? statut = null,
    Object? typeTrajet = null,
    Object? tarifFinal = freezed,
    Object? coordonneesDepart = freezed,
    Object? coordonneesArrivee = freezed,
    Object? polylineTrajet = freezed,
    Object? confirmationChauffeur = null,
    Object? confirmationPassager = null,
    Object? identiteConfirmee = null,
    Object? motifAnnulation = freezed,
    Object? chauffeurNom = freezed,
    Object? chauffeurPhoto = freezed,
    Object? chauffeurTelephone = freezed,
    Object? chauffeurNote = freezed,
    Object? vehiculeMarque = freezed,
    Object? vehiculeModele = freezed,
    Object? vehiculeCouleur = freezed,
    Object? vehiculeImmatriculation = freezed,
  }) {
    return _then(
      _value.copyWith(
            idTrajet: null == idTrajet
                ? _value.idTrajet
                : idTrajet // ignore: cast_nullable_to_non_nullable
                      as String,
            idChauffeur: freezed == idChauffeur
                ? _value.idChauffeur
                : idChauffeur // ignore: cast_nullable_to_non_nullable
                      as String?,
            adresseDepart: null == adresseDepart
                ? _value.adresseDepart
                : adresseDepart // ignore: cast_nullable_to_non_nullable
                      as String,
            adresseArrivee: null == adresseArrivee
                ? _value.adresseArrivee
                : adresseArrivee // ignore: cast_nullable_to_non_nullable
                      as String,
            distanceKm: freezed == distanceKm
                ? _value.distanceKm
                : distanceKm // ignore: cast_nullable_to_non_nullable
                      as double?,
            dureeEstimeeMin: freezed == dureeEstimeeMin
                ? _value.dureeEstimeeMin
                : dureeEstimeeMin // ignore: cast_nullable_to_non_nullable
                      as int?,
            dateHeureDebut: freezed == dateHeureDebut
                ? _value.dateHeureDebut
                : dateHeureDebut // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
            dateHeureFin: freezed == dateHeureFin
                ? _value.dateHeureFin
                : dateHeureFin // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
            statut: null == statut
                ? _value.statut
                : statut // ignore: cast_nullable_to_non_nullable
                      as String,
            typeTrajet: null == typeTrajet
                ? _value.typeTrajet
                : typeTrajet // ignore: cast_nullable_to_non_nullable
                      as String,
            tarifFinal: freezed == tarifFinal
                ? _value.tarifFinal
                : tarifFinal // ignore: cast_nullable_to_non_nullable
                      as double?,
            coordonneesDepart: freezed == coordonneesDepart
                ? _value.coordonneesDepart
                : coordonneesDepart // ignore: cast_nullable_to_non_nullable
                      as Map<String, dynamic>?,
            coordonneesArrivee: freezed == coordonneesArrivee
                ? _value.coordonneesArrivee
                : coordonneesArrivee // ignore: cast_nullable_to_non_nullable
                      as Map<String, dynamic>?,
            polylineTrajet: freezed == polylineTrajet
                ? _value.polylineTrajet
                : polylineTrajet // ignore: cast_nullable_to_non_nullable
                      as String?,
            confirmationChauffeur: null == confirmationChauffeur
                ? _value.confirmationChauffeur
                : confirmationChauffeur // ignore: cast_nullable_to_non_nullable
                      as bool,
            confirmationPassager: null == confirmationPassager
                ? _value.confirmationPassager
                : confirmationPassager // ignore: cast_nullable_to_non_nullable
                      as bool,
            identiteConfirmee: null == identiteConfirmee
                ? _value.identiteConfirmee
                : identiteConfirmee // ignore: cast_nullable_to_non_nullable
                      as bool,
            motifAnnulation: freezed == motifAnnulation
                ? _value.motifAnnulation
                : motifAnnulation // ignore: cast_nullable_to_non_nullable
                      as String?,
            chauffeurNom: freezed == chauffeurNom
                ? _value.chauffeurNom
                : chauffeurNom // ignore: cast_nullable_to_non_nullable
                      as String?,
            chauffeurPhoto: freezed == chauffeurPhoto
                ? _value.chauffeurPhoto
                : chauffeurPhoto // ignore: cast_nullable_to_non_nullable
                      as String?,
            chauffeurTelephone: freezed == chauffeurTelephone
                ? _value.chauffeurTelephone
                : chauffeurTelephone // ignore: cast_nullable_to_non_nullable
                      as String?,
            chauffeurNote: freezed == chauffeurNote
                ? _value.chauffeurNote
                : chauffeurNote // ignore: cast_nullable_to_non_nullable
                      as double?,
            vehiculeMarque: freezed == vehiculeMarque
                ? _value.vehiculeMarque
                : vehiculeMarque // ignore: cast_nullable_to_non_nullable
                      as String?,
            vehiculeModele: freezed == vehiculeModele
                ? _value.vehiculeModele
                : vehiculeModele // ignore: cast_nullable_to_non_nullable
                      as String?,
            vehiculeCouleur: freezed == vehiculeCouleur
                ? _value.vehiculeCouleur
                : vehiculeCouleur // ignore: cast_nullable_to_non_nullable
                      as String?,
            vehiculeImmatriculation: freezed == vehiculeImmatriculation
                ? _value.vehiculeImmatriculation
                : vehiculeImmatriculation // ignore: cast_nullable_to_non_nullable
                      as String?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$CourseImplCopyWith<$Res> implements $CourseCopyWith<$Res> {
  factory _$$CourseImplCopyWith(
    _$CourseImpl value,
    $Res Function(_$CourseImpl) then,
  ) = __$$CourseImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    @JsonKey(name: 'id_trajet') String idTrajet,
    @JsonKey(name: 'id_chauffeur') String? idChauffeur,
    @JsonKey(name: 'adresse_depart') String adresseDepart,
    @JsonKey(name: 'adresse_arrivee') String adresseArrivee,
    @JsonKey(name: 'distance_km', fromJson: _parseDoubleNullable)
    double? distanceKm,
    @JsonKey(name: 'duree_estimee_min') int? dureeEstimeeMin,
    @JsonKey(name: 'date_heure_debut') DateTime? dateHeureDebut,
    @JsonKey(name: 'date_heure_fin') DateTime? dateHeureFin,
    String statut,
    @JsonKey(name: 'type_trajet') String typeTrajet,
    @JsonKey(name: 'tarif_final', fromJson: _parseDoubleNullable)
    double? tarifFinal,
    @JsonKey(name: 'coordonnees_depart')
    Map<String, dynamic>? coordonneesDepart,
    @JsonKey(name: 'coordonnees_arrivee')
    Map<String, dynamic>? coordonneesArrivee,
    @JsonKey(name: 'polyline_trajet') String? polylineTrajet,
    @JsonKey(name: 'confirmation_chauffeur') bool confirmationChauffeur,
    @JsonKey(name: 'confirmation_passager') bool confirmationPassager,
    @JsonKey(name: 'identite_confirmee') bool identiteConfirmee,
    @JsonKey(name: 'motif_annulation') String? motifAnnulation,
    @JsonKey(name: 'chauffeur_nom') String? chauffeurNom,
    @JsonKey(name: 'chauffeur_photo') String? chauffeurPhoto,
    @JsonKey(name: 'chauffeur_telephone') String? chauffeurTelephone,
    @JsonKey(name: 'chauffeur_note', fromJson: _parseDoubleNullable)
    double? chauffeurNote,
    @JsonKey(name: 'vehicule_marque') String? vehiculeMarque,
    @JsonKey(name: 'vehicule_modele') String? vehiculeModele,
    @JsonKey(name: 'vehicule_couleur') String? vehiculeCouleur,
    @JsonKey(name: 'vehicule_immatriculation') String? vehiculeImmatriculation,
  });
}

/// @nodoc
class __$$CourseImplCopyWithImpl<$Res>
    extends _$CourseCopyWithImpl<$Res, _$CourseImpl>
    implements _$$CourseImplCopyWith<$Res> {
  __$$CourseImplCopyWithImpl(
    _$CourseImpl _value,
    $Res Function(_$CourseImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of Course
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? idTrajet = null,
    Object? idChauffeur = freezed,
    Object? adresseDepart = null,
    Object? adresseArrivee = null,
    Object? distanceKm = freezed,
    Object? dureeEstimeeMin = freezed,
    Object? dateHeureDebut = freezed,
    Object? dateHeureFin = freezed,
    Object? statut = null,
    Object? typeTrajet = null,
    Object? tarifFinal = freezed,
    Object? coordonneesDepart = freezed,
    Object? coordonneesArrivee = freezed,
    Object? polylineTrajet = freezed,
    Object? confirmationChauffeur = null,
    Object? confirmationPassager = null,
    Object? identiteConfirmee = null,
    Object? motifAnnulation = freezed,
    Object? chauffeurNom = freezed,
    Object? chauffeurPhoto = freezed,
    Object? chauffeurTelephone = freezed,
    Object? chauffeurNote = freezed,
    Object? vehiculeMarque = freezed,
    Object? vehiculeModele = freezed,
    Object? vehiculeCouleur = freezed,
    Object? vehiculeImmatriculation = freezed,
  }) {
    return _then(
      _$CourseImpl(
        idTrajet: null == idTrajet
            ? _value.idTrajet
            : idTrajet // ignore: cast_nullable_to_non_nullable
                  as String,
        idChauffeur: freezed == idChauffeur
            ? _value.idChauffeur
            : idChauffeur // ignore: cast_nullable_to_non_nullable
                  as String?,
        adresseDepart: null == adresseDepart
            ? _value.adresseDepart
            : adresseDepart // ignore: cast_nullable_to_non_nullable
                  as String,
        adresseArrivee: null == adresseArrivee
            ? _value.adresseArrivee
            : adresseArrivee // ignore: cast_nullable_to_non_nullable
                  as String,
        distanceKm: freezed == distanceKm
            ? _value.distanceKm
            : distanceKm // ignore: cast_nullable_to_non_nullable
                  as double?,
        dureeEstimeeMin: freezed == dureeEstimeeMin
            ? _value.dureeEstimeeMin
            : dureeEstimeeMin // ignore: cast_nullable_to_non_nullable
                  as int?,
        dateHeureDebut: freezed == dateHeureDebut
            ? _value.dateHeureDebut
            : dateHeureDebut // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
        dateHeureFin: freezed == dateHeureFin
            ? _value.dateHeureFin
            : dateHeureFin // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
        statut: null == statut
            ? _value.statut
            : statut // ignore: cast_nullable_to_non_nullable
                  as String,
        typeTrajet: null == typeTrajet
            ? _value.typeTrajet
            : typeTrajet // ignore: cast_nullable_to_non_nullable
                  as String,
        tarifFinal: freezed == tarifFinal
            ? _value.tarifFinal
            : tarifFinal // ignore: cast_nullable_to_non_nullable
                  as double?,
        coordonneesDepart: freezed == coordonneesDepart
            ? _value._coordonneesDepart
            : coordonneesDepart // ignore: cast_nullable_to_non_nullable
                  as Map<String, dynamic>?,
        coordonneesArrivee: freezed == coordonneesArrivee
            ? _value._coordonneesArrivee
            : coordonneesArrivee // ignore: cast_nullable_to_non_nullable
                  as Map<String, dynamic>?,
        polylineTrajet: freezed == polylineTrajet
            ? _value.polylineTrajet
            : polylineTrajet // ignore: cast_nullable_to_non_nullable
                  as String?,
        confirmationChauffeur: null == confirmationChauffeur
            ? _value.confirmationChauffeur
            : confirmationChauffeur // ignore: cast_nullable_to_non_nullable
                  as bool,
        confirmationPassager: null == confirmationPassager
            ? _value.confirmationPassager
            : confirmationPassager // ignore: cast_nullable_to_non_nullable
                  as bool,
        identiteConfirmee: null == identiteConfirmee
            ? _value.identiteConfirmee
            : identiteConfirmee // ignore: cast_nullable_to_non_nullable
                  as bool,
        motifAnnulation: freezed == motifAnnulation
            ? _value.motifAnnulation
            : motifAnnulation // ignore: cast_nullable_to_non_nullable
                  as String?,
        chauffeurNom: freezed == chauffeurNom
            ? _value.chauffeurNom
            : chauffeurNom // ignore: cast_nullable_to_non_nullable
                  as String?,
        chauffeurPhoto: freezed == chauffeurPhoto
            ? _value.chauffeurPhoto
            : chauffeurPhoto // ignore: cast_nullable_to_non_nullable
                  as String?,
        chauffeurTelephone: freezed == chauffeurTelephone
            ? _value.chauffeurTelephone
            : chauffeurTelephone // ignore: cast_nullable_to_non_nullable
                  as String?,
        chauffeurNote: freezed == chauffeurNote
            ? _value.chauffeurNote
            : chauffeurNote // ignore: cast_nullable_to_non_nullable
                  as double?,
        vehiculeMarque: freezed == vehiculeMarque
            ? _value.vehiculeMarque
            : vehiculeMarque // ignore: cast_nullable_to_non_nullable
                  as String?,
        vehiculeModele: freezed == vehiculeModele
            ? _value.vehiculeModele
            : vehiculeModele // ignore: cast_nullable_to_non_nullable
                  as String?,
        vehiculeCouleur: freezed == vehiculeCouleur
            ? _value.vehiculeCouleur
            : vehiculeCouleur // ignore: cast_nullable_to_non_nullable
                  as String?,
        vehiculeImmatriculation: freezed == vehiculeImmatriculation
            ? _value.vehiculeImmatriculation
            : vehiculeImmatriculation // ignore: cast_nullable_to_non_nullable
                  as String?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$CourseImpl implements _Course {
  const _$CourseImpl({
    @JsonKey(name: 'id_trajet') required this.idTrajet,
    @JsonKey(name: 'id_chauffeur') this.idChauffeur,
    @JsonKey(name: 'adresse_depart') required this.adresseDepart,
    @JsonKey(name: 'adresse_arrivee') required this.adresseArrivee,
    @JsonKey(name: 'distance_km', fromJson: _parseDoubleNullable)
    this.distanceKm,
    @JsonKey(name: 'duree_estimee_min') this.dureeEstimeeMin,
    @JsonKey(name: 'date_heure_debut') this.dateHeureDebut,
    @JsonKey(name: 'date_heure_fin') this.dateHeureFin,
    this.statut = 'en_attente',
    @JsonKey(name: 'type_trajet') this.typeTrajet = 'vtc',
    @JsonKey(name: 'tarif_final', fromJson: _parseDoubleNullable)
    this.tarifFinal,
    @JsonKey(name: 'coordonnees_depart')
    final Map<String, dynamic>? coordonneesDepart,
    @JsonKey(name: 'coordonnees_arrivee')
    final Map<String, dynamic>? coordonneesArrivee,
    @JsonKey(name: 'polyline_trajet') this.polylineTrajet,
    @JsonKey(name: 'confirmation_chauffeur') this.confirmationChauffeur = false,
    @JsonKey(name: 'confirmation_passager') this.confirmationPassager = false,
    @JsonKey(name: 'identite_confirmee') this.identiteConfirmee = false,
    @JsonKey(name: 'motif_annulation') this.motifAnnulation,
    @JsonKey(name: 'chauffeur_nom') this.chauffeurNom,
    @JsonKey(name: 'chauffeur_photo') this.chauffeurPhoto,
    @JsonKey(name: 'chauffeur_telephone') this.chauffeurTelephone,
    @JsonKey(name: 'chauffeur_note', fromJson: _parseDoubleNullable)
    this.chauffeurNote,
    @JsonKey(name: 'vehicule_marque') this.vehiculeMarque,
    @JsonKey(name: 'vehicule_modele') this.vehiculeModele,
    @JsonKey(name: 'vehicule_couleur') this.vehiculeCouleur,
    @JsonKey(name: 'vehicule_immatriculation') this.vehiculeImmatriculation,
  }) : _coordonneesDepart = coordonneesDepart,
       _coordonneesArrivee = coordonneesArrivee;

  factory _$CourseImpl.fromJson(Map<String, dynamic> json) =>
      _$$CourseImplFromJson(json);

  @override
  @JsonKey(name: 'id_trajet')
  final String idTrajet;
  @override
  @JsonKey(name: 'id_chauffeur')
  final String? idChauffeur;
  @override
  @JsonKey(name: 'adresse_depart')
  final String adresseDepart;
  @override
  @JsonKey(name: 'adresse_arrivee')
  final String adresseArrivee;
  @override
  @JsonKey(name: 'distance_km', fromJson: _parseDoubleNullable)
  final double? distanceKm;
  @override
  @JsonKey(name: 'duree_estimee_min')
  final int? dureeEstimeeMin;
  @override
  @JsonKey(name: 'date_heure_debut')
  final DateTime? dateHeureDebut;
  @override
  @JsonKey(name: 'date_heure_fin')
  final DateTime? dateHeureFin;
  @override
  @JsonKey()
  final String statut;
  @override
  @JsonKey(name: 'type_trajet')
  final String typeTrajet;
  @override
  @JsonKey(name: 'tarif_final', fromJson: _parseDoubleNullable)
  final double? tarifFinal;
  final Map<String, dynamic>? _coordonneesDepart;
  @override
  @JsonKey(name: 'coordonnees_depart')
  Map<String, dynamic>? get coordonneesDepart {
    final value = _coordonneesDepart;
    if (value == null) return null;
    if (_coordonneesDepart is EqualUnmodifiableMapView)
      return _coordonneesDepart;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  final Map<String, dynamic>? _coordonneesArrivee;
  @override
  @JsonKey(name: 'coordonnees_arrivee')
  Map<String, dynamic>? get coordonneesArrivee {
    final value = _coordonneesArrivee;
    if (value == null) return null;
    if (_coordonneesArrivee is EqualUnmodifiableMapView)
      return _coordonneesArrivee;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  @override
  @JsonKey(name: 'polyline_trajet')
  final String? polylineTrajet;
  @override
  @JsonKey(name: 'confirmation_chauffeur')
  final bool confirmationChauffeur;
  @override
  @JsonKey(name: 'confirmation_passager')
  final bool confirmationPassager;
  @override
  @JsonKey(name: 'identite_confirmee')
  final bool identiteConfirmee;
  @override
  @JsonKey(name: 'motif_annulation')
  final String? motifAnnulation;
  @override
  @JsonKey(name: 'chauffeur_nom')
  final String? chauffeurNom;
  @override
  @JsonKey(name: 'chauffeur_photo')
  final String? chauffeurPhoto;
  @override
  @JsonKey(name: 'chauffeur_telephone')
  final String? chauffeurTelephone;
  @override
  @JsonKey(name: 'chauffeur_note', fromJson: _parseDoubleNullable)
  final double? chauffeurNote;
  @override
  @JsonKey(name: 'vehicule_marque')
  final String? vehiculeMarque;
  @override
  @JsonKey(name: 'vehicule_modele')
  final String? vehiculeModele;
  @override
  @JsonKey(name: 'vehicule_couleur')
  final String? vehiculeCouleur;
  @override
  @JsonKey(name: 'vehicule_immatriculation')
  final String? vehiculeImmatriculation;

  @override
  String toString() {
    return 'Course(idTrajet: $idTrajet, idChauffeur: $idChauffeur, adresseDepart: $adresseDepart, adresseArrivee: $adresseArrivee, distanceKm: $distanceKm, dureeEstimeeMin: $dureeEstimeeMin, dateHeureDebut: $dateHeureDebut, dateHeureFin: $dateHeureFin, statut: $statut, typeTrajet: $typeTrajet, tarifFinal: $tarifFinal, coordonneesDepart: $coordonneesDepart, coordonneesArrivee: $coordonneesArrivee, polylineTrajet: $polylineTrajet, confirmationChauffeur: $confirmationChauffeur, confirmationPassager: $confirmationPassager, identiteConfirmee: $identiteConfirmee, motifAnnulation: $motifAnnulation, chauffeurNom: $chauffeurNom, chauffeurPhoto: $chauffeurPhoto, chauffeurTelephone: $chauffeurTelephone, chauffeurNote: $chauffeurNote, vehiculeMarque: $vehiculeMarque, vehiculeModele: $vehiculeModele, vehiculeCouleur: $vehiculeCouleur, vehiculeImmatriculation: $vehiculeImmatriculation)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CourseImpl &&
            (identical(other.idTrajet, idTrajet) ||
                other.idTrajet == idTrajet) &&
            (identical(other.idChauffeur, idChauffeur) ||
                other.idChauffeur == idChauffeur) &&
            (identical(other.adresseDepart, adresseDepart) ||
                other.adresseDepart == adresseDepart) &&
            (identical(other.adresseArrivee, adresseArrivee) ||
                other.adresseArrivee == adresseArrivee) &&
            (identical(other.distanceKm, distanceKm) ||
                other.distanceKm == distanceKm) &&
            (identical(other.dureeEstimeeMin, dureeEstimeeMin) ||
                other.dureeEstimeeMin == dureeEstimeeMin) &&
            (identical(other.dateHeureDebut, dateHeureDebut) ||
                other.dateHeureDebut == dateHeureDebut) &&
            (identical(other.dateHeureFin, dateHeureFin) ||
                other.dateHeureFin == dateHeureFin) &&
            (identical(other.statut, statut) || other.statut == statut) &&
            (identical(other.typeTrajet, typeTrajet) ||
                other.typeTrajet == typeTrajet) &&
            (identical(other.tarifFinal, tarifFinal) ||
                other.tarifFinal == tarifFinal) &&
            const DeepCollectionEquality().equals(
              other._coordonneesDepart,
              _coordonneesDepart,
            ) &&
            const DeepCollectionEquality().equals(
              other._coordonneesArrivee,
              _coordonneesArrivee,
            ) &&
            (identical(other.polylineTrajet, polylineTrajet) ||
                other.polylineTrajet == polylineTrajet) &&
            (identical(other.confirmationChauffeur, confirmationChauffeur) ||
                other.confirmationChauffeur == confirmationChauffeur) &&
            (identical(other.confirmationPassager, confirmationPassager) ||
                other.confirmationPassager == confirmationPassager) &&
            (identical(other.identiteConfirmee, identiteConfirmee) ||
                other.identiteConfirmee == identiteConfirmee) &&
            (identical(other.motifAnnulation, motifAnnulation) ||
                other.motifAnnulation == motifAnnulation) &&
            (identical(other.chauffeurNom, chauffeurNom) ||
                other.chauffeurNom == chauffeurNom) &&
            (identical(other.chauffeurPhoto, chauffeurPhoto) ||
                other.chauffeurPhoto == chauffeurPhoto) &&
            (identical(other.chauffeurTelephone, chauffeurTelephone) ||
                other.chauffeurTelephone == chauffeurTelephone) &&
            (identical(other.chauffeurNote, chauffeurNote) ||
                other.chauffeurNote == chauffeurNote) &&
            (identical(other.vehiculeMarque, vehiculeMarque) ||
                other.vehiculeMarque == vehiculeMarque) &&
            (identical(other.vehiculeModele, vehiculeModele) ||
                other.vehiculeModele == vehiculeModele) &&
            (identical(other.vehiculeCouleur, vehiculeCouleur) ||
                other.vehiculeCouleur == vehiculeCouleur) &&
            (identical(
                  other.vehiculeImmatriculation,
                  vehiculeImmatriculation,
                ) ||
                other.vehiculeImmatriculation == vehiculeImmatriculation));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hashAll([
    runtimeType,
    idTrajet,
    idChauffeur,
    adresseDepart,
    adresseArrivee,
    distanceKm,
    dureeEstimeeMin,
    dateHeureDebut,
    dateHeureFin,
    statut,
    typeTrajet,
    tarifFinal,
    const DeepCollectionEquality().hash(_coordonneesDepart),
    const DeepCollectionEquality().hash(_coordonneesArrivee),
    polylineTrajet,
    confirmationChauffeur,
    confirmationPassager,
    identiteConfirmee,
    motifAnnulation,
    chauffeurNom,
    chauffeurPhoto,
    chauffeurTelephone,
    chauffeurNote,
    vehiculeMarque,
    vehiculeModele,
    vehiculeCouleur,
    vehiculeImmatriculation,
  ]);

  /// Create a copy of Course
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CourseImplCopyWith<_$CourseImpl> get copyWith =>
      __$$CourseImplCopyWithImpl<_$CourseImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CourseImplToJson(this);
  }
}

abstract class _Course implements Course {
  const factory _Course({
    @JsonKey(name: 'id_trajet') required final String idTrajet,
    @JsonKey(name: 'id_chauffeur') final String? idChauffeur,
    @JsonKey(name: 'adresse_depart') required final String adresseDepart,
    @JsonKey(name: 'adresse_arrivee') required final String adresseArrivee,
    @JsonKey(name: 'distance_km', fromJson: _parseDoubleNullable)
    final double? distanceKm,
    @JsonKey(name: 'duree_estimee_min') final int? dureeEstimeeMin,
    @JsonKey(name: 'date_heure_debut') final DateTime? dateHeureDebut,
    @JsonKey(name: 'date_heure_fin') final DateTime? dateHeureFin,
    final String statut,
    @JsonKey(name: 'type_trajet') final String typeTrajet,
    @JsonKey(name: 'tarif_final', fromJson: _parseDoubleNullable)
    final double? tarifFinal,
    @JsonKey(name: 'coordonnees_depart')
    final Map<String, dynamic>? coordonneesDepart,
    @JsonKey(name: 'coordonnees_arrivee')
    final Map<String, dynamic>? coordonneesArrivee,
    @JsonKey(name: 'polyline_trajet') final String? polylineTrajet,
    @JsonKey(name: 'confirmation_chauffeur') final bool confirmationChauffeur,
    @JsonKey(name: 'confirmation_passager') final bool confirmationPassager,
    @JsonKey(name: 'identite_confirmee') final bool identiteConfirmee,
    @JsonKey(name: 'motif_annulation') final String? motifAnnulation,
    @JsonKey(name: 'chauffeur_nom') final String? chauffeurNom,
    @JsonKey(name: 'chauffeur_photo') final String? chauffeurPhoto,
    @JsonKey(name: 'chauffeur_telephone') final String? chauffeurTelephone,
    @JsonKey(name: 'chauffeur_note', fromJson: _parseDoubleNullable)
    final double? chauffeurNote,
    @JsonKey(name: 'vehicule_marque') final String? vehiculeMarque,
    @JsonKey(name: 'vehicule_modele') final String? vehiculeModele,
    @JsonKey(name: 'vehicule_couleur') final String? vehiculeCouleur,
    @JsonKey(name: 'vehicule_immatriculation')
    final String? vehiculeImmatriculation,
  }) = _$CourseImpl;

  factory _Course.fromJson(Map<String, dynamic> json) = _$CourseImpl.fromJson;

  @override
  @JsonKey(name: 'id_trajet')
  String get idTrajet;
  @override
  @JsonKey(name: 'id_chauffeur')
  String? get idChauffeur;
  @override
  @JsonKey(name: 'adresse_depart')
  String get adresseDepart;
  @override
  @JsonKey(name: 'adresse_arrivee')
  String get adresseArrivee;
  @override
  @JsonKey(name: 'distance_km', fromJson: _parseDoubleNullable)
  double? get distanceKm;
  @override
  @JsonKey(name: 'duree_estimee_min')
  int? get dureeEstimeeMin;
  @override
  @JsonKey(name: 'date_heure_debut')
  DateTime? get dateHeureDebut;
  @override
  @JsonKey(name: 'date_heure_fin')
  DateTime? get dateHeureFin;
  @override
  String get statut;
  @override
  @JsonKey(name: 'type_trajet')
  String get typeTrajet;
  @override
  @JsonKey(name: 'tarif_final', fromJson: _parseDoubleNullable)
  double? get tarifFinal;
  @override
  @JsonKey(name: 'coordonnees_depart')
  Map<String, dynamic>? get coordonneesDepart;
  @override
  @JsonKey(name: 'coordonnees_arrivee')
  Map<String, dynamic>? get coordonneesArrivee;
  @override
  @JsonKey(name: 'polyline_trajet')
  String? get polylineTrajet;
  @override
  @JsonKey(name: 'confirmation_chauffeur')
  bool get confirmationChauffeur;
  @override
  @JsonKey(name: 'confirmation_passager')
  bool get confirmationPassager;
  @override
  @JsonKey(name: 'identite_confirmee')
  bool get identiteConfirmee;
  @override
  @JsonKey(name: 'motif_annulation')
  String? get motifAnnulation;
  @override
  @JsonKey(name: 'chauffeur_nom')
  String? get chauffeurNom;
  @override
  @JsonKey(name: 'chauffeur_photo')
  String? get chauffeurPhoto;
  @override
  @JsonKey(name: 'chauffeur_telephone')
  String? get chauffeurTelephone;
  @override
  @JsonKey(name: 'chauffeur_note', fromJson: _parseDoubleNullable)
  double? get chauffeurNote;
  @override
  @JsonKey(name: 'vehicule_marque')
  String? get vehiculeMarque;
  @override
  @JsonKey(name: 'vehicule_modele')
  String? get vehiculeModele;
  @override
  @JsonKey(name: 'vehicule_couleur')
  String? get vehiculeCouleur;
  @override
  @JsonKey(name: 'vehicule_immatriculation')
  String? get vehiculeImmatriculation;

  /// Create a copy of Course
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CourseImplCopyWith<_$CourseImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

CategorieVehicule _$CategorieVehiculeFromJson(Map<String, dynamic> json) {
  return _CategorieVehicule.fromJson(json);
}

/// @nodoc
mixin _$CategorieVehicule {
  @JsonKey(name: 'id_categorie')
  String get idCategorie => throw _privateConstructorUsedError;
  String get nom => throw _privateConstructorUsedError;
  String? get description => throw _privateConstructorUsedError;
  bool get actif => throw _privateConstructorUsedError;

  /// Serializes this CategorieVehicule to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of CategorieVehicule
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $CategorieVehiculeCopyWith<CategorieVehicule> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CategorieVehiculeCopyWith<$Res> {
  factory $CategorieVehiculeCopyWith(
    CategorieVehicule value,
    $Res Function(CategorieVehicule) then,
  ) = _$CategorieVehiculeCopyWithImpl<$Res, CategorieVehicule>;
  @useResult
  $Res call({
    @JsonKey(name: 'id_categorie') String idCategorie,
    String nom,
    String? description,
    bool actif,
  });
}

/// @nodoc
class _$CategorieVehiculeCopyWithImpl<$Res, $Val extends CategorieVehicule>
    implements $CategorieVehiculeCopyWith<$Res> {
  _$CategorieVehiculeCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of CategorieVehicule
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? idCategorie = null,
    Object? nom = null,
    Object? description = freezed,
    Object? actif = null,
  }) {
    return _then(
      _value.copyWith(
            idCategorie: null == idCategorie
                ? _value.idCategorie
                : idCategorie // ignore: cast_nullable_to_non_nullable
                      as String,
            nom: null == nom
                ? _value.nom
                : nom // ignore: cast_nullable_to_non_nullable
                      as String,
            description: freezed == description
                ? _value.description
                : description // ignore: cast_nullable_to_non_nullable
                      as String?,
            actif: null == actif
                ? _value.actif
                : actif // ignore: cast_nullable_to_non_nullable
                      as bool,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$CategorieVehiculeImplCopyWith<$Res>
    implements $CategorieVehiculeCopyWith<$Res> {
  factory _$$CategorieVehiculeImplCopyWith(
    _$CategorieVehiculeImpl value,
    $Res Function(_$CategorieVehiculeImpl) then,
  ) = __$$CategorieVehiculeImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    @JsonKey(name: 'id_categorie') String idCategorie,
    String nom,
    String? description,
    bool actif,
  });
}

/// @nodoc
class __$$CategorieVehiculeImplCopyWithImpl<$Res>
    extends _$CategorieVehiculeCopyWithImpl<$Res, _$CategorieVehiculeImpl>
    implements _$$CategorieVehiculeImplCopyWith<$Res> {
  __$$CategorieVehiculeImplCopyWithImpl(
    _$CategorieVehiculeImpl _value,
    $Res Function(_$CategorieVehiculeImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of CategorieVehicule
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? idCategorie = null,
    Object? nom = null,
    Object? description = freezed,
    Object? actif = null,
  }) {
    return _then(
      _$CategorieVehiculeImpl(
        idCategorie: null == idCategorie
            ? _value.idCategorie
            : idCategorie // ignore: cast_nullable_to_non_nullable
                  as String,
        nom: null == nom
            ? _value.nom
            : nom // ignore: cast_nullable_to_non_nullable
                  as String,
        description: freezed == description
            ? _value.description
            : description // ignore: cast_nullable_to_non_nullable
                  as String?,
        actif: null == actif
            ? _value.actif
            : actif // ignore: cast_nullable_to_non_nullable
                  as bool,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$CategorieVehiculeImpl implements _CategorieVehicule {
  const _$CategorieVehiculeImpl({
    @JsonKey(name: 'id_categorie') required this.idCategorie,
    required this.nom,
    this.description,
    this.actif = true,
  });

  factory _$CategorieVehiculeImpl.fromJson(Map<String, dynamic> json) =>
      _$$CategorieVehiculeImplFromJson(json);

  @override
  @JsonKey(name: 'id_categorie')
  final String idCategorie;
  @override
  final String nom;
  @override
  final String? description;
  @override
  @JsonKey()
  final bool actif;

  @override
  String toString() {
    return 'CategorieVehicule(idCategorie: $idCategorie, nom: $nom, description: $description, actif: $actif)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CategorieVehiculeImpl &&
            (identical(other.idCategorie, idCategorie) ||
                other.idCategorie == idCategorie) &&
            (identical(other.nom, nom) || other.nom == nom) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.actif, actif) || other.actif == actif));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, idCategorie, nom, description, actif);

  /// Create a copy of CategorieVehicule
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CategorieVehiculeImplCopyWith<_$CategorieVehiculeImpl> get copyWith =>
      __$$CategorieVehiculeImplCopyWithImpl<_$CategorieVehiculeImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$CategorieVehiculeImplToJson(this);
  }
}

abstract class _CategorieVehicule implements CategorieVehicule {
  const factory _CategorieVehicule({
    @JsonKey(name: 'id_categorie') required final String idCategorie,
    required final String nom,
    final String? description,
    final bool actif,
  }) = _$CategorieVehiculeImpl;

  factory _CategorieVehicule.fromJson(Map<String, dynamic> json) =
      _$CategorieVehiculeImpl.fromJson;

  @override
  @JsonKey(name: 'id_categorie')
  String get idCategorie;
  @override
  String get nom;
  @override
  String? get description;
  @override
  bool get actif;

  /// Create a copy of CategorieVehicule
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CategorieVehiculeImplCopyWith<_$CategorieVehiculeImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
