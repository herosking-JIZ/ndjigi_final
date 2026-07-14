/**
 * UTILS/ROLEREDIRECT.TS
 * Logique centralisée de redirection basée sur le rôle utilisateur
 * Single source of truth pour les URL de chaque rôle
 */

import type { UserRole } from '@/types'

/**
 * Détermine l'URL de redirection après une authentification réussie
 * selon le rôle de l'utilisateur.
 *
 * @param role - Rôle de l'utilisateur (admin, gestionnaire, etc.)
 * @returns URL vers laquelle rediriger l'utilisateur
 *
 * @example
 * const role = 'gestionnaire'
 * const url = getRoleRedirectUrl(role)  // → '/manager'
 */
export function getRoleRedirectUrl(role: UserRole | undefined): string {
  if (!role) {
    return '/'
  }

  switch (role) {
    case 'admin':
    case 'super_admin':
      return '/dashboard'

    case 'gestionnaire':
      return '/parkeur'

    // Les rôles mobile-only ne doivent pas accéder au web
    // (bloqués au backend avec 403)
    case 'passager':
    case 'chauffeur':
    case 'proprietaire':
      return '/'

    default:
      return '/'
  }
}

/**
 * Vérifie si un rôle a accès à l'interface web
 * Les rôles mobile-only (passager, chauffeur, proprietaire) ne doivent pas
 * accéder à la web app, même s'ils reçoivent une réponse 403 du backend.
 *
 * @param role - Rôle à vérifier
 * @returns true si l'utilisateur peut accéder au web, false sinon
 */
export function canAccessWeb(role: UserRole | undefined): boolean {
  if (!role) return false

  const webRoles: UserRole[] = ['admin', 'super_admin', 'gestionnaire']
  return webRoles.includes(role)
}

/**
 * Message d'erreur localisé pour chaque type d'erreur d'accès
 */
export const ACCESS_ERROR_MESSAGES = {
  MOBILE_ONLY: 'Accès web non disponible pour ce rôle. Utilisez l\'application mobile.',
  UNAUTHORIZED: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource.',
  SESSION_EXPIRED: 'Votre session a expiré. Veuillez vous reconnecter.',
} as const
