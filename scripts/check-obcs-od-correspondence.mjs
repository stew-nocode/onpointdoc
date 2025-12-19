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

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function checkCorrespondence() {
  console.log('📥 Lecture du CSV...\n');
  
  const csv = readFileSync('temp_jira_export.csv', 'utf-8');
  const lines = csv.split('\n').filter(l => l.trim());
  const headers = parseCSVLine(lines[0]);
  
  // Trouver l'index de la colonne JIRA key
  const jiraKeyIndex = headers.findIndex(h => 
    h.includes('Clé') || h.includes('Key') || h.toLowerCase().includes('jira')
  );
  
  if (jiraKeyIndex === -1) {
    console.error('❌ Colonne JIRA key non trouvée');
    process.exit(1);
  }
  
  // Extraire toutes les clés OBCS- du CSV
  const csvOBCSKeys = new Set();
  for (let i = 1; i < lines.length; i++) {
    const parts = parseCSVLine(lines[i]);
    const key = parts[jiraKeyIndex]?.trim() || '';
    if (key.startsWith('OBCS-')) {
      csvOBCSKeys.add(key);
    }
  }
  
  console.log(`📊 CSV: ${csvOBCSKeys.size} tickets OBCS-\n`);
  
  console.log('📥 Récupération des tickets depuis Supabase...\n');
  
  // Récupérer tous les tickets d'assistance
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('jira_issue_key, title, created_at')
    .eq('ticket_type', 'ASSISTANCE');
  
  if (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
  
  const supabaseOBCSKeys = new Set();
  const supabaseODKeys = new Set();
  const supabaseOtherKeys = new Set();
  
  tickets.forEach(t => {
    const key = t.jira_issue_key;
    if (!key) return;
    
    if (key.startsWith('OBCS-')) {
      supabaseOBCSKeys.add(key);
    } else if (key.startsWith('OD-')) {
      supabaseODKeys.add(key);
    } else {
      supabaseOtherKeys.add(key);
    }
  });
  
  console.log('📊 Statistiques Supabase:\n');
  console.log(`   OBCS-: ${supabaseOBCSKeys.size} tickets`);
  console.log(`   OD-: ${supabaseODKeys.size} tickets`);
  console.log(`   Autres: ${supabaseOtherKeys.size} tickets`);
  console.log(`   Total: ${tickets.length} tickets\n`);
  
  // Trouver les OBCS- du CSV qui ne sont pas dans Supabase
  const obcsInCSVNotInSupabase = [...csvOBCSKeys].filter(k => !supabaseOBCSKeys.has(k));
  
  console.log(`🔍 Analyse de correspondance:\n`);
  console.log(`   OBCS- dans CSV mais pas dans Supabase: ${obcsInCSVNotInSupabase.length}`);
  
  // Vérifier si certains OBCS- ont été convertis en OD-
  // On cherche des patterns comme OBCS-12345 -> OD-12345 ou similaire
  const potentialConversions = [];
  
  for (const obcsKey of obcsInCSVNotInSupabase.slice(0, 100)) { // Limiter pour performance
    const obcsNumber = obcsKey.replace('OBCS-', '');
    // Chercher des patterns possibles: OD-XXXXX, OD-OBCS-XXXXX, etc.
    const possibleODKeys = [
      `OD-${obcsNumber}`,
      `OD-OBCS-${obcsNumber}`,
      `OD-${obcsKey}`
    ];
    
    for (const possibleOD of possibleODKeys) {
      if (supabaseODKeys.has(possibleOD)) {
        potentialConversions.push({ obcs: obcsKey, od: possibleOD });
        break;
    }
    }
  }
  
  if (potentialConversions.length > 0) {
    console.log(`\n⚠️  Conversions potentielles trouvées: ${potentialConversions.length}`);
    console.log('\n   Exemples:');
    potentialConversions.slice(0, 10).forEach(({ obcs, od }) => {
      console.log(`      ${obcs} -> ${od}`);
    });
  } else {
    console.log(`\n✅ Aucune conversion OBCS- -> OD- détectée dans l'échantillon`);
  }
  
  // Vérifier les tickets OD- qui pourraient correspondre à des OBCS- du CSV
  if (supabaseODKeys.size > 0) {
    console.log(`\n📋 Échantillon de tickets OD- dans Supabase:`);
    const odTickets = tickets.filter(t => t.jira_issue_key?.startsWith('OD-')).slice(0, 5);
    odTickets.forEach(t => {
      console.log(`   ${t.jira_issue_key}: ${t.title?.substring(0, 50)}...`);
    });
  }
  
  // Résumé final
  console.log(`\n📊 Résumé:\n`);
  console.log(`   OBCS- dans CSV: ${csvOBCSKeys.size}`);
  console.log(`   OBCS- dans Supabase: ${supabaseOBCSKeys.size}`);
  console.log(`   OD- dans Supabase: ${supabaseODKeys.size}`);
  console.log(`   OBCS- manquants (dans CSV mais pas Supabase): ${obcsInCSVNotInSupabase.length}`);
  
  if (obcsInCSVNotInSupabase.length > 0) {
    console.log(`\n⚠️  Premiers OBCS- manquants:`);
    obcsInCSVNotInSupabase.slice(0, 20).forEach(key => {
      console.log(`   - ${key}`);
    });
  }
}

checkCorrespondence().catch(console.error);












