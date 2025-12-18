/**
 * Exports des services de stats pour les entreprises
 */

export {
  getCompanyTicketsDistributionStats,
  type CompanyTicketsDistributionStats,
  type CompanyTicketTypeDistributionItem,
} from './company-tickets-distribution-stats';

export {
  getCompanyTicketsEvolutionStats,
  type CompanyTicketsEvolutionStats,
  type CompanyEvolutionDataPoint,
  type CompanyDataGranularity,
} from './company-tickets-evolution-stats';

export {
  getCompanyTicketsByProductModuleStats,
  type CompanyTicketsByProductModuleStats,
  type ProductModuleTicketData,
} from './company-tickets-by-product-module-stats';

