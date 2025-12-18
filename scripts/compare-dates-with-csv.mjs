import { readFileSync, writeFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xjcttqaiplnoalolebls.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Clé Supabase manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Fonction pour parser les dates françaises
function parseFrenchDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  
  let cleaned = dateStr.trim();
  cleaned = cleaned.replace(/\/dc\.?\//i, '/déc./');
  
  const frenchMatch = cleaned.match(/(\d{1,2})\/([a-zéèêàûô]+)\.?\/(\d{2})\s+(\d{1,2}):(\d{2})/i);
  if (frenchMatch) {
    const [, day, month, year, hour, minute] = frenchMatch;
    const monthNormalized = month.replace(/\.$/, '').toLowerCase();
    
    const monthMap = {
      'janv': '01', 'janvier': '01',
      'févr': '02', 'février': '02', 'fevr': '02', 'fevrier': '02',
      'mars': '03',
      'avr': '04', 'avril': '04',
      'mai': '05',
      'juin': '06',
      'juil': '07', 'juillet': '07',
      'août': '08', 'aout': '08', 'aoû': '08',
      'sept': '09', 'septembre': '09',
      'oct': '10', 'octobre': '10',
      'nov': '11', 'novembre': '11',
      'déc': '12', 'décembre': '12', 'dec': '12', 'decembre': '12'
    };
    
    const monthNum = monthMap[monthNormalized] || '01';
    const fullYear = '20' + year;
    return `${fullYear}-${monthNum}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute}:00.000Z`;
  }
  
  if (cleaned.match(/^\d{4}-\d{2}-\d{2}/)) {
    return cleaned;
  }
  
  return null;
}

async function compareDates() {
  console.log('📊 Comparaison des dates entre Supabase et le CSV...\n');

  // Lire le CSV
  const csvContent = readFileSync('temp_jira_export.csv', 'utf-8');
  const lines = csvContent.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',');
  
  const jiraKeyIndex = headers.findIndex(h => h.includes('Clé') || h.includes('jira'));
  const dateIndex = headers.findIndex(h => h.includes('Création') || h.includes('Creation'));
  
  console.log(`📄 CSV: ${lines.length - 1} lignes (sans header)`);
  console.log(`   Colonne JIRA: ${jiraKeyIndex}, Colonne Date: ${dateIndex}\n`);

  // Parser le CSV
  const csvTickets = new Map();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(',');
    if (parts.length > Math.max(jiraKeyIndex, dateIndex)) {
      const jiraKey = parts[jiraKeyIndex]?.trim();
      const dateStr = parts[dateIndex]?.trim();
      if (jiraKey && dateStr) {
        const parsedDate = parseFrenchDate(dateStr);
        if (parsedDate) {
          csvTickets.set(jiraKey, parsedDate);
        }
      }
    }
  }

  console.log(`✅ ${csvTickets.size} tickets trouvés dans le CSV\n`);

  // Récupérer tous les tickets d'assistance de Supabase
  const { data: supabaseTickets, error } = await supabase
    .from('tickets')
    .select('jira_issue_key, created_at')
    .eq('ticket_type', 'ASSISTANCE')
    .not('jira_issue_key', 'is', null);

  if (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }

  console.log(`✅ ${supabaseTickets.length} tickets d'assistance dans Supabase\n`);

  // Comparer les dates
  const mismatches = [];
  const notInCSV = [];
  const notInSupabase = [];
  let matches = 0;

  for (const ticket of supabaseTickets) {
    const csvDate = csvTickets.get(ticket.jira_issue_key);
    if (!csvDate) {
      notInCSV.push(ticket.jira_issue_key);
      continue;
    }

    const supabaseDate = new Date(ticket.created_at);
    const csvDateObj = new Date(csvDate);
    
    // Comparer seulement la date (sans l'heure)
    const supabaseDateOnly = supabaseDate.toISOString().split('T')[0];
    const csvDateOnly = csvDateObj.toISOString().split('T')[0];

    if (supabaseDateOnly === csvDateOnly) {
      matches++;
    } else {
      mismatches.push({
        jira_issue_key: ticket.jira_issue_key,
        supabase_date: supabaseDateOnly,
        csv_date: csvDateOnly,
        supabase_full: ticket.created_at,
        csv_full: csvDate
      });
    }
  }

  // Tickets dans CSV mais pas dans Supabase
  for (const [jiraKey, csvDate] of csvTickets.entries()) {
    if (!supabaseTickets.find(t => t.jira_issue_key === jiraKey)) {
      notInSupabase.push({ jira_issue_key: jiraKey, csv_date: csvDate });
    }
  }

  // Afficher les résultats
  console.log('📊 RÉSULTATS DE LA COMPARAISON\n');
  console.log(`✅ Dates correspondantes: ${matches}`);
  console.log(`⚠️  Dates différentes: ${mismatches.length}`);
  console.log(`📝 Dans CSV mais pas dans Supabase: ${notInSupabase.length}`);
  console.log(`📝 Dans Supabase mais pas dans CSV: ${notInCSV.length}\n`);

  if (mismatches.length > 0) {
    console.log('⚠️  TICKETS AVEC DATES DIFFÉRENTES (premiers 20):\n');
    mismatches.slice(0, 20).forEach(m => {
      console.log(`   ${m.jira_issue_key}: Supabase=${m.supabase_date}, CSV=${m.csv_date}`);
    });
    if (mismatches.length > 20) {
      console.log(`   ... et ${mismatches.length - 20} autres\n`);
    }
  }

  // Sauvegarder les résultats
  const report = {
    total_matches: matches,
    total_mismatches: mismatches.length,
    not_in_csv: notInCSV.length,
    not_in_supabase: notInSupabase.length,
    mismatches: mismatches.slice(0, 100), // Limiter à 100 pour le rapport
    not_in_supabase_sample: notInSupabase.slice(0, 50)
  };

  writeFileSync('date-comparison-report.json', JSON.stringify(report, null, 2), 'utf-8');
  console.log('\n✅ Rapport sauvegardé dans: date-comparison-report.json');
}

compareDates().catch(console.error);












