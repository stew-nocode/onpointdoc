import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { CompanyCreateInput, CompanyUpdateInput } from '@/lib/validators/company';
import { companyCreateSchema, companyUpdateSchema } from '@/lib/validators/company';

// Réexporter uniquement le type (pas la fonction serveur pour éviter l'import de next/headers dans les composants clients)
export type { BasicCompany } from './server';

/**
 * Crée une compagnie et ses liaisons de secteurs côté client (Supabase Browser).
 * Valide l'entrée via Zod avant insertion.
 * Retourne l'identifiant de la compagnie créée.
 */
export async function createCompanyWithSectors(input: CompanyCreateInput): Promise<string> {
  const parsed = companyCreateSchema.parse(input);
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('companies')
    .insert({ name: parsed.name, country_id: parsed.countryId ?? null, focal_user_id: parsed.focalUserId ?? null })
    .select('id')
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? 'Création de la compagnie impossible');
  }
  const companyId = data.id as string;
  if (parsed.sectorIds && parsed.sectorIds.length) {
    const rows = parsed.sectorIds.map((sectorId) => ({ company_id: companyId, sector_id: sectorId }));
    const { error: linkErr } = await supabase.from('company_sector_link').insert(rows);
    if (linkErr) {
      throw new Error(linkErr.message);
    }
  }
  return companyId;
}

/**
 * Met à jour une compagnie et ses liaisons de secteurs.
 */
export async function updateCompany(input: CompanyUpdateInput): Promise<void> {
  const parsed = companyUpdateSchema.parse(input);
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from('companies')
    .update({
      name: parsed.name,
      country_id: parsed.countryId ?? null,
      focal_user_id: parsed.focalUserId ?? null
    })
    .eq('id', parsed.id);
  if (error) throw new Error(error.message);

  if (parsed.sectorIds) {
    await supabase.from('company_sector_link').delete().eq('company_id', parsed.id);
    if (parsed.sectorIds.length) {
      const rows = parsed.sectorIds.map((sectorId) => ({ company_id: parsed.id, sector_id: sectorId }));
      const { error: linkErr } = await supabase.from('company_sector_link').insert(rows);
      if (linkErr) throw new Error(linkErr.message);
    }
  }
}

// NOTE: listCompaniesPaginated n'est PAS exporté ici car c'est un service serveur
// qui utilise createSupabaseServerClient (next/headers).
// Il doit être importé directement depuis './list-companies-paginated' dans les
// Server Components ou routes API uniquement.

