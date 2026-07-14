import { useState, useEffect, useCallback } from 'react'
import { Search, TrendingUp, ArrowDownLeft, ArrowUpRight, Percent } from 'lucide-react'
import { financesService } from '@/services/api'
import { KpiCard } from '@/components/KpiCard'
import { StatusBadge } from '@/components/StatusBadge'
import { formatFCFA, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import type { Transaction, FinanceKpis } from '@/types'

export default function Finance() {
  const { toast } = useToast()
  const [kpis, setKpis] = useState<FinanceKpis | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [k, t] = await Promise.all([
        financesService.kpis(),
        financesService.transactions({ page, limit, search }),
      ])
      setKpis(k)
      setTransactions(t.data)
      setTotal(t.total)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les finances', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold">Finances</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Suivi des transactions et commissions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Commissions totales" value={kpis ? formatFCFA(kpis.commissions_totales) : '—'} icon={TrendingUp} loading={loading} />
        <KpiCard title="Volume courses" value={kpis ? formatFCFA(kpis.volume_courses) : '—'} icon={ArrowUpRight} loading={loading} />
        <KpiCard title="Remboursements" value={kpis ? formatFCFA(kpis.remboursements) : '—'} icon={ArrowDownLeft} loading={loading} />
        <KpiCard title="Taux commission" value="15%" subtitle="Courses · 10% locations" icon={Percent} loading={loading} />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-wrap gap-3 items-center justify-between">
          <h2 className="font-display font-semibold">Transactions récentes</h2>
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Date', 'Description', 'Type', 'Montant', 'Statut'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">Aucune transaction trouvée</td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id_paiement} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(t.date_paiement)}</td>
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{t.description}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.type} /></td>
                    <td className="px-4 py-3 font-semibold font-mono">{formatFCFA(t.montant)}</td>
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
