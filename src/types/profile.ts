/**
 * Types pour les profils utilisateurs
 */

export type ProfileRole = 'admin' | 'manager' | 'director' | 'agent' | 'client';

export type Profile = {
  id: string;
  auth_uid: string;
  email: string;
  full_name: string | null;
  role: ProfileRole;
  company_id: string | null;
  is_active: boolean | null;
  department: string | null;
  job_title: string | null;
};

