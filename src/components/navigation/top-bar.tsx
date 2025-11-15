import { Bell } from 'lucide-react';

import { Button } from '@/ui/button';
import { ThemeToggle } from '@/components/navigation/theme-toggle';

export const TopBar = () => (
  <header className="flex h-16 items-center justify-between bg-white px-6 text-slate-900 dark:bg-slate-900/80 dark:text-slate-100">
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">OnpointDoc</p>
      <h1 className="text-base font-semibold text-slate-900 dark:text-white">
        Pilotage Support & Activités
      </h1>
    </div>
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <Button variant="secondary" size="sm">
        <Bell className="mr-2 h-4 w-4" />
        Notifications
      </Button>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
        AS
      </div>
    </div>
  </header>
);

