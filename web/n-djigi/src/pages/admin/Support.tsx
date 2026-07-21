import { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, Loader2, MessageCircle, Search, Send, X } from 'lucide-react'
import { io, type Socket } from 'socket.io-client'
import { supportService } from '@/services/api'
import { StatusBadge } from '@/components/StatusBadge'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, formatFCFA } from '@/lib/utils'
import type { ChatMessage, SupportStats, Ticket, TicketPriorite, TicketStatut } from '@/types'

const PRIORITES: { value: TicketPriorite; label: string }[] = [
  { value: 'faible', label: 'Faible' }, { value: 'normale', label: 'Normale' },
  { value: 'haute', label: 'Haute' }, { value: 'urgente', label: 'Urgente' },
]
const PRIORITE_STYLE: Record<TicketPriorite, string> = {
  urgente: 'bg-destructive/15 text-destructive border-destructive/30',
  haute: 'bg-warning/15 text-warning border-warning/30',
  normale: 'bg-primary/15 text-primary border-primary/30',
  faible: 'bg-muted text-muted-foreground border-border',
}
const STATUTS: { value: TicketStatut; label: string }[] = [
  { value: 'ouvert', label: 'Ouvert' }, { value: 'en_cours', label: 'En cours' },
  { value: 'resolu', label: 'Résolu' }, { value: 'ferme', label: 'Fermé' },
]
const EMPTY_STATS: SupportStats = { total: 0, ouverts: 0, en_cours: 0, resolus: 0, fermes: 0 }

function TicketChat({ ticket }: { ticket: Ticket }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [contenu, setContenu] = useState('')
  const [loading, setLoading] = useState(true)
  const socketRef = useRef<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!ticket.id_conversation) return
    const id = ticket.id_conversation
    supportService.messages(id).then(setMessages).catch(() => {
      toast({ title: 'Historique du chat indisponible', variant: 'destructive' })
    }).finally(() => setLoading(false))

    const socket = io('/chat', {
      path: '/socket.io',
      auth: { token: localStorage.getItem('ndjigi_access_token') },
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket
    socket.on('connect', () => {
      socket.emit('conversation:join', { id_conversation: id })
      socket.emit('message:read', { id_conversation: id })
    })
    socket.on('message:new', (message: ChatMessage) => {
      if (message.id_conversation !== id) return
      setMessages((current) => current.some((m) => m.id_message === message.id_message) ? current : [...current, message])
      socket.emit('message:read', { id_conversation: id })
    })
    socket.on('message:error', () => toast({ title: "Le message n'a pas pu être envoyé", variant: 'destructive' }))
    return () => { socket.disconnect(); socketRef.current = null }
  }, [ticket.id_conversation])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const envoyer = (event: React.FormEvent) => {
    event.preventDefault()
    const texte = contenu.trim()
    if (!texte || !ticket.id_conversation || !socketRef.current?.connected) return
    socketRef.current.emit('message:send', { id_conversation: ticket.id_conversation, contenu: texte })
    setContenu('')
  }

  return <section className="border border-border rounded-xl overflow-hidden">
    <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center gap-2 font-medium text-sm">
      <MessageCircle className="h-4 w-4" /> Conversation avec le client
    </div>
    <div className="h-56 overflow-y-auto p-3 space-y-2 bg-background">
      {loading ? <div className="h-full grid place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        : messages.length === 0 ? <p className="text-sm text-muted-foreground text-center pt-16">Aucun message. Démarrez la conversation.</p>
        : messages.map((message) => {
          const mine = message.id_expediteur === user?.id_utilisateur
          return <div key={message.id_message} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[82%] rounded-xl px-3 py-2 text-sm ${mine ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <p className="text-[10px] opacity-70 mb-0.5">{message.nom_expediteur}</p>
              <p className="whitespace-pre-wrap break-words">{message.contenu}</p>
              <p className="text-[10px] opacity-60 text-right mt-1">{formatDate(message.date_envoi)}</p>
            </div>
          </div>
        })}
      <div ref={bottomRef} />
    </div>
    <form onSubmit={envoyer} className="p-3 border-t border-border flex gap-2">
      <input value={contenu} onChange={(e) => setContenu(e.target.value)} maxLength={2000} placeholder="Écrire une réponse…"
        className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
      <button disabled={!contenu.trim()} className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-40" title="Envoyer"><Send className="h-4 w-4" /></button>
    </form>
  </section>
}

