import { writeFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Fonction pour échapper les valeurs CSV
function escapeCsvValue(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function exportTickets() {
  console.log('📥 Extraction des tickets avec date du 9 décembre 2025...\n');

  // Filtrer par plage de dates (du début à la fin du 9 décembre 2025)
  const startDate = '2025-12-09T00:00:00.000Z';
  const endDate = '2025-12-09T23:59:59.999Z';

  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('*')
    .eq('ticket_type', 'ASSISTANCE')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('jira_issue_key');

  if (ticketsError) {
    console.error('❌ Erreur lors de l\'extraction des tickets:', ticketsError);
    process.exit(1);
  }

  if (!tickets || tickets.length === 0) {
    console.log('⚠️  Aucun ticket trouvé');
    return;
  }

  // Récupérer les IDs uniques pour les relations
  const companyIds = [...new Set(tickets.map(t => t.company_id).filter(Boolean))];
  const reporterIds = [...new Set(tickets.map(t => t.created_by).filter(Boolean))];
  const contactIds = [...new Set(tickets.map(t => t.contact_user_id).filter(Boolean))];

  // Récupérer les entreprises
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .in('id', companyIds);

  const companiesMap = new Map(companies?.map(c => [c.id, c.name]) || []);

  // Récupérer les profils (reporters et contacts)
  const allProfileIds = [...new Set([...reporterIds, ...contactIds])];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', allProfileIds);

  const profilesMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

  // Combiner les données
  const data = tickets.map(ticket => ({
    ...ticket,
    company_name: companiesMap.get(ticket.company_id) || '',
    reporter_name: profilesMap.get(ticket.created_by) || '',
    contact_user_name: profilesMap.get(ticket.contact_user_id) || ''
  }));

  if (error) {
    console.error('❌ Erreur lors de l\'extraction:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('⚠️  Aucun ticket trouvé');
    return;
  }

  console.log(`✅ ${data.length} tickets trouvés\n`);

  // En-têtes CSV
  const headers = [
    'jira_issue_key',
    'title',
    'created_at',
    'updated_at',
    'ticket_type',
    'status',
    'priority',
    'duration_minutes',
    'action_menee',
    'objet_principal',
    'company_name',
    'reporter_name',
    'contact_user_name'
  ];

  // Créer les lignes CSV
  const csvLines = [headers.join(',')];

  for (const ticket of data) {
    const row = [
      escapeCsvValue(ticket.jira_issue_key),
      escapeCsvValue(ticket.title),
      escapeCsvValue(ticket.created_at),
      escapeCsvValue(ticket.updated_at),
      escapeCsvValue(ticket.ticket_type),
      escapeCsvValue(ticket.status),
      escapeCsvValue(ticket.priority),
      escapeCsvValue(ticket.duration_minutes),
      escapeCsvValue(ticket.action_menee),
      escapeCsvValue(ticket.objet_principal),
      escapeCsvValue(ticket.companies?.name || ''),
      escapeCsvValue(ticket.reporter?.full_name || ''),
      escapeCsvValue(ticket.contact?.full_name || '')
    ];
    csvLines.push(row.join(','));
  }

  // Écrire le fichier CSV
  const csvContent = csvLines.join('\n');
  const outputPath = 'tickets-2025-12-09.csv';
  writeFileSync(outputPath, csvContent, 'utf-8');

  console.log(`✅ Fichier CSV créé: ${outputPath}`);
  console.log(`📊 ${data.length} tickets exportés`);
}

exportTickets().catch(console.error);

