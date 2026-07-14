/**
 * Gestionnaire de Parking — Types TypeScript
 * Aligned with backend API contracts (Phase 1)
 */

// ─── Document Types ──────────────────────────────────────────
export type GestionnaireDocumentType = 'cnib' | 'casier_judiciaire' | 'photo_identite'

// ─── Payload Types ───────────────────────────────────────────

export interface CreateGestionnairePayload {
  nom: string
  prenom: string
  email: string
  numero_telephone: string
  adresse?: string
  id_parking: string
}

// ─── Response Types ──────────────────────────────────────────

export interface GestionnaireCreationResponse {
  id_utilisateur: string
  email: string
  parking: {
    id_parking: string
    nom: string
  }
  invitation_sent_at: string
  invitation_expires_at: string
}

export interface InvitationVerifyResponse {
  email: string
  id_utilisateur: string
  parking_nom: string
}

export interface FirstConnectionCompleteResponse {
  id_utilisateur: string
  email: string
  statut_compte: 'actif'
}

export interface InvitationResendResponse {
  id_utilisateur: string
  email: string
  invitation_sent_at: string
  invitation_expires_at: string
}

export interface DocumentUploadResponse {
  id_document: string
  type: GestionnaireDocumentType
  url_fichier: string
  statut_verification: 'en_attente'
}

export interface FirstConnectionPayload {
  token: string
  email: string
  nouveau_mot_de_passe: string
  accepte_conditions: boolean
}

export interface DocumentUploadPayload {
  type: GestionnaireDocumentType
  fichier: File
}
