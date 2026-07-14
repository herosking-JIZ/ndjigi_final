import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertCircle, Loader2, Check, Upload, FileText } from 'lucide-react'
import { gestionnaireService, parkingsService } from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { DocumentUploadWidget } from '@/components/DocumentUploadWidget'
import type { CreateGestionnairePayload, Parking, GestionnaireDocumentType, DocumentUploadResponse } from '@/types'

type Step = 'info' | 'parking' | 'documents' | 'success'

interface FormData {
  nom: string
  prenom: string
  email: string
  numero_telephone: string
  adresse: string
  id_parking: string
}

interface DocumentUpload {
  type: GestionnaireDocumentType
  uploaded: boolean
  response?: DocumentUploadResponse
}

export default function CreateGestionnaire() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [step, setStep] = useState<Step>('info')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [parkings, setParkings] = useState<Parking[]>([])
  const [parkingsLoading, setParkingsLoading] = useState(true)

  const [form, setForm] = useState<FormData>({
    nom: '',
    prenom: '',
    email: '',
    numero_telephone: '',
    adresse: '',
    id_parking: '',
  })

  const [documents, setDocuments] = useState<Record<GestionnaireDocumentType, DocumentUpload>>({
    cnib: { type: 'cnib', uploaded: false },
    casier_judiciaire: { type: 'casier_judiciaire', uploaded: false },
    photo_identite: { type: 'photo_identite', uploaded: false },
  })

  const [createdGestionnaire, setCreatedGestionnaire] = useState<{
    id_utilisateur: string
    email: string
    parking_nom: string
  } | null>(null)

  // Load parkings on mount
  useEffect(() => {
    const loadParkings = async () => {
      try {
        const data = await parkingsService.list()
        setParkings(data)
      } catch (err) {
        console.error('Failed to load parkings:', err)
      } finally {
        setParkingsLoading(false)
      }
    }
    loadParkings()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const validateStep = (): boolean => {
    setError('')
    switch (step) {
      case 'info':
        if (!form.nom.trim()) {
          setError('Le nom est requis')
          return false
        }
        if (!form.prenom.trim()) {
          setError('Le prénom est requis')
          return false
        }
        if (!form.email.trim()) {
          setError('L\'email est requis')
          return false
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
          setError('Email invalide')
          return false
        }
        if (!form.numero_telephone.trim()) {
          setError('Le numéro de téléphone est requis')
          return false
        }
        return true
      case 'parking':
        if (!form.id_parking) {
          setError('Veuillez sélectionner un parking')
          return false
        }
        return true
      case 'documents':
        return true
      default:
        return true
    }
  }

  const handleNextStep = () => {
    if (!validateStep()) return

    if (step === 'info') {
      setStep('parking')
    } else if (step === 'parking') {
      setStep('documents')
    } else if (step === 'documents') {
      handleCreateGestionnaire()
    }
  }

  const handlePreviousStep = () => {
    if (step === 'parking') {
      setStep('info')
    } else if (step === 'documents') {
      setStep('parking')
    }
  }

  const handleCreateGestionnaire = async () => {
    setLoading(true)
    setError('')

    try {
      const payload: CreateGestionnairePayload = {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim(),
        numero_telephone: form.numero_telephone.trim(),
        adresse: form.adresse.trim() || undefined,
        id_parking: form.id_parking,
      }

      const response = await gestionnaireService.create(payload)
      setCreatedGestionnaire({
        id_utilisateur: response.id_utilisateur,
        email: response.email,
        parking_nom: response.parking.nom,
      })
      setStep('success')

      toast({
        title: 'Gestionnaire créé',
        description: `Identifiants temporaires envoyés à ${response.email}`,
        variant: 'success',
      })
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Erreur lors de la création'
      setError(message)
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentSuccess = (type: GestionnaireDocumentType, response: DocumentUploadResponse) => {
    setDocuments((prev) => ({
      ...prev,
      [type]: { type, uploaded: true, response },
    }))
    toast({
      title: 'Document uploadé',
      description: `${type} enregistré`,
      variant: 'success',
    })
  }

  const handleGoBack = () => {
    navigate('/gestionnaires')
  }

  const handleReturn = () => {
    navigate('/gestionnaires')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={handleGoBack}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold">Créer un gestionnaire</h1>
          <p className="text-muted-foreground mt-1">
            Configurez les informations du nouveau gestionnaire de parking
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex gap-4">
        {(['info', 'parking', 'documents', 'success'] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`flex items-center gap-2 ${i > 0 ? 'before:flex-1 before:h-1 before:bg-border before:mr-4' : ''}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                step === s
                  ? 'bg-primary text-primary-foreground'
                  : (['info', 'parking', 'documents'].indexOf(s) < ['info', 'parking', 'documents'].indexOf(step))
                    ? 'bg-success text-success-foreground'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {(['info', 'parking', 'documents'].indexOf(s) < ['info', 'parking', 'documents'].indexOf(step)) ? (
                <Check className="h-5 w-5" />
              ) : (
                i + 1
              )}
            </div>
            <span className="text-sm font-medium capitalize">{s === 'info' ? 'Infos' : s === 'parking' ? 'Parking' : s === 'documents' ? 'Documents' : 'Succès'}</span>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="bg-card rounded-lg border border-border p-8">
        {/* Info Step */}
        {step === 'info' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Informations personnelles</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Prénom *</label>
                  <input
                    type="text"
                    name="prenom"
                    value={form.prenom}
                    onChange={handleInputChange}
                    placeholder="Jean"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nom *</label>
                  <input
                    type="text"
                    name="nom"
                    value={form.nom}
                    onChange={handleInputChange}
                    placeholder="Dupont"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  placeholder="jean@exemple.com"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Téléphone *</label>
                <input
                  type="tel"
                  name="numero_telephone"
                  value={form.numero_telephone}
                  onChange={handleInputChange}
                  placeholder="+226 XXXX XXXX"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Adresse</label>
                <input
                  type="text"
                  name="adresse"
                  value={form.adresse}
                  onChange={handleInputChange}
                  placeholder="123 Rue de la Paix, Ouagadougou"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Parking Step */}
        {step === 'parking' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Sélectionner un parking</h2>

              {parkingsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : parkings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun parking disponible
                </div>
              ) : (
                <div className="space-y-3">
                  {parkings.map((parking) => (
                    <label
                      key={parking.id_parking}
                      className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="radio"
                        name="id_parking"
                        value={parking.id_parking}
                        checked={form.id_parking === parking.id_parking}
                        onChange={handleInputChange}
                        className="w-4 h-4"
                      />
                      <div>
                        <p className="font-medium">{parking.nom}</p>
                        <p className="text-sm text-muted-foreground">{parking.adresse}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}

        {/* Documents Step */}
        {step === 'documents' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Documents requis</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Veuillez uploader les documents d'identification. Les documents seront vérifiés ultérieurement.
              </p>

              <div className="space-y-6">
                <DocumentUploadWidget
                  type="cnib"
                  onSuccess={(doc) => handleDocumentSuccess('cnib', doc)}
                  onError={(err) => setError(err)}
                />
                <DocumentUploadWidget
                  type="casier_judiciaire"
                  onSuccess={(doc) => handleDocumentSuccess('casier_judiciaire', doc)}
                  onError={(err) => setError(err)}
                />
                <DocumentUploadWidget
                  type="photo_identite"
                  onSuccess={(doc) => handleDocumentSuccess('photo_identite', doc)}
                  onError={(err) => setError(err)}
                />
              </div>

              <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <FileText className="h-4 w-4 inline mr-2" />
                  Les documents sont optionnels à cette étape. Le gestionnaire pourra les upload après activation du compte.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && createdGestionnaire && (
          <div className="space-y-6 text-center py-8">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center">
                <Check className="h-8 w-8 text-success" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Gestionnaire créé</h2>
              <p className="text-muted-foreground mt-2">
                Les identifiants temporaires ont été envoyés à {createdGestionnaire.email}
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg border border-border space-y-3 mt-6">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{createdGestionnaire.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Parking assigné</p>
                <p className="font-medium">{createdGestionnaire.parking_nom}</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Le gestionnaire se connectera avec les identifiants reçus et devra créer un nouveau mot de passe lors de sa première connexion.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {step !== 'success' && (
        <div className="flex gap-3 justify-between">
          <button
            onClick={step === 'info' ? handleGoBack : handlePreviousStep}
            disabled={loading}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
          >
            {step === 'info' ? 'Annuler' : 'Précédent'}
          </button>
          <button
            onClick={handleNextStep}
            disabled={loading || parkingsLoading}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Création en cours...
              </>
            ) : step === 'documents' ? (
              <>
                <Check className="h-4 w-4" />
                Créer
              </>
            ) : (
              'Suivant'
            )}
          </button>
        </div>
      )}

      {step === 'success' && (
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleReturn}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retour à la liste
          </button>
        </div>
      )}
    </div>
  )
}
