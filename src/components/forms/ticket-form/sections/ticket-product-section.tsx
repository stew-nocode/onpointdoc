/**
 * Section Produit du formulaire de ticket
 * 
 * Composant atomique pour respecter les principes Clean Code (< 100 lignes)
 */

'use client';

import { Shield } from 'lucide-react';
import { RadioGroup, RadioCard } from '@/ui/radio-group';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import type { UseFormReturn } from 'react-hook-form';
import type { Product } from '@/services/products';

type TicketProductSectionProps = {
  form: UseFormReturn<CreateTicketInput>;
  products: Product[];
  onProductChange: (productId: string) => void;
};

/**
 * Section pour sélectionner le produit concerné
 * 
 * @param form - Instance du formulaire React Hook Form
 * @param products - Liste des produits disponibles
 * @param onProductChange - Callback appelé lors du changement de produit
 */
export function TicketProductSection({
  form,
  products,
  onProductChange
}: TicketProductSectionProps) {
  const { errors } = form.formState;
  const productId = form.watch('productId');
  const productField = form.register('productId');

  // Si un seul produit, le cacher
  if (products.length === 1) {
    return <input type="hidden" {...productField} />;
  }

  return (
    <div className="grid gap-2 min-w-0">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Produit concerné
      </label>
      <RadioGroup
        value={productId}
        onValueChange={(v) => {
          form.setValue('productId', v);
          onProductChange(v);
        }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full"
      >
        {products.map((product) => (
          <RadioCard
            key={product.id}
            value={product.id}
            label={product.name}
            icon={<Shield className="h-3 w-3" />}
            variant="compact"
          />
        ))}
      </RadioGroup>
      {errors.productId && (
        <p className="text-xs text-status-danger">{errors.productId.message}</p>
      )}
    </div>
  );
}

