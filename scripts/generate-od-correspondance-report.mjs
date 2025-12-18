import { readFileSync, writeFileSync } from 'fs';

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

// Liste des tickets OD- dans Supabase (depuis la requête SQL précédente)
const odInSupabase = [
  'OD-1174', 'OD-1239', 'OD-1240', 'OD-1241', 'OD-1242', 'OD-1243', 'OD-1244',
  'OD-1524', 'OD-1588', 'OD-2212', 'OD-2213', 'OD-2214', 'OD-446', 'OD-447',
  'OD-546', 'OD-547', 'OD-548', 'OD-549', 'OD-550', 'OD-551', 'OD-552',
  'OD-553', 'OD-554', 'OD-555', 'OD-556', 'OD-557', 'OD-558', 'OD-559',
  'OD-560', 'OD-561', 'OD-562', 'OD-563', 'OD-564', 'OD-565', 'OD-566',
  'OD-567', 'OD-568', 'OD-569', 'OD-570', 'OD-571', 'OD-572', 'OD-573',
  'OD-576', 'OD-577', 'OD-628', 'OD-629', 'OD-630', 'OD-631', 'OD-632',
  'OD-633', 'OD-634', 'OD-635', 'OD-636', 'OD-637', 'OD-638', 'OD-639',
  'OD-640', 'OD-641', 'OD-644', 'OD-645', 'OD-646', 'OD-647', 'OD-648',
  'OD-649', 'OD-650', 'OD-651', 'OD-652', 'OD-653', 'OD-654', 'OD-655',
  'OD-656', 'OD-660', 'OD-661', 'OD-662', 'OD-663', 'OD-685', 'OD-686',
  'OD-687', 'OD-688', 'OD-689', 'OD-690', 'OD-738', 'OD-739', 'OD-740',
  'OD-741', 'OD-742', 'OD-743', 'OD-744', 'OD-749', 'OD-752', 'OD-754',
  'OD-755', 'OD-756', 'OD-846', 'OD-859', 'OD-861', 'OD-886', 'OD-888'
];

function generateReport() {
  console.log('📥 Analyse du fichier de correspondance...\n');
  
  const csv = readFileSync('docs/ticket/correspondance - Jira (3).csv', 'utf-8');
  const lines = csv.split('\n').filter(l => l.trim());
  
  // Extraire les correspondances
  const correspondances = new Map();
  
  for (let i = 1; i < lines.length; i++) {
    const parts = parseCSVLine(lines[i]);
    if (parts.length >= 3) {
      const od = parts[1]?.trim();
      const obcs = parts[2]?.trim();
      
      if (od && od.startsWith('OD-') && obcs && obcs.startsWith('OBCS-')) {
        correspondances.set(od, obcs);
      }
    }
  }
  
  console.log(`📊 Total correspondances dans le fichier: ${correspondances.size}\n`);
  
  // Analyser les OD- dans Supabase
  const odInSupabaseSet = new Set(odInSupabase);
  
  const report = {
    od_in_supabase_with_correspondance: [],
    od_in_supabase_without_correspondance: [],
    od_not_in_supabase_with_correspondance: []
  };
  
  // Analyser les OD- dans Supabase
  for (const od of odInSupabaseSet) {
    const obcs = correspondances.get(od);
    if (obcs) {
      report.od_in_supabase_with_correspondance.push({
        od_key: od,
        obcs_key: obcs
      });
    } else {
      report.od_in_supabase_without_correspondance.push({
        od_key: od
      });
    }
  }
  
  // Analyser les OD- du fichier non présents dans Supabase
  for (const [od, obcs] of correspondances) {
    if (!odInSupabaseSet.has(od)) {
      report.od_not_in_supabase_with_correspondance.push({
        od_key: od,
        obcs_key: obcs
      });
    }
  }
  
  // Générer le rapport
  console.log('📊 RAPPORT DE CORRESPONDANCE OD- → OBCS-\n');
  console.log('═'.repeat(80));
  console.log('\n📈 RÉSUMÉ:\n');
  console.log(`   Total correspondances dans le fichier: ${correspondances.size}`);
  console.log(`   OD- dans Supabase: ${odInSupabaseSet.size}`);
  console.log(`   ✅ OD- dans Supabase avec correspondance: ${report.od_in_supabase_with_correspondance.length}`);
  console.log(`   ⚠️  OD- dans Supabase sans correspondance: ${report.od_in_supabase_without_correspondance.length}`);
  console.log(`   📋 OD- du fichier non présents dans Supabase: ${report.od_not_in_supabase_with_correspondance.length}`);
  
  if (report.od_in_supabase_with_correspondance.length > 0) {
    console.log('\n✅ TICKETS OD- DANS SUPABASE AVEC CORRESPONDANCE OBCS-:\n');
    report.od_in_supabase_with_correspondance.slice(0, 30).forEach(({ od_key, obcs_key }) => {
      console.log(`   ${od_key} → ${obcs_key}`);
    });
    if (report.od_in_supabase_with_correspondance.length > 30) {
      console.log(`   ... et ${report.od_in_supabase_with_correspondance.length - 30} autres`);
    }
  }
  
  if (report.od_in_supabase_without_correspondance.length > 0) {
    console.log('\n⚠️  TICKETS OD- DANS SUPABASE SANS CORRESPONDANCE:\n');
    report.od_in_supabase_without_correspondance.slice(0, 20).forEach(({ od_key }) => {
      console.log(`   ${od_key}`);
    });
    if (report.od_in_supabase_without_correspondance.length > 20) {
      console.log(`   ... et ${report.od_in_supabase_without_correspondance.length - 20} autres`);
    }
  }
  
  // Sauvegarder le rapport
  const reportPath = 'od-correspondance-supabase-report.json';
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n💾 Rapport JSON sauvegardé: ${reportPath}`);
  
  // Générer CSV des OD- avec correspondance
  if (report.od_in_supabase_with_correspondance.length > 0) {
    const csvLines = ['OD Key,OBCS Key'];
    report.od_in_supabase_with_correspondance.forEach(({ od_key, obcs_key }) => {
      csvLines.push(`${od_key},${obcs_key}`);
    });
    const csvPath = 'od-in-supabase-with-obcs.csv';
    writeFileSync(csvPath, csvLines.join('\n'), 'utf-8');
    console.log(`💾 CSV des OD- avec correspondance: ${csvPath}`);
  }
  
  // Générer CSV des OBCS- correspondants à vérifier
  const obcsToCheck = new Set();
  report.od_in_supabase_with_correspondance.forEach(({ obcs_key }) => {
    obcsToCheck.add(obcs_key);
  });
  
  const obcsCsvLines = ['OBCS Key'];
  Array.from(obcsToCheck).sort().forEach(obcs => {
    obcsCsvLines.push(obcs);
  });
  const obcsCsvPath = 'obcs-to-check-in-supabase.csv';
  writeFileSync(obcsCsvPath, obcsCsvLines.join('\n'), 'utf-8');
  console.log(`💾 CSV des OBCS- à vérifier dans Supabase: ${obcsCsvPath}`);
  console.log(`   (${obcsToCheck.size} OBCS- uniques à vérifier)`);
  
  console.log('\n' + '═'.repeat(80));
}

generateReport();












