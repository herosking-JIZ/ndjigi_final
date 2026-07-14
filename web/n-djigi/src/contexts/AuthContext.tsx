import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import type { AuthUser, UserRole } from '@/types'
import axios from 'axios'

// ─── Clés localStorage ────────────────────────────────────────
const STORAGE_KEY_USER = 'ndjigi_user'
const STORAGE_KEY_ACCESS = 'ndjigi_access_token'
const STORAGE_KEY_REFRESH = 'ndjigi_refresh_token'
const STORAGE_KEY_AUTH_METHOD = 'ndjigi_auth_method'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  parkingLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  verifySms: (loginToken: string, code: string) => Promise<AuthUser>
  resendSms: (loginToken: string) => Promise<void>
  can: (permission: string) => boolean
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  hasAllRoles: (roles: UserRole[]) => boolean
  hasPermission: (permission: string) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Helper : construire AuthUser depuis la réponse Keycloak ──
function buildAuthUser(user: any): AuthUser {
  return {
    id_utilisateur: user.id_utilisateur,
    email: user.email,
    nom: user.nom,
    prenom: user.prenom,
    numero_telephone: user.numero_telephone,
    photo_profil: user.photo_profil,
    role: (user.roles && user.roles.length > 0 ? user.roles[0] : 'passager') as UserRole,
    roles: user.roles || ['passager'],
    permissions: [],
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [parkingLoading, setParkingLoading] = useState(false)

  // ─── Restaurer la session au démarrage ─────────────────────
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEY_USER)
    const storedToken = localStorage.getItem(STORAGE_KEY_ACCESS)

    if (storedUser && storedToken) {
      try {
        const u: AuthUser = JSON.parse(storedUser)
        setUser(u)
      } catch {
        clearStorage()
      }
    }
    setLoading(false)
  }, [])

  // ─── Charger le parking du gestionnaire ───────────────────── (DÉFINI PREMIER)
  const loadGestionnaireParking = useCallback(async (accessToken?: string) => {
    console.log('🔵 [AUTH] loadGestionnaireParking APPELÉE avec token:', accessToken?.substring(0, 20) + '...')
    setParkingLoading(true)
    try {
      const token = accessToken || localStorage.getItem(STORAGE_KEY_ACCESS)
      console.log('🔵 [AUTH] Token utilisé:', token?.substring(0, 20) + '...')
      if (!token) {
        console.warn('⚠️ [AUTH] Pas de token disponible')
        return
      }

      console.log('🔵 [AUTH] Appel API /gestionnaire/me/parking...')
      const res = await axios.get('/api/v1/gestionnaire/me/parking', {
        headers: { Authorization: `Bearer ${token}` }
      })

      console.log('🔵 [AUTH] Réponse API:', res.data)

      if (res.data.success && res.data.data) {
        console.log('🔵 [AUTH] Parking trouvé:', res.data.data.id_parking, res.data.data.nom)
        // Mettre à jour l'user avec les infos parking
        console.log('🔵 [AUTH] AVANT setUser - appel setUser avec parking_id:', res.data.data.id_parking)
        setUser(prevUser => {
          console.log('🔵 [AUTH] prevUser avant update:', prevUser)
          if (!prevUser) {
            console.warn('⚠️ [AUTH] prevUser est null!')
            return null
          }
          const updatedUser = {
            ...prevUser,
            parking_id: res.data.data.id_parking,
            parking_nom: res.data.data.nom,
            parking_adresse: res.data.data.adresse
          }
          console.log('🔵 [AUTH] updatedUser avec parking:', updatedUser)
          console.log('🔵 [AUTH] parking_id dans updatedUser:', updatedUser.parking_id)
          // Sauvegarder le user complet dans localStorage
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser))
          return updatedUser
        })
        console.log('🔵 [AUTH] APRÈS setUser - mise à jour en queue')
      } else {
        console.warn('⚠️ [AUTH] Réponse API invalide:', res.data)
      }
    } catch (error: any) {
      console.error('❌ [AUTH] Erreur loadGestionnaireParking:', error?.response?.data?.message || error?.message)
      // Ne pas bloquer le login si cette API échoue
    } finally {
      console.log('🔵 [AUTH] setParkingLoading(false)')
      setParkingLoading(false)
    }
  }, [])

  // ─── Login via backend Keycloak endpoints ─────────────────
  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await axios.post('/api/v1/auth/login', { email, password })

      // Vérifier que la réponse a la bonne structure
      if (!res.data || !res.data.data) {
        throw new Error('Format de réponse invalide du serveur')
      }

      const { requires_2fa, login_token, phone_masked, access_token, refresh_token, user: userData } = res.data.data

      // Si 2FA requis : laisser le composant Login gérer la redirection
      if (requires_2fa) {
        throw {
          response: {
            data: {
              requires_2fa: true,
              login_token,
              phone_masked
            }
          }
        }
      }

      // Sinon : connecter directement
      const authUser = buildAuthUser(userData)

      localStorage.setItem(STORAGE_KEY_ACCESS, access_token)
      localStorage.setItem(STORAGE_KEY_REFRESH, refresh_token)
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(authUser))
      localStorage.setItem(STORAGE_KEY_AUTH_METHOD, 'keycloak')

      setUser(authUser)

      // ✅ Charger les infos parking si gestionnaire
      if (authUser.roles.includes('gestionnaire')) {
        setTimeout(() => loadGestionnaireParking(access_token), 100)
      }
    } catch (error: any) {
      // Relancer l'erreur pour que le component Login la capte
      if (error.response) {
        throw error
      }
      // Si pas de réponse (erreur réseau ou autre), créer une erreur structurée
      throw {
        response: {
          data: {
            message: error.message || 'Erreur de connexion'
          }
        }
      }
    }
  }, [])

  // ─── Logout ────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      const refresh_token = localStorage.getItem(STORAGE_KEY_REFRESH)
      if (refresh_token) {
        await axios.post('/api/v1/auth/logout', { refresh_token })
      }
    } catch {
      // Ignorer les erreurs réseau au logout
    } finally {
      clearStorage()
      setUser(null)
    }
  }, [])

  // ─── Verify SMS ───────────────────────────────────────────
  const verifySms = useCallback(async (loginToken: string, code: string): Promise<AuthUser> => {
    const res = await axios.post('/api/v1/auth/verify-sms', {
      login_token: loginToken,
      sms_code: code
    })
    const { access_token, refresh_token, user: userData } = res.data.data

    const authUser = buildAuthUser(userData)

    localStorage.setItem(STORAGE_KEY_ACCESS, access_token)
    localStorage.setItem(STORAGE_KEY_REFRESH, refresh_token)
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(authUser))
    localStorage.setItem(STORAGE_KEY_AUTH_METHOD, 'keycloak')

    setUser(authUser)
    console.log('🟡 [VERIFY-SMS] User défini:', authUser.nom, authUser.prenom, 'Rôles:', authUser.roles)

    // ✅ Charger les infos parking si gestionnaire
    if (authUser.roles.includes('gestionnaire')) {
      console.log('🟡 [VERIFY-SMS] Gestionnaire détecté, planification du chargement parking...')
      setTimeout(() => {
        console.log('🟡 [VERIFY-SMS] Appel loadGestionnaireParking depuis setTimeout')
        loadGestionnaireParking(access_token)
      }, 100)
    } else {
      console.log('🟡 [VERIFY-SMS] Pas gestionnaire, pas de chargement parking')
    }

    return authUser
  }, [loadGestionnaireParking])

  // ─── Resend SMS ────────────────────────────────────────────
  const resendSms = useCallback(async (loginToken: string) => {
    await axios.post('/api/v1/auth/resend-sms', { login_token: loginToken })
  }, [])

  // ─── can() : permission check (placeholder) ────────────────
  const can = useCallback(() => true, [])

  // ─── hasRole : check if user has a specific role ────────────
  const hasRole = useCallback((role: UserRole): boolean => {
    if (!user) return false
    return user.role === role || user.roles.includes(role)
  }, [user])

  // ─── hasAnyRole : check if user has any of the roles ────────
  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    if (!user) return false
    return roles.some(role => user.role === role || user.roles.includes(role))
  }, [user])

  // ─── hasAllRoles : check if user has all of the roles ───────
  const hasAllRoles = useCallback((roles: UserRole[]): boolean => {
    if (!user) return false
    return roles.every(role => user.role === role || user.roles.includes(role))
  }, [user])

  // ─── hasPermission : check if user has a permission ────────
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false
    return user.permissions.includes(permission)
  }, [user])

  // ─── hasAllPermissions : check if user has all permissions ─
  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    if (!user) return false
    return permissions.every(perm => user.permissions.includes(perm))
  }, [user])

  console.log(`🔴 [AuthProvider] Rendering with user: ${user ? `${user.nom} ${user.prenom}` : 'null'}, parking_id: ${user?.parking_id}, user_ref: `, user)

  const contextValue = useMemo(() => ({
    user,
    loading,
    parkingLoading,
    login,
    logout,
    verifySms,
    resendSms,
    can,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    hasPermission,
    hasAllPermissions
  }), [user, loading, parkingLoading, login, logout, verifySms, resendSms, can, hasRole, hasAnyRole, hasAllRoles, hasPermission, hasAllPermissions])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY_USER)
  localStorage.removeItem(STORAGE_KEY_ACCESS)
  localStorage.removeItem(STORAGE_KEY_REFRESH)
  localStorage.removeItem(STORAGE_KEY_AUTH_METHOD)
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')

  return React.useMemo(() => ctx, [ctx.user?.id_utilisateur, ctx.loading, ctx.parkingLoading])
}

export { STORAGE_KEY_ACCESS, STORAGE_KEY_REFRESH, STORAGE_KEY_AUTH_METHOD }
