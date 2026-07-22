import 'package:dio/dio.dart';

String? apiErrorCode(Object error) {
  if (error is! DioException) return null;
  final body = error.response?.data;
  if (body is! Map) return null;
  final errors = body['errors'];
  if (errors is Map && errors['code'] is String) {
    return errors['code'] as String;
  }
  return null;
}

String? apiErrorMessage(Object error) {
  if (error is! DioException) return null;
  final body = error.response?.data;
  if (body is Map && body['message'] is String) {
    return body['message'] as String;
  }
  return null;
}
