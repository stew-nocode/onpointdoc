/**
 * Service pour lister les entreprises avec pagination, recherche, filtres et insights
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (lister les entreprises paginées)
 * - Utilise des fonctions auxiliaires pour respecter la limite de 20 lignes
 * - Gestion d'erreur centralisée avec handleSupabaseError
 * - Types explicites partout
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { handleSupabaseError } from '@/lib/errors/handlers';
import type { 
  CompaniesPaginatedResult, 
  CompanyWithRelations, 
  SupabaseCompanyRaw,
  CompanyCountryRelation,
  CompanyUserRelation,
  CompanySectorRelation
} from '@/types/company-with-relations';
import type { CompanyQuickFilter } from '@/types/company-filters';
import type { CompanySortColumn, SortDirection } from '@/types/company-sort';
import { transformCompanyRelation } from '@/types/company-with-relations';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Applique un filtre rapide à une requête Supabase pour les entreprises
 * 
 * @param query - Requête Supabase à modifier
 * @param quickFilter - Type de filtre rapide à appliquer
 * @returns Requête modifiée avec le filtre appliqué
 */
function applyCompanyQuickFilter(
  query: any,
  quickFilter?: CompanyQuickFilter
) {
  if (!quickFilter || quickFilter === 'all') {
    return query;
  }

  // Les filtres basés sur les insights seront appliqués après agrégation
  // Cette fonction gère seulement les filtres sur les champs directs de la table companies
  return query;
}

/**
 * Construit une requête Supabase pour les entreprises avec relations
 * 
 * @param supabase - Client Supabase
 * @param search - Terme de recherche (par nom)
 * @param quickFilter - Filtre rapide à appliquer (pré-filtrage)
 * @returns Requête Supabase configurée
 */
function buildCompaniesQuery(
  supabase: SupabaseClient,
  search?: string,
  quickFilter?: CompanyQuickFilter
) {
  let query = supabase
    .from('companies')
    .select(`
      id,
      name,
      country_id,
      focal_user_id,
      created_at,
      jira_company_id,
      company_sector_link(
        sector:sectors!company_sector_link_sector_id_fkey(id, name)
      )
    `, { count: 'exact' });
  
  // Note: Les relations country et focal_user seront chargées séparément
  // lors de la transformation pour simplifier

  // Recherche textuelle par nom
  if (search && search.trim().length > 0) {
    const searchTerm = search.trim();
    const escapedSearch = searchTerm.replace(/%/g, '\\%').replace(/_/g, '\\_');
    const searchPattern = `%${escapedSearch}%`;
    query = query.ilike('name', searchPattern);
  }

  // Appliquer les quick filters (filtres directs sur companies uniquement)
  query = applyCompanyQuickFilter(query, quickFilter);

  return query;
}

/**
 * Calcule les insights agrégés pour une entreprise
 * 
 * @param supabase - Client Supabase
 * @param companyId - ID de l'entreprise
 * @returns Objet avec tous les insights
 */
async function calculateCompanyInsights(
  supabase: SupabaseClient,
  companyId: string
): Promise<{
  users_count: number;
  tickets_count: number;
  open_tickets_count: number;
  assistance_duration_minutes: number;
}> {
  // Requêtes en parallèle pour optimiser les performances
  const [usersResult, ticketsDirect, ticketsViaLink, openTicketsResult, assistanceResult] = await Promise.all([
    // Nombre d'utilisateurs
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId),
    
    // Tickets via company_id direct
    supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId),
    
    // Tickets via ticket_company_link (many-to-many)
    supabase
      .from('ticket_company_link')
      .select('ticket_id', { count: 'exact', head: true })
      .eq('company_id', companyId),
    
    // Tickets ouverts (via company_id direct)
    supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .not('status', 'in', '(Termine,Annule,Transfere)'),
    
    // Durée d'assistance cumulée (SUM des duration_minutes pour tickets ASSISTANCE)
    supabase
      .from('tickets')
      .select('duration_minutes')
      .eq('company_id', companyId)
      .eq('ticket_type', 'ASSISTANCE')
      .not('duration_minutes', 'is', null)
  ]);

  // Calculer le total des tickets (direct + via link)
  // Pour éviter les doublons, on utilise un Set si nécessaire
  const ticketsCountDirect = ticketsDirect.count || 0;
  const ticketsCountViaLink = ticketsViaLink.count || 0;
  // Note: Un ticket peut avoir company_id ET être dans ticket_company_link
  // Pour l'instant on additionne, mais idéalement il faudrait dédupliquer
  const tickets_count = ticketsCountDirect + ticketsCountViaLink;

  // Calculer la somme des duration_minutes
  const assistance_duration_minutes = (assistanceResult.data || []).reduce(
    (sum, ticket) => sum + (ticket.duration_minutes || 0),
    0
  );

  return {
    users_count: usersResult.count || 0,
    tickets_count,
    open_tickets_count: openTicketsResult.count || 0,
    assistance_duration_minutes
  };
}

