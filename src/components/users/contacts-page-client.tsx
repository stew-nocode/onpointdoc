'use client';

import { useMemo, useState } from 'react';

import { ContactsTable, type ContactRow } from '@/components/users/contacts-table';
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
              ? 'bg-brand/20 text-brand dark:bg-brand/30 dark:text-brand-foreground'
              : 'bg-slate-800/40 text-slate-300 hover:bg-slate-700/50 dark:bg-slate-800/60'
          )}
        >
          <span>Tous</span>
          <span className="ml-2 rounded-full bg-slate-900/30 px-2 py-0.5 text-[10px] dark:bg-slate-200/20">
            {totalCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition',
            activeTab === 'active'
              ? 'bg-brand/20 text-brand dark:bg-brand/30 dark:text-brand-foreground'
              : 'bg-slate-800/40 text-slate-300 hover:bg-slate-700/50 dark:bg-slate-800/60'
          )}
        >
          <span>Actifs</span>
          <span className="ml-2 rounded-full bg-slate-900/30 px-2 py-0.5 text-[10px] dark:bg-slate-200/20">
            {activeCount}
          </span>
        </button>
        </div>
      </div>

      <ContactsTable rows={rows} companies={companies} statusPreset={activeTab} />
    </div>
  );
}


