'use client';

import { Bell, Menu } from 'lucide-react';

import { Button } from '@/ui/button';
import { ThemeToggle } from '@/components/navigation/theme-toggle';
import { SignOutButton } from '@/components/navigation/sign-out-button';
import { useSidebar } from '@/components/layout/sidebar-context';

export const TopBar = () => {
  const { toggle } = useSidebar();

  return (
    <header className="flex h-16 items-center justify-between bg-white px-4 lg:px-6 text-slate-900 dark:bg-slate-900/80 dark:text-slate-100">
      <div className="flex items-center gap-3">
        {/* Bouton menu mobile */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="lg:hidden h-9 w-9"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="hidden sm:block">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">OnpointDoc</p>
          <h1 className="text-base font-semibold text-slate-900 dark:text-white">
            Pilotage Support & Activités
          </h1>
        </div>
        <div className="sm:hidden">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">OnpointDoc</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="secondary" size="sm" className="hidden sm:flex">
          <Bell className="mr-2 h-4 w-4" />
          Notifications
        </Button>
        <Button variant="ghost" size="icon" className="sm:hidden">
          <Bell className="h-5 w-5" />
        </Button>
        <SignOutButton />
        <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
          AS
        </div>
      </div>
    </header>
  );
};

