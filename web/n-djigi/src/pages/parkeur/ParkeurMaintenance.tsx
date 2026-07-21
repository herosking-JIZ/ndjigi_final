import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, AlertTriangle } from 'lucide-react'
import { parkeurService } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/useToast'
import { NdjButton } from '@/components/NdjButton'
import { MaintenanceTile } from '@/components/MaintenanceTile'
import type { MaintenanceRequest, MaintenanceStatut, MaintenanceUrgence, TypeMaintenance, VehiculeParking } from '@/types'

interface CreateMaintenanceForm {
  id_vehicule: string
  immatriculation: string
  type: TypeMaintenance
  urgence: MaintenanceUrgence
  description: string
}

const DEFAULT_FORM: CreateMaintenanceForm = {
  id_vehicule: '',
  immatriculation: '',
  type: 'mecanique',
  urgence: 'normale',
  description: '',
}

export default function ParkeurMaintenance() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<MaintenanceStatut | 'tous'>('tous')
  const [urgenceFilter, setUrgenceFilter] = useState<MaintenanceUrgence | 'tous'>('tous')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [form, setForm] = useState<CreateMaintenanceForm>(DEFAULT_FORM)
  const [vehicules, setVehicules] = useState<VehiculeParking[]>([])
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null)
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null)

  const parkingId = user?.parking_id

  const loadMaintenance = useCallback(async () => {
    if (!parkingId) return
    setLoading(true)
    try {
      const data = await parkeurService.listerMaintenance(parkingId, {
        page: 1,
        limit: 100,
        statut: statutFilter !== 'tous' ? statutFilter : undefined,
        urgence: urgenceFilter !== 'tous' ? urgenceFilter : undefined,
      })
      setRequests(data.data)
    } catch {
      toast({ title: 'Erreur de chargement', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [parkingId, statutFilter, urgenceFilter])

  useEffect(() => {
    loadMaintenance()
  }, [loadMaintenance])

  const handleCreateMaintenance = async () => {
    if (!parkingId) return
    if (!form.id_vehicule || !form.description) {
      toast({ title: 'Veuillez remplir tous les champs obligatoires', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      await parkeurService.creerMaintenance(parkingId, {
        id_vehicule: form.id_vehicule,
        type: form.type,
        urgence: form.urgence,
        description: form.description,
      })
      toast({ title: '✅ Demande créée avec succès', variant: 'success' })
      setForm(DEFAULT_FORM)
      setShowCreateModal(false)
      loadMaintenance()
    } catch {
      toast({ title: 'Erreur lors de la création', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const openCreateModal = async () => {
    setShowCreateModal(true)
    if (!parkingId) return
    try {
      setVehicules(await parkeurService.vehiculesGares(parkingId, { presence: 'present' }))
    } catch {
      toast({ title: 'Impossible de charger les véhicules présents', variant: 'destructive' })
    }
  }

  const loadMaintenanceDetail = async (maintenance: MaintenanceRequest) => {
    if (!parkingId || maintenance.historique) return
    setDetailLoadingId(maintenance.id_maintenance)
    try {
      const detail = await parkeurService.obtenirMaintenance(parkingId, maintenance.id_maintenance)
      setRequests((items) => items.map((item) => item.id_maintenance === maintenance.id_maintenance
        ? {
            ...item,
            ...detail,
            immatriculation: detail.vehicule?.immatriculation || item.immatriculation,
            marque: detail.vehicule?.marque || item.marque,
            modele: detail.vehicule?.modele || item.modele,
            gestionnaire_nom: detail.gestionnaire
              ? `${detail.gestionnaire.prenom} ${detail.gestionnaire.nom}`
              : item.gestionnaire_nom,
          }
        : item))
    } catch {
      toast({ title: 'Impossible de charger le détail', variant: 'destructive' })
    } finally {
      setDetailLoadingId(null)
    }
  }

  const updateStatus = async (maintenance: MaintenanceRequest, statut: MaintenanceStatut) => {
    if (!parkingId) return
    setStatusLoadingId(maintenance.id_maintenance)
    try {
      await parkeurService.mettreAJourMaintenanceStatut(parkingId, maintenance.id_maintenance, { statut })
      toast({ title: 'Statut mis à jour', variant: 'success' })
      await loadMaintenance()
    } catch {
      toast({ title: 'Transition de statut impossible', variant: 'destructive' })
    } finally {
      setStatusLoadingId(null)
    }
  }

  const uploadMaintenancePhoto = async (maintenance: MaintenanceRequest, file: File) => {
    if (!parkingId) return
    setDetailLoadingId(maintenance.id_maintenance)
    try {
      await parkeurService.uploadPhotoMaintenance(parkingId, maintenance.id_maintenance, file)
      const detail = await parkeurService.obtenirMaintenance(parkingId, maintenance.id_maintenance)
      setRequests((items) => items.map((item) => item.id_maintenance === maintenance.id_maintenance
        ? { ...item, photos: detail.photos, historique: detail.historique }
        : item))
      toast({ title: 'Photo ajoutée', variant: 'success' })
    } catch {
      toast({ title: "Échec de l'ajout de la photo", variant: 'destructive' })
    } finally {
      setDetailLoadingId(null)
    }
  }

  const filteredRequests = requests.filter((r) =>
    !search || r.immatriculation.includes(search.toUpperCase())
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
        <h1 className="text-2xl font-display font-bold">Demandes de maintenance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gérer les interventions de maintenance
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value.toUpperCase())}
            placeholder="Chercher par immatriculation..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <select
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value as any)}
          className="px-3 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="tous">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="confirmee">Confirmée</option>
          <option value="en_reparation">En réparation</option>
          <option value="terminee">Terminée</option>
        </select>

        <select
          value={urgenceFilter}
          onChange={(e) => setUrgenceFilter(e.target.value as any)}
          className="px-3 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="tous">Toutes les urgences</option>
          <option value="basse">Basse</option>
          <option value="normale">Normale</option>
          <option value="haute">Haute</option>
        </select>
      </div>

      {/* Maintenance list */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Chargement des demandes...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {requests.length === 0 ? 'Aucune demande de maintenance' : 'Aucune demande correspondante'}
          </div>
        ) : (
          filteredRequests.map((maintenance) => (
            <MaintenanceTile
              key={maintenance.id_maintenance}
              maintenance={maintenance}
              parkingId={parkingId}
              onClick={() => loadMaintenanceDetail(maintenance)}
              onStatusChange={(statut) => updateStatus(maintenance, statut)}
              onPhotoUpload={(file) => uploadMaintenancePhoto(maintenance, file)}
              isLoading={detailLoadingId === maintenance.id_maintenance || statusLoadingId === maintenance.id_maintenance}
            />
          ))
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8">
        <button
          onClick={openCreateModal}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all active:scale-95"
          title="Nouvelle demande"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <h2 className="font-display font-bold text-lg mb-5">Créer une demande</h2>

            <div className="space-y-4">
              {/* Immatriculation */}
              <div>
                <label className="block text-sm font-medium mb-1">Immatriculation</label>
                <select
                  value={form.id_vehicule}
                  onChange={(e) => {
                    const vehicule = vehicules.find((v) => v.id_vehicule === e.target.value)
                    setForm({
                      ...form,
                      id_vehicule: vehicule?.id_vehicule || '',
                      immatriculation: vehicule?.immatriculation || '',
                    })
                  }}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Sélectionner un véhicule présent</option>
                  {vehicules.map((vehicule) => (
                    <option key={vehicule.id_vehicule} value={vehicule.id_vehicule}>
                      {vehicule.immatriculation} — {vehicule.marque} {vehicule.modele}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium mb-1">Type de maintenance</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as TypeMaintenance })}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="mecanique">⚙️ Mécanique</option>
                  <option value="electricite">⚡ Électricité</option>
                  <option value="carrosserie">🔨 Carrosserie</option>
                </select>
              </div>

              {/* Urgence */}
              <div>
                <label className="block text-sm font-medium mb-1">Urgence</label>
                <select
                  value={form.urgence}
                  onChange={(e) => setForm({ ...form, urgence: e.target.value as MaintenanceUrgence })}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="basse">Basse</option>
                  <option value="normale">Normale</option>
                  <option value="haute">Haute</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Détails du problème..."
                  rows={3}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <NdjButton
                onClick={() => {
                  setShowCreateModal(false)
                  setForm(DEFAULT_FORM)
                }}
                variant="secondary"
              >
                Annuler
              </NdjButton>
              <NdjButton
                onClick={handleCreateMaintenance}
                isLoading={submitting}
                variant="primary"
              >
                Créer la demande
              </NdjButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
