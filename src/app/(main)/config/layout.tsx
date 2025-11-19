import { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';

type ConfigLayoutProps = {
  children: ReactNode;
};

// Layout de garde pour toutes les pages de /config/*
// - Autorisé : admin, manager, director
// - Interdit : agent, client, autres rôles → redirection vers les tickets
export default async function ConfigLayout({ children }: ConfigLayoutProps) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    // Le middleware redirige déjà, mais on ajoute une sécurité côté serveur
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('auth_uid', user.id)
    .single();

  const role = profile?.role as 'agent' | 'manager' | 'admin' | 'director' | 'client' | undefined;

  const isAllowedForConfig = role === 'admin' || role === 'manager' || role === 'director';

  if (!isAllowedForConfig) {
    // Les profils non autorisés (ex: agent, client) sont renvoyés vers la vue tickets
    redirect('/gestion/tickets');
  }

  return <>{children}</>;
}


