'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
  width?: number;
  height?: number;
};

/**
 * Composant Logo qui s'adapte automatiquement au thème (dark/light)
 */
export function Logo({ className, width = 140, height = 40 }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Éviter l'hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Retourner un placeholder pendant le chargement pour éviter le flash
    return <div className={cn('bg-slate-200 dark:bg-slate-800 animate-pulse rounded', className)} style={{ width, height }} />;
  }

  const logoSrc = resolvedTheme === 'dark'
    ? '/images/logos/logo-dark.png'
    : '/images/logos/logo-light.png';

  return (
    <div className={cn('relative flex items-center', className)} style={{ width, height }}>
      <Image
        src={logoSrc}
        alt="OnNext Logo"
        width={width}
        height={height}
        className="object-contain"
        priority
        unoptimized
      />
    </div>
  );
}