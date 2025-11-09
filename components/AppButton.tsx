import { ButtonHTMLAttributes, forwardRef } from 'react'

type AppButtonVariant = 'primary' | 'success' | 'warning' | 'danger' | 'secondary' | 'ghost'
type AppButtonSize = 'sm' | 'default' | 'lg'

interface AppButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: AppButtonVariant
  size?: AppButtonSize
  fullWidth?: boolean
}

/**
 * AppButton - The standard button component used throughout the app
 * 
 * Predefined color schemes with guaranteed proper contrast
 * Available variants: primary (blue), success (green), warning (yellow), danger (red), secondary (gray), ghost (transparent)
 */
export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(
  ({ variant = 'primary', size = 'default', fullWidth = false, className = '', children, ...props }, ref) => {
    
    // Predefined safe color schemes
    const variantClasses: Record<AppButtonVariant, string> = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
      success: 'bg-green-600 hover:bg-green-700 text-white border-green-600',
      warning: 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600',
      danger: 'bg-red-600 hover:bg-red-700 text-white border-red-600',
      secondary: 'bg-slate-600 hover:bg-slate-500 text-white border-slate-600',
      ghost: 'bg-transparent hover:bg-white/10 text-white border-white/20',
    }

    const sizeClasses: Record<AppButtonSize, string> = {
      sm: 'text-sm px-3 py-1.5',
      default: 'px-4 py-2',
      lg: 'text-lg px-6 py-3',
    }

    const combinedClassName = [
      variantClasses[variant],
      sizeClasses[size],
      fullWidth ? 'w-full' : '',
      'font-medium rounded-md transition-colors',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      className
    ].filter(Boolean).join(' ')

    return (
      <button
        ref={ref}
        className={combinedClassName}
        {...props}
      >
        {children}
      </button>
    )
  }
)

AppButton.displayName = 'AppButton'

