import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: number
  loading?: boolean
  className?: string
}

export function KpiCard({ title, value, subtitle, icon: Icon, trend, loading, className }: KpiCardProps) {
  return (
    <div className={cn(
      'bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow',
      className
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground font-medium truncate">{title}</p>
          {loading ? (
            <div className="h-8 w-28 bg-muted animate-pulse rounded-md mt-1" />
          ) : (
            <p className="text-2xl font-bold font-display mt-1 truncate">{value}</p>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      {trend !== undefined && (
        <div className={cn(
          'flex items-center gap-1 text-xs font-medium',
          trend >= 0 ? 'text-success' : 'text-destructive'
        )}>
          {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span>{trend >= 0 ? '+' : ''}{trend}% vs hier</span>
        </div>
      )}
    </div>
  )
}
