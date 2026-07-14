import { cn } from '@/lib/utils'

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  // Compte utilisateur
  actif:       { label: 'Actif',       className: 'bg-success/15 text-success border-success/30' },
  suspendu:    { label: 'Suspendu',    className: 'bg-destructive/15 text-destructive border-destructive/30' },
  en_attente:  { label: 'En attente', className: 'bg-warning/15 text-warning border-warning/30' },
  // Document
  valide:      { label: 'Validé',  className: 'bg-success/15 text-success border-success/30' },
  rejete:      { label: 'Rejeté',  className: 'bg-destructive/15 text-destructive border-destructive/30' },
  // Trajet / Ticket (partagé : en_cours, annule)
  en_cours:    { label: 'En cours', className: 'bg-primary/15 text-primary border-primary/30' },
  termine:     { label: 'Terminé',  className: 'bg-success/15 text-success border-success/30' },
  annule:      { label: 'Annulé',   className: 'bg-muted text-muted-foreground border-border' },
  // Transaction statut
  complete:    { label: 'Complète', className: 'bg-success/15 text-success border-success/30' },
  echec:       { label: 'Échouée', className: 'bg-destructive/15 text-destructive border-destructive/30' },
  // Parking mouvements
  entree:      { label: 'Entrée', className: 'bg-primary/15 text-primary border-primary/30' },
  sortie:      { label: 'Sortie', className: 'bg-warning/15 text-warning border-warning/30' },
  // Véhicule
  disponible:  { label: 'Disponible',  className: 'bg-success/15 text-success border-success/30' },
  en_location: { label: 'En location', className: 'bg-primary/15 text-primary border-primary/30' },
  maintenance: { label: 'Maintenance', className: 'bg-warning/15 text-warning border-warning/30' },
  // État véhicule
  bon:         { label: 'Bon état',   className: 'bg-success/15 text-success border-success/30' },
  a_verifier:  { label: 'À vérifier', className: 'bg-warning/15 text-warning border-warning/30' },
  dommage:     { label: 'Dommage',    className: 'bg-destructive/15 text-destructive border-destructive/30' },
  // Type de transaction
  course:        { label: 'Course',       className: 'bg-primary/15 text-primary border-primary/30' },
  location:      { label: 'Location',     className: 'bg-accent text-accent-foreground border-border' },
  commission:    { label: 'Commission',   className: 'bg-success/15 text-success border-success/30' },
  remboursement: { label: 'Remboursement',className: 'bg-warning/15 text-warning border-warning/30' },
  depot:         { label: 'Dépôt',        className: 'bg-success/15 text-success border-success/30' },
  retrait:       { label: 'Retrait',      className: 'bg-muted text-muted-foreground border-border' },
  // Tickets support
  ouvert: { label: 'Ouvert', className: 'bg-warning/15 text-warning border-warning/30' },
  resolu: { label: 'Résolu', className: 'bg-success/15 text-success border-success/30' },
  ferme:  { label: 'Fermé',  className: 'bg-muted text-muted-foreground border-border' },
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? { label: status, className: 'bg-muted text-muted-foreground border-border' }
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
      config.className,
      className
    )}>
      {config.label}
    </span>
  )
}
