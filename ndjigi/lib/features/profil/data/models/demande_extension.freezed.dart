// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'demande_extension.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

DemandeExtension _$DemandeExtensionFromJson(Map<String, dynamic> json) {
  return _DemandeExtension.fromJson(json);
}

/// @nodoc
mixin _$DemandeExtension {
  @JsonKey(name: 'id_demande_extension')
  String get idDemandeExtension => throw _privateConstructorUsedError;
  @JsonKey(name: 'id_utilisateur')
  String get idUtilisateur => throw _privateConstructorUsedError;
  @JsonKey(name: 'extension_type')
  String get extensionType => throw _privateConstructorUsedError;
  String get statut => throw _privateConstructorUsedError;
  @JsonKey(name: 'createdAt')
  DateTime? get createdAt => throw _privateConstructorUsedError;
  @JsonKey(name: 'updatedAt')
  DateTime? get updatedAt => throw _privateConstructorUsedError;
  @JsonKey(name: 'motif_rejet')
  String? get motifRejet => throw _privateConstructorUsedError;
  List<DocumentRef> get documents => throw _privateConstructorUsedError;

  /// Serializes this DemandeExtension to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of DemandeExtension
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $DemandeExtensionCopyWith<DemandeExtension> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $DemandeExtensionCopyWith<$Res> {
  factory $DemandeExtensionCopyWith(
    DemandeExtension value,
    $Res Function(DemandeExtension) then,
  ) = _$DemandeExtensionCopyWithImpl<$Res, DemandeExtension>;
  @useResult
  $Res call({
    @JsonKey(name: 'id_demande_extension') String idDemandeExtension,
    @JsonKey(name: 'id_utilisateur') String idUtilisateur,
    @JsonKey(name: 'extension_type') String extensionType,
    String statut,
    @JsonKey(name: 'createdAt') DateTime? createdAt,
    @JsonKey(name: 'updatedAt') DateTime? updatedAt,
    @JsonKey(name: 'motif_rejet') String? motifRejet,
    List<DocumentRef> documents,
  });
}

/// @nodoc
class _$DemandeExtensionCopyWithImpl<$Res, $Val extends DemandeExtension>
    implements $DemandeExtensionCopyWith<$Res> {
  _$DemandeExtensionCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of DemandeExtension
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? idDemandeExtension = null,
    Object? idUtilisateur = null,
    Object? extensionType = null,
    Object? statut = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
    Object? motifRejet = freezed,
    Object? documents = null,
  }) {
    return _then(
      _value.copyWith(
            idDemandeExtension: null == idDemandeExtension
                ? _value.idDemandeExtension
                : idDemandeExtension // ignore: cast_nullable_to_non_nullable
                      as String,
            idUtilisateur: null == idUtilisateur
                ? _value.idUtilisateur
                : idUtilisateur // ignore: cast_nullable_to_non_nullable
                      as String,
            extensionType: null == extensionType
                ? _value.extensionType
                : extensionType // ignore: cast_nullable_to_non_nullable
                      as String,
            statut: null == statut
                ? _value.statut
                : statut // ignore: cast_nullable_to_non_nullable
                      as String,
            createdAt: freezed == createdAt
                ? _value.createdAt
                : createdAt // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
            updatedAt: freezed == updatedAt
                ? _value.updatedAt
                : updatedAt // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
            motifRejet: freezed == motifRejet
                ? _value.motifRejet
                : motifRejet // ignore: cast_nullable_to_non_nullable
                      as String?,
            documents: null == documents
                ? _value.documents
                : documents // ignore: cast_nullable_to_non_nullable
                      as List<DocumentRef>,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$DemandeExtensionImplCopyWith<$Res>
    implements $DemandeExtensionCopyWith<$Res> {
  factory _$$DemandeExtensionImplCopyWith(
    _$DemandeExtensionImpl value,
    $Res Function(_$DemandeExtensionImpl) then,
  ) = __$$DemandeExtensionImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    @JsonKey(name: 'id_demande_extension') String idDemandeExtension,
    @JsonKey(name: 'id_utilisateur') String idUtilisateur,
    @JsonKey(name: 'extension_type') String extensionType,
    String statut,
    @JsonKey(name: 'createdAt') DateTime? createdAt,
    @JsonKey(name: 'updatedAt') DateTime? updatedAt,
    @JsonKey(name: 'motif_rejet') String? motifRejet,
    List<DocumentRef> documents,
  });
}

/// @nodoc
class __$$DemandeExtensionImplCopyWithImpl<$Res>
    extends _$DemandeExtensionCopyWithImpl<$Res, _$DemandeExtensionImpl>
    implements _$$DemandeExtensionImplCopyWith<$Res> {
  __$$DemandeExtensionImplCopyWithImpl(
    _$DemandeExtensionImpl _value,
    $Res Function(_$DemandeExtensionImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of DemandeExtension
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? idDemandeExtension = null,
    Object? idUtilisateur = null,
    Object? extensionType = null,
    Object? statut = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
    Object? motifRejet = freezed,
    Object? documents = null,
  }) {
    return _then(
      _$DemandeExtensionImpl(
        idDemandeExtension: null == idDemandeExtension
            ? _value.idDemandeExtension
            : idDemandeExtension // ignore: cast_nullable_to_non_nullable
                  as String,
        idUtilisateur: null == idUtilisateur
            ? _value.idUtilisateur
            : idUtilisateur // ignore: cast_nullable_to_non_nullable
                  as String,
        extensionType: null == extensionType
            ? _value.extensionType
            : extensionType // ignore: cast_nullable_to_non_nullable
                  as String,
        statut: null == statut
            ? _value.statut
            : statut // ignore: cast_nullable_to_non_nullable
                  as String,
        createdAt: freezed == createdAt
            ? _value.createdAt
            : createdAt // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
        updatedAt: freezed == updatedAt
            ? _value.updatedAt
            : updatedAt // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
        motifRejet: freezed == motifRejet
            ? _value.motifRejet
            : motifRejet // ignore: cast_nullable_to_non_nullable
                  as String?,
        documents: null == documents
            ? _value._documents
            : documents // ignore: cast_nullable_to_non_nullable
                  as List<DocumentRef>,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$DemandeExtensionImpl implements _DemandeExtension {
  const _$DemandeExtensionImpl({
    @JsonKey(name: 'id_demande_extension') required this.idDemandeExtension,
    @JsonKey(name: 'id_utilisateur') required this.idUtilisateur,
    @JsonKey(name: 'extension_type') required this.extensionType,
    this.statut = 'en_attente',
    @JsonKey(name: 'createdAt') this.createdAt,
    @JsonKey(name: 'updatedAt') this.updatedAt,
    @JsonKey(name: 'motif_rejet') this.motifRejet,
    final List<DocumentRef> documents = const [],
  }) : _documents = documents;

  factory _$DemandeExtensionImpl.fromJson(Map<String, dynamic> json) =>
      _$$DemandeExtensionImplFromJson(json);

  @override
  @JsonKey(name: 'id_demande_extension')
  final String idDemandeExtension;
  @override
  @JsonKey(name: 'id_utilisateur')
  final String idUtilisateur;
  @override
  @JsonKey(name: 'extension_type')
  final String extensionType;
  @override
  @JsonKey()
  final String statut;
  @override
  @JsonKey(name: 'createdAt')
  final DateTime? createdAt;
  @override
  @JsonKey(name: 'updatedAt')
  final DateTime? updatedAt;
  @override
  @JsonKey(name: 'motif_rejet')
  final String? motifRejet;
  final List<DocumentRef> _documents;
  @override
  @JsonKey()
  List<DocumentRef> get documents {
    if (_documents is EqualUnmodifiableListView) return _documents;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_documents);
  }

  @override
  String toString() {
    return 'DemandeExtension(idDemandeExtension: $idDemandeExtension, idUtilisateur: $idUtilisateur, extensionType: $extensionType, statut: $statut, createdAt: $createdAt, updatedAt: $updatedAt, motifRejet: $motifRejet, documents: $documents)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$DemandeExtensionImpl &&
            (identical(other.idDemandeExtension, idDemandeExtension) ||
                other.idDemandeExtension == idDemandeExtension) &&
            (identical(other.idUtilisateur, idUtilisateur) ||
                other.idUtilisateur == idUtilisateur) &&
            (identical(other.extensionType, extensionType) ||
                other.extensionType == extensionType) &&
            (identical(other.statut, statut) || other.statut == statut) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt) &&
            (identical(other.motifRejet, motifRejet) ||
                other.motifRejet == motifRejet) &&
            const DeepCollectionEquality().equals(
              other._documents,
              _documents,
            ));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    idDemandeExtension,
    idUtilisateur,
    extensionType,
    statut,
    createdAt,
    updatedAt,
    motifRejet,
    const DeepCollectionEquality().hash(_documents),
  );

  /// Create a copy of DemandeExtension
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$DemandeExtensionImplCopyWith<_$DemandeExtensionImpl> get copyWith =>
      __$$DemandeExtensionImplCopyWithImpl<_$DemandeExtensionImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$DemandeExtensionImplToJson(this);
  }
}

abstract class _DemandeExtension implements DemandeExtension {
  const factory _DemandeExtension({
    @JsonKey(name: 'id_demande_extension')
    required final String idDemandeExtension,
    @JsonKey(name: 'id_utilisateur') required final String idUtilisateur,
    @JsonKey(name: 'extension_type') required final String extensionType,
    final String statut,
    @JsonKey(name: 'createdAt') final DateTime? createdAt,
    @JsonKey(name: 'updatedAt') final DateTime? updatedAt,
    @JsonKey(name: 'motif_rejet') final String? motifRejet,
    final List<DocumentRef> documents,
  }) = _$DemandeExtensionImpl;

  factory _DemandeExtension.fromJson(Map<String, dynamic> json) =
      _$DemandeExtensionImpl.fromJson;

  @override
  @JsonKey(name: 'id_demande_extension')
  String get idDemandeExtension;
  @override
  @JsonKey(name: 'id_utilisateur')
  String get idUtilisateur;
  @override
  @JsonKey(name: 'extension_type')
  String get extensionType;
  @override
  String get statut;
  @override
  @JsonKey(name: 'createdAt')
  DateTime? get createdAt;
  @override
  @JsonKey(name: 'updatedAt')
  DateTime? get updatedAt;
  @override
  @JsonKey(name: 'motif_rejet')
  String? get motifRejet;
  @override
  List<DocumentRef> get documents;

  /// Create a copy of DemandeExtension
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$DemandeExtensionImplCopyWith<_$DemandeExtensionImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

DocumentRef _$DocumentRefFromJson(Map<String, dynamic> json) {
  return _DocumentRef.fromJson(json);
}

/// @nodoc
mixin _$DocumentRef {
  @JsonKey(name: 'id_document')
  String get idDocument => throw _privateConstructorUsedError;
  String get type => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;

  /// Serializes this DocumentRef to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of DocumentRef
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $DocumentRefCopyWith<DocumentRef> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $DocumentRefCopyWith<$Res> {
  factory $DocumentRefCopyWith(
    DocumentRef value,
    $Res Function(DocumentRef) then,
  ) = _$DocumentRefCopyWithImpl<$Res, DocumentRef>;
  @useResult
  $Res call({
    @JsonKey(name: 'id_document') String idDocument,
    String type,
    String status,
  });
}

/// @nodoc
class _$DocumentRefCopyWithImpl<$Res, $Val extends DocumentRef>
    implements $DocumentRefCopyWith<$Res> {
  _$DocumentRefCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of DocumentRef
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? idDocument = null,
    Object? type = null,
    Object? status = null,
  }) {
    return _then(
      _value.copyWith(
            idDocument: null == idDocument
                ? _value.idDocument
                : idDocument // ignore: cast_nullable_to_non_nullable
                      as String,
            type: null == type
                ? _value.type
                : type // ignore: cast_nullable_to_non_nullable
                      as String,
            status: null == status
                ? _value.status
                : status // ignore: cast_nullable_to_non_nullable
                      as String,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$DocumentRefImplCopyWith<$Res>
    implements $DocumentRefCopyWith<$Res> {
  factory _$$DocumentRefImplCopyWith(
    _$DocumentRefImpl value,
    $Res Function(_$DocumentRefImpl) then,
  ) = __$$DocumentRefImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    @JsonKey(name: 'id_document') String idDocument,
    String type,
    String status,
  });
}

/// @nodoc
class __$$DocumentRefImplCopyWithImpl<$Res>
    extends _$DocumentRefCopyWithImpl<$Res, _$DocumentRefImpl>
    implements _$$DocumentRefImplCopyWith<$Res> {
  __$$DocumentRefImplCopyWithImpl(
    _$DocumentRefImpl _value,
    $Res Function(_$DocumentRefImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of DocumentRef
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? idDocument = null,
    Object? type = null,
    Object? status = null,
  }) {
    return _then(
      _$DocumentRefImpl(
        idDocument: null == idDocument
            ? _value.idDocument
            : idDocument // ignore: cast_nullable_to_non_nullable
                  as String,
        type: null == type
            ? _value.type
            : type // ignore: cast_nullable_to_non_nullable
                  as String,
        status: null == status
            ? _value.status
            : status // ignore: cast_nullable_to_non_nullable
                  as String,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$DocumentRefImpl implements _DocumentRef {
  const _$DocumentRefImpl({
    @JsonKey(name: 'id_document') required this.idDocument,
    required this.type,
    this.status = 'PENDING',
  });

  factory _$DocumentRefImpl.fromJson(Map<String, dynamic> json) =>
      _$$DocumentRefImplFromJson(json);

  @override
  @JsonKey(name: 'id_document')
  final String idDocument;
  @override
  final String type;
  @override
  @JsonKey()
  final String status;

  @override
  String toString() {
    return 'DocumentRef(idDocument: $idDocument, type: $type, status: $status)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$DocumentRefImpl &&
            (identical(other.idDocument, idDocument) ||
                other.idDocument == idDocument) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.status, status) || other.status == status));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, idDocument, type, status);

  /// Create a copy of DocumentRef
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$DocumentRefImplCopyWith<_$DocumentRefImpl> get copyWith =>
      __$$DocumentRefImplCopyWithImpl<_$DocumentRefImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$DocumentRefImplToJson(this);
  }
}

abstract class _DocumentRef implements DocumentRef {
  const factory _DocumentRef({
    @JsonKey(name: 'id_document') required final String idDocument,
    required final String type,
    final String status,
  }) = _$DocumentRefImpl;

  factory _DocumentRef.fromJson(Map<String, dynamic> json) =
      _$DocumentRefImpl.fromJson;

  @override
  @JsonKey(name: 'id_document')
  String get idDocument;
  @override
  String get type;
  @override
  String get status;

  /// Create a copy of DocumentRef
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$DocumentRefImplCopyWith<_$DocumentRefImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
