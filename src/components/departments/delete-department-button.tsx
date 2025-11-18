'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteDepartment } from '@/services/departments/client';
import { toast } from 'sonner';

type Props = { departmentId: string; departmentName: string; className?: string; children: React.ReactNode };

export function DeleteDepartmentButton({ departmentId, departmentName, className, children }: Props) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteDepartment(departmentId);
      toast.success('Département supprimé');
      setConfirm(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  }

  if (confirm) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="text-xs text-slate-600 dark:text-slate-300">Supprimer "{departmentName}" ?</span>
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
      className={className ?? ''}
      aria-label={`Supprimer ${departmentName}`}
      onClick={() => setConfirm(true)}
    >
      {children}
    </button>
  );
}

