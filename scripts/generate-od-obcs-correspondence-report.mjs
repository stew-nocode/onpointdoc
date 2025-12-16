import 'dotenv/config';
import { readFileSync, writeFileSync } from 'fs';
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

async function generateReport() {
  console.log('📥 Lecture du fichier de correspondance...\n');
  
  const csv = readFileSync('docs/ticket/correspondance - Jira (3).csv', 'utf-8');
  const lines = csv.split('\n').filter(l => l.trim());
  
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
  
  console.log(`📊 Fichier de correspondance:`);
  console.log(`   Total correspondances OD- → OBCS-: ${correspondances.size}`);
  console.log(`   OD- sans correspondance: ${odWithoutOBCS.length}\n`);
  
  console.log('📥 Récupération des tickets depuis Supabase...\n');
  
  // Récupérer tous les tickets d'assistance
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('jira_issue_key, title, created_at, status, ticket_type')
    .eq('ticket_type', 'ASSISTANCE');
  
  if (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
  
  const ticketsMap = new Map();
  tickets.forEach(t => {
    if (t.jira_issue_key) {
      ticketsMap.set(t.jira_issue_key, t);
    }
  });
  
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
  console.log(`   OD-: ${supabaseOD.size}\n`);
  
  // Analyser les correspondances
  const report = {
    total_correspondances: correspondances.size,
    od_in_supabase_with_correspondance: [],
    od_in_supabase_without_correspondance: [],
    od_not_in_supabase_with_correspondance: [],
    obcs_correspondants_in_supabase: [],
    obcs_correspondants_not_in_supabase: [],
    od_with_obcs_missing: []
  };
  
  // Analyser les OD- dans Supabase
  for (const odKey of supabaseOD) {
    const obcsKey = correspondances.get(odKey);
    const odTicket = ticketsMap.get(odKey);
    
    if (obcsKey) {
      const obcsTicket = ticketsMap.get(obcsKey);
      const hasOBCS = supabaseOBCS.has(obcsKey);
      
      report.od_in_supabase_with_correspondance.push({
        od_key: odKey,
        od_title: odTicket?.title || 'N/A',
        od_created_at: odTicket?.created_at || 'N/A',
        obcs_key: obcsKey,
        obcs_in_supabase: hasOBCS,
        obcs_title: obcsTicket?.title || 'N/A',
        obcs_created_at: obcsTicket?.created_at || 'N/A'
      });
      
      if (hasOBCS) {
        report.obcs_correspondants_in_supabase.push({
          od_key: odKey,
          obcs_key: obcsKey,
          obcs_title: obcsTicket?.title || 'N/A'
        });
      } else {
        report.obcs_correspondants_not_in_supabase.push({
          od_key: odKey,
          obcs_key: obcsKey
        });
        report.od_with_obcs_missing.push({
          od_key: odKey,
          od_title: odTicket?.title || 'N/A',
          obcs_key: obcsKey
        });
      }
    } else {
      report.od_in_supabase_without_correspondance.push({
        od_key: odKey,
        od_title: odTicket?.title || 'N/A',
        od_created_at: odTicket?.created_at || 'N/A'
      });
    }
  }
  
  // Analyser les OD- du fichier qui ne sont pas dans Supabase
  for (const [odKey, obcsKey] of correspondances) {
    if (!supabaseOD.has(odKey)) {
      const hasOBCS = supabaseOBCS.has(obcsKey);
      report.od_not_in_supabase_with_correspondance.push({
        od_key: odKey,
        obcs_key: obcsKey,
        obcs_in_supabase: hasOBCS
      });
    }
  }
  
  // Générer le rapport
  console.log('📊 RAPPORT DE CORRESPONDANCE OD- → OBCS-\n');
  console.log('═'.repeat(80));
  console.log('\n📈 RÉSUMÉ:\n');
  console.log(`   Total correspondances dans le fichier: ${report.total_correspondances}`);
  console.log(`   OD- dans Supabase avec correspondance: ${report.od_in_supabase_with_correspondance.length}`);
  console.log(`   OD- dans Supabase sans correspondance: ${report.od_in_supabase_without_correspondance.length}`);
  console.log(`   OD- du fichier non présents dans Supabase: ${report.od_not_in_supabase_with_correspondance.length}`);
  console.log(`   OBCS- correspondants présents dans Supabase: ${report.obcs_correspondants_in_supabase.length}`);
  console.log(`   OBCS- correspondants absents de Supabase: ${report.obcs_correspondants_not_in_supabase.length}`);
  console.log(`   ⚠️  OD- avec OBCS- manquant: ${report.od_with_obcs_missing.length}`);
  
  if (report.od_with_obcs_missing.length > 0) {
    console.log('\n⚠️  TICKETS OD- AVEC CORRESPONDANCE OBCS- MANQUANTE:\n');
    report.od_with_obcs_missing.slice(0, 30).forEach(({ od_key, od_title, obcs_key }) => {
      console.log(`   ${od_key} → ${obcs_key} (manquant)`);
      console.log(`      Titre: ${od_title.substring(0, 60)}...`);
    });
    if (report.od_with_obcs_missing.length > 30) {
      console.log(`   ... et ${report.od_with_obcs_missing.length - 30} autres`);
    }
  }
  
  if (report.od_in_supabase_with_correspondance.length > 0) {
    console.log('\n✅ TICKETS OD- AVEC CORRESPONDANCE OBCS- PRÉSENTE:\n');
    report.od_in_supabase_with_correspondance
      .filter(item => item.obcs_in_supabase)
      .slice(0, 10)
      .forEach(({ od_key, obcs_key }) => {
        console.log(`   ${od_key} → ${obcs_key} ✅`);
      });
  }
  
  // Sauvegarder le rapport JSON
  const reportPath = 'od-obcs-correspondence-report.json';
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n💾 Rapport JSON sauvegardé: ${reportPath}`);
  
  // Sauvegarder un rapport CSV pour les tickets OD- avec OBCS- manquant
  if (report.od_with_obcs_missing.length > 0) {
    const csvLines = ['OD Key,OD Title,OBCS Key'];
    report.od_with_obcs_missing.forEach(({ od_key, od_title, obcs_key }) => {
      const title = (od_title || '').replace(/"/g, '""');
      csvLines.push(`"${od_key}","${title}","${obcs_key}"`);
    });
    const csvPath = 'od-with-missing-obcs.csv';
    writeFileSync(csvPath, csvLines.join('\n'), 'utf-8');
    console.log(`💾 CSV des tickets OD- avec OBCS- manquant: ${csvPath}`);
  }
  
  console.log('\n' + '═'.repeat(80));
}

generateReport().catch(console.error);






