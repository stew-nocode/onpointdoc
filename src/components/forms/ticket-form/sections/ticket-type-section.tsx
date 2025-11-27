/**
 * Section Type et Canal du formulaire de ticket
 * 
 * Composant extrait pour respecter les principes Clean Code (composant < 100 lignes)
 */

'use client';

import { RadioGroup, RadioCard } from '@/ui/radio-group';
import { Combobox } from '@/ui/combobox';
import { Bug, FileText, HelpCircle } from 'lucide-react';
import { ticketChannels } from '@/lib/validators/ticket';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import type { UseFormReturn } from 'react-hook-form';

type TicketTypeSectionProps = {
  form: UseFormReturn<CreateTicketInput>;
};

/**
 * Section pour sélectionner le type de ticket et le canal de contact
 * 
 * @param form - Instance du formulaire React Hook Form
 */
export function TicketTypeSection({ form }: TicketTypeSectionProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="grid gap-2 min-w-0">
        <label className="text-sm font-medium text-slate-700">Type de ticket</label>
        <RadioGroup
          value={form.watch('type')}
          onValueChange={(v) => form.setValue('type', v as CreateTicketInput['type'])}
          className="grid grid-cols-3 sm:grid-cols-6 gap-2 w-full"
        >
          <RadioCard variant="compact" value="BUG" label="BUG" icon={<Bug className="h-3 w-3" />} />
          <RadioCard variant="compact" value="REQ" label="Requête" icon={<FileText className="h-3 w-3" />} />
          <RadioCard variant="compact" value="ASSISTANCE" label="Assistance" icon={<HelpCircle className="h-3 w-3" />} />
        </RadioGroup>
      </div>
      <div className="grid gap-2 min-w-0">
        <label className="text-sm font-medium text-slate-700">Canal de contact</label>
        <Combobox
          options={ticketChannels.map((channel) => ({
            value: channel,
            label: channel,
            searchable: channel
          }))}
          value={form.watch('channel')}
          onValueChange={(v) => {
            form.setValue('channel', v as CreateTicketInput['channel']);
            // Si le canal est "Constat Interne", vider le champ Contact
            if (v === 'Constat Interne') {
              form.setValue('contactUserId', '');
            }
          }}
          placeholder="Sélectionner un canal"
          searchPlaceholder="Rechercher un canal..."
          emptyText="Aucun canal disponible"
        />
      </div>
    </div>
  );
}

