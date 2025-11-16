import { userCreateInternalSchema, type UserCreateInternalInput, userUpdateSchema, type UserUpdateInput } from '@/lib/validators/user';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * Crée un utilisateur interne via l'API serveur (service role) et assigne les modules.
 * Retourne l'id du profil créé.
 */
export async function createInternalUser(input: UserCreateInternalInput): Promise<string> {
  const payload = userCreateInternalSchema.parse(input);
  const res = await fetch('/api/admin/users/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: payload.fullName,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      companyId: payload.companyId,
      isActive: payload.isActive,
      department: payload.department ?? null,
      moduleIds: payload.moduleIds
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Création utilisateur échouée');
  }
  const data = (await res.json()) as { profileId: string };
  return data.profileId;
}

/**
 * Met à jour le profil utilisateur (et remplace ses affectations modules si fourni).
 */
export async function updateUser(input: UserUpdateInput): Promise<void> {
  const parsed = userUpdateSchema.parse(input);
  const supabase = createSupabaseBrowserClient();
  const { id, moduleIds, ...fields } = parsed;
  // mapping champs UI -> DB
  const updatePayload: Record<string, unknown> = {};
  if (fields.fullName !== undefined) updatePayload.full_name = fields.fullName;
  if (fields.email !== undefined) updatePayload.email = fields.email;
  if (fields.role !== undefined) updatePayload.role = fields.role;
  if (fields.companyId !== undefined) updatePayload.company_id = fields.companyId;
  if (fields.isActive !== undefined) updatePayload.is_active = fields.isActive;
  if (fields.department !== undefined) updatePayload.department = fields.department ?? null;

  if (Object.keys(updatePayload).length > 0) {
    const { error } = await supabase.from('profiles').update(updatePayload).eq('id', id);
    if (error) throw new Error(error.message);
  }

  if (moduleIds) {
    await supabase.from('user_module_assignments').delete().eq('user_id', id);
    if (moduleIds.length) {
      const rows = moduleIds.map((moduleId) => ({ user_id: id, module_id: moduleId }));
      const { error: linkErr } = await supabase.from('user_module_assignments').insert(rows);
      if (linkErr) throw new Error(linkErr.message);
    }
  }
}



