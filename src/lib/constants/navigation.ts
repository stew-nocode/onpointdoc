export type NavItem = {
  href: string;
  label: string;
  segment: 'tickets' | 'activites' | 'taches' | 'dashboard';
  roles: Array<'agent' | 'manager' | 'it' | 'marketing' | 'direction'>;
};

export const mainNav: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Tableaux de bord',
    segment: 'dashboard',
    roles: ['manager', 'direction']
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
  }
];

