import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm animate-fade-in min-w-[300px] max-w-[400px]',
            t.variant === 'destructive'
              ? 'bg-destructive/10 border-destructive/30 text-destructive'
              : t.variant === 'success'
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-card border-border text-foreground'
          )}
        >
          {t.variant === 'destructive' ? (
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          ) : t.variant === 'success' ? (
            <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
          )}
          <div className="flex-1 min-w-0">
            {t.title && <p className="font-semibold text-sm">{t.title}</p>}
            {t.description && <p className="text-xs opacity-80 mt-0.5">{t.description}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-60 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