/**
 * Charge les relations country et focal_user pour une entreprise
 * 
 * @param supabase - Client Supabase
 * @param countryId - ID du pays (peut être null)
 * @param focalUserId - ID de l'utilisateur focal (peut être null)
 * @returns Relations country et focal_user
 */
async function loadCompanyRelations(
  supabase: SupabaseClient,
  countryId: string | null,
  focalUserId: string | null
): Promise<{
  country: CompanyCountryRelation;
  focal_user: CompanyUserRelation;
}> {
  const [countryResult, focalUserResult] = await Promise.all([
    countryId
      ? supabase
          .from('countries')
          .select('id, name')
          .eq('id', countryId)
          .single()
      : Promise.resolve({ data: null, error: null }),
    focalUserId
      ? supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', focalUserId)
          .single()
      : Promise.resolve({ data: null, error: null })
  ]);

  return {
    country: countryResult.data || null,
    focal_user: focalUserResult.data || null
  };
}

/**
 * Transforme une entreprise brute Supabase en CompanyWithRelations
 * 
 * @param company - Entreprise brute de Supabase
 * @param relations - Relations country et focal_user chargées
 * @param insights - Insights agrégés calculés
 * @returns Entreprise transformée avec relations et insights
 */
function transformCompany(
  company: SupabaseCompanyRaw,
  relations: {
    country: CompanyCountryRelation;
    focal_user: CompanyUserRelation;
  },
  insights: {
    users_count: number;
    tickets_count: number;
    open_tickets_count: number;
    assistance_duration_minutes: number;
  }
): CompanyWithRelations {
  // Transformer les secteurs (gérer les tableaux imbriqués de Supabase)
  const sectors: CompanySectorRelation[] = [];
  if (company.company_sector_link && Array.isArray(company.company_sector_link)) {
    for (const item of company.company_sector_link) {
      if (Array.isArray(item)) {
        // Si c'est un tableau, itérer sur chaque élément
        for (const nestedItem of item) {
          if (nestedItem && typeof nestedItem === 'object' && 'sector' in nestedItem) {
            const sector = nestedItem.sector;
            if (sector && typeof sector === 'object' && !Array.isArray(sector) && 'id' in sector && 'name' in sector) {
              sectors.push({
                id: sector.id as string,
                name: sector.name as string
              });
            }
          }
        }
      } else if (item && typeof item === 'object' && 'sector' in item) {
        const sector = item.sector;
        if (sector && typeof sector === 'object' && !Array.isArray(sector) && 'id' in sector && 'name' in sector) {
          sectors.push({
            id: sector.id as string,
            name: sector.name as string
          });
        } else if (Array.isArray(sector) && sector.length > 0) {
          const firstSector = sector[0];
          if (firstSector && typeof firstSector === 'object' && 'id' in firstSector && 'name' in firstSector) {
            sectors.push({
              id: firstSector.id as string,
              name: firstSector.name as string
            });
          }
        }
      }
    }
  }

  return {
    ...company,
    country: relations.country || undefined,
    focal_user: relations.focal_user || undefined,
    sectors: sectors.length > 0 ? sectors : undefined,
    // Ajouter les insights
    users_count: insights.users_count,
    tickets_count: insights.tickets_count,
    open_tickets_count: insights.open_tickets_count,
    assistance_duration_minutes: insights.assistance_duration_minutes
  };
}

/**
 * Mappe une colonne de tri vers un champ Supabase
 * 
 * @param column - Colonne de tri
 * @returns Nom du champ Supabase
 */
