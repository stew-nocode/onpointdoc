'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Props = { featureId: string; featureName: string; className?: string; children: React.ReactNode };

export function DeleteFeatureButton({ featureId, featureName, className, children }: Props) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.from('features').delete().eq('id', featureId);
    setLoading(false);
    setConfirm(false);
    router.refresh();
  }

  if (confirm) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="text-xs text-slate-600 dark:text-slate-300">Supprimer “{featureName}” ?</span>
        <button
          className="rounded bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-700 disabled:opacity-50"
          onClick={handleDelete}
          disabled={loading}
        >
          Oui
        </button>
        <button className="rounded bg-slate-200 px-2 py-1 text-xs dark:bg-slate-700" onClick={() => setConfirm(false)}>
          Non
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`${className ?? ''}`}
      aria-label={`Supprimer ${featureName}`}
      onClick={() => setConfirm(true)}
    >
      {children}
    </button>
  );
}


