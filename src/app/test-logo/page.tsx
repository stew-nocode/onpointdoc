'use client';

import { Logo } from '@/components/layout/logo';
import { ThemeToggle } from '@/components/navigation/theme-toggle';

export default function TestLogoPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Test du Logo
          </h1>
          <ThemeToggle />
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-lg border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
            Logo par défaut (140x40)
          </h2>
          <Logo />
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-lg border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
            Logo taille sidebar desktop (130x35)
          </h2>
          <Logo width={130} height={35} />
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-lg border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
            Logo taille sidebar mobile (110x30)
          </h2>
          <Logo width={110} height={30} />
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-lg border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
            Test direct des images
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Logo Light Mode:</p>
              <img src="/images/logos/logo-light.png" alt="Logo Light" className="h-10" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Logo Dark Mode:</p>
              <img src="/images/logos/logo-dark.png" alt="Logo Dark" className="h-10" />
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            💡 Utilisez le bouton de thème en haut à droite pour tester le changement automatique du logo
          </p>
        </div>
      </div>
    </div>
  );
}
