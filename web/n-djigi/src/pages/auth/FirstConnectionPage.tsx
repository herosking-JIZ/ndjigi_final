import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { MapPin, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { gestionnaireService } from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { PasswordSetupForm } from '@/components/PasswordSetupForm'
import type { InvitationVerifyResponse, FirstConnectionPayload } from '@/types'

export default function FirstConnectionPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const token = searchParams.get('token')
  const [verification, setVerification] = useState<InvitationVerifyResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Lien invalide ou expiré')
        setLoading(false)
        return
      }

      try {
        const data = await gestionnaireService.verifyToken(token)
        setVerification(data)
        setError('')
      } catch (err: any) {
        setError('Lien invalide ou expiré')
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [token])

  const handlePasswordSubmit = async (password: string) => {
    if (!verification || !token) return

    setSubmitting(true)
    setError('')

    try {
      const payload: FirstConnectionPayload = {
        token,
        email: verification.email,
        nouveau_mot_de_passe: password,
        accepte_conditions: true,
      }

      await gestionnaireService.completeFirstConnection(payload)
      setSuccess(true)

      toast({
        title: 'Compte activé',
        description: 'Votre compte a été activé avec succès',
        variant: 'success',
      })

      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1500)
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Erreur lors de l\'activation'
      setError(message)
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-card rounded-2xl border border-border shadow-2xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
              <MapPin className="h-7 w-7 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold">Activation de compte</h1>
            <p className="text-sm text-muted-foreground mt-1 text-center">
              Configurez votre mot de passe pour commencer
            </p>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Vérification du lien...</p>
            </div>
          )}

          {/* Success state */}
          {success && (
            <div className="text-center space-y-4 py-8">
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-full bg-success/15 flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-success" />
                </div>
              </div>
              <div>
                <p className="font-semibold">Compte activé !</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Vous allez être redirigé vers la connexion...
                </p>
              </div>
            </div>
          )}

          {/* Error state */}
          {!loading && !success && error && !verification && (
            <div className="text-center space-y-4 py-8">
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-full bg-destructive/15 flex items-center justify-center">
                  <AlertCircle className="h-7 w-7 text-destructive" />
                </div>
              </div>
              <div>
                <p className="font-semibold">Lien invalide</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Form state */}
          {!loading && !success && verification && (
            <PasswordSetupForm
              email={verification.email}
              parkingName={verification.parking_nom}
              onSubmit={handlePasswordSubmit}
              loading={submitting}
              error={error || null}
            />
          )}
        </div>
      </div>
    </div>
  )
}
