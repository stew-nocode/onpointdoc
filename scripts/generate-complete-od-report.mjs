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

// Tickets OD- dans Supabase
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
const allOBCS = Array.from(new Set(correspondances.values()));

// Générer le rapport complet
const report = {
  resume: {
    total_correspondances_fichier: correspondances.size,
    total_obcs_correspondants: allOBCS.length,
    total_od_supabase: odInSupabase.length,
    od_supabase_avec_correspondance: 0,
    od_supabase_sans_correspondance: odInSupabase.length
  },
  tickets_od_du_fichier_avec_correspondance: [],
  tickets_od_supabase_sans_correspondance: odInSupabase
};

// Trier les correspondances
const sortedCorrespondances = Array.from(correspondances.entries())
  .sort((a, b) => {
    const numA = parseInt(a[0].replace('OD-', ''));
    const numB = parseInt(b[0].replace('OD-', ''));
    return numB - numA;
  });

for (const [od, obcs] of sortedCorrespondances) {
  report.tickets_od_du_fichier_avec_correspondance.push({
    od_key: od,
    obcs_key: obcs,
    od_in_supabase: odInSupabaseSet.has(od)
  });
}

// Sauvegarder le rapport
writeFileSync('rapport-complet-od-avec-correspondance.json', JSON.stringify(report, null, 2), 'utf-8');

// Générer CSV des tickets OD- avec correspondance
const csvLines = ['OD Key,OBCS Key,OD dans Supabase'];
sortedCorrespondances.forEach(([od, obcs]) => {
  const inSupabase = odInSupabaseSet.has(od) ? 'OUI' : 'NON';
  csvLines.push(`${od},${obcs},${inSupabase}`);
});
writeFileSync('tickets-od-avec-correspondance-complet.csv', csvLines.join('\n'), 'utf-8');

// Afficher le rapport
console.log('📊 RAPPORT COMPLET - TICKETS OD- AVEC CORRESPONDANCE OBCS-\n');
console.log('═'.repeat(80));
console.log('\n📈 RÉSUMÉ:\n');
console.log(`   Fichier de correspondance:`);
console.log(`      - Total correspondances: ${correspondances.size}`);
console.log(`      - OBCS- correspondants uniques: ${allOBCS.length}`);
console.log(`\n   Tickets OD- dans Supabase:`);
console.log(`      - Total: ${odInSupabase.length}`);
console.log(`      - Avec correspondance dans le fichier: ${report.resume.od_supabase_avec_correspondance}`);
console.log(`      - Sans correspondance: ${report.resume.od_supabase_sans_correspondance}`);
console.log(`\n   Tickets OD- du fichier:`);
console.log(`      - Total avec correspondance: ${sortedCorrespondances.length}`);
console.log(`      - Présents dans Supabase: ${sortedCorrespondances.filter(([od]) => odInSupabaseSet.has(od)).length}`);
console.log(`      - Absents de Supabase: ${sortedCorrespondances.filter(([od]) => !odInSupabaseSet.has(od)).length}`);

console.log('\n📋 ÉCHANTILLON DES CORRESPONDANCES (20 premières):\n');
sortedCorrespondances.slice(0, 20).forEach(([od, obcs]) => {
  const inSupabase = odInSupabaseSet.has(od) ? '✅' : '❌';
  console.log(`   ${od} → ${obcs} ${inSupabase}`);
});

console.log('\n💾 Fichiers générés:');
console.log('   - rapport-complet-od-avec-correspondance.json');
console.log('   - tickets-od-avec-correspondance-complet.csv');
console.log('\n' + '═'.repeat(80));






