'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Props = {
  userId: string;
  userName: string;
  className?: string;
  children: React.ReactNode;
};

export function DeleteUserButton({ userId, userName, className, children }: Props) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.from('user_module_assignments').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('id', userId);
    setLoading(false);
    setConfirm(false);
    router.refresh();
  }

  if (confirm) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="text-xs text-slate-600 dark:text-slate-300">Supprimer “{userName}” ?</span>
        <button
          className="rounded bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-700 disabled:opacity-50"
          onClick={handleDelete}
          disabled={loading}
        >
          Oui
        </button>
        <button
          className="rounded bg-slate-200 px-2 py-1 text-xs dark:bg-slate-700"
          onClick={() => setConfirm(false)}
        >
          Non
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-md ${className ?? ''}`}
      onClick={() => setConfirm(true)}
      aria-label={`Supprimer ${userName}`}
    >
      {children}
    </button>
  );
}



