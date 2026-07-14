import { useState } from 'react'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { authService } from '@/services/api'
import { useToast } from '@/hooks/useToast'

export default function ChangePassword() {
  const { toast } = useToast()
  const [form, setForm] = useState({ ancien: '', nouveau: '', confirm: '' })
  const [show, setShow] = useState({ ancien: false, nouveau: false, confirm: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const toggle = (field: keyof typeof show) => setShow((s) => ({ ...s, [field]: !s[field] }))
  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    // Validate new password: 12+ chars, uppercase, lowercase, digit, special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/
    if (!passwordRegex.test(form.nouveau)) {
      setError('Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.')
      return
    }
    if (form.nouveau !== form.confirm) { setError('Les nouveaux mots de passe ne correspondent pas.'); return }

    setLoading(true)
    try {
      await authService.changePassword(form.ancien, form.nouveau)
      setDone(true)
      setForm({ ancien: '', nouveau: '', confirm: '' })
      toast({ title: 'Mot de passe modifié', description: 'Votre mot de passe a été mis à jour.', variant: 'success' })
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Ancien mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <h1 className="text-2xl font-display font-bold">Changer le mot de passe</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Mettez à jour votre mot de passe de connexion</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        {done && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-success/10 border border-success/30 text-success px-4 py-3 text-sm animate-fade-in">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>Mot de passe modifié avec succès.</span>
          </div>
        )}
        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'ancien', label: 'Mot de passe actuel', auto: 'current-password' },
            { key: 'nouveau', label: 'Nouveau mot de passe', auto: 'new-password' },
            { key: 'confirm', label: 'Confirmer le nouveau mot de passe', auto: 'new-password' },
          ].map(({ key, label, auto }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={show[key as keyof typeof show] ? 'text' : 'password'}
                  value={form[key as keyof typeof form]}
                  onChange={set(key as keyof typeof form)}
                  required
                  autoComplete={auto}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground"
                />
                <button type="button" onClick={() => toggle(key as keyof typeof show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {show[key as keyof typeof show] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {key === 'confirm' && form.confirm && form.nouveau !== form.confirm && (
                <p className="text-xs text-destructive mt-1">Les mots de passe ne correspondent pas</p>
              )}
            </div>
          ))}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-primary text-primary-foreground font-semibold px-6 py-2.5 text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Enregistrement...' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
