import axios, { AxiosInstance } from 'axios'
import type {
  ApiResponse,
  LoginCredentials, LoginResponseData, KeycloakLoginResponse,
  Utilisateur, PaginatedResponse, AccountStatus, CreateUserPayload,
  Document, DocumentStatus,
  Trajet,
  Transaction, FinanceKpis, Wallet, DepotPayload,
  Parking, CreateParkingPayload, VehiculeParking, MouvementParking,
  ZoneTarifaire, CategorieVehicule, CodePromo,  TarifCategorieZone,
  AdminKpis, ChartDataPoint, TopChauffeur,
  Ticket,
  SupportTicketList, ChatMessage, TicketPriorite,
  // Gestionnaire (Phase 1+)
  CreateGestionnairePayload, GestionnaireCreationResponse, InvitationVerifyResponse, FirstConnectionCompleteResponse, InvitationResendResponse, DocumentUploadResponse, FirstConnectionPayload,
  // Demandes d'extension
  DemandeExtension, UpdateDemandeExtensionPayload,
} from '@/types'
import * as mock from '@/data/mockData'
import { STORAGE_KEY_ACCESS, STORAGE_KEY_REFRESH } from '@/contexts/AuthContext'

// ─── Mode démo ────────────────────────────────────────────────
const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true'
function delay(ms = 300) { return new Promise((r) => setTimeout(r, ms)) }

