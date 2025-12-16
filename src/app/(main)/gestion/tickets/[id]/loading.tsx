import { TicketDetailSkeleton } from '@/components/tickets/ticket-detail-skeleton';

/**
 * Loading state for ticket detail page
 * Displayed during navigation and data fetching
 */
export default function TicketDetailLoading() {
  return <TicketDetailSkeleton />;
}
