/**
 * Point d'entrée pour tous les hooks personnalisés
 * 
 * Exporte tous les hooks pour faciliter les imports
 */

// Hooks d'authentification
export { useAuth } from './auth/use-auth';
export { useAuthRedirect } from './auth/use-auth-redirect';

// Hooks Supabase génériques
export { useSupabaseQuery } from './supabase/use-supabase-query';

// Hooks Supabase spécifiques
export { useCountries } from './supabase/use-countries';
export { useSectors } from './supabase/use-sectors';
export { useProfiles } from './supabase/use-profiles';
export { useProfile } from './supabase/use-profile';
export { useCompanies } from './supabase/use-companies';
export { useCompany } from './supabase/use-company';
export { useCompanySectors } from './supabase/use-company-sectors';
export { useModules } from './supabase/use-modules';
export { useUserModules } from './supabase/use-user-modules';

// Hooks de formulaires
export { useFileUpload } from './forms/use-file-upload';
export type { FileWithPreview } from './forms/use-file-upload';
export { useTicketForm } from './forms/use-ticket-form';

// Hooks N8N
export { useAnalysisGenerator } from './n8n/use-analysis-generator';
export { useTextReveal } from './n8n/use-text-reveal';

// Hooks d'éditeurs
export { useRichTextEditor } from './editors/use-rich-text-editor';

// Hooks de tickets
export { useTicketSelection } from './tickets/use-ticket-selection';
export { useBulkActions } from './tickets/use-bulk-actions';
export type { BulkActionResult } from './tickets/use-bulk-actions';
export { useComments } from './tickets/use-comments';

// Hooks de navigation
export { usePageTransition } from './navigation/use-page-transition';
export { useLinkInterceptor } from './navigation/use-link-interceptor';
