import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-4">
      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
        <MapPin className="h-8 w-8 text-white" />
      </div>
      <div className="text-center">
        <h1 className="text-6xl font-display font-bold text-primary mb-2">404</h1>
        <p className="text-xl font-semibold">Page introuvable</p>
        <p className="text-muted-foreground mt-2">Cette page n'existe pas ou vous n'y avez pas accès.</p>
      </div>
      <Link to="/" className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
        Retour à l'accueil
      </Link>
    </div>
  )
}
