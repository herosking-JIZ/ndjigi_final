/**
 * SERVICES/GESTIONNAIRESERVICE.TS
 * Frontend API calls for gestionnaire creation and invitation system
 */

import api from './api'
import type { ApiResponse } from '@/types'
import type {
  CreateGestionnairePayload,
  GestionnaireCreationResponse,
  InvitationVerifyResponse,
  FirstConnectionCompleteResponse,
  InvitationResendResponse,
  DocumentUploadResponse,
  FirstConnectionPayload,
  DocumentUploadPayload,
} from '@/types/gestionnaire'

/**
 * Helper: extract data from API response
 */
function extractData<T>(apiResponse: ApiResponse<T>): T {
  if (!apiResponse.success) {
    const err: any = new Error(apiResponse.message || 'Erreur serveur')
    err.backendErrors = apiResponse.errors
    err.response = { data: apiResponse }
    throw err
  }
  return apiResponse.data
}

export const gestionnaireService = {
  /**
   * POST /admin/gestionnaires
   * Create a new gestionnaire (admin only)
   */
  async create(payload: CreateGestionnairePayload): Promise<GestionnaireCreationResponse> {
    const { data } = await api.post<ApiResponse<GestionnaireCreationResponse>>(
      '/admin/gestionnaires',
      payload
    )
    return extractData(data)
  },

  /**
   * GET /auth/verify-invitation?token=XXX
   * Verify invitation token (public route)
   */
  async verifyToken(token: string): Promise<InvitationVerifyResponse> {
    const { data } = await api.get<ApiResponse<InvitationVerifyResponse>>(
      '/auth/verify-invitation',
      { params: { token } }
    )
    return extractData(data)
  },

  /**
   * POST /auth/complete-first-connection
   * Complete account activation - set password (public route)
   */
  async completeFirstConnection(
    payload: FirstConnectionPayload
  ): Promise<FirstConnectionCompleteResponse> {
    const { data } = await api.post<ApiResponse<FirstConnectionCompleteResponse>>(
      '/auth/complete-first-connection',
      payload
    )
    return extractData(data)
  },

  /**
   * POST /auth/resend-invitation
   * Resend invitation email (admin only)
   */
  async resendInvitation(id_utilisateur: string): Promise<InvitationResendResponse> {
    const { data } = await api.post<ApiResponse<InvitationResendResponse>>(
      '/auth/resend-invitation',
      { id_utilisateur }
    )
    return extractData(data)
  },

  /**
   * POST /documents
   * Upload document (CNIB, Casier judiciaire, Photo d'identité)
   * Auth: Bearer token required
   */
  async uploadDocument(payload: DocumentUploadPayload): Promise<DocumentUploadResponse> {
    const formData = new FormData()
    // IMPORTANT: Text fields MUST be appended BEFORE the file.
    // Multer parses multipart fields in stream order; if the file arrives
    // before 'type', req.body.type will be undefined when Multer generates
    // the filename, resulting in "unknown" instead of the actual type.
    formData.append('type', payload.type)
    formData.append('fichier', payload.fichier)

    const { data } = await api.post<ApiResponse<DocumentUploadResponse>>(
      '/documents',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    )
    return extractData(data)
  }
}
