'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TicketForm } from '@/components/forms/ticket-form';
import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/ui/dialog';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import type { Product, Module, Submodule, Feature } from '@/services/products';
import type { BasicProfile } from '@/services/users';

type CreateTicketDialogProps = {
  products: Product[];
  modules: Module[];
  submodules: Submodule[];
  features: Feature[];
  contacts: BasicProfile[];
  onSubmit: (values: CreateTicketInput) => Promise<string | void>;
};

export const CreateTicketDialog = ({
  products,
  modules,
  submodules,
  features,
  contacts,
  onSubmit
}: CreateTicketDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (values: CreateTicketInput, files?: File[]) => {
    setIsSubmitting(true);
    try {
      const id = await onSubmit(values);
      // Upload attachments si présents
      if (id && files && files.length) {
        const { uploadTicketAttachments } = await import('@/services/tickets/attachments.client');
        await uploadTicketAttachments(id, files);
      }
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Erreur lors de la création du ticket:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Créer un ticket</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un nouveau ticket</DialogTitle>
          <DialogDescription>
            Remplissez le formulaire pour créer un ticket Assistance, BUG ou REQUÊTE.
          </DialogDescription>
        </DialogHeader>
        <TicketForm
          onSubmit={handleSubmit}
          products={products}
          modules={modules}
          submodules={submodules}
          features={features}
          contacts={contacts}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};

