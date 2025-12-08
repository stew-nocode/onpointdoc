/**
 * Type exports from Supabase database
 * Auto-generated via: npx supabase gen types typescript --project-id xjcttqaiplnoalolebls
 *
 * To regenerate:
 * export SUPABASE_ACCESS_TOKEN="your_token"
 * npx supabase gen types typescript --project-id xjcttqaiplnoalolebls > src/types/database.types.ts
 */

export type { Database, Json } from './database.types';
export type { Database as DB } from './database.types';

// Helper types for tables
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Import Database type for helper types
import type { Database } from './database.types';

// Commonly used table types
export type Ticket = Tables<'tickets'>;
export type Company = Tables<'companies'>;
export type Department = Tables<'departments'>;
export type Product = Tables<'products'>;
export type Module = Tables<'modules'>;
export type Submodule = Tables<'submodules'>;
export type Feature = Tables<'features'>;
export type Profile = Tables<'profiles'>;
export type Team = Tables<'teams'>;
export type Activity = Tables<'activities'>;
export type Task = Tables<'tasks'>;
export type Comment = Tables<'comments'>;
export type TicketComment = Tables<'ticket_comments'>;
export type JiraSync = Tables<'jira_sync'>;
