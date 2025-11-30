/**
 * Utilitaires pour la réinitialisation du formulaire de ticket
 */

import type { CreateTicketInput } from '@/lib/validators/ticket';
import type { Product } from '@/services/products';
import type { BasicProfile } from '@/services/users';

/**
 * Crée les valeurs par défaut pour réinitialiser le formulaire
 * 
 * @param products - Liste des produits disponibles
 * @param contacts - Liste des contacts disponibles
 * @returns Valeurs par défaut du formulaire
 */
export function getDefaultFormValues(
  products: Product[],
  contacts: BasicProfile[]
): Partial<CreateTicketInput> {
  return {
    title: '',
    description: '',
    type: 'ASSISTANCE',
    channel: 'Whatsapp',
    productId: products[0]?.id ?? '',
    moduleId: '',
    submoduleId: '',
    featureId: '',
    customerContext: '',
    priority: 'Medium',
    contactUserId: contacts[0]?.id ?? '',
    companyId: '',
    scope: undefined,
    affectsAllCompanies: false,
    selectedCompanyIds: [],
    bug_type: null
  };
}

