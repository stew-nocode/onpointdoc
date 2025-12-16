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
  Calendar,
  CalendarDays,
  PlayCircle,
  Mail,
  Eye,
  Send,
  MousePointerClick,
  Circle,
  AlertCircle,
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
  | 'activity'
  | 'calendar'
  | 'calendar-days'
  | 'play-circle'
  | 'mail'
  | 'eye'
  | 'send'
  | 'mouse-pointer-click'
  | 'circle'
  | 'alert-circle';

export const ICON_MAP: Record<IconId, LucideIcon> = {
  clock: Clock,
  'message-square': MessageSquare,
  'check-circle-2': CheckCircle2,
  'git-branch': GitBranch,
  briefcase: Briefcase,
  'alert-triangle': AlertTriangle,
  'plus-circle': PlusCircle,
  activity: Activity,
  calendar: Calendar,
  'calendar-days': CalendarDays,
  'play-circle': PlayCircle,
  mail: Mail,
  eye: Eye,
  send: Send,
  'mouse-pointer-click': MousePointerClick,
  circle: Circle,
  'alert-circle': AlertCircle
};

/**
 * Obtient une icône par son identifiant
 */
export function getIconById(iconId: IconId): LucideIcon {
  return ICON_MAP[iconId];
}

