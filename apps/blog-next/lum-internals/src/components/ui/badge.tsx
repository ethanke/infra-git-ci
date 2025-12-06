'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        // Glass variants
        glass:
          'bg-glass backdrop-blur-sm border-glass-border text-foreground',
        'glass-primary':
          'bg-luminous-orange/10 backdrop-blur-sm border-luminous-orange/30 text-luminous-orange',
        'glass-secondary':
          'bg-luminous-pink/10 backdrop-blur-sm border-luminous-pink/30 text-luminous-pink',
        'glass-accent':
          'bg-luminous-violet/10 backdrop-blur-sm border-luminous-violet/30 text-luminous-violet',
        // Status badges
        success:
          'border-transparent bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
        warning:
          'border-transparent bg-amber-500/10 text-amber-500 border-amber-500/30',
        error:
          'border-transparent bg-red-500/10 text-red-500 border-red-500/30',
        info:
          'border-transparent bg-blue-500/10 text-blue-500 border-blue-500/30',
        // Basic variants (for compatibility)
        muted: 'border-transparent bg-muted text-muted-foreground',
        accent: 'border-transparent bg-accent text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
