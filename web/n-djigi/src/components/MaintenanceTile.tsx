import { ChevronDown, Wrench, AlertTriangle, Camera } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MaintenanceRequest, MaintenanceStatut } from '@/types'
import { StatusBadge } from './StatusBadge'
import { TimelineStep } from './TimelineStep'
import { parkeurService } from '@/services/api'

interface MaintenanceTileProps {
  maintenance: MaintenanceRequest
  parkingId: string
  onClick?: () => void
  onStatusChange?: (statut: MaintenanceStatut, commentaire?: string) => void
  onPhotoUpload?: (file: File) => void
  isLoading?: boolean
}

const typeIcons: Record<string, string> = {
  'mecanique': '⚙️',
  'electricite': '⚡',
  'carrosserie': '🔨'
}

const urgenceColors: Record<string, string> = {
  'basse': 'bg-success/10 text-success',
  'normale': 'bg-warning/10 text-warning',
  'haute': 'bg-danger/10 text-danger'
}

const nextStatus: Partial<Record<MaintenanceStatut, { value: MaintenanceStatut; label: string }>> = {
  en_attente: { value: 'confirmee', label: 'Confirmer la demande' },
  confirmee: { value: 'en_reparation', label: 'Démarrer la réparation' },
  en_reparation: { value: 'terminee', label: 'Marquer terminée' },
  terminee: { value: 'bon_etat', label: 'Valider le bon état' },
}

export function MaintenanceTile({
  maintenance,
  parkingId,
  onClick,
  onStatusChange,
  onPhotoUpload,
  isLoading = false
}: MaintenanceTileProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-border rounded-xl overflow-hidden hover:bg-muted/50 transition-colors">
      {/* Header */}
      <button
        onClick={() => {
          setExpanded(!expanded)
          onClick?.()
        }}
        disabled={isLoading}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted transition-colors text-left disabled:opacity-60"
      >
        {/* Icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${urgenceColors[maintenance.urgence]}`}>
          {typeIcons[maintenance.type] || '🔧'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate">
              {maintenance.immatriculation}
            </p>
            {maintenance.urgence === 'haute' && (
              <AlertTriangle className="h-4 w-4 text-danger flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {maintenance.type} • {maintenance.date_creation.split('T')[0]}
          </p>
        </div>

        {/* Status Badge */}
        <StatusBadge status={maintenance.statut} />

        {/* Expand icon */}
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-4 bg-muted/20">
          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">Description</p>
            <p className="text-sm text-foreground">{maintenance.description}</p>
          </div>

          {/* Gestionnaire */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">Signalé par</p>
            <p className="text-sm text-foreground">{maintenance.gestionnaire_nom}</p>
          </div>

          {/* Timeline */}
          {maintenance.historique && maintenance.historique.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Historique</p>
              <div className="space-y-0">
                {maintenance.historique.map((step, idx) => (
                  <TimelineStep
                    key={step.id_step}
                    statut={step.statut_nouveau}
                    commentaire={step.commentaire}
                    date={step.date_transition}
                    isLast={idx === maintenance.historique!.length - 1}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          {maintenance.photos && maintenance.photos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Photos ({maintenance.photos.length})</p>
              <div className="grid grid-cols-3 gap-2">
                {maintenance.photos.map(photo => (
                  <SecureParkingPhoto
                    key={photo.id_photo}
                    parkingId={parkingId}
                    photoId={photo.id_photo}
                  />
                ))}
              </div>
            </div>
          )}

          {onPhotoUpload && (
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-primary hover:underline">
              <Camera className="h-4 w-4" /> Ajouter une photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) onPhotoUpload(file)
                  event.target.value = ''
                }}
              />
            </label>
          )}

          {nextStatus[maintenance.statut] && onStatusChange && (
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onStatusChange(nextStatus[maintenance.statut]!.value)}
              className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {nextStatus[maintenance.statut]!.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function SecureParkingPhoto({ parkingId, photoId }: { parkingId: string; photoId: string }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let objectUrl: string | null = null
    parkeurService.getParkingPhoto(parkingId, photoId).then((blob) => {
      if (!active) return
      objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    }).catch(() => setUrl(null))
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [parkingId, photoId])

  if (!url) return <div className="aspect-square rounded-lg bg-muted" />
  return (
    <a href={url} target="_blank" rel="noreferrer" className="aspect-square rounded-lg bg-muted overflow-hidden hover:opacity-80">
      <img src={url} alt="maintenance" className="w-full h-full object-cover" />
    </a>
  )
}
