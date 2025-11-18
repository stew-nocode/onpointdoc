import { contactCreateSchema, type ContactCreateInput, contactUpdateSchema, type ContactUpdateInput } from '@/lib/validators/user';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export async function createContact(input: ContactCreateInput): Promise<string> {
  const payload = contactCreateSchema.parse(input);
  try {
    const res = await fetch('/api/admin/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: payload.fullName,
        email: payload.email,
        password: payload.password,
        role: 'client',
        companyId: payload.companyId,
        isActive: payload.isActive,
        jobTitle: payload.jobTitle ?? null
      })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Création contact échouée (${res.status})`);
    }
    const data = (await res.json()) as { profileId: string };
    return data.profileId;
  } catch (error: any) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion réseau.');
    }
    throw error;
  }
}

/**
 * Met à jour un contact (client externe).
 * Ne permet pas de modifier le rôle (toujours 'client') ni le mot de passe.
 */
export async function updateContact(input: ContactUpdateInput): Promise<void> {
  const parsed = contactUpdateSchema.parse(input);
  const supabase = createSupabaseBrowserClient();
  const { id, ...fields } = parsed;
  
  // Mapping champs UI -> DB
  const updatePayload: Record<string, unknown> = {};
  if (fields.fullName !== undefined) updatePayload.full_name = fields.fullName;
  if (fields.email !== undefined) updatePayload.email = fields.email;
  if (fields.companyId !== undefined) updatePayload.company_id = fields.companyId;
  if (fields.isActive !== undefined) updatePayload.is_active = fields.isActive;
  if (fields.jobTitle !== undefined) updatePayload.job_title = fields.jobTitle ?? null;

  if (Object.keys(updatePayload).length > 0) {
    const { error } = await supabase.from('profiles').update(updatePayload).eq('id', id);
    if (error) throw new Error(error.message);
  }
}

/**
 * Supprime un contact (client externe).
 * Supprime le profil et les affectations associées.
 */
export async function deleteContact(contactId: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  
  // Supprimer les affectations modules (si existantes, normalement pas pour les clients)
  await supabase.from('user_module_assignments').delete().eq('user_id', contactId);
  
  // Supprimer le profil
  const { error } = await supabase.from('profiles').delete().eq('id', contactId);
  if (error) throw new Error(error.message);
}


