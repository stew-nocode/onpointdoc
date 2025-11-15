export type TicketStatus = 'NOUVEAU' | 'EN_COURS' | 'TRANSFERE' | 'RESOLU';
export type TicketType = 'BUG' | 'REQ' | 'ASSISTANCE';

export type Ticket = {
  id: string;
  title: string;
  ticket_type: TicketType;
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high';
  assigned_to_id?: string | null;
  created_at: string;
};

