import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { MapPin, AlertCircle, CheckCircle, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import { authService } from '@/services/api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  // Le backend envoie un lien du type : https://admin.ndjigi.bf/auth/reset-password?token=XXXX
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [violations, setViolations] = useState<string[]>([])
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setViolations([])

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (!token) {
      setError('Lien de reinitialisation invalide ou expire.')
      return
    }

    setLoading(true)
    try {
      await authService.resetPassword(token, password)
      setDone(true)
      sessionStorage.setItem('auth_flash_success', 'Mot de passe modifie avec succes. Connectez-vous avec votre nouveau mot de passe.')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err: any) {
      const backendViolations = err?.response?.data?.errors?.violations
      if (Array.isArray(backendViolations)) {
        setViolations(backendViolations)
      }
      setError(err?.response?.data?.message || err?.message || 'Lien expire ou invalide. Recommencez la procedure.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl border border-border shadow-2xl p-8 w-full max-w-md text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <p className="font-semibold">Lien invalide</p>
          <p className="text-sm text-muted-foreground">Ce lien de reinitialisation est invalide ou a expire.</p>
          <Link to="/auth/forgot-password" className="inline-block text-sm text-primary hover:underline">
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-card rounded-2xl border border-border shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
              <MapPin className="h-7 w-7 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold">Nouveau mot de passe</h1>
            <p className="text-sm text-muted-foreground mt-1 text-center">
              Choisissez un mot de passe securise (minimum 12 caracteres)
            </p>
          </div>

          {done ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-full bg-success/15 flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-success" />
                </div>
              </div>
              <div>
                <p className="font-semibold">Mot de passe modifie !</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Vous allez etre redirige vers la page de connexion...
                </p>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {violations.length > 0 && (
                <div className="mb-5 rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                  <p className="font-semibold mb-2">Regles non respectees :</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {violations.map((violation) => (
                      <li key={violation}>{violation}</li>
                    ))}
                  </ul>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nouveau mot de passe</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                      required
                      minLength={12}
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground"
                    />
                    <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Confirmer le mot de passe</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="********"
                      required
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground"
                    />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirm && password !== confirm && (
                    <p className="text-xs text-destructive mt-1">Les mots de passe ne correspondent pas</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-2.5 text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
                </button>
              </form>

              <div className="mt-5 text-center">
                <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                  Retour a la connexion
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
