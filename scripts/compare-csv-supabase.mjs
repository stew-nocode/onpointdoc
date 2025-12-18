import 'dotenv/config';
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function compare() {
  console.log('📥 Lecture du CSV...\n');
  
  const csv = readFileSync('temp_jira_export.csv', 'utf-8');
  const lines = csv.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',');
  
  // Trouver l'index de la colonne JIRA key
  const jiraKeyIndex = headers.findIndex(h => 
    h.includes('Clé') || h.includes('Key') || h.toLowerCase().includes('jira')
  );
  
  if (jiraKeyIndex === -1) {
    console.error('❌ Colonne JIRA key non trouvée dans:', headers);
    process.exit(1);
  }
  
  const csvKeys = new Set(
    lines.slice(1)
      .map(l => {
        const parts = l.split(',');
        return parts[jiraKeyIndex]?.trim() || '';
      })
      .filter(k => k && k.startsWith('OBCS-'))
  );
  
  console.log(`📊 CSV: ${csvKeys.size} tickets d'assistance\n`);
  
  console.log('📥 Récupération des tickets depuis Supabase...\n');
  
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('jira_issue_key')
    .eq('ticket_type', 'ASSISTANCE');
  
  if (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
  
  const supabaseKeys = new Set(
    tickets.map(t => t.jira_issue_key).filter(Boolean)
  );
  
  const alreadyInSupabase = [...csvKeys].filter(k => supabaseKeys.has(k)).length;
  const newTickets = csvKeys.size - alreadyInSupabase;
  
  console.log('📊 Résultats:\n');
  console.log(`   📄 CSV: ${csvKeys.size} tickets`);
  console.log(`   🗄️  Supabase: ${supabaseKeys.size} tickets`);
  console.log(`   ✅ Déjà dans Supabase: ${alreadyInSupabase} tickets`);
  console.log(`   🆕 Nouveaux à ajouter: ${newTickets} tickets`);
  console.log(`\n📈 Total après ajout: ${supabaseKeys.size + newTickets} tickets`);
}

compare().catch(console.error);












