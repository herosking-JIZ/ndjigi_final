import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ToastProvider } from '@/hooks/useToast'
import { Toaster } from '@/components/Toaster'
import { AppLayout } from '@/layouts/AppLayout'

// Pages auth (publiques)
import Login from '@/pages/Login'
import VerifySMS from '@/pages/VerifySMS'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'
import FirstConnectionPage from '@/pages/auth/FirstConnectionPage'
import NotFound from '@/pages/NotFound'

// Pages admin
import Dashboard from '@/pages/admin/Dashboard'
import Users from '@/pages/admin/Users'
import Documents from '@/pages/admin/Documents'
import Trips from '@/pages/admin/Trips'
import Finance from '@/pages/admin/Finance'
import Parkings from '@/pages/admin/Parkings'
import Support from '@/pages/admin/Support'
import Config from '@/pages/admin/Config'
import Gestionnaires from '@/pages/admin/Gestionnaires'
import CreateGestionnaire from '@/pages/admin/CreateGestionnaire'
import Extensions from '@/pages/admin/Extensions'

// Pages gestionnaire
import ManagerDashboard from '@/pages/manager/ManagerDashboard'

// Pages parkeur
import ParkeurHome from '@/pages/parkeur/ParkeurHome'
import ParkeurFlux from '@/pages/parkeur/ParkeurFlux'
import ParkeurMaintenance from '@/pages/parkeur/ParkeurMaintenance'
import ParkeurVehicules from '@/pages/parkeur/ParkeurVehicules'

// Page partagée
import ChangePassword from '@/pages/auth/ChangePassword'
import { getRoleRedirectUrl } from '@/utils/roleRedirect'

// ─── ProtectedRoute ───────────────────────────────────────────
interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
  managerOnly?: boolean
}

function ProtectedRoute({
  children,
  adminOnly = false,
  managerOnly = false,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  // adminOnly : seuls admin et super_admin ont accès
  if (adminOnly && user.role !== 'admin' && user.role !== 'super_admin') {
    return <Navigate to="/" replace />
  }

  // managerOnly : seuls gestionnaires ont accès
  if (managerOnly && user.role !== 'gestionnaire') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

// ─── Routes ───────────────────────────────────────────────────
function AppRoutes() {
  const { user } = useAuth()

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const isManager = user?.role === 'gestionnaire'

  return (
    <Routes>
      {/* ── Routes publiques (sans layout) ─────────────────── */}
      <Route path="/login" element={<Login />} />
      <Route path="/verify-sms" element={<VerifySMS />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      {/* Le backend envoie un lien du type /auth/reset-password?token=XXXX */}
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      {/* Le backend envoie un lien du type /auth/first-connection?token=XXXX */}
      <Route path="/auth/first-connection" element={<FirstConnectionPage />} />
      {/* Change temporary password (requires auth but accessible when mot_de_passe_temporaire=true) */}
      <Route path="/auth/change-password" element={<ChangePassword />} />

      {/* ── Routes protégées (avec layout) ─────────────────── */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Index : dashboard selon le rôle */}
        <Route
          index
          element={
            isAdmin ? (
              <Dashboard />
            ) : isManager ? (
              <ManagerDashboard />
            ) : (
              <ParkeurHome />
            )
          }
        />

        {/* Profil — accessible à tous les rôles connectés */}
        <Route path="profil/mot-de-passe" element={<ChangePassword />} />

        {/* Routes gestionnaire */}
        <Route
          path="manager"
          element={
            <ProtectedRoute managerOnly>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Routes parkeur */}
        <Route
          path="parkeur"
          element={<ProtectedRoute><ParkeurHome /></ProtectedRoute>}
        />
        <Route
          path="parkeur/flux"
          element={<ProtectedRoute><ParkeurFlux /></ProtectedRoute>}
        />
        <Route
          path="parkeur/maintenance"
          element={<ProtectedRoute><ParkeurMaintenance /></ProtectedRoute>}
        />
        <Route
          path="parkeur/vehicules"
          element={<ProtectedRoute><ParkeurVehicules /></ProtectedRoute>}
        />

        {/* Routes admin */}
        <Route
          path="dashboard"
          element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>}
        />

        {/* Routes admin uniquement */}
        <Route
          path="utilisateurs"
          element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>}
        />
        <Route
          path="documents"
          element={<ProtectedRoute adminOnly><Documents /></ProtectedRoute>}
        />
        <Route
          path="trajets"
          element={<ProtectedRoute adminOnly><Trips /></ProtectedRoute>}
        />
        <Route
          path="finances"
          element={<ProtectedRoute adminOnly><Finance /></ProtectedRoute>}
        />
        <Route
          path="parkings"
          element={<ProtectedRoute adminOnly><Parkings /></ProtectedRoute>}
        />
        <Route
          path="support"
          element={<ProtectedRoute adminOnly><Support /></ProtectedRoute>}
        />
        <Route
          path="configuration"
          element={<ProtectedRoute adminOnly><Config /></ProtectedRoute>}
        />
        <Route
          path="gestionnaires"
          element={<ProtectedRoute adminOnly><Gestionnaires /></ProtectedRoute>}
        />
        <Route
          path="gestionnaires/create"
          element={<ProtectedRoute adminOnly><CreateGestionnaire /></ProtectedRoute>}
        />
        <Route
          path="extensions"
          element={<ProtectedRoute adminOnly><Extensions /></ProtectedRoute>}
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

// ─── Root ─────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
