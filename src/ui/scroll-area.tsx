'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type ScrollAreaProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Composant ScrollArea simple sans dépendances Radix UI
 * Utilise overflow-y-auto natif
 */
const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('relative overflow-y-auto', className)}
      {...props}
    >
      {children}
    </div>
  )
);
ScrollArea.displayName = 'ScrollArea';

export { ScrollArea };

