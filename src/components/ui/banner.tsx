'use client';

import { ReactNode, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';

type BannerVariant = 'info' | 'warning' | 'success' | 'error';

type BannerProps = {
  /**
   * Titre de la bannière
   */
  title: string;
  
  /**
   * Description ou sous-titre (optionnel)
   */
  description?: string;
  
  /**
   * Contenu de la bannière (liste, texte, etc.)
   */
  children?: ReactNode;
  
  /**
   * Variante de style (info, warning, success, error)
   * @default 'info'
   */
  variant?: BannerVariant;
  
  /**
   * Icône à afficher dans le titre (optionnel)
   */
  icon?: ReactNode;
  
  /**
   * Si true, la bannière peut être fermée
   * @default true
   */
  dismissible?: boolean;
  
  /**
   * Clé unique pour persister l'état de fermeture dans localStorage
   * Si fournie, la bannière restera fermée après rechargement
   */
  storageKey?: string;
  
  /**
   * Callback appelé quand la bannière est fermée
   */
  onDismiss?: () => void;
  
  /**
   * Classes CSS supplémentaires
   */
  className?: string;
};

/**
 * Mapping des variantes vers les classes Tailwind
 */
const variantStyles: Record<BannerVariant, {
  card: string;
  title: string;
  description: string;
  content: string;
  code: string;
}> = {
  info: {
    card: 'border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800',
    title: 'text-blue-900 dark:text-blue-100',
    description: 'text-blue-700 dark:text-blue-300',
    content: 'text-blue-800 dark:text-blue-200',
    code: 'bg-blue-100 dark:bg-blue-900'
  },
  warning: {
    card: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800',
    title: 'text-yellow-900 dark:text-yellow-100',
    description: 'text-yellow-700 dark:text-yellow-300',
    content: 'text-yellow-800 dark:text-yellow-200',
    code: 'bg-yellow-100 dark:bg-yellow-900'
  },
  success: {
    card: 'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800',
    title: 'text-green-900 dark:text-green-100',
    description: 'text-green-700 dark:text-green-300',
    content: 'text-green-800 dark:text-green-200',
    code: 'bg-green-100 dark:bg-green-900'
  },
  error: {
    card: 'border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800',
    title: 'text-red-900 dark:text-red-100',
    description: 'text-red-700 dark:text-red-300',
    content: 'text-red-800 dark:text-red-200',
    code: 'bg-red-100 dark:bg-red-900'
  }
};

/**
 * Bannière d'information réutilisable et fermable
 * 
 * Permet d'afficher des messages importants (configurations, avertissements, etc.)
 * avec possibilité de fermeture et persistance dans localStorage.
 * 
 * @example
 * ```tsx
 * <Banner
 *   title="🚀 Configuration requise"
 *   description="Avant d'utiliser l'email marketing, vous devez :"
 *   variant="info"
 *   storageKey="email-marketing-config-banner"
 * >
 *   <ol className="list-decimal list-inside space-y-2">
 *     <li>Étape 1</li>
 *     <li>Étape 2</li>
 *   </ol>
 * </Banner>
 * ```
 */
export function Banner({
  title,
  description,
  children,
  variant = 'info',
  icon,
  dismissible = true,
  storageKey,
  onDismiss,
  className
}: BannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Vérifier localStorage au montage si storageKey est fourni
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      const isDismissed = localStorage.getItem(`banner-dismissed-${storageKey}`) === 'true';
      setIsVisible(!isDismissed);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    setIsVisible(false);
    
    // Persister dans localStorage si storageKey est fourni
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(`banner-dismissed-${storageKey}`, 'true');
    }
    
    // Appeler le callback si fourni
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  const styles = variantStyles[variant];

  return (
    <Card className={cn(styles.card, className)}>
      <CardHeader className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className={cn(styles.title, 'flex items-center gap-2')}>
              {icon && <span>{icon}</span>}
              {title}
            </CardTitle>
            {description && (
              <CardDescription className={styles.description}>
                {description}
              </CardDescription>
            )}
          </div>
          {dismissible && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 opacity-70 hover:opacity-100"
              onClick={handleDismiss}
              aria-label="Fermer la bannière"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      {children && (
        <CardContent className={styles.content}>
          {children}
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Composant helper pour formater le code dans les bannières
 * 
 * Utilise les styles de la variante 'info' par défaut.
 * Pour utiliser une autre variante, passez className avec les classes appropriées.
 */
export function BannerCode({ 
  children, 
  className,
  variant = 'info'
}: { 
  children: ReactNode; 
  className?: string;
  variant?: BannerVariant;
}) {
  const styles = variantStyles[variant];
  return (
    <code className={cn(styles.code, 'px-2 py-1 rounded text-sm', className)}>
      {children}
    </code>
  );
}

