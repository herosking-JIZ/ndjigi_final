import { useState, useEffect, useCallback, useRef } from 'react'
import { Activity, Car, Clock, TrendingUp } from 'lucide-react'
import { parkeurService } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { KpiCard } from '@/components/KpiCard'
import { useToast } from '@/hooks/useToast'
import { ProgressBar } from '@/components/ProgressBar'
import { AlertTriangle } from 'lucide-react'
import type { Parking } from '@/types'

export default function ParkeurHome() {
  const renderCountRef = useRef(0)
  const { user, parkingLoading } = useAuth()
  const { toast } = useToast()
  const [parking, setParking] = useState<Parking | null>(null)
  const [loading, setLoading] = useState(true)
  const [pullRefreshing, setPullRefreshing] = useState(false)
  const [showNoParking, setShowNoParking] = useState(false)

  const parkingId = user?.parking_id

  renderCountRef.current++
  console.log(`🟠 [ParkeurHome] RENDER #${renderCountRef.current} at ${new Date().toISOString().split('T')[1]}`, {
    user: user ? `${user.nom} ${user.prenom} (id: ${user.id_utilisateur})` : 'null',
    user_ref: user,
    parkingLoading,
    parkingId,
    showNoParking,
  })

  const load = useCallback(async () => {
    if (!parkingId) return
    try {
      const data = await parkeurService.detailParking(parkingId)
      setParking(data)
    } catch {
      toast({ title: 'Erreur de chargement', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [parkingId, toast])

  useEffect(() => {
    load()
  }, [load])

  // Afficher le message d'erreur seulement après avoir attendu le chargement du parking
  useEffect(() => {
    console.log('📱 [ParkeurHome] useEffect showNoParking:', { user: !!user, parkingLoading, parkingId })
    if (!user || parkingLoading) {
      console.log('📱 [ParkeurHome] Condition vraie - reset showNoParking à false')
      setShowNoParking(false)
      return
    }

    console.log('📱 [ParkeurHome] Setting timer de 1s pour showNoParking')
    const timer = setTimeout(() => {
      console.log('📱 [ParkeurHome] Timer déclenché - setShowNoParking(true)')
      setShowNoParking(true)
    }, 1000)

    return () => {
      console.log('📱 [ParkeurHome] Cleanup timer')
      clearTimeout(timer)
    }
  }, [user, parkingLoading])

  const handlePullRefresh = async () => {
    setPullRefreshing(true)
    await load()
    setPullRefreshing(false)
  }

  // Attendre que le parking soit chargé ou que le délai expire
  if (parkingLoading || (user && !parkingId && !showNoParking)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!parkingId && showNoParking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-warning/15 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-warning" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg">Aucun parking assigné</h2>
          <p className="text-muted-foreground mt-1">Contactez un administrateur pour être affecté à un parking.</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="space-y-5 touch-pan-y"
      onTouchMove={(e) => {
        if (window.scrollY === 0 && e.touches[0].clientY > 50) {
          handlePullRefresh()
        }
      }}
    >
      {/* Header */}
      {parking && (
        <div>
          <h1 className="text-2xl font-display font-bold">{parking.nom}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {parking.adresse} • {parking.ville}
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Capacité"
          value={parking ? `${parking.capacite_occupee}/${parking.capacite_totale}` : '—'}
          subtitle="Places occupées"
          icon={Car}
          loading={loading}
        />
        <KpiCard
          title="En bon état"
          value={parking?.vehicules_bon_etat ?? '—'}
          subtitle="Véhicules sains"
          icon={TrendingUp}
          loading={loading}
        />
        <KpiCard
          title="Horaires"
          value={parking?.horaires ?? '—'}
          subtitle="Heures d'ouverture"
          icon={Clock}
          loading={loading}
        />
      </div>

      {/* Capacity Progress */}
      {parking && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-display font-semibold mb-4">Taux d'occupation</h2>
          <ProgressBar
            current={parking.capacite_occupee}
            total={parking.capacite_totale}
            label="Capacité du parking"
            showPercent={true}
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href="/parkeur/flux"
          className="p-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-center font-semibold text-sm"
        >
          ➕ Entrée/Sortie
        </a>
        <a
          href="/parkeur/maintenance"
          className="p-4 rounded-xl border border-border hover:bg-muted transition-colors text-center font-semibold text-sm"
        >
          🔧 Maintenance
        </a>
      </div>

      {pullRefreshing && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          Rafraîchissement en cours...
        </div>
      )}
    </div>
  )
}
