'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteContact } from '@/services/contacts';
import { toast } from 'sonner';

type Props = {
  contactId: string;
  contactName: string;
  className?: string;
  children: React.ReactNode;
};

export function DeleteContactButton({ contactId, contactName, className, children }: Props) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteContact(contactId);
      toast.success('Contact supprimé');
      setConfirm(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message ?? 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  }

  if (confirm) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="text-xs text-slate-600 dark:text-slate-300">Supprimer "{contactName}" ?</span>
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
          disabled={loading}
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
      aria-label={`Supprimer ${contactName}`}
    >
      {children}
    </button>
  );
}

