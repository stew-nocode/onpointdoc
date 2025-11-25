/**
 * Section Priorité du formulaire de ticket
 * 
 * Composant extrait pour respecter les principes Clean Code
 */

'use client';

import { RadioGroup, RadioCard } from '@/ui/radio-group';
import { Zap, AlertCircle, AlertTriangle, Shield } from 'lucide-react';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import type { UseFormReturn } from 'react-hook-form';

type PrioritySectionProps = {
  form: UseFormReturn<CreateTicketInput>;
};

/**
 * Section pour sélectionner la priorité du ticket
 * 
 * @param form - Instance du formulaire React Hook Form
 */
export function PrioritySection({ form }: PrioritySectionProps) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-slate-700">Priorité</label>
      <RadioGroup
        value={form.watch('priority')}
        onValueChange={(v) => form.setValue('priority', v as CreateTicketInput['priority'])}
        className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full"
      >
        <RadioCard variant="compact" value="Low" label="Faible" icon={<Zap className="h-3 w-3" />} />
        <RadioCard variant="compact" value="Medium" label="Moyenne" icon={<AlertCircle className="h-3 w-3" />} />
        <RadioCard variant="compact" value="High" label="Élevée" icon={<AlertTriangle className="h-3 w-3" />} />
        <RadioCard variant="compact" value="Critical" label="Critique" icon={<Shield className="h-3 w-3" />} />
      </RadioGroup>
    </div>
  );
}