// ═══════════════════════════════════════════════════════════════
// AXIOS INSTANCE
// ═══════════════════════════════════════════════════════════════
const api: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// ─── Injecter le token sur chaque requête ────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEY_ACCESS)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Gérer les réponses : unwrap { success, data } ──────────
api.interceptors.response.use(
  (res) => {
    // Check if user has temporary password and needs to change it
    const responseData = res.data?.data
    if (responseData?.mot_de_passe_temporaire === true && !window.location.pathname.includes('/auth/change-password')) {
      // Store flag in sessionStorage and redirect after a brief moment
      sessionStorage.setItem('needs_password_change', 'true')
      setTimeout(() => {
        if (!window.location.pathname.includes('/auth/change-password')) {
          window.location.href = '/auth/change-password'
        }
      }, 100)
    }
    return res
  },
  async (err) => {
    const status = err.response?.status
    const errorCode = err.response?.data?.code

    // PASSWORD_CHANGE_REQUIRED → redirect to password change page
    if (status === 403 && errorCode === 'PASSWORD_CHANGE_REQUIRED') {
      if (!window.location.pathname.includes('/auth/change-password')) {
        window.location.href = '/auth/change-password'
      }
      return Promise.reject(err)
    }

    // Token expiré → tenter le refresh
    if (status === 401) {
      const refreshToken = localStorage.getItem(STORAGE_KEY_REFRESH)
      if (refreshToken && !err.config._retry) {
        err.config._retry = true
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', { refresh_token: refreshToken })
          const newToken = data.data?.access_token
          if (newToken) {
            localStorage.setItem(STORAGE_KEY_ACCESS, newToken)
            if (data.data?.refresh_token) {
              localStorage.setItem(STORAGE_KEY_REFRESH, data.data.refresh_token)
            }
            err.config.headers.Authorization = `Bearer ${newToken}`
            return api(err.config)
          }
        } catch {
          localStorage.removeItem(STORAGE_KEY_ACCESS)
          localStorage.removeItem(STORAGE_KEY_REFRESH)
          localStorage.removeItem('ndjigi_user')
          window.location.href = '/login'
          return Promise.reject(err)
        }
      }
      // Pas de refresh token ou refresh échoué → déconnexion
      localStorage.removeItem(STORAGE_KEY_ACCESS)
      localStorage.removeItem(STORAGE_KEY_REFRESH)
      localStorage.removeItem('ndjigi_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ─── Helper : extraire data depuis { success, message, data } ─
// Lance une erreur avec le message backend si success=false
function extractData<T>(apiResponse: ApiResponse<T>): T {
  if (!apiResponse.success) {
    const err: any = new Error(apiResponse.message || 'Erreur serveur')
    err.backendErrors = apiResponse.errors
    err.response = { data: apiResponse }
    throw err
  }
  return apiResponse.data
}

// ─── In-memory state pour le mode démo ───────────────────────
let _users = [...mock.MOCK_UTILISATEURS]
let _documents = [...mock.MOCK_DOCUMENTS]
let _trajets = [...mock.MOCK_TRAJETS]
let _transactions = [...mock.MOCK_TRANSACTIONS]
let _parkings = [...mock.MOCK_PARKINGS]
let _vehicules = [...mock.MOCK_VEHICULES_PARKING]
let _mouvements = [...mock.MOCK_MOUVEMENTS]
let _promos = [...mock.MOCK_PROMOS]

// ═══════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════
export const authService = {
  // Phase 1: Retourne KeycloakLoginResponse
  login: async (creds: LoginCredentials): Promise<KeycloakLoginResponse> => {
    if (IS_DEMO) {
      await delay()
      const expectedPwd = mock.MOCK_PASSWORDS[creds.email]
      if (!expectedPwd || expectedPwd !== creds.mot_de_passe) {
        const err: any = new Error('Identifiants incorrects')
        err.response = { data: { success: false, message: 'Identifiants incorrects' }, status: 401 }
        throw err
      }
      // Retourner mock au format Keycloak pour demo mode
      const oldData = mock.MOCK_LOGIN_DATA[creds.email]
      return {
        access_token: oldData.tokens.accessToken,
        refresh_token: oldData.tokens.refreshToken,
        expires_in: 3600,
        token_type: 'Bearer',
        user: {
          id_utilisateur: oldData.user.id_utilisateur,
          keycloak_id: oldData.user.id_utilisateur,
          email: oldData.user.email,
          nom: oldData.user.nom,
          prenom: oldData.user.prenom,
          numero_telephone: oldData.user.numero_telephone,
          photo_profil: oldData.user.photo_profil,
          roles: (oldData.user.utilisateur_role || []).filter(r => r.actif).map(r => r.role as any),
          auth_provider: 'keycloak'
        }
      }
    }
    const { data } = await api.post<ApiResponse<KeycloakLoginResponse>>('/auth/login', { email: creds.email, password: creds.mot_de_passe })
    return extractData(data)
  },

  logout: async () => {
    if (IS_DEMO) { await delay(100); return }
    try { await api.post('/auth/logout') } catch { /* ignorer */ }
  },

  // Demander un email de réinitialisation
  forgotPassword: async (email: string): Promise<void> => {
    if (IS_DEMO) { await delay(500); return }
    const { data } = await api.post<ApiResponse<null>>('/auth/forgot-password', { email })
    extractData(data)
  },

  // Réinitialiser le mot de passe avec le token reçu par email
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    if (IS_DEMO) { await delay(500); return }
    const { data } = await api.post<ApiResponse<null>>('/auth/reset-password', {
      token,
      newPassword,
    })
    extractData(data)
  },

  // Changer le mot de passe (utilisateur connecté)
  // Works for both temporary password change and regular password change
  changePassword: async (ancienMotDePasse: string, nouveauMotDePasse: string): Promise<void> => {
    if (IS_DEMO) { await delay(500); return }
    const { data } = await api.post<ApiResponse<null>>('/auth/change-temporary-password', {
      ancien_mot_de_passe: ancienMotDePasse,
      nouveau_mot_de_passe: nouveauMotDePasse,
    })
    extractData(data)
  },
}

// ═══════════════════════════════════════════════════════════════
// UTILISATEURS
// ═══════════════════════════════════════════════════════════════
export const utilisateursService = {
  list: async (params?: {
  page?: number; limit?: number; search?: string; role?: string; statut?: string
}): Promise<PaginatedResponse<Utilisateur>> => {
  if (IS_DEMO) {
    await delay()
    const filtered = mock.filterUsers(params?.search ?? '', params?.role ?? '', params?.statut ?? '')
    return mock.paginate(filtered, params?.page ?? 1, params?.limit ?? 20)
  }

  const response = await api.get<ApiResponse<{
    data: Utilisateur[];
    meta: { total: number; page: number; limit: number };
  }>>('/utilisateurs', { params })

  const { data: utilisateurs, meta } = extractData(response.data)

  return {
    data: utilisateurs,
    total: meta.total,
    page: meta.page,
    limit: meta.limit,
    totalPages: Math.ceil(meta.total / meta.limit),
  }
},

  getById: async (id: string): Promise<Utilisateur> => {
    if (IS_DEMO) {
      await delay()
      return _users.find((x) => x.id_utilisateur === id) ?? _users[0]
    }
    const { data } = await api.get<ApiResponse<Utilisateur>>(`/utilisateurs/${id}`)
    return extractData(data)
  },

  updateStatut: async (id: string, statut: AccountStatus): Promise<void> => {
    if (IS_DEMO) {
      await delay()
      _users = _users.map((u) => u.id_utilisateur === id ? { ...u, statut_compte: statut } : u)
      return
    }
    const { data } = await api.patch<ApiResponse<null>>(`/utilisateurs/${id}/statut`, { statut })
    extractData(data)
  },

  // Création d'utilisateur par l'admin (gestionnaire, chauffeur, etc.)
  create: async (payload: CreateUserPayload): Promise<Utilisateur> => {
    if (IS_DEMO) {
      await delay(500)
      const newUser: Utilisateur = {
        id_utilisateur: `u-${Date.now()}`,
        nom: payload.nom,
        prenom: payload.prenom,
        email: payload.email,
        numero_telephone: payload.numero_telephone,
        adresse: payload.adresse,
        statut_compte: 'actif',
        date_inscription: new Date().toISOString(),
        roles: [payload.role],
        parking_id: payload.parking_id,
      }
      _users = [newUser, ..._users]
      return newUser
    }
    const { data } = await api.post<ApiResponse<Utilisateur>>('auth/admin/users', payload)
    return extractData(data)
  },

  // Dépôt admin vers wallet passager
  depot: async (payload: DepotPayload): Promise<void> => {
    if (IS_DEMO) { await delay(400); return }
    const { data } = await api.post<ApiResponse<null>>('/utilisateurs/depot', payload)
    extractData(data)
  },

  // Wallet d'un utilisateur
  getWallet: async (id: string): Promise<Wallet> => {
    if (IS_DEMO) {
      await delay()
      return { id_portefeuille: `w-${id}`, id_utilisateur: id, solde: 12500, dette_commission: 0, devise: 'XOF', statut: 'actif' }
    }
    const { data } = await api.get<ApiResponse<Wallet>>(`/utilisateurs/${id}/wallet`)
    return extractData(data)
  },
}

// ═══════════════════════════════════════════════════════════════
// DOCUMENTS
// ═══════════════════════════════════════════════════════════════
export const documentsService = {
  listEnAttente: async (): Promise<Document[]> => {
    if (IS_DEMO) { await delay(); return _documents.filter((d) => d.statut_verification === 'en_attente') }
    const { data } = await api.get<ApiResponse<Document[]>>('/documents?statut=en_attente')
    return extractData(data)
  },
  listHistorique: async (): Promise<Document[]> => {
    if (IS_DEMO) { await delay(); return _documents.filter((d) => d.statut_verification !== 'en_attente') }
    const { data } = await api.get<ApiResponse<Document[]>>('/documents?statut=valide,rejete')
    return extractData(data)
  },
  valider: async (id: string): Promise<void> => {
    if (IS_DEMO) {
      await delay()
      _documents = _documents.map((d) => d.id_document === id ? { ...d, statut_verification: 'valide' as DocumentStatus } : d)
      return
    }
    const { data } = await api.patch<ApiResponse<null>>(`/documents/${id}/valider`)
    extractData(data)
  },
  rejeter: async (id: string, motif: string): Promise<void> => {
    if (IS_DEMO) {
      await delay()
      _documents = _documents.map((d) => d.id_document === id ? { ...d, statut_verification: 'rejete' as DocumentStatus } : d)
      return
    }
    const { data } = await api.patch<ApiResponse<null>>(`/documents/${id}/rejeter`, { motif })
    extractData(data)
  },
}

// ═══════════════════════════════════════════════════════════════
// TRAJETS
// ═══════════════════════════════════════════════════════════════
export const trajetsService = {
  enCours: async (): Promise<Trajet[]> => {
    if (IS_DEMO) { await delay(); return _trajets.filter((t) => t.statut === 'en_cours') }
    const { data } = await api.get<ApiResponse<Trajet[]>>('/trajets?statut=en_cours')
    return extractData(data)
  },




historique: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<Trajet>> => {
  if (IS_DEMO) {
    await delay()
    const q = (params?.search ?? '').toLowerCase()
    const filtered = _trajets.filter((t) =>
      !q ||
      t.passager_nom.toLowerCase().includes(q) ||
      t.chauffeur_nom.toLowerCase().includes(q) ||
      t.adresse_depart.toLowerCase().includes(q) ||
      t.statut.includes(q)
    )
    return mock.paginate(filtered, params?.page ?? 1, params?.limit ?? 20)
  }

  // ✅ extractData retourne { data, total, page, limit, totalPages }
  const { data } = await api.get<ApiResponse<PaginatedResponse<Trajet>>>('/trajets/historique', { params })
  return extractData(data)  // PaginatedResponse directement
},



  
}

// ═══════════════════════════════════════════════════════════════
// FINANCES
// ═══════════════════════════════════════════════════════════════
export const financesService = {
  kpis: async (): Promise<FinanceKpis> => {
    if (IS_DEMO) { await delay(); return mock.MOCK_FINANCE_KPIS }
    const { data } = await api.get<ApiResponse<FinanceKpis>>('/finances/kpis')
    return extractData(data)
  },
  transactions: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<Transaction>> => {
    if (IS_DEMO) {
      await delay()
      const q = (params?.search ?? '').toLowerCase()
      const filtered = _transactions.filter((t) => !q || t.description.toLowerCase().includes(q) || t.type.includes(q) || t.statut.includes(q))
      return mock.paginate(filtered, params?.page ?? 1, params?.limit ?? 20)
    }
    const { data } = await api.get<ApiResponse<PaginatedResponse<Transaction>>>('/finances/transactions', { params })
    return extractData(data)
  },
  // Wallet global de la plateforme (commissions accumulées)
  walletPlateforme: async (): Promise<{ solde: number; total_commissions: number }> => {
    if (IS_DEMO) { await delay(); return { solde: 4_250_000, total_commissions: 5_100_000 } }
    const { data } = await api.get<ApiResponse<{ solde: number; total_commissions: number }>>('/finances/wallet-plateforme')
    return extractData(data)
  },
  // Faire un remboursement
  rembourser: async (payload: { id_utilisateur: string; montant: number; motif: string; id_ticket?: string }): Promise<void> => {
    if (IS_DEMO) { await delay(400); return }
    const { data } = await api.post<ApiResponse<null>>('/finances/rembourser', payload)
    extractData(data)
  },
}

// ═══════════════════════════════════════════════════════════════
// SUPPORT / TICKETS
// ═══════════════════════════════════════════════════════════════
export const supportService = {
  list: async (params?: { page?: number; limit?: number; search?: string; statut?: string }): Promise<SupportTicketList> => {
    if (IS_DEMO) {
      await delay()
      const result = mock.paginate(mock.MOCK_TICKETS, params?.page ?? 1, params?.limit ?? 20)
      return { ...result, stats: { total: result.total, ouverts: 0, en_cours: 0, resolus: 0, fermes: 0 } }
    }
    const { data } = await api.get<ApiResponse<SupportTicketList>>('/support/tickets', { params })
    return extractData(data)
  },
  getById: async (id: string): Promise<Ticket> => {
    if (IS_DEMO) { await delay(); return mock.MOCK_TICKETS.find((t) => t.id_ticket === id) ?? mock.MOCK_TICKETS[0] }
    const { data } = await api.get<ApiResponse<Ticket>>(`/support/tickets/${id}`)
    return extractData(data)
  },
  updateStatut: async (id: string, statut: string, note_resolution?: string): Promise<void> => {
    if (IS_DEMO) { await delay(); return }
    const { data } = await api.patch<ApiResponse<null>>(`/support/tickets/${id}/statut`, { statut, note_resolution })
    extractData(data)
  },
  updatePriorite: async (id: string, priorite: TicketPriorite): Promise<void> => {
    const { data } = await api.patch<ApiResponse<null>>(`/support/tickets/${id}/priorite`, { priorite })
    extractData(data)
  },
  messages: async (idConversation: string): Promise<ChatMessage[]> => {
    const { data } = await api.get<ApiResponse<{ messages: ChatMessage[] }>>(`/conversations/${idConversation}/messages`, { params: { page: 1, limit: 50 } })
    return extractData(data).messages.reverse()
  },
}

// ═══════════════════════════════════════════════════════════════
// PARKINGS (admin)
// ═══════════════════════════════════════════════════════════════
export const parkingsService = {
  list: async (): Promise<Parking[]> => {
    if (IS_DEMO) { await delay(); return _parkings }
    const { data } = await api.get<ApiResponse<Parking[]>>('/parkings')
    return extractData(data)
  },
  create: async (payload: CreateParkingPayload): Promise<Parking> => {
    if (IS_DEMO) {
      await delay()
      const newParking: Parking = {
        id_parking: Math.random().toString(36).slice(2),
        ...payload,
        capacite_occupee: 0,
        actif: true,
      }
      _parkings.push(newParking)
      return newParking
    }
    const { data } = await api.post<ApiResponse<Parking>>('/parkings', payload)
    return extractData(data)
  },
  update: async (id: string, payload: Partial<Parking>): Promise<Parking> => {
    if (IS_DEMO) {
      await delay()
      _parkings = _parkings.map((p) => p.id_parking === id ? { ...p, ...payload } : p)
      return _parkings.find((p) => p.id_parking === id)!
    }
    const { data } = await api.put<ApiResponse<Parking>>(`/parkings/${id}`, payload)
    return extractData(data)
  },
  mouvements: async (params?: { search?: string }): Promise<MouvementParking[]> => {
    if (IS_DEMO) {
      await delay()
      const q = (params?.search ?? '').toLowerCase()
      return _mouvements.filter((m) => !q || m.immatriculation.toLowerCase().includes(q) || m.parking_nom.toLowerCase().includes(q) || m.parkeur_nom.toLowerCase().includes(q))
    }
    const { data } = await api.get<ApiResponse<MouvementParking[]>>('/parkings/mouvements', { params })
    return extractData(data)
  },
}

// ═══════════════════════════════════════════════════════════════
// GESTIONNAIRE INVITATION SYSTEM (Phase 1+)
// ═══════════════════════════════════════════════════════════════
export const gestionnaireService = {
  // Create gestionnaire (admin only)
  create: async (payload: CreateGestionnairePayload): Promise<GestionnaireCreationResponse> => {
    if (IS_DEMO) {
      await delay(500)
      return {
        id_utilisateur: `g-${Date.now()}`,
        email: payload.email,
        parking: { id_parking: payload.id_parking, nom: 'Parking' },
        invitation_sent_at: new Date().toISOString(),
        invitation_expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      }
    }
    const { data } = await api.post<ApiResponse<GestionnaireCreationResponse>>(
      '/admin/gestionnaires',
      payload
    )
    return extractData(data)
  },

  // Verify invitation token (public)
  verifyToken: async (token: string): Promise<InvitationVerifyResponse> => {
    if (IS_DEMO) {
      await delay()
      return {
        email: 'demo@example.com',
        id_utilisateur: 'demo-user',
        parking_nom: 'Parking Demo',
      }
    }
    const { data } = await api.get<ApiResponse<InvitationVerifyResponse>>(
      '/auth/verify-invitation',
      { params: { token } }
    )
    return extractData(data)
  },

  // Complete first connection (public)
  completeFirstConnection: async (payload: FirstConnectionPayload): Promise<FirstConnectionCompleteResponse> => {
    if (IS_DEMO) {
      await delay(500)
      return {
        id_utilisateur: 'demo-user',
        email: payload.email,
        statut_compte: 'actif',
      }
    }
    const { data } = await api.post<ApiResponse<FirstConnectionCompleteResponse>>(
      '/auth/complete-first-connection',
      payload
    )
    return extractData(data)
  },

  // Resend invitation (admin only)
  resendInvitation: async (id_utilisateur: string): Promise<InvitationResendResponse> => {
    if (IS_DEMO) {
      await delay(400)
      return {
        id_utilisateur,
        email: 'demo@example.com',
        invitation_sent_at: new Date().toISOString(),
        invitation_expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      }
    }
    const { data } = await api.post<ApiResponse<InvitationResendResponse>>(
      '/auth/resend-invitation',
      { id_utilisateur }
    )
    return extractData(data)
  },

  // Get my parking (gestionnaire authenticated)
  getMyParking: async (): Promise<{
    id_parking: string
    nom: string
    adresse: string
    ville: string
    capacite_totale: number
    capacite_occupee: number
  }> => {
    if (IS_DEMO) {
      await delay()
      const parking = _parkings[0]
      return {
        id_parking: parking.id_parking,
        nom: parking.nom,
        adresse: parking.adresse,
        ville: parking.ville || 'Ouagadougou',
        capacite_totale: parking.capacite_totale || 50,
        capacite_occupee: parking.capacite_occupee || 12
      }
    }
    const { data } = await api.get<ApiResponse<{
      id_parking: string
      nom: string
      adresse: string
      ville: string
      capacite_totale: number
      capacite_occupee: number
    }>>('/gestionnaire/me/parking')
    return extractData(data)
  },
}

// ═══════════════════════════════════════════════════════════════
// PARKEUR (gestionnaire)
// ═══════════════════════════════════════════════════════════════
export const parkeurService = {
  // ── Dashboard ──────────────────────────────────────────────────
  detailParking: async (parkingId: string) => {
    if (IS_DEMO) {
      await delay()
      const p = _parkings[0]
      return { ...p, capacite_dispo: (p.capacite_totale || 0) - (p.capacite_occupee || 0), vehicules_bon_etat: 15 }
    }
    const { data } = await api.get<ApiResponse<any>>(`/parkings/${parkingId}/detail-parkeur`)
    return extractData(data)
  },

  vehiculesGares: async (parkingId: string, params?: { presence?: 'present' | 'absent' | 'all'; search?: string }): Promise<VehiculeParking[]> => {
    if (IS_DEMO) { await delay(); return _vehicules }
    const { data } = await api.get<ApiResponse<VehiculeParking[]>>(`/parkings/${parkingId}/vehicules`, { params })
    return extractData(data)
  },

  mouvementsParkeur: async (parkingId: string, params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<MouvementParking>> => {
    if (IS_DEMO) {
      await delay()
      const q = (params?.search ?? '').toLowerCase()
      const filtered = _mouvements.filter((m) => m.id_parking === parkingId && (!q || m.immatriculation.toLowerCase().includes(q)))
      return mock.paginate(filtered, params?.page ?? 1, params?.limit ?? 20)
    }
    const { data } = await api.get<ApiResponse<PaginatedResponse<MouvementParking>>>(`/parkings/${parkingId}/mouvements-parkeur`, { params })
    return extractData(data)
  },

  // ── Flux Entrée/Sortie ────────────────────────────────────────
  enregistrerEntree: async (parkingId: string, payload: { id_vehicule: string; etat_vehicule: string; commentaire?: string }): Promise<void> => {
    if (IS_DEMO) { await delay(400); return }
    const { data } = await api.post<ApiResponse<null>>(`/parkings/${parkingId}/entree`, payload)
    extractData(data)
  },

  enregistrerSortie: async (parkingId: string, payload: { id_vehicule: string; etat_vehicule: string; commentaire?: string }): Promise<void> => {
    if (IS_DEMO) { await delay(400); return }
    const { data } = await api.post<ApiResponse<null>>(`/parkings/${parkingId}/sortie`, payload)
    extractData(data)
  },

  // ── Maintenance ────────────────────────────────────────────────
  listerMaintenance: async (parkingId: string, params?: { page?: number; limit?: number; statut?: string; urgence?: string }) => {
    if (IS_DEMO) { await delay(); return { data: [], total: 0, page: 1, limit: 20 } }
    const { data } = await api.get<ApiResponse<PaginatedResponse<any>>>(`/parkings/${parkingId}/maintenance`, { params })
    return extractData(data)
  },

  creerMaintenance: async (parkingId: string, payload: { id_vehicule: string; type: string; urgence?: string; description: string }): Promise<void> => {
    if (IS_DEMO) { await delay(400); return }
    const { data } = await api.post<ApiResponse<null>>(`/parkings/${parkingId}/maintenance`, payload)
    extractData(data)
  },

  obtenirMaintenance: async (parkingId: string, maintenanceId: string) => {
    if (IS_DEMO) { await delay(); return {} }
    const { data } = await api.get<ApiResponse<any>>(`/parkings/${parkingId}/maintenance/${maintenanceId}`)
    return extractData(data)
  },

  mettreAJourMaintenanceStatut: async (parkingId: string, maintenanceId: string, payload: { statut: string; commentaire?: string }): Promise<void> => {
    if (IS_DEMO) { await delay(400); return }
    const { data } = await api.patch<ApiResponse<null>>(`/parkings/${parkingId}/maintenance/${maintenanceId}`, payload)
    extractData(data)
  },

  // ── Photos ─────────────────────────────────────────────────────
  uploadPhotoMouvement: async (parkingId: string, mouvementId: string, file: File): Promise<{ id_photo: string; url: string }> => {
    if (IS_DEMO) { await delay(600); return { id_photo: `p-${Date.now()}`, url: '/mock-photo.jpg' } }
    const formData = new FormData()
    formData.append('photo', file)
    const { data } = await api.post<ApiResponse<{ id_photo: string; url: string }>>(
      `/parkings/${parkingId}/mouvements/${mouvementId}/photos`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return extractData(data)
  },

  uploadPhotoMaintenance: async (parkingId: string, maintenanceId: string, file: File): Promise<{ id_photo: string; url: string }> => {
    if (IS_DEMO) { await delay(600); return { id_photo: `p-${Date.now()}`, url: '/mock-photo.jpg' } }
    const formData = new FormData()
    formData.append('photo', file)
    const { data } = await api.post<ApiResponse<{ id_photo: string; url: string }>>(
      `/parkings/${parkingId}/maintenance/${maintenanceId}/photos`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return extractData(data)
  },

  getParkingPhoto: async (parkingId: string, photoId: string): Promise<Blob> => {
    const { data } = await api.get(`/parkings/${parkingId}/photos/${photoId}`, { responseType: 'blob' })
    return data
  },

  deletePhoto: async (parkingId: string, photoId: string): Promise<void> => {
    if (IS_DEMO) { await delay(300); return }
    const { data } = await api.delete<ApiResponse<null>>(`/parkings/${parkingId}/photos/${photoId}`)
    extractData(data)
  }
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════
export const configService = {

  // ── Zones ──────────────────────────────────────────────────
 listZones: async (): Promise<ZoneTarifaire[]> => {
  if (IS_DEMO) { await delay(); return [...mock._zones] }
  const { data } = await api.get<ApiResponse<{ data: ZoneTarifaire[]; meta: any }>>('/config/zones')
  return extractData(data).data
},

  createZone: async (payload: Omit<ZoneTarifaire, 'id_zone'>): Promise<ZoneTarifaire> => {
    if (IS_DEMO) {
      await delay()
      const z: ZoneTarifaire = { ...payload, id_zone: `z-${Date.now()}` }
      mock._zones.push(z)
      return z
    }
    const { data } = await api.post<ApiResponse<ZoneTarifaire>>('/config/zones', payload)
    return extractData(data)
  },

  updateZone: async (id: string, payload: Partial<ZoneTarifaire>): Promise<ZoneTarifaire> => {
    if (IS_DEMO) {
      await delay()
      const idx = mock._zones.findIndex((z) => z.id_zone === id)
      mock._zones[idx] = { ...mock._zones[idx], ...payload }
      return mock._zones[idx]
    }
    const { data } = await api.put<ApiResponse<ZoneTarifaire>>(`/config/zones/${id}`, payload)
    return extractData(data)
  },

  deleteZone: async (id: string): Promise<void> => {
    if (IS_DEMO) {
      await delay()
      const idx = mock._zones.findIndex((z) => z.id_zone === id)
      if (idx !== -1) mock._zones.splice(idx, 1)
      return
    }
    const { data } = await api.delete<ApiResponse<null>>(`/config/zones/${id}`)
    extractData(data)
  },

  // ── Catégories ─────────────────────────────────────────────
  listCategories: async (): Promise<CategorieVehicule[]> => {
  if (IS_DEMO) { await delay(); return [...mock._categories] }
  const { data } = await api.get<ApiResponse<{ data: CategorieVehicule[]; meta: any }>>('/config/categories')
  return extractData(data).data
},
  createCategorie: async (payload: Omit<CategorieVehicule, 'id_categorie'>): Promise<CategorieVehicule> => {
    if (IS_DEMO) {
      await delay()
      const c: CategorieVehicule = { ...payload, id_categorie: `c-${Date.now()}` }
      mock._categories.push(c)
      return c
    }
    const { data } = await api.post<ApiResponse<CategorieVehicule>>('/config/categories', payload)
    return extractData(data)
  },

  updateCategorie: async (id: string, payload: Partial<CategorieVehicule>): Promise<CategorieVehicule> => {
    if (IS_DEMO) {
      await delay()
      const idx = mock._categories.findIndex((c) => c.id_categorie === id)
      mock._categories[idx] = { ...mock._categories[idx], ...payload }
      return mock._categories[idx]
    }
    const { data } = await api.put<ApiResponse<CategorieVehicule>>(`/config/categories/${id}`, payload)
    return extractData(data)
  },

  deleteCategorie: async (id: string): Promise<void> => {
    if (IS_DEMO) {
      await delay()
      const idx = mock._categories.findIndex((c) => c.id_categorie === id)
      if (idx !== -1) mock._categories.splice(idx, 1)
      return
    }
    const { data } = await api.delete<ApiResponse<null>>(`/config/categories/${id}`)
    extractData(data)
  },

  // ── Matrice tarifs zone × catégorie ────────────────────────
  listTarifsParZone: async (id_zone: string): Promise<TarifCategorieZone[]> => {
    if (IS_DEMO) {
      await delay()
      return mock._tarifs.filter((t) => t.id_zone === id_zone)
    }
    const { data } = await api.get<ApiResponse<TarifCategorieZone[]>>(`/config/tarifs/${id_zone}`)
    return extractData(data)
  },

  upsertTarif: async (payload: TarifCategorieZone): Promise<TarifCategorieZone> => {
    if (IS_DEMO) {
      await delay()
      const idx = mock._tarifs.findIndex(
        (t) => t.id_zone === payload.id_zone && t.id_categorie === payload.id_categorie
      )
      if (idx !== -1) {
        mock._tarifs[idx] = { ...mock._tarifs[idx], ...payload }
      } else {
        mock._tarifs.push(payload)
      }
      return payload
    }
    const { data } = await api.put<ApiResponse<TarifCategorieZone>>('/config/tarifs', payload)
    return extractData(data)
  },

  // ── Promos ─────────────────────────────────────────────────
  listPromos: async (): Promise<CodePromo[]> => {
    if (IS_DEMO) { await delay(); return [...mock.MOCK_PROMOS] }
    const { data } = await api.get<ApiResponse<CodePromo[]>>('/code-promo')
    return extractData(data)
  },

  createPromo: async (payload: Omit<CodePromo, 'id_promo' | 'nb_utilisations_actuel'>): Promise<CodePromo> => {
    if (IS_DEMO) {
      await delay()
      const p: CodePromo = { ...payload, id_promo: `pr-${Date.now()}`, nb_utilisations_actuel: 0 }
      mock.MOCK_PROMOS.push(p)
      return p
    }
    const { data } = await api.post<ApiResponse<CodePromo>>('/code-promo', payload)
    return extractData(data)
  },

  updatePromo: async (id: string, payload: Partial<CodePromo>): Promise<CodePromo> => {
    if (IS_DEMO) {
      await delay()
      const idx = mock.MOCK_PROMOS.findIndex((p) => p.id_promo === id)
      mock.MOCK_PROMOS[idx] = { ...mock.MOCK_PROMOS[idx], ...payload }
      return mock.MOCK_PROMOS[idx]
    }
    const { data } = await api.put<ApiResponse<CodePromo>>(`/code-promo/${id}`, payload)
    return extractData(data)
  },

  deletePromo: async (id: string): Promise<void> => {
    if (IS_DEMO) {
      await delay()
      const idx = mock.MOCK_PROMOS.findIndex((p) => p.id_promo === id)
      if (idx !== -1) mock.MOCK_PROMOS.splice(idx, 1)
      return
    }
    const { data } = await api.delete<ApiResponse<null>>(`/code-promo/${id}`)
    extractData(data)
  },
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// 
export const dashboardService = {
  kpis: async (): Promise<AdminKpis> => {
    if (IS_DEMO) { await delay(); return mock.MOCK_KPIS }
    const { data } = await api.get<ApiResponse<AdminKpis>>('/dashboard/kpis'); return extractData(data)
  },
  coursesSemaine: async (): Promise<ChartDataPoint[]> => {
    if (IS_DEMO) { await delay(); return mock.MOCK_COURSES_SEMAINE }
    const { data } = await api.get<ApiResponse<ChartDataPoint[]>>('/dashboard/courses-semaine'); return extractData(data)
  },
  evolutionMensuelle: async (): Promise<ChartDataPoint[]> => {
    if (IS_DEMO) { await delay(); return mock.MOCK_EVOLUTION }
    const { data } = await api.get<ApiResponse<ChartDataPoint[]>>('/dashboard/evolution-mensuelle'); return extractData(data)
  },
  moyensPaiement: async (): Promise<{ name: string; value: number }[]> => {
    if (IS_DEMO) { await delay(); return mock.MOCK_PAIEMENTS }
    const { data } = await api.get<ApiResponse<{ name: string; value: number }[]>>('/dashboard/moyens-paiement'); return extractData(data)
  },
  topChauffeurs: async (): Promise<TopChauffeur[]> => {
    if (IS_DEMO) { await delay(); return mock.MOCK_TOP_CHAUFFEURS }
    const { data } = await api.get<ApiResponse<TopChauffeur[]>>('/dashboard/top-chauffeurs'); return extractData(data)
  },
}

// ═══════════════════════════════════════════════════════════════
// DEMANDES D'EXTENSION DE PROFIL
// ═══════════════════════════════════════════════════════════════
export const demandeExtensionService = {
  list: async (params?: {
    page?: number; limit?: number; statut?: string; extension_type?: string
  }): Promise<PaginatedResponse<DemandeExtension>> => {
    if (IS_DEMO) {
      await delay()
      // Retourner data en mode démo
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      }
    }
    const { data } = await api.get<ApiResponse<{
      demandes: DemandeExtension[];
      total: number;
      pages: number;
    }>>('/demandes-extension/admin', { params })

    const { demandes, total, pages } = extractData(data)
    return {
      data: demandes,
      total,
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      totalPages: pages,
    }
  },

  getById: async (id: string): Promise<DemandeExtension> => {
    if (IS_DEMO) { await delay(); return {} as DemandeExtension }
    const { data } = await api.get<ApiResponse<DemandeExtension>>(`/demandes-extension/${id}`)
    return extractData(data)
  },

  getMesDemandes: async (): Promise<DemandeExtension[]> => {
    if (IS_DEMO) { await delay(); return [] }
    const { data } = await api.get<ApiResponse<DemandeExtension[]>>('/demandes-extension/mes-demandes')
    return extractData(data)
  },

  updateStatut: async (id: string, payload: UpdateDemandeExtensionPayload): Promise<DemandeExtension> => {
    if (IS_DEMO) { await delay(); return {} as DemandeExtension }
    const { data } = await api.patch<ApiResponse<DemandeExtension>>(`/demandes-extension/${id}/statut`, payload)
    return extractData(data)
  },
}
