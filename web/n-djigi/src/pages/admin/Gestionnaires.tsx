import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Mail, MapPin, AlertCircle, Loader2, RotateCcw } from 'lucide-react'
import { gestionnaireService } from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { formatDate } from '@/lib/utils'
import type { GestionnaireCreationResponse } from '@/types'

interface Gestionnaire extends GestionnaireCreationResponse {
  invitation_sent_at: string
}

export default function Gestionnaires() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [gestionnaires, setGestionnaires] = useState<Gestionnaire[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resendingId, setResendingId] = useState<string | null>(null)

  // Load gestionnaires on mount
  useEffect(() => {
    loadGestionnaires()
  }, [])

  const loadGestionnaires = async () => {
    setLoading(true)
    setError('')
    try {
      // Note: This endpoint may not be implemented yet
      // For now, we'll show an empty list as a placeholder
      setGestionnaires([])
    } catch (err: any) {
      console.warn('Could not load gestionnaires:', err)
      // Don't show error for missing endpoint - just show empty list
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    navigate('/gestionnaires/create')
  }

  const handleResendInvitation = async (id_utilisateur: string, email: string) => {
    setResendingId(id_utilisateur)
    try {
      await gestionnaireService.resendInvitation(id_utilisateur)
      toast({
        title: 'Invitation renvoyée',
        description: `L'email a été renvoyé à ${email}`,
        variant: 'success',
      })
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Erreur lors du renvoi'
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setResendingId(null)
    }
  }

  const filteredGestionnaires = gestionnaires.filter(
    (g) =>
      g.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.parking?.nom.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestionnaires</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les gestionnaires de parking
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nouveau gestionnaire
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher par email ou parking..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
        />
      </div>

      {/* Content */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : gestionnaires.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'Aucun gestionnaire trouvé.' : 'Aucun gestionnaire créé pour le moment.'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Créer le premier gestionnaire
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Parking</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Créé le</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Expiration</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGestionnaires.map((gest) => (
                  <tr key={gest.id_utilisateur} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{gest.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {gest.parking?.nom || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatDate(gest.invitation_sent_at)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(gest.invitation_expires_at) < new Date() ? (
                        <span className="text-destructive font-medium">Expiré</span>
                      ) : (
                        <span className="text-success">
                          {new Date(gest.invitation_expires_at).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleResendInvitation(gest.id_utilisateur, gest.email)}
                        disabled={resendingId === gest.id_utilisateur}
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {resendingId === gest.id_utilisateur ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Envoi...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4" />
                            Renvoyer
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
