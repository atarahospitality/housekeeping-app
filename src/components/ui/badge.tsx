import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-800',
        clean: 'bg-emerald-100 text-emerald-800',
        dirty: 'bg-amber-100 text-amber-800',
        'checked-out': 'bg-blue-100 text-blue-800',
        'not-checked-out': 'bg-red-100 text-red-800',
        outline: 'border border-current bg-transparent',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
