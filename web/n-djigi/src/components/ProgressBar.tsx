interface ProgressBarProps {
  current: number
  total: number
  label?: string
  showPercent?: boolean
}

export function ProgressBar({
  current,
  total,
  label,
  showPercent = true
}: ProgressBarProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0
  const isWarning = percent >= 90

  return (
    <div className="space-y-1.5">
      {(label || showPercent) && (
        <div className="flex justify-between items-center text-sm">
          {label && <span className="font-medium text-muted-foreground">{label}</span>}
          {showPercent && (
            <span className={`font-semibold ${
              isWarning ? 'text-danger' : 'text-primary'
            }`}>
              {percent}%
            </span>
          )}
        </div>
      )}

      <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isWarning
              ? 'bg-danger'
              : 'bg-primary'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{current}</span>
        <span>/{total}</span>
      </div>
    </div>
  )
}
