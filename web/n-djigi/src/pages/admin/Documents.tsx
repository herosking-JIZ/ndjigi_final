import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, Eye } from 'lucide-react'
import { documentsService } from '@/services/api'
import { StatusBadge } from '@/components/StatusBadge'
import { useToast } from '@/hooks/useToast'
import { formatDate } from '@/lib/utils'
import type { Document } from '@/types'

const DOC_LABELS: Record<string, string> = {
  permis: 'Permis de conduire',
  cni: 'Carte nationale d\'identité',
  carte_grise: 'Carte grise',
  assurance: 'Attestation d\'assurance',
}

export default function Documents() {
  const { toast } = useToast()
  const [pending, setPending] = useState<Document[]>([])
  const [history, setHistory] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectModal, setRejectModal] = useState<Document | null>(null)
  const [motif, setMotif] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, h] = await Promise.all([
        documentsService.listEnAttente(),
        documentsService.listHistorique(),
      ])
      setPending(p)
      setHistory(h)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les documents', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleValider = async (doc: Document) => {
    try {
      await documentsService.valider(doc.id_document)
      toast({ title: 'Document validé', variant: 'success' })
      load()
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }

  const handleRejeter = async () => {
    if (!rejectModal) return
    try {
      await documentsService.rejeter(rejectModal.id_document, motif)
      toast({ title: 'Document rejeté', description: motif })
      setRejectModal(null)
      setMotif('')
      load()
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }

  const handleVoir = async (doc: Document) => {
    try {
      // Import axios pour récupérer le fichier avec authentification
      const api = (await import('@/services/api')).default

      // Requête GET avec token Bearer automatique
      const response = await api.get(
        `/documents/${doc.id_document}/fichier?inline=true`,
        { responseType: 'blob' }
      )

      // Créer une Blob URL et l'ouvrir dans un nouvel onglet
      const blob = response.data
      const blobUrl = URL.createObjectURL(blob)
      window.open(blobUrl, '_blank')

      // Nettoyer après un certain délai (le navigateur a eu le temps de charger)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible d\'ouvrir le document', variant: 'destructive' })
    }
  }

  const DocumentTable = ({ docs, withActions }: { docs: Document[]; withActions?: boolean }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Utilisateur</th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Type</th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Date</th>
            {!withActions && <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Statut</th>}
            {withActions && <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {docs.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                Aucun document
              </td>
            </tr>
          ) : (
            docs.map((doc) => (
              <tr key={doc.id_document} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{doc.utilisateur_prenom} {doc.utilisateur_nom}</td>
                <td className="px-4 py-3 text-muted-foreground">{DOC_LABELS[doc.type] ?? doc.type}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(doc.date_soumission)}</td>
                {!withActions && (
                  <td className="px-4 py-3"><StatusBadge status={doc.statut_verification} /></td>
                )}
                {withActions && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleVoir(doc)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-medium"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Voir
                      </button>
                      <button
                        onClick={() => handleValider(doc)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors text-xs font-medium"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Valider
                      </button>
                      <button
                        onClick={() => setRejectModal(doc)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-xs font-medium"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Rejeter
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold">Documents</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Vérification des pièces justificatives</p>
      </div>

      {/* En attente */}
      {(loading || pending.length > 0) && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold">En attente de validation</h2>
            {!loading && (
              <span className="px-2 py-0.5 bg-warning/15 text-warning text-xs font-medium rounded-full border border-warning/30">
                {pending.length} en attente
              </span>
            )}
          </div>
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <DocumentTable docs={pending} withActions />
          )}
        </div>
      )}

      {/* Historique */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-display font-semibold">Historique des documents</h2>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <DocumentTable docs={history} />
        )}
      </div>

      {/* Modal rejet */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setRejectModal(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-bold text-lg mb-1">Rejeter le document</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {DOC_LABELS[rejectModal.type]} de {rejectModal.utilisateur_prenom} {rejectModal.utilisateur_nom}
            </p>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Motif du rejet (obligatoire)…"
              rows={3}
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-sm">
                Annuler
              </button>
              <button
                onClick={handleRejeter}
                disabled={!motif.trim()}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
