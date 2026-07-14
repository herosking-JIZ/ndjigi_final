import { useState } from 'react'
import { Check, X, Eye, EyeOff, AlertCircle } from 'lucide-react'

interface PasswordRule {
  id: string
  label: string
  test: (password: string) => boolean
}

const PASSWORD_RULES: PasswordRule[] = [
  { id: 'min-length', label: 'Au moins 12 caractères', test: (p) => p.length >= 12 },
  { id: 'uppercase', label: 'Au moins 1 majuscule', test: (p) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'Au moins 1 minuscule', test: (p) => /[a-z]/.test(p) },
  { id: 'digit', label: 'Au moins 1 chiffre', test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'Au moins 1 caractère spécial', test: (p) => /[!@#$%^&*]/.test(p) },
]

interface PasswordSetupFormProps {
  email?: string
  parkingName?: string
  onSubmit: (password: string) => Promise<void>
  loading?: boolean
  error?: string | null
}

export function PasswordSetupForm({ email, parkingName, onSubmit, loading, error }: PasswordSetupFormProps) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [formError, setFormError] = useState<string | null>(error || null)

  const passedRules = PASSWORD_RULES.filter((rule) => rule.test(password))
  const allRulesPassed = passedRules.length === PASSWORD_RULES.length
  const passwordsMatch = password && confirmation && password === confirmation
  const isValid = allRulesPassed && passwordsMatch && acceptedTerms

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!isValid) {
      setFormError('Veuillez respecter tous les critères')
      return
    }

    try {
      await onSubmit(password)
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de l\'activation')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {email && (
        <div className="bg-muted/50 p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground"><strong>Email:</strong> {email}</p>
          {parkingName && <p className="text-sm text-muted-foreground mt-2"><strong>Parking:</strong> {parkingName}</p>}
        </div>
      )}

      {formError && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {formError}
        </div>
      )}

      <div className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-foreground">Mot de passe</span>
          <div className="mt-2 relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="Entrez un mot de passe fort"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground">Confirmer le mot de passe</span>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            disabled={loading}
            placeholder="Confirmez votre mot de passe"
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 mt-2"
          />
        </label>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800 space-y-2">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Critères du mot de passe :</p>
        <ul className="space-y-1">
          {PASSWORD_RULES.map((rule) => {
            const passed = rule.test(password)
            return (
              <li key={rule.id} className="flex items-center gap-2 text-sm">
                {passed ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={passed ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}>
                  {rule.label}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      {password && confirmation && !passwordsMatch && (
        <div className="text-sm text-destructive">Les mots de passe ne correspondent pas</div>
      )}

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          disabled={loading}
          className="w-4 h-4 rounded border-border"
        />
        <span className="text-sm text-muted-foreground">
          J'accepte les <a href="/conditions" target="_blank" rel="noopener" className="text-primary hover:underline">conditions d'utilisation</a>
        </span>
      </label>

      <button
        type="submit"
        disabled={!isValid || loading}
        className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Activation en cours...' : 'Activer mon compte'}
      </button>
    </form>
  )
}
