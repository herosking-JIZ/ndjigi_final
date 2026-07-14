import { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface NdjButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  type?: 'button' | 'submit' | 'reset'
  className?: string
}

const baseStyles = 'font-semibold rounded-xl transition-colors flex items-center justify-center gap-2'

const variants = {
  primary: 'bg-primary text-white hover:bg-primary/90 disabled:opacity-60',
  secondary: 'bg-secondary text-white hover:bg-secondary/90 disabled:opacity-60',
  outline: 'border border-border hover:bg-muted disabled:opacity-60',
  danger: 'bg-danger text-white hover:bg-danger/90 disabled:opacity-60'
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm h-9',
  md: 'px-4 py-2 text-sm h-10',
  lg: 'px-5 py-3 text-base h-12 min-w-full sm:min-w-auto'
}

export function NdjButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  className = ''
}: NdjButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement...
        </>
      ) : (
        children
      )}
    </button>
  )
}
