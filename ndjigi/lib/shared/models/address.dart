// ignore_for_file: invalid_annotation_target
import 'package:freezed_annotation/freezed_annotation.dart';

part 'address.freezed.dart';
part 'address.g.dart';

double _parseDouble(dynamic value) {
  if (value is double) return value;
  if (value is int) return value.toDouble();
  if (value is String) return double.parse(value);
  throw ArgumentError('Cannot parse $value as double');
}

@freezed
class Address with _$Address {
  const factory Address({
    @JsonKey(name: 'id_address') required String idAddress,
    required String label,
    required String address,
    @JsonKey(fromJson: _parseDouble) required double latitude,
    @JsonKey(fromJson: _parseDouble) required double longitude,
    @Default(false) bool isfavorite,
    @JsonKey(name: 'createdAt') DateTime? createdAt,
    @JsonKey(name: 'updatedAt') DateTime? updatedAt,
  }) = _Address;

  factory Address.fromJson(Map<String, dynamic> json) => _$AddressFromJson(json);
}
