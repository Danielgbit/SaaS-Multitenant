import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Spinner } from './Spinner'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none',
  {
    variants: {
      variant: {
        primary:
          'bg-[#0F4C5C] dark:bg-[#38BDF8] text-white dark:text-[#0F172A] hover:opacity-90 active:opacity-80',
        secondary:
          'bg-[#F8FAFC] dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F1F5F9] border border-[#E2E8F0] dark:border-[#334155] hover:bg-[#F1F5F9] dark:hover:bg-[#334155]',
        ghost:
          'bg-transparent text-[#475569] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] hover:text-[#0F172A] dark:hover:text-[#F1F5F9]',
        danger:
          'bg-[#DC2626] dark:bg-[#EF4444] text-white hover:opacity-90 active:opacity-80',
        link:
          'bg-transparent text-[#0F4C5C] dark:text-[#38BDF8] underline underline-offset-2 hover:opacity-80',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-[6px]',
        md: 'h-10 px-4 text-sm rounded-[12px]',
        lg: 'h-12 px-6 text-base rounded-[12px]',
        icon: 'h-9 w-9 p-0 rounded-[10px]',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  }
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  icon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, icon, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Spinner size="sm" />
        ) : icon && size !== 'icon' ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {size === 'icon' && icon ? (
          <span className="flex items-center justify-center">{icon}</span>
        ) : children ? (
          <span>{children}</span>
        ) : null}
      </button>
    )
  }
)
Button.displayName = 'Button'
