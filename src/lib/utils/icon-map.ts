/**
 * Map des icônes Lucide par identifiant
 * Permet de passer des icônes entre Server et Client Components via un identifiant string
 */

import {
  Clock,
  MessageSquare,
  CheckCircle2,
  GitBranch,
  Briefcase,
  AlertTriangle,
  PlusCircle,
  Activity,
  type LucideIcon
} from 'lucide-react';

export type IconId =
  | 'clock'
  | 'message-square'
  | 'check-circle-2'
  | 'git-branch'
  | 'briefcase'
  | 'alert-triangle'
  | 'plus-circle'
  | 'activity';

export const ICON_MAP: Record<IconId, LucideIcon> = {
  clock: Clock,
  'message-square': MessageSquare,
  'check-circle-2': CheckCircle2,
  'git-branch': GitBranch,
  briefcase: Briefcase,
  'alert-triangle': AlertTriangle,
  'plus-circle': PlusCircle,
  activity: Activity
};

/**
 * Obtient une icône par son identifiant
 */
export function getIconById(iconId: IconId): LucideIcon {
  return ICON_MAP[iconId];
}

