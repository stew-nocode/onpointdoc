import type { DepartmentCreateInput, DepartmentUpdateInput } from '@/lib/validators/department';

/**
 * Crée un nouveau département via l'API serveur.
 * @param payload - Données du département à créer (nom, code, description, couleur)
 * @returns Les données du département créé
 * @throws {Error} Si la création échoue
 */
export const createDepartment = async (payload: DepartmentCreateInput) => {
  const res = await fetch('/api/admin/departments/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Erreur inattendue' }));
    throw new Error(error.message || 'Erreur lors de la création du département');
  }
  return res.json();
};

/**
 * Met à jour un département existant via l'API serveur.
 * @param payload - Données du département à mettre à jour (id requis, autres champs optionnels)
 * @returns Les données du département mis à jour
 * @throws {Error} Si la mise à jour échoue
 */
export const updateDepartment = async (payload: DepartmentUpdateInput) => {
  const res = await fetch('/api/admin/departments/update', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Erreur inattendue' }));
    throw new Error(error.message || 'Erreur lors de la mise à jour du département');
  }
  return res.json();
};

/**
 * Supprime un département via l'API serveur.
 * Vérifie qu'aucun utilisateur n'est associé au département avant suppression.
 * @param id - UUID du département à supprimer
 * @returns Confirmation de suppression
 * @throws {Error} Si la suppression échoue ou si des utilisateurs sont associés
 */
export const deleteDepartment = async (id: string) => {
  const res = await fetch(`/api/admin/departments/delete?id=${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Erreur inattendue' }));
    throw new Error(error.message || 'Erreur lors de la suppression du département');
  }
  return res.json();
};

/**
 * Lie un produit à un département via la table product_department_link.
 * @param departmentId - UUID du département
 * @param productId - UUID du produit
 * @returns Les données de la liaison créée
 * @throws {Error} Si la liaison échoue ou si elle existe déjà
 */
export const linkProductToDepartment = async (departmentId: string, productId: string) => {
  const res = await fetch('/api/admin/departments/link-product', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ departmentId, productId })
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Erreur inattendue' }));
    throw new Error(error.message || 'Erreur lors de la liaison');
  }
  return res.json();
};

/**
 * Retire la liaison entre un produit et un département.
 * @param departmentId - UUID du département
 * @param productId - UUID du produit
 * @returns Confirmation de suppression de la liaison
 * @throws {Error} Si la suppression de la liaison échoue
 */
export const unlinkProductFromDepartment = async (departmentId: string, productId: string) => {
  const res = await fetch(
    `/api/admin/departments/unlink-product?departmentId=${encodeURIComponent(departmentId)}&productId=${encodeURIComponent(productId)}`,
    {
      method: 'DELETE'
    }
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Erreur inattendue' }));
    throw new Error(error.message || 'Erreur lors de la suppression de la liaison');
  }
  return res.json();
};
