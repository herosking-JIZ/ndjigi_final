import { NavLink, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, Users, FileText, Car, CreditCard,
  ParkingCircle, HeadphonesIcon, Settings, LogOut, MapPin,
  ChevronRight, KeyRound, ArrowRightLeft, Wrench, List, FileCheck,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn, getInitials } from '@/lib/utils'

const ADMIN_NAV = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { to: '/utilisateurs', label: 'Utilisateurs', icon: Users },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/extensions', label: 'Extensions', icon: FileCheck },
  { to: '/trajets', label: 'Trajets', icon: Car },
  { to: '/finances', label: 'Finances', icon: CreditCard },
  { to: '/parkings', label: 'Parkings', icon: ParkingCircle },
  { to: '/support', label: 'Support', icon: HeadphonesIcon },
  { to: '/configuration', label: 'Configuration', icon: Settings },
]

const GESTIONNAIRE_NAV = [
  { to: '/parkeur', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { to: '/parkeur/flux', label: 'Entrées/Sorties', icon: ArrowRightLeft },
  { to: '/parkeur/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/parkeur/vehicules', label: 'Véhicules', icon: List },
]

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  super_admin: 'Super Admin',
  gestionnaire: 'Gestionnaire',
  chauffeur: 'Chauffeur',
  passager: 'Passager',
  proprietaire: 'Propriétaire',
}

export function AppSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const navItems = isAdmin ? ADMIN_NAV : GESTIONNAIRE_NAV

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className={cn(
      'flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-sidebar-border',
        collapsed && 'justify-center px-0'
      )}>
        <div className="shrink-0 w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <MapPin className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-lg text-sidebar-accent-foreground tracking-tight">
            N'DJIGI
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
        <ul className="space-y-0.5 px-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.exact}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  collapsed && 'justify-center px-0 w-10 mx-auto'
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        {/* User info */}
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-1">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">
                {getInitials(user.nom, user.prenom)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-accent-foreground truncate">
                {user.prenom} {user.nom}
              </p>
              <p className="text-xs text-sidebar-foreground">{ROLE_LABELS[user.role] ?? user.role}</p>
            </div>
          </div>
        )}

        {/* Changer mot de passe */}
        <Link
          to="/profil/mot-de-passe"
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm',
            collapsed && 'justify-center px-0 w-10 mx-auto'
          )}
          title={collapsed ? 'Changer le mot de passe' : undefined}
        >
          <KeyRound className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="font-medium">Mot de passe</span>}
        </Link>

        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive transition-colors text-sm',
            collapsed && 'justify-center px-0 w-10 mx-auto'
          )}
          title={collapsed ? 'Déconnexion' : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="font-medium">Déconnexion</span>}
        </button>

        {/* Réduire sidebar */}
        <button
          onClick={onToggle}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-sm',
            collapsed && 'justify-center'
          )}
        >
          <ChevronRight className={cn('h-4 w-4 transition-transform', !collapsed && 'rotate-180')} />
          {!collapsed && <span className="text-xs">Réduire</span>}
        </button>
      </div>
    </aside>
  )
}
