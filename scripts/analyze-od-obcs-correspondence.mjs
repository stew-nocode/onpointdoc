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

async function analyzeCorrespondence() {
  console.log('📥 Lecture du fichier de correspondance...\n');
  
  const csv = readFileSync('docs/ticket/correspondance - Jira (3).csv', 'utf-8');
  const lines = csv.split('\n').filter(l => l.trim());
  const headers = parseCSVLine(lines[0]);
  
  console.log('📋 Headers:', headers);
  
  // Extraire les correspondances OD- → OBCS-
  const correspondances = new Map();
  const odWithoutOBCS = [];
  
  for (let i = 1; i < lines.length; i++) {
    const parts = parseCSVLine(lines[i]);
    if (parts.length >= 3) {
      const od = parts[1]?.trim();
      const obcs = parts[2]?.trim();
      
      if (od && od.startsWith('OD-')) {
        if (obcs && obcs.startsWith('OBCS-')) {
          correspondances.set(od, obcs);
        } else {
          odWithoutOBCS.push(od);
        }
      }
    }
  }
  
  console.log(`\n📊 Statistiques du fichier de correspondance:`);
  console.log(`   Total lignes: ${lines.length - 1}`);
  console.log(`   OD- avec correspondance OBCS-: ${correspondances.size}`);
  console.log(`   OD- sans correspondance OBCS-: ${odWithoutOBCS.length}`);
  
  console.log(`\n📥 Récupération des tickets depuis Supabase...\n`);
  
  // Récupérer tous les tickets d'assistance
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('jira_issue_key, title, ticket_type')
    .eq('ticket_type', 'ASSISTANCE');
  
  if (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
  
  const supabaseOBCS = new Set();
  const supabaseOD = new Set();
  
  tickets.forEach(t => {
    const key = t.jira_issue_key;
    if (!key) return;
    
    if (key.startsWith('OBCS-')) {
      supabaseOBCS.add(key);
    } else if (key.startsWith('OD-')) {
      supabaseOD.add(key);
    }
  });
  
  console.log(`📊 Tickets dans Supabase:`);
  console.log(`   OBCS-: ${supabaseOBCS.size}`);
  console.log(`   OD-: ${supabaseOD.size}`);
  
  // Vérifier les correspondances
  const odInSupabase = [...supabaseOD];
  const odWithCorrespondance = [];
  const odWithoutCorrespondanceInSupabase = [];
  const obcsFromOD = new Set();
  
  for (const odKey of odInSupabase) {
    const obcsKey = correspondances.get(odKey);
    if (obcsKey) {
      odWithCorrespondance.push({ od: odKey, obcs: obcsKey });
      obcsFromOD.add(obcsKey);
    } else {
      odWithoutCorrespondanceInSupabase.push(odKey);
    }
  }
  
  console.log(`\n🔍 Analyse des correspondances:`);
  console.log(`   OD- dans Supabase avec correspondance OBCS-: ${odWithCorrespondance.length}`);
  console.log(`   OD- dans Supabase sans correspondance: ${odWithoutCorrespondanceInSupabase.length}`);
  
  // Vérifier si les OBCS- correspondants sont dans Supabase
  const obcsInSupabase = [];
  const obcsNotInSupabase = [];
  
  for (const obcsKey of obcsFromOD) {
    if (supabaseOBCS.has(obcsKey)) {
      obcsInSupabase.push(obcsKey);
    } else {
      obcsNotInSupabase.push(obcsKey);
    }
  }
  
  console.log(`\n📋 OBCS- correspondants aux OD-:`);
  console.log(`   OBCS- présents dans Supabase: ${obcsInSupabase.length}`);
  console.log(`   OBCS- absents de Supabase: ${obcsNotInSupabase.length}`);
  
  if (odWithCorrespondance.length > 0) {
    console.log(`\n✅ Exemples de correspondances trouvées:`);
    odWithCorrespondance.slice(0, 10).forEach(({ od, obcs }) => {
      const inSupabase = supabaseOBCS.has(obcs) ? '✅' : '❌';
      console.log(`   ${od} → ${obcs} ${inSupabase}`);
    });
  }
  
  if (obcsNotInSupabase.length > 0) {
    console.log(`\n⚠️  OBCS- correspondants absents de Supabase (échantillon):`);
    obcsNotInSupabase.slice(0, 20).forEach(obcs => {
      console.log(`   - ${obcs}`);
    });
  }
  
  if (odWithoutCorrespondanceInSupabase.length > 0) {
    console.log(`\n⚠️  OD- dans Supabase sans correspondance dans le fichier (échantillon):`);
    odWithoutCorrespondanceInSupabase.slice(0, 20).forEach(od => {
      console.log(`   - ${od}`);
    });
  }
  
  console.log(`\n📊 Résumé final:`);
  console.log(`   Total correspondances dans le fichier: ${correspondances.size}`);
  console.log(`   OD- dans Supabase avec correspondance: ${odWithCorrespondance.length}`);
  console.log(`   OBCS- correspondants présents dans Supabase: ${obcsInSupabase.length}`);
  console.log(`   OBCS- correspondants absents de Supabase: ${obcsNotInSupabase.length}`);
}

analyzeCorrespondence().catch(console.error);












