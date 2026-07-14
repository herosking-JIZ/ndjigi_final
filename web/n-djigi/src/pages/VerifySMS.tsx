import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, Loader2, RotateCcw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getRoleRedirectUrl, ACCESS_ERROR_MESSAGES } from '@/utils/roleRedirect'

export default function VerifySMS() {
  const location = useLocation()
  const navigate = useNavigate()
  const { verifySms, resendSms, user } = useAuth()

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [attemptsRemaining, setAttemptsRemaining] = useState(3)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const loginToken = (location.state as any)?.loginToken
  const phoneMasked = (location.state as any)?.phoneMasked

  useEffect(() => {
    if (!loginToken) {
      navigate('/login', { replace: true })
    }
    inputRefs.current[0]?.focus()
  }, [loginToken, navigate])

  // Cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const handleInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return // Only digits

    const newCode = [...code]
    newCode[index] = value.slice(-1) // Derniers chiffre uniquement

    setCode(newCode)

    // Auto-focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all digits entered
    if (newCode.every((digit) => digit !== '')) {
      handleSubmit(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (codeValue?: string) => {
    const smsCode = codeValue || code.join('')

    if (smsCode.length !== 6) {
      setError('Entrez les 6 chiffres')
      return
    }

    setError('')
    setLoading(true)

    try {
      const authenticatedUser = await verifySms(loginToken, smsCode)

      // Rediriger selon le rôle de l'utilisateur (utiliser la réponse directe, pas le hook)
      if (authenticatedUser) {
        console.log('✅ [VerifySMS] Utilisateur authentifié:', authenticatedUser.nom, 'Rôle:', authenticatedUser.role)
        navigate(getRoleRedirectUrl(authenticatedUser.role), { replace: true })
      } else {
        console.log('❌ [VerifySMS] Pas d\'utilisateur retourné')
        navigate('/', { replace: true })
      }
    } catch (err: any) {
      // Vérifier si c'est une erreur 403 (mobile-only role)
      if (err?.response?.status === 403 && err?.response?.data?.code === 'MOBILE_ONLY_ROLE') {
        setError(ACCESS_ERROR_MESSAGES.MOBILE_ONLY)
        return
      }

      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Erreur lors de la vérification'
      setError(msg)

      const remaining = err?.response?.data?.data?.attempts_remaining
      if (remaining !== undefined) {
        setAttemptsRemaining(remaining)
      }

      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    try {
      await resendSms(loginToken)
      setResendCooldown(60)
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur lors du renvoi'
      setError(msg)

      const retryAfter = err?.response?.data?.data?.retry_after
      if (retryAfter) {
        setResendCooldown(retryAfter)
      }
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
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              Vérification par SMS
            </h1>
            <p className="text-sm text-muted-foreground">
              Un code a été envoyé à {phoneMasked}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Code Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-4 text-center">
              Entrez le code à 6 chiffres
            </label>
            <div className="flex gap-2 justify-center">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el
                  }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInput(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  placeholder="•"
                  disabled={loading}
                  className="w-12 h-14 text-center text-xl font-semibold rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-60 transition-all"
                />
              ))}
            </div>
          </div>

          {/* Attempts remaining */}
          {attemptsRemaining < 3 && (
            <div className="mb-4 text-center text-sm text-amber-600">
              {attemptsRemaining} tentative{attemptsRemaining > 1 ? 's' : ''} restante{attemptsRemaining > 1 ? 's' : ''}
            </div>
          )}

          {/* Resend Button */}
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || loading}
            className="w-full mb-4 rounded-xl border border-input bg-background text-foreground font-semibold py-2.5 text-sm flex items-center justify-center gap-2 hover:bg-accent disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : 'Renvoyer le code'}
          </button>

          {/* Submit Button */}
          <button
            onClick={() => handleSubmit()}
            disabled={loading || code.some((digit) => !digit)}
            className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-2.5 text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Vérification...' : 'Vérifier'}
          </button>

          {/* Help text */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-center text-xs text-muted-foreground">
              Vous n'avez pas reçu le code ?{' '}
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="text-primary hover:underline disabled:opacity-60"
              >
                Renvoyer
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
