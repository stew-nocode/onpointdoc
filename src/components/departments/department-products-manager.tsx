'use client';

import { useEffect, useState, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { linkProductToDepartment, unlinkProductFromDepartment } from '@/services/departments/client';
import { Combobox } from '@/ui/combobox';
import { Button } from '@/ui/button';
import { X } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
  departmentId: string;
};

type Product = {
  id: string;
  name: string;
};

type LinkedProduct = {
  id: string;
  name: string;
};

/**
 * Composant de gestion des produits associés à un département.
 * Permet d'afficher, ajouter et retirer des produits liés à un département.
 * La gestion se fait via des appels API séparés (link/unlink).
 * @param departmentId - UUID du département
 */
export function DepartmentProductsManager({ departmentId }: Props) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [linkedProducts, setLinkedProducts] = useState<LinkedProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [linking, setLinking] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();

    // Charger tous les produits
    const { data: allProducts } = await supabase
      .from('products')
      .select('id, name')
      .order('name', { ascending: true });

    // Charger les produits liés à ce département
    const { data: links } = await supabase
      .from('product_department_link')
      .select('product_id, products:product_id (id, name)')
      .eq('department_id', departmentId);

    const linked = (links ?? [])
      .map((link: any) => link.products)
      .filter(Boolean)
      .map((p: any) => ({ id: p.id, name: p.name }));

    setProducts(allProducts ?? []);
    setLinkedProducts(linked);
    setLoading(false);
  }, [departmentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleLink() {
    if (!selectedProductId) return;

    setLinking(true);
    try {
      await linkProductToDepartment(departmentId, selectedProductId);
      toast.success('Produit lié au département');
      setSelectedProductId('');
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la liaison');
    } finally {
      setLinking(false);
    }
  }

  async function handleUnlink(productId: string) {
    try {
      await unlinkProductFromDepartment(departmentId, productId);
      toast.success('Liaison supprimée');
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la suppression');
    }
  }

  // Produits disponibles (non liés)
  const availableProducts = products.filter(
    (p) => !linkedProducts.some((lp) => lp.id === p.id)
  );

  if (loading) {
    return <p className="text-sm text-slate-500">Chargement…</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        {linkedProducts.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">Aucun produit associé</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {linkedProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand dark:bg-brand/20 dark:text-brand-foreground"
              >
                <span>{product.name}</span>
                <button
                  type="button"
                  onClick={() => handleUnlink(product.id)}
                  className="ml-1 rounded-full p-0.5 hover:bg-brand/20 dark:hover:bg-brand/30"
                  aria-label={`Retirer ${product.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {availableProducts.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Ajouter un produit
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Combobox
                options={availableProducts.map((p) => ({ value: p.id, label: p.name }))}
                value={selectedProductId}
                onValueChange={setSelectedProductId}
                placeholder="Sélectionner un produit"
                searchPlaceholder="Rechercher un produit..."
                emptyText="Aucun produit disponible"
              />
            </div>
            <Button
              type="button"
              onClick={handleLink}
              disabled={!selectedProductId || linking}
              size="sm"
            >
              {linking ? 'Ajout…' : 'Ajouter'}
            </Button>
          </div>
        </div>
      )}

      {availableProducts.length === 0 && linkedProducts.length > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Tous les produits sont déjà associés à ce département
        </p>
      )}
    </div>
  );
}

