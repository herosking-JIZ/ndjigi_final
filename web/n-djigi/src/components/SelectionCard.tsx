import { ReactNode } from 'react'

interface SelectionCardProps {
  label: string
  icon?: ReactNode
  description?: string
  selected?: boolean
  onClick?: () => void
  color?: 'success' | 'warning' | 'danger'
  className?: string
}

const colorMap = {
  success: 'bg-success/10 border-success text-success',
  warning: 'bg-warning/10 border-warning text-warning',
  danger: 'bg-danger/10 border-danger text-danger'
}

export function SelectionCard({
  label,
  icon,
  description,
  selected = false,
  onClick,
  color = 'success',
  className = ''
}: SelectionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative p-4 rounded-xl border-2 transition-all text-left
        ${selected
          ? `${colorMap[color]} ring-2 ring-offset-2 ring-${color}`
          : 'border-border hover:border-primary/50 bg-background'
        }
        ${className}
      `}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-current opacity-20" />
      )}

      {icon && <div className="mb-2 text-xl">{icon}</div>}

      <p className={`font-semibold text-sm ${
        selected ? 'text-current' : 'text-primary'
      }`}>
        {label}
      </p>

      {description && (
        <p className={`text-xs mt-1 ${
          selected ? 'text-current opacity-80' : 'text-muted-foreground'
        }`}>
          {description}
        </p>
      )}
    </button>
  )
}
