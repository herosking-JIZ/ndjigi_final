// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'auth_result.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

/// @nodoc
mixin _$AuthResult {
  bool get success => throw _privateConstructorUsedError;
  String? get accessToken => throw _privateConstructorUsedError;
  String? get refreshToken => throw _privateConstructorUsedError;
  Utilisateur? get user => throw _privateConstructorUsedError;
  String? get errorMessage => throw _privateConstructorUsedError;
  int? get statusCode => throw _privateConstructorUsedError;
  String? get errorCode => throw _privateConstructorUsedError;
  String? get accessTokenPending => throw _privateConstructorUsedError;
  Map<String, dynamic>? get keycloakData => throw _privateConstructorUsedError;

  /// Create a copy of AuthResult
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $AuthResultCopyWith<AuthResult> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AuthResultCopyWith<$Res> {
  factory $AuthResultCopyWith(
    AuthResult value,
    $Res Function(AuthResult) then,
  ) = _$AuthResultCopyWithImpl<$Res, AuthResult>;
  @useResult
  $Res call({
    bool success,
    String? accessToken,
    String? refreshToken,
    Utilisateur? user,
    String? errorMessage,
    int? statusCode,
    String? errorCode,
    String? accessTokenPending,
    Map<String, dynamic>? keycloakData,
  });

  $UtilisateurCopyWith<$Res>? get user;
}

/// @nodoc
class _$AuthResultCopyWithImpl<$Res, $Val extends AuthResult>
    implements $AuthResultCopyWith<$Res> {
  _$AuthResultCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of AuthResult
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? success = null,
    Object? accessToken = freezed,
    Object? refreshToken = freezed,
    Object? user = freezed,
    Object? errorMessage = freezed,
    Object? statusCode = freezed,
    Object? errorCode = freezed,
    Object? accessTokenPending = freezed,
    Object? keycloakData = freezed,
  }) {
    return _then(
      _value.copyWith(
            success: null == success
                ? _value.success
                : success // ignore: cast_nullable_to_non_nullable
                      as bool,
            accessToken: freezed == accessToken
                ? _value.accessToken
                : accessToken // ignore: cast_nullable_to_non_nullable
                      as String?,
            refreshToken: freezed == refreshToken
                ? _value.refreshToken
                : refreshToken // ignore: cast_nullable_to_non_nullable
                      as String?,
            user: freezed == user
                ? _value.user
                : user // ignore: cast_nullable_to_non_nullable
                      as Utilisateur?,
            errorMessage: freezed == errorMessage
                ? _value.errorMessage
                : errorMessage // ignore: cast_nullable_to_non_nullable
                      as String?,
            statusCode: freezed == statusCode
                ? _value.statusCode
                : statusCode // ignore: cast_nullable_to_non_nullable
                      as int?,
            errorCode: freezed == errorCode
                ? _value.errorCode
                : errorCode // ignore: cast_nullable_to_non_nullable
                      as String?,
            accessTokenPending: freezed == accessTokenPending
                ? _value.accessTokenPending
                : accessTokenPending // ignore: cast_nullable_to_non_nullable
                      as String?,
            keycloakData: freezed == keycloakData
                ? _value.keycloakData
                : keycloakData // ignore: cast_nullable_to_non_nullable
                      as Map<String, dynamic>?,
          )
          as $Val,
    );
  }

  /// Create a copy of AuthResult
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $UtilisateurCopyWith<$Res>? get user {
    if (_value.user == null) {
      return null;
    }

    return $UtilisateurCopyWith<$Res>(_value.user!, (value) {
      return _then(_value.copyWith(user: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$AuthResultImplCopyWith<$Res>
    implements $AuthResultCopyWith<$Res> {
  factory _$$AuthResultImplCopyWith(
    _$AuthResultImpl value,
    $Res Function(_$AuthResultImpl) then,
  ) = __$$AuthResultImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    bool success,
    String? accessToken,
    String? refreshToken,
    Utilisateur? user,
    String? errorMessage,
    int? statusCode,
    String? errorCode,
    String? accessTokenPending,
    Map<String, dynamic>? keycloakData,
  });

  @override
  $UtilisateurCopyWith<$Res>? get user;
}

/// @nodoc
class __$$AuthResultImplCopyWithImpl<$Res>
    extends _$AuthResultCopyWithImpl<$Res, _$AuthResultImpl>
    implements _$$AuthResultImplCopyWith<$Res> {
  __$$AuthResultImplCopyWithImpl(
    _$AuthResultImpl _value,
    $Res Function(_$AuthResultImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of AuthResult
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? success = null,
    Object? accessToken = freezed,
    Object? refreshToken = freezed,
    Object? user = freezed,
    Object? errorMessage = freezed,
    Object? statusCode = freezed,
    Object? errorCode = freezed,
    Object? accessTokenPending = freezed,
    Object? keycloakData = freezed,
  }) {
    return _then(
      _$AuthResultImpl(
        success: null == success
            ? _value.success
            : success // ignore: cast_nullable_to_non_nullable
                  as bool,
        accessToken: freezed == accessToken
            ? _value.accessToken
            : accessToken // ignore: cast_nullable_to_non_nullable
                  as String?,
        refreshToken: freezed == refreshToken
            ? _value.refreshToken
            : refreshToken // ignore: cast_nullable_to_non_nullable
                  as String?,
        user: freezed == user
            ? _value.user
            : user // ignore: cast_nullable_to_non_nullable
                  as Utilisateur?,
        errorMessage: freezed == errorMessage
            ? _value.errorMessage
            : errorMessage // ignore: cast_nullable_to_non_nullable
                  as String?,
        statusCode: freezed == statusCode
            ? _value.statusCode
            : statusCode // ignore: cast_nullable_to_non_nullable
                  as int?,
        errorCode: freezed == errorCode
            ? _value.errorCode
            : errorCode // ignore: cast_nullable_to_non_nullable
                  as String?,
        accessTokenPending: freezed == accessTokenPending
            ? _value.accessTokenPending
            : accessTokenPending // ignore: cast_nullable_to_non_nullable
                  as String?,
        keycloakData: freezed == keycloakData
            ? _value._keycloakData
            : keycloakData // ignore: cast_nullable_to_non_nullable
                  as Map<String, dynamic>?,
      ),
    );
  }
}

/// @nodoc

class _$AuthResultImpl implements _AuthResult {
  const _$AuthResultImpl({
    required this.success,
    this.accessToken,
    this.refreshToken,
    this.user,
    this.errorMessage,
    this.statusCode,
    this.errorCode,
    this.accessTokenPending,
    final Map<String, dynamic>? keycloakData,
  }) : _keycloakData = keycloakData;

  @override
  final bool success;
  @override
  final String? accessToken;
  @override
  final String? refreshToken;
  @override
  final Utilisateur? user;
  @override
  final String? errorMessage;
  @override
  final int? statusCode;
  @override
  final String? errorCode;
  @override
  final String? accessTokenPending;
  final Map<String, dynamic>? _keycloakData;
  @override
  Map<String, dynamic>? get keycloakData {
    final value = _keycloakData;
    if (value == null) return null;
    if (_keycloakData is EqualUnmodifiableMapView) return _keycloakData;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  @override
  String toString() {
    return 'AuthResult(success: $success, accessToken: $accessToken, refreshToken: $refreshToken, user: $user, errorMessage: $errorMessage, statusCode: $statusCode, errorCode: $errorCode, accessTokenPending: $accessTokenPending, keycloakData: $keycloakData)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AuthResultImpl &&
            (identical(other.success, success) || other.success == success) &&
            (identical(other.accessToken, accessToken) ||
                other.accessToken == accessToken) &&
            (identical(other.refreshToken, refreshToken) ||
                other.refreshToken == refreshToken) &&
            (identical(other.user, user) || other.user == user) &&
            (identical(other.errorMessage, errorMessage) ||
                other.errorMessage == errorMessage) &&
            (identical(other.statusCode, statusCode) ||
                other.statusCode == statusCode) &&
            (identical(other.errorCode, errorCode) ||
                other.errorCode == errorCode) &&
            (identical(other.accessTokenPending, accessTokenPending) ||
                other.accessTokenPending == accessTokenPending) &&
            const DeepCollectionEquality().equals(
              other._keycloakData,
              _keycloakData,
            ));
  }

  @override
  int get hashCode => Object.hash(
    runtimeType,
    success,
    accessToken,
    refreshToken,
    user,
    errorMessage,
    statusCode,
    errorCode,
    accessTokenPending,
    const DeepCollectionEquality().hash(_keycloakData),
  );

  /// Create a copy of AuthResult
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AuthResultImplCopyWith<_$AuthResultImpl> get copyWith =>
      __$$AuthResultImplCopyWithImpl<_$AuthResultImpl>(this, _$identity);
}

abstract class _AuthResult implements AuthResult {
  const factory _AuthResult({
    required final bool success,
    final String? accessToken,
    final String? refreshToken,
    final Utilisateur? user,
    final String? errorMessage,
    final int? statusCode,
    final String? errorCode,
    final String? accessTokenPending,
    final Map<String, dynamic>? keycloakData,
  }) = _$AuthResultImpl;

  @override
  bool get success;
  @override
  String? get accessToken;
  @override
  String? get refreshToken;
  @override
  Utilisateur? get user;
  @override
  String? get errorMessage;
  @override
  int? get statusCode;
  @override
  String? get errorCode;
  @override
  String? get accessTokenPending;
  @override
  Map<String, dynamic>? get keycloakData;

  /// Create a copy of AuthResult
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AuthResultImplCopyWith<_$AuthResultImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
