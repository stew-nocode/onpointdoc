'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckSquare, Square, X, FileDown, User, Tag, Flag } from 'lucide-react';
import { Button } from '@/ui/button';
import { BulkChangeStatusDialog } from './bulk-change-status-dialog';
import { BulkChangePriorityDialog } from './bulk-change-priority-dialog';
import { BulkReassignDialog } from './bulk-reassign-dialog';
import { toast } from 'sonner';

type BulkActionsBarProps = {
  selectedTickets: Set<string>;
  totalTickets: number;
  onClearSelection: () => void;
  onRefresh: () => void;
};

export function BulkActionsBar({
  selectedTickets,
  totalTickets,
  onClearSelection,
  onRefresh
}: BulkActionsBarProps) {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [priorityDialogOpen, setPriorityDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);

  const selectedCount = selectedTickets.size;

  const handleExport = async (format: 'csv' | 'excel') => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/tickets/bulk/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketIds: Array.from(selectedTickets),
          format
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets-export-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'csv' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Export ${format.toUpperCase()} réussi`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'export');
    } finally {
      setIsExporting(false);
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
            <CheckSquare className="h-4 w-4" />
            <span>
              {selectedCount} ticket{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusDialogOpen(true)}
              className="gap-2"
            >
              <Tag className="h-4 w-4" />
              Changer statut
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPriorityDialogOpen(true)}
              className="gap-2"
            >
              <Flag className="h-4 w-4" />
              Changer priorité
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReassignDialogOpen(true)}
              className="gap-2"
            >
              <User className="h-4 w-4" />
              Réassigner
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="gap-2"
            >
              <FileDown className="h-4 w-4" />
              Exporter CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Annuler
            </Button>
          </div>
        </div>
      </div>

      <BulkChangeStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        ticketIds={Array.from(selectedTickets)}
        onSuccess={() => {
          onClearSelection();
          onRefresh();
          router.refresh();
        }}
      />

      <BulkChangePriorityDialog
        open={priorityDialogOpen}
        onOpenChange={setPriorityDialogOpen}
        ticketIds={Array.from(selectedTickets)}
        onSuccess={() => {
          onClearSelection();
          onRefresh();
          router.refresh();
        }}
      />

      <BulkReassignDialog
        open={reassignDialogOpen}
        onOpenChange={setReassignDialogOpen}
        ticketIds={Array.from(selectedTickets)}
        onSuccess={() => {
          onClearSelection();
          onRefresh();
          router.refresh();
        }}
      />
    </>
  );
}

