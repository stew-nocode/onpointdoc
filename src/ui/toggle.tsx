'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
};

export function Toggle({ checked, onChange, disabled, label, className, size = 'md' }: ToggleProps) {
  const height = size === 'sm' ? 'h-5' : 'h-6';
  const width = size === 'sm' ? 'w-9' : 'w-11';
  const knobSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const translate = checked ? (size === 'sm' ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={typeof label === 'string' ? (label as string) : undefined}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'inline-flex items-center gap-3 select-none',
        disabled && 'opacity-60 cursor-not-allowed',
        className
      )}
    >
      <span
        className={cn(
          'relative inline-flex rounded-full transition-colors duration-200',
          height,
          width,
          checked ? 'bg-green-500/80 dark:bg-green-500/70' : 'bg-slate-300/70 dark:bg-slate-700'
        )}
      >
        <span
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 transform rounded-full bg-white shadow transition-transform duration-200',
            knobSize,
            translate
          )}
        />
      </span>
      {label && <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>}
    </button>
  );
}


