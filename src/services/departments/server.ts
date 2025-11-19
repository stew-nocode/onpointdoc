import { createSupabaseServerClient } from '@/lib/supabase/server';

export type Department = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const listDepartments = async (): Promise<Department[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('departments')
    .select('id, name, code, description, color, is_active, created_at, updated_at')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const getDepartment = async (id: string): Promise<Department | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('departments')
    .select('id, name, code, description, color, is_active, created_at, updated_at')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
};

