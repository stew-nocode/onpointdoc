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

function analyzeCorrespondanceFile() {
  console.log('📥 Lecture du fichier de correspondance...\n');
  
  const csv = readFileSync('docs/ticket/correspondance - Jira (3).csv', 'utf-8');
  const lines = csv.split('\n').filter(l => l.trim());
  
  // Extraire les correspondances OD- → OBCS-
  const correspondances = new Map();
  const odWithoutOBCS = [];
  const allOD = new Set();
  
  for (let i = 1; i < lines.length; i++) {
    const parts = parseCSVLine(lines[i]);
    if (parts.length >= 3) {
      const od = parts[1]?.trim();
      const obcs = parts[2]?.trim();
      
      if (od && od.startsWith('OD-')) {
        allOD.add(od);
        if (obcs && obcs.startsWith('OBCS-')) {
          correspondances.set(od, obcs);
        } else {
          odWithoutOBCS.push(od);
        }
      }
    }
  }
  
  console.log('📊 STATISTIQUES DU FICHIER DE CORRESPONDANCE:\n');
  console.log(`   Total lignes: ${lines.length - 1}`);
  console.log(`   Total tickets OD-: ${allOD.size}`);
  console.log(`   OD- avec correspondance OBCS-: ${correspondances.size}`);
  console.log(`   OD- sans correspondance OBCS-: ${odWithoutOBCS.length}`);
  
  // Extraire les OBCS- correspondants
  const obcsFromOD = new Set();
  for (const obcs of correspondances.values()) {
    obcsFromOD.add(obcs);
  }
  
  console.log(`   OBCS- correspondants uniques: ${obcsFromOD.size}`);
  
  // Générer le rapport
  const report = {
    total_od_in_file: allOD.size,
    total_correspondances: correspondances.size,
    od_with_correspondance: [],
    od_without_correspondance: odWithoutOBCS,
    obcs_correspondants: Array.from(obcsFromOD).sort()
  };
  
  // Trier les correspondances
  const sortedCorrespondances = Array.from(correspondances.entries())
    .sort((a, b) => {
      const numA = parseInt(a[0].replace('OD-', ''));
      const numB = parseInt(b[0].replace('OD-', ''));
      return numB - numA; // Plus récent en premier
    });
  
  for (const [od, obcs] of sortedCorrespondances) {
    report.od_with_correspondance.push({
      od_key: od,
      obcs_key: obcs
    });
  }
  
  // Sauvegarder le rapport JSON
  const reportPath = 'od-obcs-correspondance-report.json';
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n💾 Rapport JSON sauvegardé: ${reportPath}`);
  
  // Générer un CSV des correspondances
  const csvLines = ['OD Key,OBCS Key'];
  for (const [od, obcs] of sortedCorrespondances) {
    csvLines.push(`${od},${obcs}`);
  }
  const csvPath = 'od-obcs-correspondances.csv';
  writeFileSync(csvPath, csvLines.join('\n'), 'utf-8');
  console.log(`💾 CSV des correspondances sauvegardé: ${csvPath}`);
  
  // Afficher un échantillon
  console.log('\n📋 ÉCHANTILLON DES CORRESPONDANCES (20 premières):\n');
  sortedCorrespondances.slice(0, 20).forEach(([od, obcs]) => {
    console.log(`   ${od} → ${obcs}`);
  });
  
  if (sortedCorrespondances.length > 20) {
    console.log(`   ... et ${sortedCorrespondances.length - 20} autres`);
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 RÉSUMÉ:');
  console.log(`   ✅ ${correspondances.size} tickets OD- ont une correspondance OBCS-`);
  console.log(`   ⚠️  ${odWithoutOBCS.length} tickets OD- n'ont pas de correspondance`);
  console.log(`\n💡 Prochaine étape: Vérifier dans Supabase si ces OBCS- existent`);
}

analyzeCorrespondanceFile();