function TicketModal({ ticket, onClose, onUpdated }: { ticket: Ticket; onClose: () => void; onUpdated: () => void }) {
  const { toast } = useToast()
  const [statut, setStatut] = useState(ticket.statut)
  const [priorite, setPriorite] = useState(ticket.priorite)
  const [note, setNote] = useState(ticket.note_resolution || '')
  const [updating, setUpdating] = useState(false)

  const changerStatut = async (nouveau: TicketStatut) => {
    if (['resolu', 'ferme'].includes(nouveau) && !note.trim()) {
      toast({ title: 'Note de résolution requise', variant: 'destructive' }); return
    }
    setUpdating(true)
    try {
      await supportService.updateStatut(ticket.id_ticket, nouveau, note)
      setStatut(nouveau); onUpdated()
      toast({ title: 'Statut mis à jour', variant: 'success' })
    } catch (error: any) { toast({ title: 'Erreur', description: error?.response?.data?.message, variant: 'destructive' }) }
    finally { setUpdating(false) }
  }

  const changerPriorite = async (value: TicketPriorite) => {
    setUpdating(true)
    try { await supportService.updatePriorite(ticket.id_ticket, value); setPriorite(value); onUpdated() }
    catch { toast({ title: 'Priorité non modifiée', variant: 'destructive' }) }
    finally { setUpdating(false) }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
    <div className="bg-white text-foreground border border-border rounded-2xl p-6 w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[94vh] space-y-4" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start justify-between gap-3">
        <div><h2 className="font-display font-bold text-lg">{ticket.sujet.replace(/_/g, ' ')}</h2><div className="mt-2"><StatusBadge status={statut} /></div></div>
        <button onClick={onClose}><X className="h-5 w-5" /></button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <div><p className="text-xs text-muted-foreground">Utilisateur</p><p className="font-medium">{ticket.utilisateur_prenom} {ticket.utilisateur_nom}</p><p>{ticket.utilisateur_email}</p><p>{ticket.utilisateur_telephone}</p></div>
        <div><p className="text-xs text-muted-foreground">Créé le</p><p>{formatDate(ticket.date_creation)}</p></div>
      </div>
      <div className="bg-muted rounded-xl px-4 py-3 text-sm"><p className="text-xs text-muted-foreground mb-1">Description</p><p className="whitespace-pre-wrap">{ticket.description}</p></div>
      {ticket.trajet && <div className="border border-border rounded-xl p-3 text-sm"><p className="font-medium mb-1">Trajet lié</p><p>{ticket.trajet.adresse_depart} → {ticket.trajet.adresse_arrivee}</p><p className="text-muted-foreground">{ticket.trajet.tarif_final != null && formatFCFA(ticket.trajet.tarif_final)}</p></div>}
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm font-medium">Priorité
          <select value={priorite} disabled={updating} onChange={(e) => changerPriorite(e.target.value as TicketPriorite)} className="mt-1 w-full rounded-xl border border-input bg-white px-3 py-2">
            {PRIORITES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Note de résolution
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Obligatoire pour résoudre ou fermer" className="mt-1 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm" />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">{STATUTS.map((item) => <button key={item.value} disabled={updating || statut === item.value} onClick={() => changerStatut(item.value)} className={`px-3 py-1.5 rounded-lg text-xs border disabled:opacity-50 ${statut === item.value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{item.label}</button>)}</div>
      {ticket.id_conversation && <TicketChat ticket={ticket} />}
    </div>
  </div>
}

export default function Support() {
  const { toast } = useToast()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<SupportStats>(EMPTY_STATS)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Ticket | null>(null)
  const limit = 20

  const load = useCallback(async () => {
    setLoading(true)
    try { const result = await supportService.list({ page, limit, search, statut: filterStatut }); setTickets(result.data); setTotal(result.total); setStats(result.stats) }
    catch { toast({ title: 'Impossible de charger les tickets', variant: 'destructive' }) }
    finally { setLoading(false) }
  }, [page, search, filterStatut])
  useEffect(() => { load() }, [load])

  const ouvrir = async (ticket: Ticket) => {
    setDetailLoading(true)
    try { setSelected(await supportService.getById(ticket.id_ticket)) }
    catch { toast({ title: 'Détail du ticket indisponible', variant: 'destructive' }) }
    finally { setDetailLoading(false) }
  }
  const totalPages = Math.ceil(total / limit)

  return <div className="space-y-5">
    <div><h1 className="text-2xl font-display font-bold">Assistance</h1><p className="text-sm text-muted-foreground">Tickets clients, traitement et conversation en temps réel</p></div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[
      ['Total', stats.total], ['Ouverts', stats.ouverts], ['En cours', stats.en_cours], ['Résolus', stats.resolus],
    ].map(([label, value]) => <div key={label} className="bg-card border border-border rounded-xl px-4 py-3"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold">{loading ? '—' : value}</p></div>)}</div>
    <div className="bg-card border border-border rounded-2xl p-4 flex gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Sujet, description ou utilisateur…" className="w-full pl-9 pr-3 py-2 rounded-xl border bg-background text-sm" /></div><select value={filterStatut} onChange={(e) => { setFilterStatut(e.target.value); setPage(1) }} className="rounded-xl border bg-background px-3"><option value="">Tous les statuts</option>{STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
    <div className="bg-card border border-border rounded-2xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-muted/40"><th className="text-left px-4 py-3">Sujet</th><th className="text-left px-4 py-3">Utilisateur</th><th className="text-left px-4 py-3">Priorité</th><th className="text-left px-4 py-3">Statut</th><th className="text-left px-4 py-3">Date</th><th /></tr></thead><tbody>
      {loading ? <tr><td colSpan={6} className="py-12 text-center"><Loader2 className="inline h-5 w-5 animate-spin" /></td></tr> : tickets.length === 0 ? <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">Aucun ticket trouvé</td></tr> : tickets.map((t) => <tr key={t.id_ticket} className="border-b last:border-0 hover:bg-muted/30"><td className="px-4 py-3 font-medium">{t.sujet.replace(/_/g, ' ')}</td><td className="px-4 py-3">{t.utilisateur_prenom} {t.utilisateur_nom}</td><td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs border ${PRIORITE_STYLE[t.priorite]}`}>{PRIORITES.find((p) => p.value === t.priorite)?.label}</span></td><td className="px-4 py-3"><StatusBadge status={t.statut} /></td><td className="px-4 py-3 text-muted-foreground">{formatDate(t.date_creation)}</td><td className="px-4 py-3 text-right"><button disabled={detailLoading} onClick={() => ouvrir(t)} className="p-1.5 rounded-lg hover:bg-muted"><Eye className="h-4 w-4" /></button></td></tr>)}
    </tbody></table></div>{totalPages > 1 && <div className="border-t px-4 py-3 flex justify-between"><span>Page {page} / {totalPages}</span><div className="flex gap-2"><button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border rounded disabled:opacity-40">←</button><button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded disabled:opacity-40">→</button></div></div>}</div>
    {selected && <TicketModal ticket={selected} onClose={() => setSelected(null)} onUpdated={load} />}
  </div>
}