function mapSortColumnToSupabase(column: CompanySortColumn): string {
  switch (column) {
    case 'name':
      return 'name';
    case 'country':
      // Tri par nom du pays (nécessite une jointure ou sous-requête)
      return 'country_id'; // Tri approximatif par country_id
    case 'created_at':
      return 'created_at';
    case 'users_count':
    case 'tickets_count':
    case 'open_tickets_count':
    case 'assistance_duration':
      // Ces colonnes nécessitent un tri après agrégation
      // Pour l'instant, on trie par created_at comme fallback
      return 'created_at';
    default:
      return 'name';
  }
}

/**
 * Liste les entreprises avec pagination, recherche, filtres et insights
 * 
 * @param offset - Décalage pour la pagination (défaut: 0)
 * @param limit - Nombre d'éléments par page (défaut: 25)
 * @param search - Terme de recherche (par nom)
 * @param quickFilter - Filtre rapide à appliquer
 * @param sort - Colonne de tri (défaut: 'name')
 * @param direction - Direction de tri (défaut: 'asc')
 * @returns Résultat paginé avec entreprises transformées et insights
 * @throws ApplicationError si une erreur survient
 */
export async function listCompaniesPaginated(
  offset: number = 0,
  limit: number = 25,
  search?: string,
  quickFilter?: CompanyQuickFilter,
  sort: CompanySortColumn = 'name',
  direction: SortDirection = 'asc'
): Promise<CompaniesPaginatedResult> {
  const supabase = await createSupabaseServerClient();
  
  // Construire la requête de base
  let query = buildCompaniesQuery(supabase, search, quickFilter);
  
  // Appliquer le tri
  const sortColumn = mapSortColumnToSupabase(sort);
  query = query.order(sortColumn, { ascending: direction === 'asc' });
  
  // Appliquer pagination
  query = query.range(offset, offset + limit - 1);

  // Exécuter la requête
  const { data, error, count } = await query;

  if (error) {
    throw handleSupabaseError(error, 'Erreur lors de la récupération des entreprises');
  }

  if (!data || data.length === 0) {
    return {
      companies: [],
      hasMore: false,
      total: count || 0
    };
  }

  // Calculer les insights et charger les relations pour toutes les entreprises en parallèle
  const companiesWithInsights = await Promise.all(
    data.map(async (company: SupabaseCompanyRaw) => {
      const [insights, relations] = await Promise.all([
        calculateCompanyInsights(supabase, company.id),
        loadCompanyRelations(supabase, company.country_id, company.focal_user_id)
      ]);
      return transformCompany(company, relations, insights);
    })
  );

  // Appliquer les filtres basés sur les insights (après calcul)
  let filteredCompanies = companiesWithInsights;
  if (quickFilter) {
    switch (quickFilter) {
      case 'with_users':
        filteredCompanies = companiesWithInsights.filter(c => c.users_count > 0);
        break;
      case 'without_users':
        filteredCompanies = companiesWithInsights.filter(c => c.users_count === 0);
        break;
      case 'with_tickets':
        filteredCompanies = companiesWithInsights.filter(c => c.tickets_count > 0);
        break;
      case 'with_open_tickets':
        filteredCompanies = companiesWithInsights.filter(c => c.open_tickets_count > 0);
        break;
      case 'with_assistance':
        filteredCompanies = companiesWithInsights.filter(c => c.assistance_duration_minutes > 0);
        break;
    }
  }

  // Appliquer le tri sur les colonnes d'insights si nécessaire
  if (['users_count', 'tickets_count', 'open_tickets_count', 'assistance_duration'].includes(sort)) {
    filteredCompanies.sort((a, b) => {
      let aValue: number;
      let bValue: number;
      
      switch (sort) {
        case 'users_count':
          aValue = a.users_count;
          bValue = b.users_count;
          break;
        case 'tickets_count':
          aValue = a.tickets_count;
          bValue = b.tickets_count;
          break;
        case 'open_tickets_count':
          aValue = a.open_tickets_count;
          bValue = b.open_tickets_count;
          break;
        case 'assistance_duration':
          aValue = a.assistance_duration_minutes;
          bValue = b.assistance_duration_minutes;
          break;
        default:
          return 0;
      }
      
      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }

  return {
    companies: filteredCompanies,
    hasMore: count ? offset + limit < count : false,
    total: count || 0
  };
}
