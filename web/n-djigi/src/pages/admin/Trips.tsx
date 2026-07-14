import { useState, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'
import { trajetsService } from '@/services/api'
import { StatusBadge } from '@/components/StatusBadge'
import { formatDate, formatFCFA } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import type { Trajet } from '@/types'

export default function Trips() {
  const { toast } = useToast()
  const [enCours, setEnCours] = useState<Trajet[]>([])
  const [historique, setHistorique] = useState<Trajet[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [ec, hist] = await Promise.all([
        trajetsService.enCours(),
        trajetsService.historique({ page, limit, search }),
      ])
      setEnCours(ec)
      setHistorique(hist.data)
      setTotal(hist.total)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les trajets', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold">Trajets</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Supervision des courses</p>
      </div>

      {/* En cours */}
      {enCours.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold">Courses en cours</h2>
            <span className="px-2 py-0.5 bg-primary/15 text-primary text-xs font-medium rounded-full border border-primary/30">
              {enCours.length} active{enCours.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Passager', 'Chauffeur', 'Trajet', 'Distance', 'Durée', 'Montant', 'Paiement'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enCours.map((t) => (
                  <tr key={t.id_trajet} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{t.passager_nom}</td>
                    <td className="px-4 py-3">{t.chauffeur_nom}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px]">
                      <span className="block truncate">{t.adresse_depart}</span>
                      <span className="block truncate">→ {t.adresse_arrivee}</span>
                    </td>
                    <td className="px-4 py-3">{t.distance_km ? `${t.distance_km} km` : '—'}</td>
                    <td className="px-4 py-3">{t.duree_estimee_min ? `${t.duree_estimee_min} min` : '—'}</td>
                    <td className="px-4 py-3 font-semibold">{t.tarif_final ? formatFCFA(t.tarif_final) : '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.methode_paiement ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historique */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <h2 className="font-display font-semibold">Historique des courses</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Rechercher…"
                className="pl-9 pr-3 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/50 w-60"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Date', 'Passager', 'Chauffeur', 'Trajet', 'Montant', 'Statut'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : historique.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    Aucune course trouvée
                  </td>
                </tr>
              ) : (
                historique.map((t) => (
                  <tr key={t.id_trajet} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{t.date_heure_debut ? formatDate(t.date_heure_debut) : '—'}</td>
                    <td className="px-4 py-3 font-medium">{t.passager_nom}</td>
                    <td className="px-4 py-3">{t.chauffeur_nom}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px]">
                      <span className="block truncate">{t.adresse_depart}</span>
                      <span className="block truncate">→ {t.adresse_arrivee}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{t.tarif_final ? formatFCFA(t.tarif_final) : '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.statut} /></td>
                  </tr>
                ))
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
    </div>
  )
}
