import { useState, useEffect, useCallback } from 'react'
import { Search, AlertTriangle } from 'lucide-react'
import { parkeurService } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/useToast'
import { NdjButton } from '@/components/NdjButton'
import { NdjTextField } from '@/components/NdjTextField'
import { SelectionCard } from '@/components/SelectionCard'
import { formatDate } from '@/lib/utils'
import type { VehiculeParking, MouvementParking, EtatVehiculeParking } from '@/types'

type TabType = 'entree' | 'sortie' | 'historique'

interface FluxForm {
  immatriculation: string
  etat_vehicule: EtatVehiculeParking
  commentaire: string
}

const ETAT_OPTIONS: { value: EtatVehiculeParking; label: string; icon: string }[] = [
  { value: 'bon_etat', label: 'Bon état', icon: '✅' },
  { value: 'besoin_maintenance', label: 'À vérifier', icon: '⚠️' },
  { value: 'en_maintenance', label: 'En maintenance', icon: '🔧' },
  { value: 'retire', label: 'Retiré', icon: '❌' },
]

const DEFAULT_FORM: FluxForm = {
  immatriculation: '',
  etat_vehicule: 'bon_etat',
  commentaire: '',
}

export default function ParkeurFlux() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [tab, setTab] = useState<TabType>('entree')
  const [vehicules, setVehicules] = useState<VehiculeParking[]>([])
  const [mouvements, setMouvements] = useState<MouvementParking[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<FluxForm>(DEFAULT_FORM)
  const [selectedVehicule, setSelectedVehicule] = useState<VehiculeParking | null>(null)
  const [showStateWarning, setShowStateWarning] = useState(false)

  const parkingId = user?.parking_id

  const loadData = useCallback(async () => {
    if (!parkingId) return
    setLoading(true)
    try {
      if (tab === 'historique') {
        const data = await parkeurService.mouvementsParkeur(parkingId, {
          page: 1,
          limit: 50,
          search: search,
        })
        setMouvements(data.data)
      } else {
        const data = await parkeurService.vehiculesGares(parkingId)
        setVehicules(data)
      }
    } catch {
      toast({ title: 'Erreur de chargement', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [parkingId, tab, search])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleVehiculeSelect = (vehicule: VehiculeParking) => {
    setSelectedVehicule(vehicule)
    setForm({
      ...DEFAULT_FORM,
      immatriculation: vehicule.immatriculation,
    })
  }

  const handleSubmit = async () => {
    if (!parkingId || !user?.id_utilisateur) return
    if (!form.immatriculation) {
      toast({ title: 'Veuillez saisir une immatriculation', variant: 'destructive' })
      return
    }
    if (!selectedVehicule) {
      toast({ title: 'Veuillez sélectionner un véhicule', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      if (tab === 'entree') {
        await parkeurService.enregistrerEntree(parkingId, {
          id_vehicule: selectedVehicule.id_vehicule,
          id_utilisateur: user.id_utilisateur,
          etat_vehicule: form.etat_vehicule,
          commentaire: form.commentaire,
        })
        toast({ title: '✅ Véhicule enregistré à l\'entrée', variant: 'success' })

        if (form.etat_vehicule !== 'bon_etat') {
          setShowStateWarning(true)
        }
      } else if (tab === 'sortie') {
        await parkeurService.enregistrerSortie(parkingId, {
          id_vehicule: selectedVehicule.id_vehicule,
          id_utilisateur: user.id_utilisateur,
          etat_vehicule: form.etat_vehicule,
          commentaire: form.commentaire,
        })
        toast({ title: '✅ Sortie enregistrée', variant: 'success' })
      }

      setForm(DEFAULT_FORM)
      setSelectedVehicule(null)
      setSearch('')
      loadData()
    } catch (error) {
      toast({ title: 'Erreur lors de l\'enregistrement', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

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
        <h1 className="text-2xl font-display font-bold">Flux de mouvements</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gérer les entrées et sorties</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(['entree', 'sortie', 'historique'] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t)
              setForm(DEFAULT_FORM)
              setSelectedVehicule(null)
              setSearch('')
            }}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'entree' && '➕ Entrée'}
            {t === 'sortie' && '🚀 Sortie'}
            {t === 'historique' && '📋 Historique'}
          </button>
        ))}
      </div>

      {/* Content */}
      {(tab === 'entree' || tab === 'sortie') && (
        <div className="space-y-5">
          {/* Form */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-lg">
              {tab === 'entree' ? '🚗 Enregistrer une entrée' : '🚀 Enregistrer une sortie'}
            </h2>

            {/* Immatriculation Search */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Immatriculation</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={form.immatriculation}
                  onChange={(e) => {
                    setForm({ ...form, immatriculation: e.target.value.toUpperCase() })
                    setSearch(e.target.value)
                  }}
                  placeholder="Saisir l'immatriculation..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Vehicle suggestions */}
            {search && vehicules.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Véhicules correspondants</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {vehicules
                    .filter((v) =>
                      v.immatriculation.includes(search.toUpperCase())
                    )
                    .map((v) => (
                      <button
                        key={v.id_vehicule}
                        onClick={() => handleVehiculeSelect(v)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedVehicule?.id_vehicule === v.id_vehicule
                            ? 'bg-primary/10 border-primary'
                            : 'bg-muted/50 border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-mono font-semibold">{v.immatriculation}</div>
                        <div className="text-sm text-muted-foreground">
                          {v.marque} {v.modele}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Vehicle state selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium">État du véhicule</label>
              <div className="grid grid-cols-2 gap-2">
                {ETAT_OPTIONS.map((option) => (
                  <SelectionCard
                    key={option.value}
                    label={option.label}
                    icon={option.icon}
                    selected={form.etat_vehicule === option.value}
                    onClick={() => setForm({ ...form, etat_vehicule: option.value })}
                    color={
                      option.value === 'bon_etat'
                        ? 'success'
                        : option.value === 'besoin_maintenance'
                        ? 'warning'
                        : 'danger'
                    }
                  />
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Commentaire (optionnel)</label>
              <textarea
                value={form.commentaire}
                onChange={(e) => setForm({ ...form, commentaire: e.target.value })}
                placeholder="Détails supplémentaires..."
                rows={2}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            <NdjButton
              onClick={handleSubmit}
              isLoading={submitting}
              variant="primary"
              fullWidth
            >
              {tab === 'entree' ? 'Confirmer l\'entrée' : 'Confirmer la sortie'}
            </NdjButton>
          </div>

          {/* Warning Modal */}
          {showStateWarning && form.etat_vehicule !== 'bon_etat' && (
            <div className="bg-warning/10 border border-warning rounded-xl p-4 space-y-3">
              <div className="flex gap-2 items-start">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-warning">Attention</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ce véhicule ne sera pas en bon état. Une intervention de maintenance pourrait être nécessaire.
                  </p>
                </div>
              </div>
              <NdjButton
                onClick={() => setShowStateWarning(false)}
                variant="secondary"
                fullWidth
              >
                Fermer
              </NdjButton>
            </div>
          )}
        </div>
      )}

      {/* Historique */}
      {tab === 'historique' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Chercher dans l'historique..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Movements list */}
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement...
              </div>
            ) : mouvements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun mouvement enregistré
              </div>
            ) : (
              mouvements.map((m) => (
                <div
                  key={m.id_log}
                  className="bg-card border border-border rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono font-semibold">{m.immatriculation}</div>
                      <div className="text-sm text-muted-foreground">
                        {m.type_mouvement === 'entree' ? '➕ Entrée' : '🚀 Sortie'} •{' '}
                        {formatDate(m.date_mouvement)}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      m.etat_vehicule === 'bon_etat'
                        ? 'bg-success/10 text-success'
                        : m.etat_vehicule === 'besoin_maintenance'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-danger/10 text-danger'
                    }`}>
                      {m.etat_vehicule === 'bon_etat' && '✅ Bon'}
                      {m.etat_vehicule === 'besoin_maintenance' && '⚠️ Vérifié'}
                      {m.etat_vehicule === 'en_maintenance' && '🔧 Maintenance'}
                      {m.etat_vehicule === 'retire' && '❌ Retiré'}
                    </div>
                  </div>
                  {m.commentaire && (
                    <p className="text-sm text-muted-foreground">{m.commentaire}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
