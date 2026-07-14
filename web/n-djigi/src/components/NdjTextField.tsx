import { ReactNode, InputHTMLAttributes, useState } from 'react'

interface NdjTextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helpText?: string
  icon?: ReactNode
}

export function NdjTextField({
  label,
  error,
  helpText,
  icon,
  className = '',
  ...props
}: NdjTextFieldProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className="space-y-1">
      {label && (
        <label className={`block text-sm font-medium transition-colors ${
          isFocused ? 'text-primary' : 'text-muted-foreground'
        }`}>
          {label}
        </label>
      )}
      <div className={`relative flex items-center rounded-xl border transition-all ${
        error
          ? 'border-danger bg-danger/5'
          : isFocused
          ? 'border-primary bg-background ring-2 ring-primary/20'
          : 'border-input bg-background'
      }`}>
        {icon && <div className="absolute left-3 text-muted-foreground">{icon}</div>}
        <input
          {...props}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          className={`
            w-full px-3 py-2 text-sm bg-transparent outline-none
            ${icon ? 'pl-10' : ''}
            ${className}
          `}
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {helpText && !error && <p className="text-xs text-muted-foreground">{helpText}</p>}
    </div>
  )
}
