/**
 * Dialog pour créer un nouvel utilisateur interne
 * 
 * Utilise les hooks personnalisés pour charger les données (companies, modules)
 * Séparant la logique métier de la présentation selon les principes Clean Code
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/ui/dialog';
import { Toggle } from '@/ui/toggle';
import { RadioGroup, RadioCard } from '@/ui/radio-group';
import { Combobox } from '@/ui/combobox';
import { userCreateInternalSchema, departments, type Department } from '@/lib/validators/user';
import { createInternalUser } from '@/services/users';
import { toast } from 'sonner';
import { User, Shield, Crown, Users, Headphones, Code, Megaphone } from 'lucide-react';
import { useCompanies, useModules } from '@/hooks';

type Props = { children: React.ReactNode };

/**
 * Dialog pour créer un nouvel utilisateur interne
 * 
 * @param children - Trigger pour ouvrir le dialog
 */
export function NewUserDialog({ children }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'agent' | 'manager' | 'admin' | 'director'>('agent');
  const [department, setDepartment] = useState<Department | ''>('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyId, setCompanyId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [moduleToAdd, setModuleToAdd] = useState<string>('');
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);

  // Charger les données avec les hooks personnalisés (uniquement quand le dialog est ouvert)
  const { companyOptions: companies, isLoading: isLoadingCompanies } = useCompanies({ enabled: open });
  const { moduleOptions: modules, isLoading: isLoadingModules } = useModules({ enabled: open });

  const isLoading = isLoadingCompanies || isLoadingModules;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = userCreateInternalSchema.parse({
        fullName,
        email,
        password,
        role,
        department: department || undefined,
        jobTitle: jobTitle || undefined,
        companyId,
        isActive,
        moduleIds: selectedModuleIds
      });
      await createInternalUser(payload);
      toast.success('Utilisateur créé avec succès');
      setOpen(false);
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('agent');
      setDepartment('');
      setJobTitle('');
      setCompanyId('');
      setIsActive(true);
      setSelectedModuleIds([]);
      router.refresh();
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Créer un utilisateur</DialogTitle>
          <DialogDescription>Compte Auth + profil + affectations modules.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Nom complet</label>
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Mot de passe (temporaire)</label>
            <input
              type="password"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-3">
              <label className="text-sm font-medium text-slate-700">Rôle</label>
              <RadioGroup 
              value={role} 
              onValueChange={(v) => setRole(v as 'agent' | 'manager' | 'admin' | 'director')} 
              className="grid grid-cols-2 gap-2"
            >
                <RadioCard
                  value="agent"
                  label="Agent"
                  icon={<User className="h-4 w-4" />}
                />
                <RadioCard
                  value="manager"
                  label="Manager"
                  icon={<Users className="h-4 w-4" />}
                />
                <RadioCard
                  value="admin"
                  label="Admin"
                  icon={<Shield className="h-4 w-4" />}
                />
                <RadioCard
                  value="director"
                  label="Directeur"
                  icon={<Crown className="h-4 w-4" />}
                />
              </RadioGroup>
            </div>
            <div className="grid gap-3">
              <label className="text-sm font-medium text-slate-700">Département</label>
              <RadioGroup
                value={department || ''}
                onValueChange={(v) => setDepartment(v as Department | '')}
                className="grid grid-cols-3 gap-2"
              >
                <RadioCard
                  value="Support"
                  label="Support"
                  icon={<Headphones className="h-4 w-4" />}
                />
                <RadioCard
                  value="IT"
                  label="IT"
                  icon={<Code className="h-4 w-4" />}
                />
                <RadioCard
                  value="Marketing"
                  label="Marketing"
                  icon={<Megaphone className="h-4 w-4" />}
                />
              </RadioGroup>
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Fonction</label>
            <input
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Ex: Chef comptable, Directeur Technique..."
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Entreprise</label>
            <Combobox
              options={companies.map((c) => ({ value: c.id, label: c.name }))}
              value={companyId}
              onValueChange={setCompanyId}
              placeholder="Sélectionner une entreprise"
              searchPlaceholder="Rechercher une entreprise..."
              emptyText="Aucune entreprise trouvée"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Affectations modules</label>
            <div className="flex gap-2">
              <Combobox
                options={modules
                  .filter((m) => !selectedModuleIds.includes(m.id))
                  .map((m) => ({ value: m.id, label: m.name }))}
                value={moduleToAdd}
                onValueChange={setModuleToAdd}
                placeholder="Sélectionner un module"
                searchPlaceholder="Rechercher un module..."
                emptyText="Aucun module disponible"
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (!moduleToAdd) return;
                  setSelectedModuleIds((prev) => (prev.includes(moduleToAdd) ? prev : [...prev, moduleToAdd]));
                  setModuleToAdd('');
                }}
              >
                Ajouter
              </Button>
            </div>
            {selectedModuleIds.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedModuleIds
                  .map((id) => {
                    const module = modules.find((m) => m.id === id);
                    if (!module) return null;
                    return (
                      <span
                        key={module.id}
                        className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800"
                      >
                        {module.name}
                        <button
                          type="button"
                          className="rounded p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700"
                          onClick={() => setSelectedModuleIds((prev) => prev.filter((v) => v !== module.id))}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })
                  .filter(Boolean)}
              </div>
            )}
          </div>
          <Toggle checked={isActive} onChange={setIsActive} label="Actif" />
          {error && <p className="text-sm text-status-danger">{error}</p>}
          <Button className="w-full" type="submit" disabled={saving}>
            {saving ? 'Création…' : 'Créer'}
          </Button>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}


