import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-brand/40 dark:focus-visible:ring-offset-slate-900',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 text-white hover:from-blue-700 hover:via-indigo-800 hover:to-purple-900 active:opacity-90 transition-all duration-200 dark:from-blue-700 dark:via-indigo-800 dark:to-purple-900 dark:hover:from-blue-600 dark:hover:via-indigo-700 dark:hover:to-purple-800',
        secondary:
          'bg-white text-brand shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-700',
        destructive:
          'bg-status-danger text-white hover:bg-status-danger/90 dark:bg-status-danger dark:text-white dark:hover:bg-status-danger/80',
        outline:
          'border border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800',
        ghost:
          'hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100',
        link: 'text-brand underline-offset-4 hover:underline dark:text-status-info'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

