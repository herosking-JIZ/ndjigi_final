import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Zap, ChevronRight, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react'
import { configService } from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { formatDateShort } from '@/lib/utils'
import type { ZoneTarifaire, CategorieVehicule, TarifCategorieZone, CodePromo } from '@/types'

type Tab = 'zones' | 'categories' | 'tarifs' | 'promos'

// ─── Zones tarifaires ──────────────────────────────────────────
function ZonesTab() {
  const { toast } = useToast()
  const [zones, setZones] = useState<ZoneTarifaire[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Partial<ZoneTarifaire> | null>(null)
  const [isNew, setIsNew] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setZones(await configService.listZones()) }
    catch { toast({ title: 'Erreur', variant: 'destructive' }) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => {
    setIsNew(true)
    setModal({ nom: '', vitesse_moyenne_kmh: 30, coefficient_max: 3, actif: true })
  }
  const openEdit = (z: ZoneTarifaire) => { setIsNew(false); setModal({ ...z }) }

  const handleSave = async () => {
    if (!modal) return
    try {
      if (isNew) await configService.createZone(modal as Omit<ZoneTarifaire, 'id_zone'>)
      else await configService.updateZone(modal.id_zone!, modal)
      toast({ title: isNew ? 'Zone créée' : 'Zone mise à jour', variant: 'success' })
      setModal(null); load()
    } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette zone ? Les tarifs associés seront aussi supprimés.')) return
    try { await configService.deleteZone(id); toast({ title: 'Zone supprimée' }); load() }
    catch { toast({ title: 'Erreur', variant: 'destructive' }) }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Nouvelle zone
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {['Zone', 'Vitesse moy.', 'Coeff. surge max', 'Statut', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {[...Array(5)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : zones.map((z) => (
              <tr key={z.id_zone} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-semibold">{z.nom}</td>
                <td className="px-4 py-3 font-mono">
                  <span className="text-muted-foreground">{z.vitesse_moyenne_kmh} km/h</span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-warning/15 text-warning text-xs rounded-md border border-warning/30">
                    <Zap className="h-3 w-3" />{z.coefficient_max}×
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={async () => { await configService.updateZone(z.id_zone, { actif: !z.actif }); load() }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${z.actif ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${z.actif ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(z)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(z.id_zone)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 pb-4 border-b border-border/50">
              <h2 className="font-display font-bold text-lg">{isNew ? 'Nouvelle zone tarifaire' : 'Modifier la zone'}</h2>
              <p className="text-xs text-muted-foreground mt-1">Les tarifs par catégorie se configurent dans l'onglet "Tarifs"</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {[
                { key: 'nom', label: 'Nom de la zone', type: 'text', placeholder: 'Ex: Ouaga 2000, Patte d\'Oie...' },
                { key: 'vitesse_moyenne_kmh', label: 'Vitesse moyenne estimée (km/h)', type: 'number', placeholder: 'Ex: 20 pour centre-ville, 50 pour périphérie' },
                { key: 'coefficient_max', label: 'Coefficient de surge max', type: 'number', step: '0.1', placeholder: 'Ex: 3.0' },
              ].map(({ key, label, type, step, placeholder }) => (
                <div key={key}>
                  <label className="block text-[12px] font-bold text-foreground mb-1.5 uppercase tracking-wider">{label}</label>
                  <input
                    type={type} step={step} placeholder={placeholder}
                    value={(modal as any)[key] ?? ''}
                    onChange={(e) => setModal((m) => ({ ...m, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
              ))}
              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-border">
                <div>
                  <p className="text-sm font-bold">Zone active</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-tight">Activer les services dans cette zone</p>
                </div>
                <button
                  onClick={() => setModal((m) => ({ ...m, actif: !m?.actif }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${modal.actif ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${modal.actif ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
            <div className="p-6 border-t border-border flex gap-3 justify-end bg-white dark:bg-zinc-900">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl border border-border hover:bg-muted text-sm font-semibold">Annuler</button>
              <button onClick={handleSave} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90">Enregistrer la zone</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Catégories ────────────────────────────────────────────────
function CategoriesTab() {
  const { toast } = useToast()
  const [cats, setCats] = useState<CategorieVehicule[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Partial<CategorieVehicule> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [nomOpen, setNomOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setCats(await configService.listCategories()) }
    catch { toast({ title: 'Erreur', variant: 'destructive' }) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => { setIsNew(true); setModal({ nom: 'Economique', description: '', actif: true }) }
  const openEdit = (c: CategorieVehicule) => { setIsNew(false); setModal({ ...c }) }

  const handleSave = async () => {
    if (!modal) return
    try {
      if (isNew) await configService.createCategorie(modal as Omit<CategorieVehicule, 'id_categorie'>)
      else await configService.updateCategorie(modal.id_categorie!, modal)
      toast({ title: isNew ? 'Catégorie créée' : 'Catégorie mise à jour', variant: 'success' })
      setModal(null); load()
    } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
  }
const handleDelete = async (id: string) => {
  // 1. Demander confirmation à l'utilisateur
  if (!confirm('Voulez-vous vraiment supprimer cette catégorie ?')) return

  try {
    await configService.deleteCategorie(id)
    toast({ 
      title: 'Succès', 
      description: 'Catégorie supprimée avec succès', 
      variant: 'success' 
    })
    load()
  } catch (error: any) {
    // 2. Extraire le message d'erreur du backend (Payload : error.response.data)
    const backendMessage = error.response?.data?.message 
    const errorCode = error.response?.data?.errors?.code

    // 3. Afficher le message spécifique dans le Toast
    toast({
      title: errorCode === 'DEPENDENCY_CONFLICT' ? 'Action impossible' : 'Erreur',
      // C'est ici qu'on affiche "Suppression impossible : 1 véhicule(s)..."
      description: backendMessage || "Une erreur est survenue lors de la suppression.",
      variant: 'destructive',
    })

    console.error('[DeleteCategory Error]', error)
  }
}

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Nouvelle catégorie
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cats.map((c) => (
            <div key={c.id_categorie} className="bg-card border border-border rounded-2xl p-4 relative">
              <div className="absolute top-3 right-3">
                <button
                  onClick={async () => { await configService.updateCategorie(c.id_categorie, { actif: !c.actif }); load() }}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${c.actif ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${c.actif ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="pr-10 mb-3">
                <p className="font-semibold text-base">{c.nom}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.description || '—'}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => openEdit(c)} className="flex-1 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-medium">Modifier</button>
                <button onClick={() => handleDelete(c.id_categorie)} className="px-3 py-1.5 rounded-lg hover:bg-destructive/10 text-destructive text-xs font-medium">Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 pb-4 border-b border-border/50">
              <h2 className="font-display font-bold text-lg">{isNew ? 'Nouvelle catégorie' : 'Modifier la catégorie'}</h2>
              <p className="text-xs text-muted-foreground mt-1">Les tarifs par zone se configurent dans l'onglet "Tarifs"</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="relative">
                <label className="block text-[12px] font-bold text-foreground mb-1.5 uppercase tracking-wider">Nom</label>
                <button
                  type="button"
                  onClick={() => setNomOpen((o) => !o)}
                  className="w-full flex items-center justify-between rounded-xl border border-input bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                >
                  <span>{{ Economique: 'Économique', Confort: 'Confort', Premium: 'Premium' }[modal.nom ?? 'Economique']}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${nomOpen ? 'rotate-180' : ''}`} />
                </button>
                {nomOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-white dark:bg-zinc-800 shadow-lg overflow-hidden">
                    {(['Economique', 'Confort', 'Premium'] as const).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => { setModal((m) => ({ ...m, nom: val })); setNomOpen(false) }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-primary/10 transition-colors ${modal.nom === val ? 'text-primary font-bold' : ''}`}
                      >
                        {{ Economique: 'Économique', Confort: 'Confort', Premium: 'Premium' }[val]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[12px] font-bold text-foreground mb-1.5 uppercase tracking-wider">Description courte</label>
                <input
                  type="text"
                  placeholder="Ex: Véhicules spacieux et climatisés"
                  value={modal.description ?? ''}
                  onChange={(e) => setModal((m) => ({ ...m, description: e.target.value }))}
                  className="w-full rounded-xl border border-input bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-border">
                <div>
                  <p className="text-sm font-bold">Catégorie active</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-tight">Visible par les chauffeurs et passagers</p>
                </div>
                <button
                  onClick={() => setModal((m) => ({ ...m, actif: !m?.actif }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${modal.actif ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${modal.actif ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
            <div className="p-6 border-t border-border flex gap-3 justify-end bg-white dark:bg-zinc-900">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl border border-border hover:bg-muted text-sm font-semibold">Annuler</button>
              <button onClick={handleSave} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Matrice tarifs zone × catégorie ──────────────────────────
function TarifsTab() {
  const { toast } = useToast()
  const [zones, setZones] = useState<ZoneTarifaire[]>([])
  const [categories, setCategories] = useState<CategorieVehicule[]>([])
  const [selectedZone, setSelectedZone] = useState<ZoneTarifaire | null>(null)
  const [tarifs, setTarifs] = useState<TarifCategorieZone[]>([])
  const [loadingZones, setLoadingZones] = useState(true)
  const [loadingTarifs, setLoadingTarifs] = useState(false)
  const [modal, setModal] = useState<TarifCategorieZone | null>(null)
  const [saving, setSaving] = useState(false)

  // Charger zones + catégories au montage
  useEffect(() => {
    const init = async () => {
      setLoadingZones(true)
      try {
        const [z, c] = await Promise.all([
          configService.listZones(),
          configService.listCategories(),
        ])
        setZones(z)
        setCategories(c)
      } catch { toast({ title: 'Erreur de chargement', variant: 'destructive' }) }
      finally { setLoadingZones(false) }
    }
    init()
  }, [])

  // Charger les tarifs quand on sélectionne une zone
  const selectZone = async (zone: ZoneTarifaire) => {
    setSelectedZone(zone)
    setLoadingTarifs(true)
    try {
      setTarifs(await configService.listTarifsParZone(zone.id_zone))
    } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
    finally { setLoadingTarifs(false) }
  }

  // Récupérer le tarif existant pour une catégorie, ou valeur vide
  const getTarif = (id_categorie: string): TarifCategorieZone => {
    const existing = tarifs.find((t) => t.id_categorie === id_categorie)
    return existing ?? {
      id_zone: selectedZone!.id_zone,
      id_categorie,
      tarif_base: 0,
      tarif_km: 0,
      tarif_minute: 0,
      actif: true,
    }
  }

  const isConfigured = (id_categorie: string) =>
    tarifs.some((t) => t.id_categorie === id_categorie && t.tarif_base > 0)

  const handleSave = async () => {
    if (!modal) return
    setSaving(true)
    try {
      const saved = await configService.upsertTarif(modal)
      setTarifs((prev) => {
        const exists = prev.find(
          (t) => t.id_zone === saved.id_zone && t.id_categorie === saved.id_categorie
        )
        return exists
          ? prev.map((t) => t.id_categorie === saved.id_categorie ? saved : t)
          : [...prev, saved]
      })
      toast({ title: 'Tarifs enregistrés', variant: 'success' })
      setModal(null)
    } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  const configuredCount = categories.filter((c) => isConfigured(c.id_categorie)).length
  const totalCount = categories.filter((c) => c.actif).length

  if (loadingZones) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Sélection de zone */}
      {!selectedZone ? (
        <>
          <div className="p-4 bg-muted/40 border border-border rounded-2xl text-sm text-muted-foreground">
            Sélectionnez une zone pour configurer ses tarifs par catégorie de véhicule.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {zones.map((z) => (
              <button
                key={z.id_zone}
                onClick={() => selectZone(z)}
                className="text-left bg-card border border-border rounded-2xl p-4 hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">{z.nom}</p>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="text-xs text-muted-foreground">{z.vitesse_moyenne_kmh} km/h · coeff. max {z.coefficient_max}×</p>
                {!z.actif && (
                  <span className="mt-2 inline-block text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded-md">Zone inactive</span>
                )}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Header zone sélectionnée */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedZone(null); setTarifs([]) }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Toutes les zones
            </button>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold">{selectedZone.nom}</span>
          </div>

          {/* Barre de progression */}
          <div className="p-4 bg-card border border-border rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Progression de configuration</p>
              <p className="text-sm font-mono text-muted-foreground">{configuredCount}/{totalCount} catégories</p>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: totalCount > 0 ? `${(configuredCount / totalCount) * 100}%` : '0%' }}
              />
            </div>
            {configuredCount === totalCount && totalCount > 0 && (
              <p className="text-xs text-success mt-2 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Toutes les catégories sont configurées pour cette zone
              </p>
            )}
          </div>

          {/* Liste des catégories à configurer */}
          {loadingTarifs ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {categories.filter((c) => c.actif).map((cat) => {
                const tarif = getTarif(cat.id_categorie)
                const configured = isConfigured(cat.id_categorie)
                return (
                  <div
                    key={cat.id_categorie}
                    className={`bg-card border rounded-2xl p-4 transition-all ${configured ? 'border-border' : 'border-warning/40 bg-warning/5'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {configured ? (
                          <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-warning flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-sm">{cat.nom}</p>
                          <p className="text-xs text-muted-foreground">{cat.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {configured && (
                          <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground font-mono">
                            <span>Base: {tarif.tarif_base} XOF</span>
                            <span>{tarif.tarif_km} XOF/km</span>
                            <span>{tarif.tarif_minute} XOF/min</span>
                          </div>
                        )}
                        <button
                          onClick={() => setModal({ ...tarif })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            configured
                              ? 'border border-border hover:bg-muted'
                              : 'bg-primary text-primary-foreground hover:bg-primary/90'
                          }`}
                        >
                          {configured ? 'Modifier' : 'Configurer'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Modal de saisie des tarifs */}
      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl w-full max-w-md shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 pb-4 border-b border-border/50">
              <h2 className="font-display font-bold text-lg">
                {categories.find((c) => c.id_categorie === modal.id_categorie)?.nom}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Zone : <span className="font-medium text-foreground">{selectedZone?.nom}</span>
              </p>
            </div>

            <div className="p-6 space-y-5">
              {/* Explication contextuelle */}
              <div className="p-3 bg-muted/50 rounded-xl text-xs text-muted-foreground leading-relaxed">
                Ces tarifs s'appliquent à tous les véhicules de type <strong className="text-foreground">{categories.find((c) => c.id_categorie === modal.id_categorie)?.nom}</strong> circulant dans la zone <strong className="text-foreground">{selectedZone?.nom}</strong>.
              </div>

              {[
                { key: 'tarif_base', label: 'Tarif de base (XOF)', placeholder: 'Ex: 500', hint: 'Montant fixe au démarrage de chaque course' },
                { key: 'tarif_km', label: 'Tarif par kilomètre (XOF/km)', placeholder: 'Ex: 150', hint: 'Multiplié par la distance réelle parcourue' },
                { key: 'tarif_minute', label: 'Tarif par minute (XOF/min)', placeholder: 'Ex: 15', hint: `Calculé sur durée estimée à ${selectedZone?.vitesse_moyenne_kmh} km/h — non lié au temps réel` },
              ].map(({ key, label, placeholder, hint }) => (
                <div key={key}>
                  <label className="block text-[12px] font-bold text-foreground mb-1 uppercase tracking-wider">{label}</label>
                  <input
                    type="number"
                    placeholder={placeholder}
                    value={(modal as any)[key] ?? ''}
                    onChange={(e) => setModal((m) => m ? { ...m, [key]: Number(e.target.value) } : m)}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>
                </div>
              ))}

              {/* Aperçu du calcul */}
              {modal.tarif_base > 0 && modal.tarif_km > 0 && modal.tarif_minute > 0 && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2">Exemple — trajet de 5 km</p>
                  {(() => {
                    const duree = Math.round((5 / (selectedZone?.vitesse_moyenne_kmh ?? 30)) * 60)
                    const total = modal.tarif_base + (5 * modal.tarif_km) + (duree * modal.tarif_minute)
                    return (
                      <p className="text-xs text-muted-foreground">
                        {modal.tarif_base} + (5 × {modal.tarif_km}) + ({duree} min × {modal.tarif_minute}) = <span className="font-bold text-foreground">{total.toLocaleString()} XOF</span>
                      </p>
                    )
                  })()}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border flex gap-3 justify-end bg-white dark:bg-zinc-900">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl border border-border hover:bg-muted text-sm font-semibold">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50">
                {saving ? 'Enregistrement...' : 'Enregistrer les tarifs'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Codes promo — inchangé ────────────────────────────────────
// ... ton PromosTab existant reste identique ...

// ─── Codes promo ───────────────────────────────────────────────
function PromosTab() {
  const { toast } = useToast()
  const [promos, setPromos] = useState<CodePromo[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Partial<CodePromo> | null>(null)
  const [isNew, setIsNew] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setPromos(await configService.listPromos()) }
    catch { toast({ title: 'Erreur', variant: 'destructive' }) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => {
    setIsNew(true)
    setModal({ code: '', type_reduction: 'pourcentage', valeur: 10, date_debut: new Date().toISOString().slice(0, 10), actif: true, nb_utilisations_actuel: 0 })
  }
  const openEdit = (p: CodePromo) => { setIsNew(false); setModal({ ...p }) }

  const handleSave = async () => {
    if (!modal) return
    if (modal.type_reduction === 'pourcentage' && (modal.valeur ?? 0) > 100) {
      toast({ title: 'Erreur', description: 'Le pourcentage ne peut pas dépasser 100', variant: 'destructive' }); return
    }
    try {
      if (isNew) await configService.createPromo(modal as any)
      else await configService.updatePromo(modal.id_promo!, modal)
      toast({ title: isNew ? 'Code créé' : 'Code mis à jour', variant: 'success' })
      setModal(null); load()
    } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
  }

  const getProgressColor = (actuel: number, max?: number) => {
    if (!max) return 'bg-success'
    const pct = actuel / max
    if (pct >= 1) return 'bg-destructive'
    if (pct >= 0.75) return 'bg-warning'
    return 'bg-success'
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Nouveau code
        </button>
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Code', 'Type', 'Valeur', 'Période', 'Utilisations', 'Statut', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : promos.map((p) => (
                <tr key={p.id_promo} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <code className="px-2 py-0.5 bg-muted rounded font-mono text-xs font-semibold">{p.code}</code>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${p.type_reduction === 'pourcentage' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}`}>
                      {p.type_reduction === 'pourcentage' ? '%' : 'FCFA'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">{p.type_reduction === 'pourcentage' ? `${p.valeur}%` : `${p.valeur} FCFA`}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDateShort(p.date_debut)} → {p.date_fin ? formatDateShort(p.date_fin) : '∞'}
                  </td>
                  <td className="px-4 py-3 min-w-[120px]">
                    <div className="text-xs mb-1">{p.nb_utilisations_actuel}{p.nb_utilisations_max ? `/${p.nb_utilisations_max}` : ''}</div>
                    {p.nb_utilisations_max && (
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getProgressColor(p.nb_utilisations_actuel, p.nb_utilisations_max)}`}
                          style={{ width: `${Math.min(100, (p.nb_utilisations_actuel / p.nb_utilisations_max) * 100)}%` }}
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={async () => { await configService.updatePromo(p.id_promo, { actif: !p.actif }); load() }}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${p.actif ? 'bg-primary' : 'bg-muted'}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${p.actif ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={async () => { if (confirm('Supprimer ?')) { await configService.deletePromo(p.id_promo); load() } }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl w-full max-w-md shadow-2xl animate-fade-in flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 pb-4 border-b border-border/50">
              <h2 className="font-display font-bold text-lg">{isNew ? 'Nouveau code promo' : 'Modifier le code'}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-background/30">
              <div>
                <label className="block text-[12px] font-bold text-foreground mb-1.5 uppercase tracking-wider">Code de réduction</label>
                <input
                  type="text" placeholder="EX: BIENVENUE20"
                  value={modal.code ?? ''}
                  onChange={(e) => setModal((m) => ({ ...m, code: e.target.value.toUpperCase() }))}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-mono font-medium outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-foreground mb-1.5 uppercase tracking-wider">Type de remise</label>
                <select
                  value={modal.type_reduction}
                  onChange={(e) => setModal((m) => ({ ...m, type_reduction: e.target.value as any }))}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all cursor-pointer"
                >
                  <option value="pourcentage">Pourcentage (%)</option>
                  <option value="fixe">Montant fixe (FCFA)</option>
                </select>
              </div>
              {[
                { key: 'valeur', label: modal.type_reduction === 'pourcentage' ? 'Valeur du rabais (%)' : 'Montant du rabais (FCFA)', type: 'number' },
                { key: 'date_debut', label: 'Début de validité', type: 'date' },
                { key: 'date_fin', label: 'Fin de validité (optionnel)', type: 'date' },
                { key: 'nb_utilisations_max', label: "Limite d'utilisations (max)", type: 'number' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-[12px] font-bold text-foreground mb-1.5 uppercase tracking-wider">{label}</label>
                  <input
                    type={type}
                    value={(modal as any)[key] ?? ''}
                    onChange={(e) => setModal((m) => ({ ...m, [key]: type === 'number' && e.target.value ? Number(e.target.value) : e.target.value || undefined }))}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
              ))}
              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-border">
                <div>
                  <p className="text-sm font-bold">Activer le code</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-tight">Rendre disponible immédiatement</p>
                </div>
                <button
                  onClick={() => setModal((m) => ({ ...m, actif: !m?.actif }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${modal.actif ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${modal.actif ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
            <div className="p-6 border-t border-border flex gap-3 justify-end bg-white dark:bg-zinc-900">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl border border-border hover:bg-muted text-sm font-semibold">Annuler</button>
              <button onClick={handleSave} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Page principale ───────────────────────────────────────────
export default function Config() {
  const [tab, setTab] = useState<Tab>('zones')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'zones', label: 'Zones tarifaires' },
    { key: 'categories', label: 'Catégories' },
    { key: 'tarifs', label: 'Tarifs' },
    { key: 'promos', label: 'Codes promo' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold">Configuration</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Paramètres de la plateforme</p>
      </div>

      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'zones' && <ZonesTab />}
      {tab === 'categories' && <CategoriesTab />}
      {tab === 'tarifs' && <TarifsTab />}
      {tab === 'promos' && <PromosTab />}
    </div>
  )
}