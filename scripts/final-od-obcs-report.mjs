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

function generateFinalReport() {
  console.log('📥 Génération du rapport final...\n');
  
  // Lire le fichier de correspondance
  const csv = readFileSync('docs/ticket/correspondance - Jira (3).csv', 'utf-8');
  const lines = csv.split('\n').filter(l => l.trim());
  
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
  
  // Tickets OD- dans Supabase (depuis la requête SQL)
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
  
  const odInSupabaseSet = new Set(odInSupabase);
  
  // Extraire tous les OBCS- correspondants
  const allOBCSFromFile = new Set();
  for (const obcs of correspondances.values()) {
    allOBCSFromFile.add(obcs);
  }
  
  // Générer le rapport
  const report = {
    fichier_correspondance: {
      total_od: correspondances.size,
      total_obcs_uniques: allOBCSFromFile.size
    },
    supabase: {
      total_od: odInSupabase.length,
      od_avec_correspondance: 0,
      od_sans_correspondance: []
    },
    tickets_od_du_fichier_non_dans_supabase: [],
    obcs_correspondants_a_verifier: Array.from(allOBCSFromFile).sort()
  };
  
  // Analyser les OD- dans Supabase
  for (const od of odInSupabaseSet) {
    if (correspondances.has(od)) {
      report.supabase.od_avec_correspondance++;
    } else {
      report.supabase.od_sans_correspondance.push(od);
    }
  }
  
  // Analyser les OD- du fichier non dans Supabase
  for (const [od, obcs] of correspondances) {
    if (!odInSupabaseSet.has(od)) {
      report.tickets_od_du_fichier_non_dans_supabase.push({
        od_key: od,
        obcs_key: obcs
      });
    }
  }
  
  // Afficher le rapport
  console.log('📊 RAPPORT FINAL - CORRESPONDANCE OD- → OBCS-\n');
  console.log('═'.repeat(80));
  console.log('\n📈 RÉSUMÉ GÉNÉRAL:\n');
  console.log(`   Fichier de correspondance:`);
  console.log(`      - Total correspondances OD- → OBCS-: ${correspondances.size}`);
  console.log(`      - OBCS- correspondants uniques: ${allOBCSFromFile.size}`);
  console.log(`\n   Tickets dans Supabase:`);
  console.log(`      - Total tickets OD-: ${odInSupabase.length}`);
  console.log(`      - OD- avec correspondance dans le fichier: ${report.supabase.od_avec_correspondance}`);
  console.log(`      - OD- sans correspondance: ${report.supabase.od_sans_correspondance.length}`);
  console.log(`\n   Tickets OD- du fichier:`);
  console.log(`      - OD- non présents dans Supabase: ${report.tickets_od_du_fichier_non_dans_supabase.length}`);
  console.log(`      - OBCS- correspondants à vérifier: ${report.obcs_correspondants_a_verifier.length}`);
  
  console.log('\n⚠️  CONCLUSION:\n');
  if (report.supabase.od_avec_correspondance === 0) {
    console.log('   Les tickets OD- dans Supabase sont DIFFÉRENTS de ceux du fichier de correspondance.');
    console.log('   Les tickets OD- du fichier ont probablement été convertis en OBCS-.');
    console.log(`   Il faut vérifier si les ${report.obcs_correspondants_a_verifier.length} OBCS- correspondants sont dans Supabase.`);
  }
  
  // Sauvegarder le rapport
  const reportPath = 'rapport-od-obcs-correspondance.json';
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n💾 Rapport JSON sauvegardé: ${reportPath}`);
  
  // Générer CSV des OBCS- à vérifier
  const obcsCsvLines = ['OBCS Key'];
  report.obcs_correspondants_a_verifier.forEach(obcs => {
    obcsCsvLines.push(obcs);
  });
  const obcsCsvPath = 'obcs-correspondants-a-verifier.csv';
  writeFileSync(obcsCsvPath, obcsCsvLines.join('\n'), 'utf-8');
  console.log(`💾 CSV des OBCS- à vérifier: ${obcsCsvPath}`);
  
  // Générer CSV des OD- du fichier non dans Supabase
  const odCsvLines = ['OD Key,OBCS Key'];
  report.tickets_od_du_fichier_non_dans_supabase.slice(0, 100).forEach(({ od_key, obcs_key }) => {
    odCsvLines.push(`${od_key},${obcs_key}`);
  });
  const odCsvPath = 'od-du-fichier-non-dans-supabase.csv';
  writeFileSync(odCsvPath, odCsvLines.join('\n'), 'utf-8');
  console.log(`💾 CSV des OD- du fichier non dans Supabase (100 premiers): ${odCsvPath}`);
  
  console.log('\n' + '═'.repeat(80));
}

generateFinalReport();






