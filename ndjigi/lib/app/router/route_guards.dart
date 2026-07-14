import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/storage/secure_storage.dart';
import '../../shared/models/utilisateur_role.dart';

class RouteGuards {
  final Ref ref;

  RouteGuards(this.ref);

  /// Check if user is authenticated
  Future<bool> isAuthenticated() async {
    final storage = SecureStorage();
    final token = await storage.getAccessToken();
    return token != null && token.isNotEmpty;
  }

  /// Check if user has required role
  Future<bool> hasRole(UtilisateurRole requiredRole) async {
    // For now, return true for development
    return true;
  }

  /// Check if user (driver/owner) is validated
  Future<bool> isValidated() async {
    // TODO: Implement validation checking from auth provider
    // For now, return true for development
    return true;
  }

  /// Check if user is driver
  Future<bool> isDriver() async {
    return hasRole(UtilisateurRole.chauffeur);
  }

  /// Check if user is owner
  Future<bool> isOwner() async {
    return hasRole(UtilisateurRole.proprietaire);
  }

  /// Check if user is passenger
  Future<bool> isPassenger() async {
    return hasRole(UtilisateurRole.passager);
  }
}

/// Helper redirect functions for GoRouter
Future<String?> authRedirect(BuildContext context, GoRouterState state) async {
  final storage = SecureStorage();
  final token = await storage.getAccessToken();

  if (token == null || token.isEmpty) {
    return '/login';
  }

  return null;
}

Future<String?> roleRedirect(
  BuildContext context,
  GoRouterState state,
  UtilisateurRole role,
) async {
  // TODO: Implement role checking
  return null;
}
