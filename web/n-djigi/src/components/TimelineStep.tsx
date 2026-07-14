import { formatDate } from '@/lib/utils'
import { MaintenanceStatut } from '@/types'

interface TimelineStepProps {
  statut: MaintenanceStatut
  commentaire?: string
  date: string
  isLast?: boolean
}

const statutColors: Record<MaintenanceStatut, string> = {
  'en_attente': 'bg-warning text-warning',
  'confirmee': 'bg-primary text-primary',
  'en_reparation': 'bg-accent text-accent',
  'terminee': 'bg-success text-success',
  'bon_etat': 'bg-success text-success'
}

const statutLabels: Record<MaintenanceStatut, string> = {
  'en_attente': 'En attente',
  'confirmee': 'Confirmée',
  'en_reparation': 'En réparation',
  'terminee': 'Terminée',
  'bon_etat': 'Bon état'
}

export function TimelineStep({
  statut,
  commentaire,
  date,
  isLast = false
}: TimelineStepProps) {
  const [color, textColor] = statutColors[statut].split(' ')

  return (
    <div className="flex gap-3">
      {/* Vertical line */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${textColor} bg-current mt-1.5`} />
        {!isLast && <div className="w-0.5 h-12 bg-border mt-1" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${color} bg-opacity-10 ${textColor}`}>
            {statutLabels[statut]}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(date)}
          </span>
        </div>
        {commentaire && (
          <p className="text-sm text-muted-foreground mt-1">
            {commentaire}
          </p>
        )}
      </div>
    </div>
  )
}
