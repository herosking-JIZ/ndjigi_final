import { useState, useEffect, useCallback } from 'react'
import { Search, Eye, RefreshCw, X, Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { demandeExtensionService } from '@/services/api'
import { StatusBadge } from '@/components/StatusBadge'
import { useToast } from '@/hooks/useToast'
import { formatDate } from '@/lib/utils'
import type { DemandeExtension } from '@/types'

// ─── Labels statuts ──────────────────────────────────────────────
const STATUT_MAP: Record<string, { label: string; cls: string }> = {
  en_attente: { label: 'En attente', cls: 'bg-warning/15 text-warning border-warning/30' },
  accepte:    { label: 'Acceptée', cls: 'bg-success/15 text-success border-success/30' },
  refuse:     { label: 'Refusée', cls: 'bg-destructive/15 text-destructive border-destructive/30' },
}

const EXTENSION_MAP: Record<string, string> = {
  chauffeur: 'Chauffeur',
  proprietaire: 'Propriétaire',
}

// ─── Modal Détails + Actions ──────────────────────────────────────
interface DemandeModalProps {
  demande: DemandeExtension
  onClose: () => void
  onUpdated: () => void
}

function DemandeModal({ demande, onClose, onUpdated }: DemandeModalProps) {
  const { toast } = useToast()
  const [updating, setUpdating] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [motifRejet, setMotifRejet] = useState('')

  const handleAccept = async () => {
    setUpdating(true)
    try {
      await demandeExtensionService.updateStatut(demande.id_demande_extension, {
        statut: 'accepte'
      })
      toast({ title: 'Demande acceptée', variant: 'success' })
      onUpdated()
      onClose()
    } catch (err: any) {
      toast({ title: 'Erreur', description: err?.message || 'Impossible d\'accepter la demande', variant: 'destructive' })
    } finally {
      setUpdating(false)
    }
  }

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!motifRejet.trim()) return
    setUpdating(true)
    try {
      await demandeExtensionService.updateStatut(demande.id_demande_extension, {
        statut: 'refuse',
        motif_rejet: motifRejet
      })
      toast({ title: 'Demande refusée', variant: 'success' })
      onUpdated()
      onClose()
    } catch (err: any) {
      toast({ title: 'Erreur', description: err?.message || 'Impossible de refuser la demande', variant: 'destructive' })
    } finally {
      setUpdating(false)
    }
  }

  const utilisateur = demande.utilisateur
  const pc = STATUT_MAP[demande.statut] ?? STATUT_MAP.en_attente
  const isProcessed = demande.statut !== 'en_attente'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl shadow-2xl animate-fade-in overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-start justify-between mb-5 gap-3">
          <div>
            <h2 className="font-display font-bold text-lg">Demande d'extension</h2>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${pc.cls}`}>
                {pc.label}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/30">
                {EXTENSION_MAP[demande.extension_type] || 'Inconnu'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Profil Utilisateur */}
        <div className="bg-muted/50 rounded-xl p-4 mb-5 border border-border">
          <p className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wide">Profil de l'utilisateur</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Nom</p>
              <p className="font-semibold text-sm">{utilisateur?.prenom} {utilisateur?.nom}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-mono text-xs text-primary break-all">{utilisateur?.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Téléphone</p>
              <p className="font-semibold text-sm">{utilisateur?.numero_telephone}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Adresse</p>
              <p className="text-sm">{utilisateur?.adresse || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Inscrit le</p>
              <p className="text-sm">{utilisateur?.date_inscription ? formatDate(utilisateur.date_inscription) : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Statut</p>
              <p className="text-sm font-medium">{utilisateur?.statut_compte || '—'}</p>
            </div>
          </div>
        </div>

        {/* Documents */}
        {demande.documents && demande.documents.length > 0 && (
          <div className="mb-5">
            <p className="text-sm font-semibold mb-2">Documents soumis</p>
            <div className="space-y-2">
              {demande.documents.map((doc) => (
                <div key={doc.id_document} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border">
                  <div className="flex-1">
                    <p className="text-xs font-medium">{doc.type}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(doc.date_soumission)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                      doc.statut_verification === 'valide' ? 'bg-success/15 text-success' :
                      doc.statut_verification === 'rejete' ? 'bg-destructive/15 text-destructive' :
                      'bg-warning/15 text-warning'
                    }`}>
                      {doc.statut_verification === 'en_attente' ? 'En attente' :
                       doc.statut_verification === 'valide' ? 'Validé' : 'Rejeté'}
                    </span>
                    {doc.url_fichier && (
                      <a href={doc.url_fichier} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        <Eye className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Motif de rejet (si applicable) */}
        {demande.motif_rejet && (
          <div className="mb-5 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="text-xs text-muted-foreground font-medium mb-1">Motif du refus</p>
            <p className="text-sm text-destructive">{demande.motif_rejet}</p>
          </div>
        )}

        {/* Actions */}
        {!isProcessed ? (
          <div>
            {!showRejectForm ? (
              <div className="flex gap-2">
                <button
                  onClick={handleAccept}
                  disabled={updating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-success text-success-foreground text-sm font-medium hover:bg-success/90 disabled:opacity-50 transition-colors"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  {updating ? 'Traitement...' : 'Accepter'}
                </button>
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={updating}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  <XCircle className="h-4 w-4 inline mr-2" />
                  Refuser
                </button>
              </div>
            ) : (
              <form onSubmit={handleReject} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Motif du refus</label>
                  <textarea
                    value={motifRejet}
                    onChange={(e) => setMotifRejet(e.target.value)}
                    required
                    minLength={5}
                    maxLength={500}
                    placeholder="Expliquez pourquoi cette demande est refusée..."
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none h-24"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setShowRejectForm(false); setMotifRejet('') }} className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs">
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={updating || !motifRejet.trim()}
                    className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-medium flex items-center gap-2 hover:bg-destructive/90 disabled:opacity-60 transition-colors"
                  >
                    {updating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {updating ? 'Refus en cours…' : 'Confirmer le refus'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-muted text-center text-sm text-muted-foreground">
            Cette demande a déjà été traitée et ne peut pas être modifiée.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page Principale ──────────────────────────────────────────────
export default function Extensions() {
  const { toast } = useToast()
  const [demandes, setDemandes] = useState<DemandeExtension[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [filterType, setFilterType] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<DemandeExtension | null>(null)
  const limit = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await demandeExtensionService.list({
        page,
        limit,
        statut: filterStatut || undefined,
        extension_type: filterType || undefined,
      })
      setDemandes(res.data)
      setTotal(res.total)
    } catch (err: any) {
      toast({ title: 'Erreur', description: err?.message || 'Impossible de charger les demandes', variant: 'destructive' })
      setDemandes([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, limit, filterStatut, filterType, toast])

  useEffect(() => {
    load()
  }, [load])

  const handleRefresh = () => {
    setPage(1)
    load()
  }

  const pages = Math.ceil(total / limit)
  const hasSearchFilter = search.length > 0

  // Filtrage local par search (nom/email utilisateur)
  const filtered = demandes.filter((d) => {
    if (!hasSearchFilter) return true
    const user = d.utilisateur
    const q = search.toLowerCase()
    return (
      user?.prenom.toLowerCase().includes(q) ||
      user?.nom.toLowerCase().includes(q) ||
      user?.email.toLowerCase().includes(q) ||
      user?.numero_telephone.includes(q)
    )
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl">Demandes d'Extension de Profil</h1>
        <p className="text-sm text-muted-foreground mt-1">Gérer les demandes pour devenir chauffeur ou propriétaire</p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-64 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-input bg-background">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Chercher par nom, email ou téléphone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none bg-transparent text-sm"
          />
        </div>

        <select
          value={filterStatut}
          onChange={(e) => { setFilterStatut(e.target.value); setPage(1) }}
          className="px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="accepte">Acceptées</option>
          <option value="refuse">Refusées</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1) }}
          className="px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Tous les types</option>
          <option value="chauffeur">Chauffeur</option>
          <option value="proprietaire">Propriétaire</option>
        </select>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-input hover:bg-muted disabled:opacity-50 transition-colors text-sm"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tableau */}
      <div className="border border-border rounded-xl overflow-hidden">
        {loading && demandes.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
            <p className="text-sm font-medium">{hasSearchFilter ? 'Aucun résultat' : 'Aucune demande'}</p>
            <p className="text-xs text-muted-foreground">{hasSearchFilter ? 'Essayez une autre recherche' : 'Pas encore de demandes d\'extension'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Utilisateur</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((demande) => {
                  const user = demande.utilisateur
                  const pc = STATUT_MAP[demande.statut] ?? STATUT_MAP.en_attente
                  return (
                    <tr key={demande.id_demande_extension} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{user?.prenom} {user?.nom}</p>
                          <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/30">
                          {EXTENSION_MAP[demande.extension_type] || 'Inconnu'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${pc.cls}`}>
                          {pc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {demande.createdAt ? formatDate(demande.createdAt) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelected(demande)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted text-primary text-xs font-medium transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          Voir
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            {demandes.length === 0 ? 'Aucune demande' : `${(page - 1) * limit + 1}–${Math.min(page * limit, total)} sur ${total}`}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || loading}
              className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition-colors"
            >
              Précédent
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pages) }).map((_, i) => {
                const p = i + Math.max(1, page - 2)
                if (p > pages) return null
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      p === page
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border hover:bg-muted'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setPage(Math.min(pages, page + 1))}
              disabled={page === pages || loading}
              className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition-colors"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {selected && <DemandeModal demande={selected} onClose={() => setSelected(null)} onUpdated={handleRefresh} />}
    </div>
  )
}
