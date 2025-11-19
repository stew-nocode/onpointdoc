'use client';

import { useMemo, useState } from 'react';

import { ContactsTable } from '@/components/users/contacts-table';
import type { ContactRow } from '@/components/users/contacts-table';
import { cn } from '@/lib/utils';

type Props = {
  rows: ContactRow[];
  companies: Record<string, string>;
};

export function ContactsPageClient({ rows, companies }: Props) {
  const [activeTab, setActiveTab] = useState<'all' | 'active'>('all');

  const totalCount = rows.length;
  const activeCount = useMemo(
    () => rows.filter((r) => r.is_active ?? false).length,
    [rows]
  );

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition',
            activeTab === 'all'
              ? 'bg-brand text-white dark:bg-brand dark:text-white'
              : 'bg-slate-800/40 text-slate-300 hover:bg-slate-700/50 dark:bg-slate-800/60 dark:text-slate-300'
          )}
        >
          <span>Tous</span>
          <span className={cn(
            "ml-2 rounded-full px-2 py-0.5 text-[10px]",
            activeTab === 'all' 
              ? "bg-white/20 text-white" 
              : "bg-slate-900/30 text-slate-300 dark:bg-slate-200/20 dark:text-slate-400"
          )}>
            {totalCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition',
            activeTab === 'active'
              ? 'bg-brand text-white dark:bg-brand dark:text-white'
              : 'bg-slate-800/40 text-slate-300 hover:bg-slate-700/50 dark:bg-slate-800/60 dark:text-slate-300'
          )}
        >
          <span>Actifs</span>
          <span className={cn(
            "ml-2 rounded-full px-2 py-0.5 text-[10px]",
            activeTab === 'active' 
              ? "bg-white/20 text-white" 
              : "bg-slate-900/30 text-slate-300 dark:bg-slate-200/20 dark:text-slate-400"
          )}>
            {activeCount}
          </span>
        </button>
        </div>
      </div>

      <ContactsTable rows={rows} companies={companies} statusPreset={activeTab} />
    </div>
  );
}


