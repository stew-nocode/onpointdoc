import { z } from 'zod';
import { ticketTypes, ticketPriorities, ticketChannels } from './ticket';

/**
 * Schéma Zod pour un filtre de période de date
 */
const dateRangeSchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()
});

/**
 * Schéma Zod pour un filtre de date
 */
const dateFilterSchema = z.object({
  preset: z.enum(['today', 'this_week', 'this_month', 'custom']).nullable(),
  range: dateRangeSchema.nullable()
});

/**
 * Schéma Zod pour les filtres avancés
 * 
 * Tous les champs sont optionnels et peuvent être vides (tableaux vides)
 */
export const advancedFiltersSchema = z.object({
  types: z.array(z.enum(ticketTypes)).default([]),
  statuses: z.array(z.string()).default([]),
  priorities: z.array(z.enum(ticketPriorities)).default([]),
  assignedTo: z.array(z.string().uuid()).default([]),
  products: z.array(z.string().uuid()).default([]),
  modules: z.array(z.string().uuid()).default([]),
  channels: z.array(z.enum(ticketChannels)).default([]),
  createdAt: dateFilterSchema.nullable().default(null),
  resolvedAt: dateFilterSchema.nullable().default(null),
  origins: z.array(z.enum(['supabase', 'jira'])).default([]),
  hasJiraSync: z.boolean().nullable().default(null)
});

/**
 * Type TypeScript inféré du schéma
 */
export type AdvancedFiltersInput = z.infer<typeof advancedFiltersSchema>;

/**
 * Vérifie si les filtres avancés sont vides (aucun filtre actif)
 * 
 * @param filters - Filtres avancés à vérifier
 * @returns true si aucun filtre n'est actif
 */
export function areFiltersEmpty(filters: AdvancedFiltersInput): boolean {
  return (
    filters.types.length === 0 &&
    filters.statuses.length === 0 &&
    filters.priorities.length === 0 &&
    filters.assignedTo.length === 0 &&
    filters.products.length === 0 &&
    filters.modules.length === 0 &&
    filters.channels.length === 0 &&
    filters.createdAt === null &&
    filters.resolvedAt === null &&
    filters.origins.length === 0 &&
    filters.hasJiraSync === null
  );
}

/**
 * Valide et parse les filtres avancés depuis les URL params
 * 
 * @param params - Paramètres URL (record de strings)
 * @returns Filtres avancés validés ou null si erreur
 */
export function parseAdvancedFiltersFromParams(
  params: Record<string, string | string[] | undefined>
): AdvancedFiltersInput | null {
  try {
    const parsed = {
      types: parseArrayParam(params.types),
      statuses: parseArrayParam(params.statuses),
      priorities: parseArrayParam(params.priorities),
      assignedTo: parseArrayParam(params.assignedTo),
      products: parseArrayParam(params.products),
      modules: parseArrayParam(params.modules),
      channels: parseArrayParam(params.channels),
      createdAt: parseDateFilter(params.createdAtPreset, params.createdAtStart, params.createdAtEnd),
      resolvedAt: parseDateFilter(
        params.resolvedAtPreset,
        params.resolvedAtStart,
        params.resolvedAtEnd
      ),
      origins: parseArrayParam(params.origins),
      hasJiraSync: parseBooleanParam(params.hasJiraSync)
    };

    return advancedFiltersSchema.parse(parsed);
  } catch (error) {
    // Logger l'erreur pour le debugging mais ne pas faire échouer la requête
    // Les filtres avancés sont optionnels
    if (process.env.NODE_ENV === 'development') {
      console.error('Erreur lors du parsing des filtres avancés:', error);
      console.error('Paramètres reçus:', params);
    }
    return null;
  }
}

/**
 * Parse un paramètre de tableau depuis l'URL
 * 
 * @param param - Paramètre URL (string ou string[])
 * @returns Tableau de strings ou tableau vide
 */
function parseArrayParam(param: string | string[] | undefined): string[] {
  if (!param) return [];

  if (Array.isArray(param)) {
    return param.filter((p) => typeof p === 'string' && p.length > 0);
  }

  return typeof param === 'string' && param.length > 0 ? [param] : [];
}

/**
 * Valide un preset de date
 *
 * @param presetValue - Valeur du preset à valider
 * @returns true si le preset est valide
 */
function validateDatePreset(presetValue: string | null): presetValue is 'today' | 'this_week' | 'this_month' | 'custom' {
  if (!presetValue) return false;

  const validPresets = ['today', 'this_week', 'this_month', 'custom'];
  return validPresets.includes(presetValue);
}

/**
 * Construit un filtre de date personnalisé
 *
 * @param startValue - Date de début (YYYY-MM-DD)
 * @param endValue - Date de fin (YYYY-MM-DD)
 * @returns Filtre de date custom ou null
 */
function buildCustomDateFilter(
  startValue: string | null,
  endValue: string | null
): { preset: 'custom'; range: { start: string | null; end: string | null } } | null {
  if (!startValue && !endValue) return null;

  return {
    preset: 'custom',
    range: {
      start: startValue || null,
      end: endValue || null
    }
  };
}

/**
 * Construit un filtre de date avec preset
 *
 * @param presetValue - Preset valide (today, this_week, this_month)
 * @returns Filtre de date avec preset
 */
function buildPresetDateFilter(
  presetValue: 'today' | 'this_week' | 'this_month'
): { preset: 'today' | 'this_week' | 'this_month'; range: null } {
  return {
    preset: presetValue,
    range: null
  };
}

/**
 * Parse un filtre de date depuis les paramètres URL
 *
 * @param preset - Présélection (today, this_week, etc.)
 * @param start - Date de début (YYYY-MM-DD)
 * @param end - Date de fin (YYYY-MM-DD)
 * @returns Filtre de date ou null
 */
function parseDateFilter(
  preset: string | string[] | undefined,
  start: string | string[] | undefined,
  end: string | string[] | undefined
): { preset: 'today' | 'this_week' | 'this_month' | 'custom' | null; range: { start: string | null; end: string | null } | null } | null {
  const presetValue = typeof preset === 'string' ? preset : Array.isArray(preset) ? preset[0] : null;

  if (!presetValue || !validateDatePreset(presetValue)) {
    return null;
  }

  const startValue = typeof start === 'string' ? start : Array.isArray(start) ? start[0] : null;
  const endValue = typeof end === 'string' ? end : Array.isArray(end) ? end[0] : null;

  if (presetValue === 'custom') {
    return buildCustomDateFilter(startValue, endValue);
  }

  return buildPresetDateFilter(presetValue);
}

/**
 * Parse un paramètre booléen depuis l'URL
 * 
 * @param param - Paramètre URL (string ou string[])
 * @returns boolean | null
 */
function parseBooleanParam(param: string | string[] | undefined): boolean | null {
  if (!param) return null;

  const value = typeof param === 'string' ? param : Array.isArray(param) ? param[0] : null;

  if (value === 'true') return true;
  if (value === 'false') return false;

  return null;
}

