import { writeFileSync, readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

// Utiliser les variables d'environnement du projet
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xjcttqaiplnoalolebls.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Clé Supabase manquante. Vérifiez vos variables d\'environnement.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function escapeCsvValue(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function generateCSV() {
  console.log('📥 Extraction des tickets avec date du 9 décembre 2025...\n');

  // Filtrer par plage de dates
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
    console.error('❌ Erreur:', ticketsError);
    process.exit(1);
  }

  if (!tickets || tickets.length === 0) {
    console.log('⚠️  Aucun ticket trouvé');
    return;
  }

  console.log(`✅ ${tickets.length} tickets trouvés\n`);

  // Récupérer les relations
  const companyIds = [...new Set(tickets.map(t => t.company_id).filter(Boolean))];
  const reporterIds = [...new Set(tickets.map(t => t.created_by).filter(Boolean))];
  const contactIds = [...new Set(tickets.map(t => t.contact_user_id).filter(Boolean))];

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .in('id', companyIds);

  const companiesMap = new Map(companies?.map(c => [c.id, c.name]) || []);

  const allProfileIds = [...new Set([...reporterIds, ...contactIds])];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', allProfileIds);

  const profilesMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

  // Préparer les données
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

  const csvLines = [headers.join(',')];

  for (const ticket of tickets) {
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
      escapeCsvValue(companiesMap.get(ticket.company_id) || ''),
      escapeCsvValue(profilesMap.get(ticket.created_by) || ''),
      escapeCsvValue(profilesMap.get(ticket.contact_user_id) || '')
    ];
    csvLines.push(row.join(','));
  }

  const csvContent = csvLines.join('\n');
  const outputPath = 'tickets-2025-12-09.csv';
  writeFileSync(outputPath, csvContent, 'utf-8');

  console.log(`✅ Fichier CSV créé: ${outputPath}`);
  console.log(`📊 ${tickets.length} tickets exportés`);
}

generateCSV().catch(console.error);

