import { useState, useEffect, useCallback } from 'react'
import { Search, Pencil, Plus, ParkingCircle, Car, Activity, X, AlertCircle, Loader2, MapPin } from 'lucide-react'
import { parkingsService } from '@/services/api'
import { KpiCard } from '@/components/KpiCard'
import { StatusBadge } from '@/components/StatusBadge'
import { useToast } from '@/hooks/useToast'
import { formatDate } from '@/lib/utils'
import type { Parking, MouvementParking, CreateParkingPayload } from '@/types'

// Leaflet imports
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// Global Leaflet marker icon fix is applied in lib/leaflet-setup.ts (imported in main.tsx)

// ─── Composant interne: Map avec clic pour placer le marqueur ──
interface MapClickerProps {
  onMarkerMove: (lat: number, lng: number) => void
  markerPosition: { lat: number; lng: number } | null
}

function MapClicker({ onMarkerMove, markerPosition }: MapClickerProps) {
  useMapEvents({
    click(e: L.LeafletMouseEvent) {
      onMarkerMove(e.latlng.lat, e.latlng.lng)
    },
  })
  return markerPosition ? <Marker position={[markerPosition.lat, markerPosition.lng]} draggable={true} eventHandlers={{ dragend: (e) => { const latlng = (e.target as any).getLatLng(); onMarkerMove(latlng.lat, latlng.lng) } }} /> : null
}

// ─── Modal Créer Parking ──────────────────────────────────────
interface CreateParkingModalProps {
  onClose: () => void
  onCreated: () => void
}

