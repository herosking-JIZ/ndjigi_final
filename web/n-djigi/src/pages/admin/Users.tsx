import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye, Plus, Wallet, Loader2, X, AlertCircle } from 'lucide-react'
import { utilisateursService } from '@/services/api'
import { StatusBadge } from '@/components/StatusBadge'
import { useToast } from '@/hooks/useToast'
import { formatDateShort, formatFCFA } from '@/lib/utils'
import type { Utilisateur, AccountStatus, CreateUserPayload, UserRole } from '@/types'

// ─── Labels rôles ─────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  gestionnaire: 'Gestionnaire',
  chauffeur: 'Chauffeur',
  passager: 'Passager',
  proprietaire: 'Propriétaire',
}

// Rôles que l'admin peut créer (gestionnaire créé via un flux dédié)
const CREATABLE_ROLES: { value: UserRole; label: string }[] = [
  { value: 'chauffeur', label: 'Chauffeur' },
  { value: 'passager', label: 'Passager' },
  { value: 'proprietaire', label: 'Propriétaire de véhicule' },
]

// ─── Modal Créer Utilisateur ──────────────────────────────────
interface CreateUserModalProps {
  onClose: () => void
  onCreated: () => void
}

function CreateUserModal({ onClose, onCreated }: CreateUserModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<CreateUserPayload>({
    nom: '', prenom: '', email: '', numero_telephone: '',
    mot_de_passe: '', role: 'chauffeur', adresse: '', parking_id: '',
  })

  const set = (field: keyof CreateUserPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.nom || !form.prenom || !form.email || !form.numero_telephone || !form.mot_de_passe) {
      setError('Tous les champs obligatoires doivent être remplis.')
      return
    }

    const payload: CreateUserPayload = {
      ...form,
      parking_id: form.parking_id || undefined,
      adresse: form.adresse || undefined,
    }

    setLoading(true)
    try {
      await utilisateursService.create(payload)
      toast({ title: 'Utilisateur créé', description: `${form.prenom} ${form.nom} a été créé.`, variant: 'success' })
      onCreated()
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Impossible de créer l\'utilisateur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-fade-in overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg">Créer un utilisateur</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Rôle — en premier pour conditionner le reste */}
          <div>
            <label className="block text-sm font-medium mb-1">Rôle <span className="text-destructive">*</span></label>
            <select
              value={form.role}
              onChange={set('role')}
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            >
              {CREATABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Nom / Prénom */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'prenom', label: 'Prénom' },
              { key: 'nom', label: 'Nom' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1">{label} <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={(form as any)[key]}
                  onChange={set(key as keyof CreateUserPayload)}
                  required
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            ))}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email <span className="text-destructive">*</span></label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-sm font-medium mb-1">Téléphone <span className="text-destructive">*</span></label>
            <input
              type="tel"
              value={form.numero_telephone}
              onChange={set('numero_telephone')}
              required
              placeholder="+226 70 00 00 00"
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Mot de passe initial <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={form.mot_de_passe}
              onChange={set('mot_de_passe')}
              required
              minLength={8}
              placeholder="Minimum 8 caractères"
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              L'utilisateur devra changer ce mot de passe à sa première connexion.
            </p>
          </div>

          {/* Adresse (optionnel) */}
          <div>
            <label className="block text-sm font-medium mb-1">Adresse <span className="text-muted-foreground font-normal">(optionnel)</span></label>
            <input
              type="text"
              value={form.adresse}
              onChange={set('adresse')}
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex gap-3 pt-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-sm">
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:bg-primary/90 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Création...' : 'Créer l\'utilisateur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Modal Dépôt wallet ───────────────────────────────────────
interface DepotModalProps {
  user: Utilisateur
  onClose: () => void
}

