// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'faq.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

Faq _$FaqFromJson(Map<String, dynamic> json) {
  return _Faq.fromJson(json);
}

/// @nodoc
mixin _$Faq {
  @JsonKey(name: 'id_faq')
  String get idFaq => throw _privateConstructorUsedError;
  String get question => throw _privateConstructorUsedError;
  String get reponse => throw _privateConstructorUsedError;
  String? get categorie => throw _privateConstructorUsedError;
  int get ordre => throw _privateConstructorUsedError;
  bool get isActive => throw _privateConstructorUsedError;
  int get helpfulCount => throw _privateConstructorUsedError;
  int get notHelpfulCount => throw _privateConstructorUsedError;
  int get viewCount => throw _privateConstructorUsedError;
  @JsonKey(name: 'createdAt')
  DateTime? get createdAt => throw _privateConstructorUsedError;
  @JsonKey(name: 'updatedAt')
  DateTime? get updatedAt => throw _privateConstructorUsedError;

  /// Serializes this Faq to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Faq
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $FaqCopyWith<Faq> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $FaqCopyWith<$Res> {
  factory $FaqCopyWith(Faq value, $Res Function(Faq) then) =
      _$FaqCopyWithImpl<$Res, Faq>;
  @useResult
  $Res call({
    @JsonKey(name: 'id_faq') String idFaq,
    String question,
    String reponse,
    String? categorie,
    int ordre,
    bool isActive,
    int helpfulCount,
    int notHelpfulCount,
    int viewCount,
    @JsonKey(name: 'createdAt') DateTime? createdAt,
    @JsonKey(name: 'updatedAt') DateTime? updatedAt,
  });
}

/// @nodoc
class _$FaqCopyWithImpl<$Res, $Val extends Faq> implements $FaqCopyWith<$Res> {
  _$FaqCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Faq
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? idFaq = null,
    Object? question = null,
    Object? reponse = null,
    Object? categorie = freezed,
    Object? ordre = null,
    Object? isActive = null,
    Object? helpfulCount = null,
    Object? notHelpfulCount = null,
    Object? viewCount = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
  }) {
    return _then(
      _value.copyWith(
            idFaq: null == idFaq
                ? _value.idFaq
                : idFaq // ignore: cast_nullable_to_non_nullable
                      as String,
            question: null == question
                ? _value.question
                : question // ignore: cast_nullable_to_non_nullable
                      as String,
            reponse: null == reponse
                ? _value.reponse
                : reponse // ignore: cast_nullable_to_non_nullable
                      as String,
            categorie: freezed == categorie
                ? _value.categorie
                : categorie // ignore: cast_nullable_to_non_nullable
                      as String?,
            ordre: null == ordre
                ? _value.ordre
                : ordre // ignore: cast_nullable_to_non_nullable
                      as int,
            isActive: null == isActive
                ? _value.isActive
                : isActive // ignore: cast_nullable_to_non_nullable
                      as bool,
            helpfulCount: null == helpfulCount
                ? _value.helpfulCount
                : helpfulCount // ignore: cast_nullable_to_non_nullable
                      as int,
            notHelpfulCount: null == notHelpfulCount
                ? _value.notHelpfulCount
                : notHelpfulCount // ignore: cast_nullable_to_non_nullable
                      as int,
            viewCount: null == viewCount
                ? _value.viewCount
                : viewCount // ignore: cast_nullable_to_non_nullable
                      as int,
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
abstract class _$$FaqImplCopyWith<$Res> implements $FaqCopyWith<$Res> {
  factory _$$FaqImplCopyWith(_$FaqImpl value, $Res Function(_$FaqImpl) then) =
      __$$FaqImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    @JsonKey(name: 'id_faq') String idFaq,
    String question,
    String reponse,
    String? categorie,
    int ordre,
    bool isActive,
    int helpfulCount,
    int notHelpfulCount,
    int viewCount,
    @JsonKey(name: 'createdAt') DateTime? createdAt,
    @JsonKey(name: 'updatedAt') DateTime? updatedAt,
  });
}

/// @nodoc
class __$$FaqImplCopyWithImpl<$Res> extends _$FaqCopyWithImpl<$Res, _$FaqImpl>
    implements _$$FaqImplCopyWith<$Res> {
  __$$FaqImplCopyWithImpl(_$FaqImpl _value, $Res Function(_$FaqImpl) _then)
    : super(_value, _then);

  /// Create a copy of Faq
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? idFaq = null,
    Object? question = null,
    Object? reponse = null,
    Object? categorie = freezed,
    Object? ordre = null,
    Object? isActive = null,
    Object? helpfulCount = null,
    Object? notHelpfulCount = null,
    Object? viewCount = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
  }) {
    return _then(
      _$FaqImpl(
        idFaq: null == idFaq
            ? _value.idFaq
            : idFaq // ignore: cast_nullable_to_non_nullable
                  as String,
        question: null == question
            ? _value.question
            : question // ignore: cast_nullable_to_non_nullable
                  as String,
        reponse: null == reponse
            ? _value.reponse
            : reponse // ignore: cast_nullable_to_non_nullable
                  as String,
        categorie: freezed == categorie
            ? _value.categorie
            : categorie // ignore: cast_nullable_to_non_nullable
                  as String?,
        ordre: null == ordre
            ? _value.ordre
            : ordre // ignore: cast_nullable_to_non_nullable
                  as int,
        isActive: null == isActive
            ? _value.isActive
            : isActive // ignore: cast_nullable_to_non_nullable
                  as bool,
        helpfulCount: null == helpfulCount
            ? _value.helpfulCount
            : helpfulCount // ignore: cast_nullable_to_non_nullable
                  as int,
        notHelpfulCount: null == notHelpfulCount
            ? _value.notHelpfulCount
            : notHelpfulCount // ignore: cast_nullable_to_non_nullable
                  as int,
        viewCount: null == viewCount
            ? _value.viewCount
            : viewCount // ignore: cast_nullable_to_non_nullable
                  as int,
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
class _$FaqImpl implements _Faq {
  const _$FaqImpl({
    @JsonKey(name: 'id_faq') required this.idFaq,
    required this.question,
    required this.reponse,
    this.categorie,
    this.ordre = 0,
    this.isActive = true,
    this.helpfulCount = 0,
    this.notHelpfulCount = 0,
    this.viewCount = 0,
    @JsonKey(name: 'createdAt') this.createdAt,
    @JsonKey(name: 'updatedAt') this.updatedAt,
  });

  factory _$FaqImpl.fromJson(Map<String, dynamic> json) =>
      _$$FaqImplFromJson(json);

  @override
  @JsonKey(name: 'id_faq')
  final String idFaq;
  @override
  final String question;
  @override
  final String reponse;
  @override
  final String? categorie;
  @override
  @JsonKey()
  final int ordre;
  @override
  @JsonKey()
  final bool isActive;
  @override
  @JsonKey()
  final int helpfulCount;
  @override
  @JsonKey()
  final int notHelpfulCount;
  @override
  @JsonKey()
  final int viewCount;
  @override
  @JsonKey(name: 'createdAt')
  final DateTime? createdAt;
  @override
  @JsonKey(name: 'updatedAt')
  final DateTime? updatedAt;

  @override
  String toString() {
    return 'Faq(idFaq: $idFaq, question: $question, reponse: $reponse, categorie: $categorie, ordre: $ordre, isActive: $isActive, helpfulCount: $helpfulCount, notHelpfulCount: $notHelpfulCount, viewCount: $viewCount, createdAt: $createdAt, updatedAt: $updatedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$FaqImpl &&
            (identical(other.idFaq, idFaq) || other.idFaq == idFaq) &&
            (identical(other.question, question) ||
                other.question == question) &&
            (identical(other.reponse, reponse) || other.reponse == reponse) &&
            (identical(other.categorie, categorie) ||
                other.categorie == categorie) &&
            (identical(other.ordre, ordre) || other.ordre == ordre) &&
            (identical(other.isActive, isActive) ||
                other.isActive == isActive) &&
            (identical(other.helpfulCount, helpfulCount) ||
                other.helpfulCount == helpfulCount) &&
            (identical(other.notHelpfulCount, notHelpfulCount) ||
                other.notHelpfulCount == notHelpfulCount) &&
            (identical(other.viewCount, viewCount) ||
                other.viewCount == viewCount) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    idFaq,
    question,
    reponse,
    categorie,
    ordre,
    isActive,
    helpfulCount,
    notHelpfulCount,
    viewCount,
    createdAt,
    updatedAt,
  );

  /// Create a copy of Faq
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$FaqImplCopyWith<_$FaqImpl> get copyWith =>
      __$$FaqImplCopyWithImpl<_$FaqImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$FaqImplToJson(this);
  }
}

abstract class _Faq implements Faq {
  const factory _Faq({
    @JsonKey(name: 'id_faq') required final String idFaq,
    required final String question,
    required final String reponse,
    final String? categorie,
    final int ordre,
    final bool isActive,
    final int helpfulCount,
    final int notHelpfulCount,
    final int viewCount,
    @JsonKey(name: 'createdAt') final DateTime? createdAt,
    @JsonKey(name: 'updatedAt') final DateTime? updatedAt,
  }) = _$FaqImpl;

  factory _Faq.fromJson(Map<String, dynamic> json) = _$FaqImpl.fromJson;

  @override
  @JsonKey(name: 'id_faq')
  String get idFaq;
  @override
  String get question;
  @override
  String get reponse;
  @override
  String? get categorie;
  @override
  int get ordre;
  @override
  bool get isActive;
  @override
  int get helpfulCount;
  @override
  int get notHelpfulCount;
  @override
  int get viewCount;
  @override
  @JsonKey(name: 'createdAt')
  DateTime? get createdAt;
  @override
  @JsonKey(name: 'updatedAt')
  DateTime? get updatedAt;

  /// Create a copy of Faq
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$FaqImplCopyWith<_$FaqImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
