/**
 * Dialog pour créer un nouveau contact (utilisateur client)
 * 
 * Réutilise le pattern de NewCompanyDialog et les composants existants
 * Respecte les principes Clean Code
 */

'use client';

import { useState } from 'react';
import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/ui/dialog';
import { Combobox } from '@/ui/combobox';
import { contactCreateSchema, type ContactCreateInput } from '@/lib/validators/user';
import { createContact } from '@/services/contacts';
import { toast } from 'sonner';
import { useCompanies } from '@/hooks';
import { INPUT_CLASS } from '@/lib/constants/form-styles';

type CreateContactDialogProps = {
  children: React.ReactNode;
  onContactCreated?: (contactId: string) => void;
  defaultCompanyId?: string;
};

/**
 * Dialog pour créer un nouveau contact (utilisateur client)
 * 
 * @param children - Trigger pour ouvrir le dialog
 * @param onContactCreated - Callback appelé après la création du contact avec l'ID du profil créé
 * @param defaultCompanyId - ID de l'entreprise par défaut (optionnel)
 */
export function CreateContactDialog({
  children,
  onContactCreated,
  defaultCompanyId
}: CreateContactDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formulaire
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyId, setCompanyId] = useState<string>(defaultCompanyId || '');
  const [isActive, setIsActive] = useState(true);

  // Charger les entreprises avec le hook personnalisé (uniquement quand le dialog est ouvert)
  const { companies, isLoading: isLoadingCompanies } = useCompanies({ enabled: open });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      const payload = contactCreateSchema.parse({
        fullName,
        email,
        password,
        jobTitle: jobTitle || undefined,
        companyId,
        isActive
      });
      
      const profileId = await createContact(payload);
      
      toast.success('Contact créé avec succès');
      setOpen(false);
      
      // Réinitialiser le formulaire
      setFullName('');
      setEmail('');
      setPassword('');
      setJobTitle('');
      setCompanyId(defaultCompanyId || '');
      setIsActive(true);
      
      // Appeler le callback si fourni
      if (onContactCreated) {
        onContactCreated(profileId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inattendue';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un nouveau contact</DialogTitle>
          <DialogDescription>
            Renseignez les informations du contact client. Un compte utilisateur sera créé.
          </DialogDescription>
        </DialogHeader>
        {isLoadingCompanies ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="fullName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nom complet <span className="text-status-danger">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  className={INPUT_CLASS}
                  placeholder="Ex: Jean Dupont"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email <span className="text-status-danger">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className={INPUT_CLASS}
                  placeholder="Ex: jean.dupont@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Mot de passe <span className="text-status-danger">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  className={INPUT_CLASS}
                  placeholder="Minimum 8 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Le mot de passe sera communiqué au contact pour se connecter.
                </p>
              </div>
              <div className="grid gap-2">
                <label htmlFor="jobTitle" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Poste
                </label>
                <input
                  id="jobTitle"
                  type="text"
                  className={INPUT_CLASS}
                  placeholder="Ex: Directeur Technique"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  maxLength={100}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="companyId" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Entreprise <span className="text-status-danger">*</span>
              </label>
              <Combobox
                options={companies.map((c) => ({ value: c.id, label: c.name }))}
                value={companyId}
                onValueChange={setCompanyId}
                placeholder="Sélectionner une entreprise"
                searchPlaceholder="Rechercher une entreprise..."
                emptyText="Aucune entreprise trouvée"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Actif (le contact pourra se connecter)
              </label>
            </div>

            {error && (
              <div className="rounded-lg border border-status-danger/50 bg-status-danger/10 p-3 text-sm text-status-danger">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Création...' : 'Créer le contact'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}


