'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/ui/button';

type DeleteCompanyButtonProps = {
  companyId: string;
  companyName: string;
  children: React.ReactNode;
  className?: string;
};

export function DeleteCompanyButton({
  companyId,
  companyName,
  children,
  className
}: DeleteCompanyButtonProps) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    // supprimer d'abord les liaisons
    await supabase.from('company_sector_link').delete().eq('company_id', companyId);
    const { error } = await supabase.from('companies').delete().eq('id', companyId);
    setLoading(false);
    if (!error) {
      setConfirm(false);
      router.refresh();
    }
  }

  if (confirm) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="text-xs text-slate-600 dark:text-slate-300">
          Supprimer “{companyName}” ?
        </span>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={loading}
          className="h-7"
        >
          Oui
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setConfirm(false)} className="h-7">
          Non
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-label={`Supprimer ${companyName}`}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition hover:bg-slate-100 dark:hover:bg-slate-800 ${className ?? ''}`}
      onClick={() => setConfirm(true)}
    >
      {children}
    </button>
  );
}


