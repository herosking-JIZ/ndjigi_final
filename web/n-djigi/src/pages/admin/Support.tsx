import { useState, useEffect, useCallback } from 'react'
import { Search, Eye, RefreshCw, X, Loader2, AlertTriangle } from 'lucide-react'
import { supportService, financesService } from '@/services/api'
import { StatusBadge } from '@/components/StatusBadge'
import { useToast } from '@/hooks/useToast'
import { formatDate, formatFCFA } from '@/lib/utils'
import type { Ticket } from '@/types'

const PRIORITE_MAP: Record<string, { label: string; cls: string }> = {
  urgente: { label: 'Urgente', cls: 'bg-destructive/15 text-destructive border-destructive/30' },
  haute:   { label: 'Haute',   cls: 'bg-warning/15 text-warning border-warning/30' },
  normale: { label: 'Normale', cls: 'bg-primary/15 text-primary border-primary/30' },
  faible:  { label: 'Faible',  cls: 'bg-muted text-muted-foreground border-border' },
}

const STATUTS = [
  { value: 'ouvert', label: 'Ouvert' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'resolu', label: 'Résolu' },
  { value: 'ferme', label: 'Fermé' },
]

function TicketModal({ ticket, onClose, onUpdated }: { ticket: Ticket; onClose: () => void; onUpdated: () => void }) {
  const { toast } = useToast()
  const [statut, setStatut] = useState(ticket.statut)
  const [updating, setUpdating] = useState(false)
  const [showRmb, setShowRmb] = useState(false)
  const [montant, setMontant] = useState('')
  const [motif, setMotif] = useState(ticket.sujet)
  const [rmbLoading, setRmbLoading] = useState(false)

  const changeStatut = async (s: string) => {
    setUpdating(true)
    try {
      await supportService.updateStatut(ticket.id_ticket, s)
      setStatut(s as any)
      onUpdated()
      toast({ title: 'Statut mis à jour', variant: 'success' })
    } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
    finally { setUpdating(false) }
  }

  const doRemboursement = async (e: React.FormEvent) => {
    e.preventDefault()
    const m = Number(montant)
    if (!m || m <= 0) return
    setRmbLoading(true)
    try {
      await financesService.rembourser({ id_utilisateur: ticket.id_utilisateur, montant: m, motif, id_ticket: ticket.id_ticket })
      await supportService.updateStatut(ticket.id_ticket, 'resolu')
      toast({ title: 'Remboursement effectué', description: `${formatFCFA(m)} remboursés.`, variant: 'success' })
      onUpdated(); onClose()
    } catch (err: any) {
      toast({ title: 'Erreur', description: err?.message || 'Impossible d\'effectuer le remboursement.', variant: 'destructive' })
    } finally { setRmbLoading(false) }
  }

  const pc = PRIORITE_MAP[ticket.priorite] ?? PRIORITE_MAP.normale

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-fade-in overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4 gap-3">
          <div>
            <h2 className="font-display font-bold text-lg">{ticket.sujet}</h2>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              <StatusBadge status={statut} />
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${pc.cls}`}>{pc.label}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div><p className="text-xs text-muted-foreground">Utilisateur</p><p className="font-medium">{ticket.utilisateur_prenom} {ticket.utilisateur_nom}</p></div>
          <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{formatDate(ticket.date_creation)}</p></div>
        </div>

        <div className="bg-muted rounded-xl px-4 py-3 text-sm mb-4">
          <p className="text-xs text-muted-foreground mb-1">Description</p>
          <p className="leading-relaxed">{ticket.description}</p>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Changer le statut</p>
          <div className="flex flex-wrap gap-2">
            {STATUTS.map((opt) => (
              <button key={opt.value} onClick={() => changeStatut(opt.value)} disabled={updating || statut === opt.value}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${statut === opt.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {ticket.eligible_remboursement && (
          <div className="border border-warning/30 rounded-xl p-4 bg-warning/5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
              <p className="text-sm font-semibold text-warning">Éligible à un remboursement</p>
            </div>
            {!showRmb ? (
              <button onClick={() => setShowRmb(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-warning text-warning-foreground text-sm font-medium hover:bg-warning/90">
                <RefreshCw className="h-4 w-4" /> Effectuer un remboursement
              </button>
            ) : (
              <form onSubmit={doRemboursement} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Montant (FCFA)</label>
                  <input type="number" value={montant} onChange={(e) => setMontant(e.target.value)} required min="1" placeholder="Ex : 3500"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Motif</label>
                  <input type="text" value={motif} onChange={(e) => setMotif(e.target.value)} required
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowRmb(false)} className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs">Annuler</button>
                  <button type="submit" disabled={rmbLoading} className="px-4 py-2 rounded-xl bg-warning text-warning-foreground text-xs font-medium flex items-center gap-2 hover:bg-warning/90 disabled:opacity-60">
                    {rmbLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {rmbLoading ? 'En cours…' : 'Confirmer'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Support() {
  const { toast } = useToast()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Ticket | null>(null)
  const limit = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await supportService.list({ page, limit, search, statut: filterStatut })
      setTickets(res.data)
      setTotal(res.total)
    } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
    finally { setLoading(false) }
  }, [page, search, filterStatut])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / limit)
  const ouverts   = tickets.filter((t) => t.statut === 'ouvert').length
  const enCours   = tickets.filter((t) => t.statut === 'en_cours').length
  const eligibles = tickets.filter((t) => t.eligible_remboursement && t.statut === 'ouvert').length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold">Support client</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gestion des tickets et demandes de remboursement</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: total },
          { label: 'Ouverts', value: ouverts },
          { label: 'En cours', value: enCours },
          { label: 'Remboursables', value: eligibles },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-xl px-4 py-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold font-display mt-0.5">{loading ? '—' : value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Rechercher…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <select value={filterStatut} onChange={(e) => { setFilterStatut(e.target.value); setPage(1) }}
          className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
          <option value="">Tous les statuts</option>
          {STATUTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Sujet</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Utilisateur</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Priorité</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Statut</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Date</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border">{[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>)}</tr>
                ))
              ) : tickets.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Aucun ticket trouvé</td></tr>
              ) : (
                tickets.map((t) => {
                  const pc = PRIORITE_MAP[t.priorite] ?? PRIORITE_MAP.normale
                  return (
                    <tr key={t.id_ticket} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate max-w-[180px]">{t.sujet}</span>
                          {t.eligible_remboursement && t.statut === 'ouvert' && (
                            <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-warning/15 text-warning border border-warning/30">
                              <RefreshCw className="h-2.5 w-2.5" /> Rmb
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{t.utilisateur_prenom} {t.utilisateur_nom}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${pc.cls}`}>{pc.label}</span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={t.statut} /></td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{formatDate(t.date_creation)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button onClick={() => setSelected(t)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" title="Voir le ticket">
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
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

      {selected && <TicketModal ticket={selected} onClose={() => setSelected(null)} onUpdated={load} />}
    </div>
  )
}
