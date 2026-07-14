/**
 * PAGES/MANAGER/MANAGERDASHBOARD.TSX
 * Dashboard dédié aux gestionnaires de parking
 * Affiche les informations de gestion du parking assigné
 */

import { useAuth } from '@/contexts/AuthContext'
import { AlertCircle } from 'lucide-react'

export default function ManagerDashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tableau de bord Gestionnaire</h1>
        <p className="text-muted-foreground mt-2">
          Bienvenue, {user?.prenom} {user?.nom}
        </p>
      </div>

      {/* Placeholder - À implémenter selon les besoins */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground">Page en construction</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Le dashboard gestionnaire est en cours de développement. Il permettra de gérer
              votre parking assigné, les mouvements de véhicules, et les utilisateurs associés.
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-sm text-muted-foreground mb-1">Status</div>
          <div className="text-2xl font-bold text-foreground">Actif</div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-sm text-muted-foreground mb-1">Rôle</div>
          <div className="text-2xl font-bold text-foreground">Gestionnaire</div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-sm text-muted-foreground mb-1">Email</div>
          <div className="text-sm font-medium text-foreground truncate">{user?.email}</div>
        </div>
      </div>
    </div>
  )
}
