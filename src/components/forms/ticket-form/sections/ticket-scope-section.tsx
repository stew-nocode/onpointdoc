/**
 * Section Portée du Ticket
 * 
 * Permet de sélectionner la portée du ticket :
 * - Une seule entreprise
 * - Toutes les entreprises
 * - Plusieurs entreprises spécifiques
 * 
 * Composant extrait pour respecter les principes Clean Code (composant < 100 lignes)
 */

'use client';

import { useEffect, useMemo } from 'react';
import { RadioGroup, RadioCard } from '@/ui/radio-group';
import { Building2, Globe, Briefcase } from 'lucide-react';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import type { UseFormReturn } from 'react-hook-form';
import type { BasicCompany } from '@/services/companies';
import type { BasicProfile } from '@/services/users';
import { Combobox } from '@/ui/combobox';
import { CompanyMultiSelect } from './company-multi-select';

type TicketScopeSectionProps = {
  form: UseFormReturn<CreateTicketInput>;
  contacts: BasicProfile[];
  companies: BasicCompany[];
  selectedContactId?: string;
  channel: CreateTicketInput['channel'];
};

/**
 * Section pour sélectionner la portée du ticket et les entreprises concernées
 * 
 * @param form - Instance du formulaire React Hook Form
 * @param contacts - Liste des contacts disponibles
 * @param companies - Liste des entreprises disponibles
 * @param selectedContactId - ID du contact sélectionné (pour auto-remplissage)
 * @param channel - Canal de contact (pour désactiver si Constat Interne)
 */
export function TicketScopeSection({
  form,
  contacts,
  companies,
  selectedContactId,
  channel
}: TicketScopeSectionProps) {
  const scope = form.watch('scope');
  const contactUserId = form.watch('contactUserId');
  const companyId = form.watch('companyId');
  
  // Trouver le contact sélectionné pour récupérer son entreprise
  const selectedContact = useMemo(() => {
    if (!contactUserId) return null;
    return contacts.find((c) => c.id === contactUserId) || null;
  }, [contacts, contactUserId]);
  
  const contactCompanyId = selectedContact?.company_id || null;
  const contactCompanyName = selectedContact?.company_name || null;
  
  // Auto-remplissage : quand un contact est sélectionné, pré-remplir l'entreprise et la portée
  useEffect(() => {
    if (channel === 'Constat Interne') {
      // Pas d'auto-remplissage pour constat interne
      return;
    }
    
    if (contactCompanyId && !scope && !companyId) {
      // Contact sélectionné avec entreprise → auto-remplir
      form.setValue('companyId', contactCompanyId);
      form.setValue('scope', 'single');
    }
  }, [contactCompanyId, contactUserId, scope, companyId, channel, form]);
  
  // Gérer le changement de portée
  const handleScopeChange = (newScope: 'single' | 'all' | 'multiple') => {
    form.setValue('scope', newScope);
    
    if (newScope === 'all') {
      // Toutes les entreprises : vider les sélections
      form.setValue('affectsAllCompanies', true);
      form.setValue('companyId', '');
      form.setValue('selectedCompanyIds', []);
    } else if (newScope === 'single') {
      // Une seule entreprise : pré-remplir avec l'entreprise du contact si disponible
      form.setValue('affectsAllCompanies', false);
      form.setValue('selectedCompanyIds', []);
      
      if (contactCompanyId && !companyId) {
        form.setValue('companyId', contactCompanyId);
      }
    } else if (newScope === 'multiple') {
      // Plusieurs entreprises : pré-cocher l'entreprise du contact
      form.setValue('affectsAllCompanies', false);
      form.setValue('companyId', '');
      
      const currentSelected = form.getValues('selectedCompanyIds') || [];
      if (contactCompanyId && !currentSelected.includes(contactCompanyId)) {
        form.setValue('selectedCompanyIds', [contactCompanyId, ...currentSelected]);
      }
    }
  };
  
  // Portée obligatoire si constat interne
  const isScopeRequired = channel === 'Constat Interne';
  
  // Portée par défaut si non définie
  const effectiveScope = scope || (isScopeRequired ? 'single' : undefined);
  
  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700">
          Portée du ticket {isScopeRequired && <span className="text-status-danger">*</span>}
        </label>
        <RadioGroup
          value={effectiveScope}
          onValueChange={(v) => handleScopeChange(v as 'single' | 'all' | 'multiple')}
          className="grid grid-cols-3 gap-2 w-full"
        >
          <RadioCard
            variant="compact"
            value="single"
            label="Une seule entreprise"
            icon={<Building2 className="h-3 w-3" />}
          />
          <RadioCard
            variant="compact"
            value="all"
            label="Toutes les entreprises"
            icon={<Globe className="h-3 w-3" />}
          />
          <RadioCard
            variant="compact"
            value="multiple"
            label="Plusieurs entreprises"
            icon={<Briefcase className="h-3 w-3" />}
          />
        </RadioGroup>
      </div>
      
      {/* Affichage conditionnel selon la portée */}
      {effectiveScope === 'single' && (
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">
            Entreprise concernée <span className="text-status-danger">*</span>
          </label>
          <Combobox
            options={companies.map((c) => ({
              value: c.id,
              label: c.name,
              searchable: c.name
            }))}
            value={companyId || ''}
            onValueChange={(v) => form.setValue('companyId', v || '')}
            placeholder="Sélectionner une entreprise"
            searchPlaceholder="Rechercher une entreprise..."
            emptyText="Aucune entreprise disponible"
          />
          {contactCompanyName && companyId === contactCompanyId && (
            <p className="text-xs text-green-600 dark:text-green-400">
              ✅ Entreprise déduite du contact : {contactCompanyName}
            </p>
          )}
        </div>
      )}
      
      {effectiveScope === 'all' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
          <div className="flex items-start gap-2">
            <span className="text-amber-600 dark:text-amber-400">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Ticket Global
              </p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                Ce ticket sera visible par toutes les entreprises du système.
                {contactCompanyName && (
                  <span className="block mt-1">
                    Signalé par : {contacts.find((c) => c.id === contactUserId)?.full_name || 'Contact'} ({contactCompanyName})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {effectiveScope === 'multiple' && (
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">
            Entreprises concernées <span className="text-status-danger">*</span>
            <span className="ml-2 text-xs font-normal text-slate-500">(minimum 2)</span>
          </label>
          <CompanyMultiSelect
            companies={companies}
            selectedIds={form.watch('selectedCompanyIds') || []}
            onSelectionChange={(ids) => form.setValue('selectedCompanyIds', ids)}
            preselectedId={contactCompanyId || undefined}
          />
          {form.watch('selectedCompanyIds')?.length && (
            <p className="text-xs text-slate-500">
              ✅ {form.watch('selectedCompanyIds')?.length || 0} entreprise(s) sélectionnée(s)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

