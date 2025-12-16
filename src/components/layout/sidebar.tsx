'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';
import { useSidebar } from './sidebar-context';
import { NavigationMenu } from './navigation-menu';
import { ConfigurationMenu } from './configuration-menu';
import { Logo } from './logo';

type SidebarProps = {
  role?: 'agent' | 'manager' | 'it' | 'marketing' | 'direction' | 'director' | 'admin';
};

export const Sidebar = ({ role = 'agent' }: SidebarProps) => {
  const [ticketsOpen, setTicketsOpen] = useState(false);
  const [marketingOpen, setMarketingOpen] = useState(false);
  const { isOpen, close } = useSidebar();

  /**
   * Fermer la sidebar au clic sur un lien (mobile uniquement)
   */
  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      // lg breakpoint
      close();
    }
  };

  /**
   * Fermer la sidebar au resize si on passe au desktop
   */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // lg breakpoint
        close();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [close]);

  return (
    <>
      {/* Overlay pour mobile - visible uniquement quand la sidebar est ouverte */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - fixe sur desktop, overlay sur mobile */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 shrink-0 border-r border-slate-200 bg-white/95 p-6 backdrop-blur transition-transform duration-300 ease-in-out supports-[backdrop-filter]:bg-white/70 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-100',
          // Desktop: toujours visible
          'lg:translate-x-0',
          // Mobile: visible uniquement si isOpen est true
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo et bouton fermer sur mobile */}
        <div className="mb-6 flex items-center justify-between gap-2 lg:hidden">
          <div className="flex-shrink-0">
            <Logo width={110} height={30} />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={close}
            className="h-8 w-8 flex-shrink-0"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Logo sur desktop */}
        <div className="mb-6 hidden lg:block">
          <Logo width={130} height={35} />
        </div>

        <NavigationMenu
          role={role}
          ticketsOpen={ticketsOpen}
          onTicketsToggle={() => setTicketsOpen((v) => !v)}
          marketingOpen={marketingOpen}
          onMarketingToggle={() => setMarketingOpen((v) => !v)}
          onLinkClick={handleLinkClick}
        />

        <ConfigurationMenu role={role} onLinkClick={handleLinkClick} />
      </aside>
    </>
  );
};

