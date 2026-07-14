import { useState, useEffect, useCallback } from 'react'
import { Search, AlertTriangle } from 'lucide-react'
import { parkeurService } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/useToast'
import { formatDate } from '@/lib/utils'
import type { VehiculeParking } from '@/types'

export default function ParkeurVehicules() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [vehicules, setVehicules] = useState<VehiculeParking[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const parkingId = user?.parking_id

  const loadVehicules = useCallback(async () => {
    if (!parkingId) return
    setLoading(true)
    try {
      const data = await parkeurService.vehiculesGares(parkingId)
      setVehicules(data)
    } catch {
      toast({ title: 'Erreur de chargement', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [parkingId])

  useEffect(() => {
    loadVehicules()
  }, [loadVehicules])

  const filteredVehicules = vehicules.filter((v) =>
    !search ||
    v.immatriculation.toUpperCase().includes(search.toUpperCase()) ||
    v.marque.toUpperCase().includes(search.toUpperCase()) ||
    v.modele.toUpperCase().includes(search.toUpperCase())
  )

  if (!parkingId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <AlertTriangle className="h-8 w-8 text-warning" />
        <p className="text-muted-foreground">Aucun parking assigné</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold">Véhicules gares</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {vehicules.length} véhicule{vehicules.length > 1 ? 's' : ''} présent{vehicules.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Chercher par immatriculation, marque, modèle..."
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Immatriculation</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Véhicule</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Catégorie</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">État</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Entrée</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Propriétaire</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredVehicules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    {vehicules.length === 0 ? 'Aucun véhicule présent' : 'Aucune correspondance'}
                  </td>
                </tr>
              ) : (
                filteredVehicules.map((v) => (
                  <tr
                    key={v.id_vehicule}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-primary">
                      {v.immatriculation}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{v.marque} {v.modele}</div>
                      {v.couleur && (
                        <div className="text-xs text-muted-foreground capitalize">{v.couleur}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">
                      {v.categorie}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        v.etat === 'bon_etat'
                          ? 'bg-success/10 text-success'
                          : v.etat === 'besoin_maintenance'
                          ? 'bg-warning/10 text-warning'
                          : v.etat === 'en_maintenance'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-danger/10 text-danger'
                      }`}>
                        {v.etat === 'bon_etat' && '✅ Bon'}
                        {v.etat === 'besoin_maintenance' && '⚠️ À vérifier'}
                        {v.etat === 'en_maintenance' && '🔧 En maintenance'}
                        {v.etat === 'retire' && '❌ Retiré'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {v.date_entree ? formatDate(v.date_entree) : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {v.proprietaire_nom || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      {!loading && vehicules.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
          <div className="bg-success/10 rounded-xl p-3 text-center">
            <div className="font-semibold text-success">
              {vehicules.filter((v) => v.etat === 'bon_etat').length}
            </div>
            <div className="text-xs text-muted-foreground">En bon état</div>
          </div>
          <div className="bg-warning/10 rounded-xl p-3 text-center">
            <div className="font-semibold text-warning">
              {vehicules.filter((v) => v.etat === 'besoin_maintenance').length}
            </div>
            <div className="text-xs text-muted-foreground">À vérifier</div>
          </div>
          <div className="bg-accent/10 rounded-xl p-3 text-center">
            <div className="font-semibold text-accent">
              {vehicules.filter((v) => v.etat === 'en_maintenance').length}
            </div>
            <div className="text-xs text-muted-foreground">En maintenance</div>
          </div>
          <div className="bg-danger/10 rounded-xl p-3 text-center">
            <div className="font-semibold text-danger">
              {vehicules.filter((v) => v.etat === 'retire').length}
            </div>
            <div className="text-xs text-muted-foreground">Retirés</div>
          </div>
        </div>
      )}
    </div>
  )
}
