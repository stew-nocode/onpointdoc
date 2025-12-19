'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

type MarketingSubmenuProps = {
  isOpen: boolean;
  onLinkClick: () => void;
};

/**
 * Sous-menu pour Marketing (Email, Ads)
 *
 * @param isOpen - Si le sous-menu est ouvert
 * @param onLinkClick - Callback appelé lors du clic sur un lien
 */
export function MarketingSubmenu({ isOpen, onLinkClick }: MarketingSubmenuProps) {
  if (!isOpen) return null;

  return (
    <ul id="submenu-marketing" className="mt-1 space-y-1 pl-5 text-xs font-normal text-slate-600 dark:text-slate-300">
      <li>
        <Link
          href="/marketing/email"
          onClick={onLinkClick}
          className={cn(
            'block rounded-md px-3 py-1 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white'
          )}
        >
          Email
        </Link>
      </li>
      <li>
        <Link
          href="/marketing/ads"
          onClick={onLinkClick}
          className={cn(
            'block rounded-md px-3 py-1 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white opacity-50 cursor-not-allowed'
          )}
          aria-disabled="true"
          title="Ads - Bientôt disponible"
        >
          Ads <span className="text-xs">(Bientôt)</span>
        </Link>
      </li>
    </ul>
  );
}
