export type NavItem = {
  href: string;
  label: string;
  segment: 'tickets' | 'activites' | 'taches' | 'dashboard' | 'marketing' | 'planning';
  roles: Array<'agent' | 'manager' | 'it' | 'marketing' | 'direction' | 'admin'>;
};

export const mainNav: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Tableaux de bord',
    segment: 'dashboard',
    roles: ['manager', 'direction', 'admin']
  },
  {
    href: '/planning',
    label: 'Planning',
    segment: 'planning',
    roles: ['agent', 'manager', 'it', 'marketing', 'direction', 'admin']
  },
  {
    href: '/gestion/tickets',
    label: 'Tickets',
    segment: 'tickets',
    roles: ['agent', 'manager', 'marketing']
  },
  {
    href: '/gestion/activites',
    label: 'Activités',
    segment: 'activites',
    roles: ['agent', 'manager', 'marketing']
  },
  {
    href: '/gestion/taches',
    label: 'Tâches',
    segment: 'taches',
    roles: ['agent', 'manager', 'marketing']
  },
  {
    href: '/marketing/email',
    label: 'Marketing',
    segment: 'marketing',
    roles: ['marketing', 'manager', 'direction', 'admin']
  }
];

