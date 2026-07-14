import { Navigate } from 'react-router-dom'
import type { UserRole } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  requiredPermissions?: string[]
  requireAll?: boolean
}

export function ProtectedRoute({
  children,
  requiredRoles,
  requiredPermissions,
  requireAll = false
}: ProtectedRouteProps) {
  const { user, loading, hasRole, hasPermission, hasAnyRole, hasAllPermissions } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requireAll
      ? requiredRoles.every(role => hasRole(role))
      : requiredRoles.some(role => hasRole(role))

    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">403 - Accès Refusé</h1>
            <p className="text-muted-foreground mb-4">Vous n'avez pas les permissions nécessaires.</p>
            <a href="/" className="text-primary hover:underline">
              Retour à l'accueil
            </a>
          </div>
        </div>
      )
    }
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? hasAllPermissions(requiredPermissions)
      : requiredPermissions.some(perm => hasPermission(perm))

    if (!hasRequiredPermissions) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">403 - Accès Refusé</h1>
            <p className="text-muted-foreground mb-4">Vous n'avez pas les permissions nécessaires.</p>
            <a href="/" className="text-primary hover:underline">
              Retour à l'accueil
            </a>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