function CreateParkingModal({ onClose, onCreated }: CreateParkingModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchAddress, setSearchAddress] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [form, setForm] = useState<CreateParkingPayload>({
    nom: '',
    adresse: '',
    ville: 'Ouagadougou',
    capacite_totale: 0,
    latitude: 12.3714,
    longitude: -1.5197,
    horaires: '',
  })
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>({
    lat: form.latitude,
    lng: form.longitude,
  })

  const set = (field: keyof CreateParkingPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = field === 'capacite_totale' ? Number(e.target.value) : e.target.value
      setForm((f) => ({ ...f, [field]: value }))
    }

  const handleMarkerMove = (lat: number, lng: number) => {
    setForm((f) => ({ ...f, latitude: lat, longitude: lng }))
    setMarkerPosition({ lat, lng })
  }

  // Recherche d'adresse via Nominatim
  const handleSearchAddress = async () => {
    if (!searchAddress.trim()) return

    setSearchLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1`
      )
      const results = await response.json()

      if (results.length > 0) {
        const { lat, lon, address } = results[0]
        const latNum = parseFloat(lat)
        const lonNum = parseFloat(lon)

        setForm((f) => ({
          ...f,
          latitude: latNum,
          longitude: lonNum,
          adresse: form.adresse || (address as any).road || (address as any).suburb || (address as any).town || '',
          ville: form.ville || (address as any).city || (address as any).town || 'Ouagadougou',
        }))
        setMarkerPosition({ lat: latNum, lng: lonNum })
        toast({ title: 'Adresse trouvée', description: `${(address as any).road || ''} ${(address as any).town || ''}`, variant: 'success' })
      } else {
        toast({ title: 'Adresse non trouvée', description: 'Veuillez affiner votre recherche', variant: 'destructive' })
      }
    } catch (err) {
      console.error('Erreur Nominatim:', err)
      toast({ title: 'Erreur', description: 'Impossible de rechercher l\'adresse', variant: 'destructive' })
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!form.nom || !form.adresse || !form.ville || !form.capacite_totale) {
      setError('Tous les champs obligatoires doivent être remplis.')
      return
    }
    if (form.latitude === null || form.longitude === null) {
      setError('Veuillez sélectionner une localisation sur la carte.')
      return
    }

    setLoading(true)
    try {
      await parkingsService.create(form)
      toast({ title: 'Parking créé', description: `${form.nom} a été créé avec succès.`, variant: 'success' })
      onCreated()
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Impossible de créer le parking.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl shadow-2xl animate-fade-in overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg">Créer un parking</h2>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informations basiques */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Informations</h3>

            <div>
              <label className="block text-sm font-medium mb-1">
                Nom du parking <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={form.nom}
                onChange={set('nom')}
                placeholder="Parking Central Ouaga"
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Adresse <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={form.adresse}
                onChange={set('adresse')}
                placeholder="Zogona"
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Ville <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={form.ville}
                  onChange={set('ville')}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Capacité <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  value={form.capacite_totale}
                  onChange={set('capacite_totale')}
                  min="1"
                  placeholder="50"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Horaires <span className="text-muted-foreground font-normal">(optionnel)</span>
              </label>
              <input
                type="text"
                value={form.horaires}
                onChange={set('horaires')}
                placeholder="7h - 22h tous les jours"
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Localisation sur carte */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Localisation</h3>

            {/* Barre de recherche d'adresse Nominatim */}
            <div className="flex gap-2">
              <input
                type="text"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                placeholder="Rechercher une adresse..."
                onKeyDown={(e) => e.key === 'Enter' && handleSearchAddress()}
                className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                type="button"
                onClick={handleSearchAddress}
                disabled={searchLoading || !searchAddress.trim()}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2"
              >
                {searchLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {searchLoading ? 'Recherche...' : 'Chercher'}
              </button>
            </div>

            {/* Carte Leaflet */}
            <div className="rounded-2xl overflow-hidden border border-border h-80 bg-muted">
              <MapContainer center={[form.latitude, form.longitude]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                <MapClicker onMarkerMove={handleMarkerMove} markerPosition={markerPosition} />
              </MapContainer>
            </div>

            {/* Affichage lecture seule des coordonnées */}
            {markerPosition && (
              <div className="flex gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Latitude:</strong> {markerPosition.lat.toFixed(6)} — <strong>Longitude:</strong> {markerPosition.lng.toFixed(6)}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
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
              {loading ? 'Création...' : 'Créer le parking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page Parkings ────────────────────────────────────────────
export default function Parkings() {
  const { toast } = useToast()
  const [parkings, setParkings] = useState<Parking[]>([])
  const [mouvements, setMouvements] = useState<MouvementParking[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editTarget, setEditTarget] = useState<Parking | null>(null)
  const [editForm, setEditForm] = useState<Partial<Parking>>({})
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [ps, mv] = await Promise.all([
        parkingsService.list(),
        parkingsService.mouvements({ search }),
      ])
      setParkings(ps)
      setMouvements(mv)
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    load()
  }, [load])

  const handleEdit = (p: Parking) => {
    setEditTarget(p)
    setEditForm({ ...p })
  }

  const handleSave = async () => {
    if (!editTarget) return
    try {
      await parkingsService.update(editTarget.id_parking, editForm)
      toast({ title: 'Parking mis à jour', variant: 'success' })
      setEditTarget(null)
      load()
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }

  const totalVehicules = parkings.reduce((s, p) => s + p.capacite_occupee, 0)
  const totalCapacite = parkings.reduce((s, p) => s + p.capacite_totale, 0)
  const actifs = parkings.filter((p) => p.actif).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Parkings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Réseau de parkings N'DJIGI</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Créer un parking
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Parkings actifs" value={actifs} subtitle={`sur ${parkings.length} au total`} icon={ParkingCircle} loading={loading} />
        <KpiCard title="Véhicules en parking" value={totalVehicules} subtitle={`capacité totale : ${totalCapacite}`} icon={Car} loading={loading} />
        <KpiCard title="Mouvements récents" value={mouvements.length} subtitle="Entrées et sorties" icon={Activity} loading={loading} />
      </div>

      {/* Liste parkings */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-display font-semibold">Liste des parkings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Nom', 'Ville', 'Adresse', 'Véhicules', 'Horaires', 'Statut', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : (
                parkings.map((p) => (
                  <tr key={p.id_parking} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-semibold">{p.nom}</td>
                    <td className="px-4 py-3">{p.ville}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{p.adresse}</td>
                    <td className="px-4 py-3">
                      <span className={p.capacite_occupee >= p.capacite_totale ? 'text-destructive font-semibold' : ''}>
                        {p.capacite_occupee}
                      </span>
                      <span className="text-muted-foreground">/{p.capacite_totale}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.horaires ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.actif ? 'actif' : 'suspendu'} /></td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleEdit(p)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mouvements */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-wrap gap-3 items-center justify-between">
          <h2 className="font-display font-semibold">Mouvements récents</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…"
              className="pl-9 pr-3 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-primary/50 w-60" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Date', 'Type', 'Immatriculation', 'Parking', 'Parkeur', 'État', 'Commentaire'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mouvements.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Aucun mouvement</td></tr>
              ) : (
                mouvements.map((m) => (
                  <tr key={m.id_log} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(m.date_mouvement)}</td>
                    <td className="px-4 py-3"><StatusBadge status={m.type_mouvement} /></td>
                    <td className="px-4 py-3 font-mono font-medium">{m.immatriculation}</td>
                    <td className="px-4 py-3">{m.parking_nom}</td>
                    <td className="px-4 py-3">{m.parkeur_nom}</td>
                    <td className="px-4 py-3"><StatusBadge status={m.etat_vehicule} /></td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{m.commentaire ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal édition */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setEditTarget(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-bold text-lg mb-5">Modifier le parking</h2>
            <div className="space-y-3">
              {[
                { key: 'nom', label: 'Nom', type: 'text' },
                { key: 'ville', label: 'Ville', type: 'text' },
                { key: 'adresse', label: 'Adresse', type: 'text' },
                { key: 'capacite_totale', label: 'Capacité', type: 'number' },
                { key: 'horaires', label: 'Horaires', type: 'text' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input
                    type={type}
                    value={(editForm as any)[key] ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              ))}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Parking actif</label>
                <button
                  onClick={() => setEditForm((f) => ({ ...f, actif: !f.actif }))}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${editForm.actif ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${editForm.actif ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setEditTarget(null)} className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-sm">Annuler</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal création */}
      {showCreate && (
        <CreateParkingModal onClose={() => setShowCreate(false)} onCreated={load} />
      )}
    </div>
  )
}