function DepotModal({ user, onClose }: DepotModalProps) {
  const { toast } = useToast()
  const [montant, setMontant] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const m = Number(montant)
    if (!m || m <= 0) { setError('Montant invalide'); return }

    setLoading(true)
    try {
      await utilisateursService.depot({
        id_utilisateur: user.id_utilisateur,
        montant: m,
        description: description || `Dépôt admin vers ${user.prenom} ${user.nom}`,
      })
      toast({
        title: 'Dépôt effectué',
        description: `${formatFCFA(m)} versés sur le wallet de ${user.prenom} ${user.nom}.`,
        variant: 'success',
      })
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Impossible d\'effectuer le dépôt.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg">Dépôt sur wallet</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="bg-muted rounded-xl px-4 py-3 mb-4 text-sm">
          <p className="text-muted-foreground text-xs mb-0.5">Bénéficiaire</p>
          <p className="font-semibold">{user.prenom} {user.nom}</p>
          <p className="text-muted-foreground">{user.email}</p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Montant (FCFA) <span className="text-destructive">*</span></label>
            <input
              type="number"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              required
              min="1"
              step="1"
              placeholder="Ex : 5000"
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description <span className="text-muted-foreground font-normal">(optionnel)</span></label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex : Remboursement course annulée"
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex gap-3 pt-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-sm">Annuler</button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-success text-success-foreground text-sm font-medium flex items-center gap-2 hover:bg-success/90 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Dépôt...' : 'Confirmer le dépôt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────
export default function Users() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [users, setUsers] = useState<Utilisateur[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [statut, setStatut] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Utilisateur | null>(null)
  const [depotTarget, setDepotTarget] = useState<Utilisateur | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const limit = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await utilisateursService.list({ page, limit, search, role, statut })
      setUsers(res?.data ?? [])
      setTotal(res?.total ?? 0)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les utilisateurs', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, search, role, statut])

  useEffect(() => { load() }, [load])

  const handleStatutChange = async (id: string, newStatut: AccountStatus) => {
    try {
      await utilisateursService.updateStatut(id, newStatut)
      setUsers((prev) => prev.map((u) => u.id_utilisateur === id ? { ...u, statut_compte: newStatut } : u))
      toast({ title: 'Statut mis à jour', variant: 'success' })
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier le statut', variant: 'destructive' })
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total} utilisateurs au total</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => navigate('/gestionnaires/create')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" />
            Créer un gestionnaire
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Créer un utilisateur
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Nom, email, téléphone…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1) }}
          className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Tous les rôles</option>
          <option value="passager">Passager</option>
          <option value="chauffeur">Chauffeur</option>
          <option value="proprietaire">Propriétaire</option>
          <option value="gestionnaire">Gestionnaire</option>
        </select>
        <select
          value={statut}
          onChange={(e) => { setStatut(e.target.value); setPage(1) }}
          className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="suspendu">Suspendu</option>
          <option value="banni">Banni</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Nom</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Contact</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Rôle(s)</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Statut</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Inscription</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : users?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Aucun utilisateur trouvé</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id_utilisateur} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{u.prenom} {u.nom}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{u.email}</div>
                      <div className="text-xs text-muted-foreground">{u.numero_telephone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles?.map((r) => (
                          <span key={r} className="px-1.5 py-0.5 bg-muted rounded text-xs">{ROLE_LABELS[r] ?? r}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={u.statut_compte} /></td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {formatDateShort(u.date_inscription)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Voir profil */}
                        <button
                          onClick={() => setSelected(u)}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Voir le profil"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {/* Dépôt wallet — disponible pour passagers et propriétaires */}
                        {(u.roles?.includes('passager') || u.roles?.includes('proprietaire')) && (
                          <button
                            onClick={() => setDepotTarget(u)}
                            className="p-1.5 rounded-lg hover:bg-success/10 text-success transition-colors"
                            title="Dépôt sur wallet"
                          >
                            <Wallet className="h-4 w-4" />
                          </button>
                        )}
                        {/* Changer statut */}
                        <select
                          value={u.statut_compte}
                          onChange={(e) => handleStatutChange(u.id_utilisateur, e.target.value as AccountStatus)}
                          className="rounded-lg border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="actif">✅ Actif</option>
                          <option value="suspendu">🚫 Suspendu</option>
                          <option value="banni">❌ Banni</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Page {page} sur {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40">←</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40">→</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal profil */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelected(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg">Profil utilisateur</h2>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Prénom', value: selected.prenom },
                { label: 'Nom', value: selected.nom },
                { label: 'Email', value: selected.email },
                { label: 'Téléphone', value: selected.numero_telephone },
                { label: 'Statut', value: <StatusBadge status={selected.statut_compte} /> },
                { label: 'Inscription', value: formatDateShort(selected.date_inscription) },
                { label: 'Note', value: selected.note_moyenne ? `${selected.note_moyenne}/5` : '—' },
                { label: 'Adresse', value: selected.adresse || '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium mt-0.5">{value as any}</p>
                </div>
              ))}
            </div>
            {/* Bouton dépôt depuis le modal profil aussi */}
            {(selected.roles?.includes('passager') || selected.roles?.includes('proprietaire')) && (
              <div className="mt-5 pt-4 border-t border-border">
                <button
                  onClick={() => { setSelected(null); setDepotTarget(selected) }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/10 text-success border border-success/30 text-sm font-medium hover:bg-success/20 transition-colors"
                >
                  <Wallet className="h-4 w-4" />
                  Effectuer un dépôt sur le wallet
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal créer utilisateur */}
      {showCreate && (
        <CreateUserModal onClose={() => setShowCreate(false)} onCreated={load} />
      )}

      {/* Modal dépôt */}
      {depotTarget && (
        <DepotModal user={depotTarget} onClose={() => setDepotTarget(null)} />
      )}
    </div>
  )
}
