#!/usr/bin/env node

/**
 * Script pour comparer les noms des utilisateurs internes avec les utilisateurs externes
 * pour détecter les similitudes/doublons potentiels
 * 
 * Usage: node scripts/compare-internal-external-users.mjs
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Charger .env.local en priorité si présent
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch {
  dotenv.config();
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE ??
  '';

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false }
});

/**
 * Normalise un nom pour la comparaison
 */
function normalizeName(name) {
  if (!name) return '';
  return name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ') // Normaliser les espaces multiples
    .replace(/[^A-Z0-9\s]/g, ''); // Supprimer les caractères spéciaux
}

/**
 * Calcule la similarité entre deux noms (Levenshtein simplifié)
 */
function calculateSimilarity(name1, name2) {
  const normalized1 = normalizeName(name1);
  const normalized2 = normalizeName(name2);
  
  // Si les noms sont identiques après normalisation
  if (normalized1 === normalized2) {
    return 100;
  }
  
  // Si un nom est contenu dans l'autre
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return 90;
  }
  
  // Comparaison par mots (vérifier si les mots principaux correspondent)
  const words1 = normalized1.split(' ').filter(w => w.length > 2);
  const words2 = normalized2.split(' ').filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) {
    return 0;
  }
  
  // Compter les mots en commun
  let commonWords = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2) {
        commonWords++;
        break;
      }
    }
  }
  
  const maxWords = Math.max(words1.length, words2.length);
  return Math.round((commonWords / maxWords) * 100);
}

/**
 * Trouve les correspondances entre utilisateurs internes et externes
 */
function findMatches(internalUsers, externalUsers) {
  const matches = [];
  
  for (const internal of internalUsers) {
    if (!internal.full_name) continue;
    
    for (const external of externalUsers) {
      if (!external.full_name) continue;
      
      const similarity = calculateSimilarity(internal.full_name, external.full_name);
      
      if (similarity >= 80) {
        matches.push({
          similarity,
          internal: {
            id: internal.id,
            name: internal.full_name,
            email: internal.email,
            role: internal.role,
            department: internal.department
          },
          external: {
            id: external.id,
            name: external.full_name,
            email: external.email,
            company_id: external.company_id
          }
        });
      }
    }
  }
  
  // Trier par similarité décroissante
  matches.sort((a, b) => b.similarity - a.similarity);
  
  return matches;
}

async function main() {
  try {
    console.log('═'.repeat(80));
    console.log('🔍 COMPARAISON UTILISATEURS INTERNES vs EXTERNES');
    console.log('═'.repeat(80));
    console.log('');

    // 1. Récupérer les utilisateurs internes
    console.log('📥 Récupération des utilisateurs internes...');
    const { data: internalUsers, error: internalError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, department')
      .neq('role', 'client')
      .not('role', 'is', null)
      .order('full_name', { ascending: true });

    if (internalError) {
      throw new Error(`Erreur lors de la récupération des utilisateurs internes: ${internalError.message}`);
    }

    console.log(`✅ ${internalUsers?.length || 0} utilisateur(s) interne(s) trouvé(s)\n`);

    // 2. Récupérer les utilisateurs externes (clients)
    console.log('📥 Récupération des utilisateurs externes (clients)...');
    const { data: externalUsers, error: externalError } = await supabase
      .from('profiles')
      .select('id, full_name, email, company_id')
      .eq('role', 'client')
      .order('full_name', { ascending: true });

    if (externalError) {
      throw new Error(`Erreur lors de la récupération des utilisateurs externes: ${externalError.message}`);
    }

    console.log(`✅ ${externalUsers?.length || 0} utilisateur(s) externe(s) trouvé(s)\n`);

    // 3. Trouver les correspondances
    console.log('🔍 Recherche des correspondances...\n');
    const matches = findMatches(internalUsers || [], externalUsers || []);

    // 4. Afficher les résultats
    console.log('═'.repeat(80));
    console.log('📊 RÉSULTATS');
    console.log('═'.repeat(80));
    console.log('');

    if (matches.length === 0) {
      console.log('✅ Aucune correspondance trouvée (similarité >= 80%)\n');
    } else {
      console.log(`⚠️  ${matches.length} correspondance(s) trouvée(s):\n`);

      // Grouper par similarité
      const exactMatches = matches.filter(m => m.similarity === 100);
      const highSimilarity = matches.filter(m => m.similarity >= 90 && m.similarity < 100);
      const mediumSimilarity = matches.filter(m => m.similarity >= 80 && m.similarity < 90);

      if (exactMatches.length > 0) {
        console.log(`🔴 Correspondances EXACTES (100%) : ${exactMatches.length}\n`);
        exactMatches.forEach((match, idx) => {
          console.log(`   ${idx + 1}. "${match.internal.name}" ↔ "${match.external.name}"`);
          console.log(`      👤 Interne: ID=${match.internal.id}, Email=${match.internal.email || 'N/A'}, Role=${match.internal.role}`);
          console.log(`      👥 Externe: ID=${match.external.id}, Email=${match.external.email || 'N/A'}, Company=${match.external.company_id || 'N/A'}`);
          console.log('');
        });
      }

      if (highSimilarity.length > 0) {
        console.log(`🟠 Correspondances FORTES (90-99%) : ${highSimilarity.length}\n`);
        highSimilarity.forEach((match, idx) => {
          console.log(`   ${idx + 1}. "${match.internal.name}" ↔ "${match.external.name}" (${match.similarity}%)`);
          console.log(`      👤 Interne: ID=${match.internal.id}, Email=${match.internal.email || 'N/A'}, Role=${match.internal.role}`);
          console.log(`      👥 Externe: ID=${match.external.id}, Email=${match.external.email || 'N/A'}, Company=${match.external.company_id || 'N/A'}`);
          console.log('');
        });
      }

      if (mediumSimilarity.length > 0) {
        console.log(`🟡 Correspondances MOYENNES (80-89%) : ${mediumSimilarity.length}\n`);
        mediumSimilarity.forEach((match, idx) => {
          console.log(`   ${idx + 1}. "${match.internal.name}" ↔ "${match.external.name}" (${match.similarity}%)`);
          console.log(`      👤 Interne: ID=${match.internal.id}, Email=${match.internal.email || 'N/A'}, Role=${match.internal.role}`);
          console.log(`      👥 Externe: ID=${match.external.id}, Email=${match.external.email || 'N/A'}, Company=${match.external.company_id || 'N/A'}`);
          console.log('');
        });
      }

      // Générer un rapport JSON
      const report = {
        date: new Date().toISOString(),
        summary: {
          totalInternal: internalUsers?.length || 0,
          totalExternal: externalUsers?.length || 0,
          totalMatches: matches.length,
          exactMatches: exactMatches.length,
          highSimilarity: highSimilarity.length,
          mediumSimilarity: mediumSimilarity.length
        },
        matches: matches
      };

      const fs = await import('fs');
      const reportPath = path.join(process.cwd(), 'docs', 'analysis', 'rapport-comparaison-internal-external-users.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
      console.log(`💾 Rapport sauvegardé dans: ${reportPath}\n`);
    }

    console.log('═'.repeat(80));
    console.log('✅ Analyse terminée');
    console.log('═'.repeat(80));
    console.log('');

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });







