import { redirect } from 'next/navigation';

/**
 * Page de redirection pour /gestion
 * Redirige vers /gestion/tickets par défaut
 */
export default function GestionPage() {
  redirect('/gestion/tickets');
}

