import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';

const highlights = [
  {
    title: 'Tickets Support',
    description: 'Centralisez les Assistances, BUG et REQ avec synchronisation automatique JIRA.',
    href: '/gestion/tickets'
  },
  {
    title: 'Activités & Tâches',
    description: 'Planifiez revues, ateliers et to-do avec liaisons many-to-many.',
    href: '/gestion/activites'
  },
  {
    title: 'Pilotage Direction',
    description: 'Préparez les dashboards MTTR, charge et santé produit.',
    href: '/dashboard'
  }
];

export default function HomePage() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-12">
      <div className="space-y-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">OnpointDoc</p>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
          Gestion unifiée des tickets, activités et tâches
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          Suivez le workflow Support → IT, orchestrez vos activités internes et pilotez les produits OBC,
          SNI et Credit Factory dans une seule interface.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="min-w-[220px]">
            <Link href="/gestion/tickets">
              Enregistrer un ticket
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary" className="min-w-[220px]">
            <Link href="/dashboard">Voir les KPIs</Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {highlights.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600 dark:text-slate-300">{item.description}</p>
              <Button asChild variant="link" className="px-0">
                <Link href={item.href} className="inline-flex items-center">
                  Accéder
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

