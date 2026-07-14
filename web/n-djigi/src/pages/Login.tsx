import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, AlertCircle, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getRoleRedirectUrl, ACCESS_ERROR_MESSAGES } from '@/utils/roleRedirect'

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const flash = sessionStorage.getItem('auth_flash_success')
    if (flash) {
      setSuccessMessage(flash)
      sessionStorage.removeItem('auth_flash_success')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)
    try {
      await login(email, password)

      // Vérifier si c'est un rôle web valide
      if (user) {
        navigate(getRoleRedirectUrl(user.role))
      } else {
        navigate('/')
      }
    } catch (err: any) {
      // Vérifier si c'est une réponse 2FA
      if (err?.response?.data?.requires_2fa) {
        navigate('/verify-sms', {
          state: {
            loginToken: err.response.data.login_token,
            phoneMasked: err.response.data.phone_masked
          }
        })
        return
      }

      // Vérifier si c'est une erreur 403 (mobile-only role)
      if (err?.response?.status === 403 && err?.response?.data?.code === 'MOBILE_ONLY_ROLE') {
        setError(ACCESS_ERROR_MESSAGES.MOBILE_ONLY)
        return
      }

      // Sinon : erreur normale
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Identifiants incorrects. Veuillez réessayer.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      {/* Background decoration */}
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
            <h1 className="font-display text-2xl font-bold text-foreground">N'DJIGI</h1>
            <p className="text-sm text-muted-foreground mt-1 text-center">
              Plateforme de mobilité — Administration
            </p>
          </div>

          {/* Error */}
          {successMessage && (
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-success/10 border border-success/30 text-success px-4 py-3 text-sm animate-fade-in">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Adresse email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium">Mot de passe</label>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-2.5 text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
