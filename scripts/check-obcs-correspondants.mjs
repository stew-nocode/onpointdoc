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

// Extraire tous les OBCS- correspondants
const allOBCS = Array.from(new Set(correspondances.values())).sort();

// Générer un rapport des tickets OD- qui devraient avoir une correspondance
const report = {
  total_correspondances: correspondances.size,
  total_obcs_uniques: allOBCS.length,
  correspondances: []
};

// Trier les correspondances par OD- (plus récent en premier)
const sortedCorrespondances = Array.from(correspondances.entries())
  .sort((a, b) => {
    const numA = parseInt(a[0].replace('OD-', ''));
    const numB = parseInt(b[0].replace('OD-', ''));
    return numB - numA;
  });

for (const [od, obcs] of sortedCorrespondances) {
  report.correspondances.push({
    od_key: od,
    obcs_key: obcs
  });
}

// Sauvegarder le rapport JSON
writeFileSync('rapport-tickets-od-avec-correspondance.json', JSON.stringify(report, null, 2), 'utf-8');

// Générer un CSV détaillé
const csvLines = ['OD Key,OBCS Key'];
sortedCorrespondances.forEach(([od, obcs]) => {
  csvLines.push(`${od},${obcs}`);
});
writeFileSync('tickets-od-avec-correspondance-obcs.csv', csvLines.join('\n'), 'utf-8');

// Afficher le rapport
console.log('📊 RAPPORT DES TICKETS OD- AVEC CORRESPONDANCE OBCS-\n');
console.log('═'.repeat(80));
console.log('\n📈 RÉSUMÉ:\n');
console.log(`   Total correspondances OD- → OBCS-: ${correspondances.size}`);
console.log(`   OBCS- correspondants uniques: ${allOBCS.length}`);
console.log(`\n📋 ÉCHANTILLON (30 premières correspondances):\n`);
sortedCorrespondances.slice(0, 30).forEach(([od, obcs]) => {
  console.log(`   ${od} → ${obcs}`);
});
if (sortedCorrespondances.length > 30) {
  console.log(`   ... et ${sortedCorrespondances.length - 30} autres`);
}
console.log(`\n💾 Fichiers générés:`);
console.log(`   - rapport-tickets-od-avec-correspondance.json`);
console.log(`   - tickets-od-avec-correspondance-obcs.csv`);
console.log(`\n⚠️  NOTE IMPORTANTE:`);
console.log(`   Ces tickets OD- du fichier de correspondance ne sont PAS dans Supabase.`);
console.log(`   Ils ont probablement été convertis en OBCS- dans JIRA.`);
console.log(`   Il faut vérifier si les ${allOBCS.length} OBCS- correspondants sont dans Supabase.`);
console.log('\n' + '═'.repeat(80));












