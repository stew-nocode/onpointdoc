#!/usr/bin/env node

/**
 * Script pour analyser les résumés de tickets et identifier automatiquement
 * les modules appropriés basés sur des mots-clés
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch (error) {
  console.error('⚠️  Impossible de charger .env.local:', error.message);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const GOOGLE_SHEET_ID = '1cwjY3Chw5Y2ce_zzBBHOg3R3n1NntmHpLbuxNU8_WOQ';
const GID = '0';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=${GID}`;

/**
 * Mots-clés pour identifier les modules
 */
const MODULE_KEYWORDS = {
  'Finance': [
    'finance', 'comptabilité', 'comptable', 'compte', 'balance', 'journal',
    'écriture', 'imputation', 'soldes', 'facture', 'facture fournisseur',
    'facture client', 'paiement', 'états financiers', 'charges', 'redevance',
    'bilan', 'compte de résultat', 'comptabilité analytique', 'débours'
  ],
  'RH': [
    'rh', 'ressources humaines', 'congé', 'paie', 'paiement', 'salaire',
    'contrat', 'départ', 'fin de contrat', 'prêt', 'côte d\'ivoire', 'civ',
    'ancienneté', 'médaille', 'frais de mission', 'mission', 'rubrique',
    'types de départ', 'gestion départ', 'paie journalier'
  ],
  'CRM': [
    'crm', 'client', 'prospect', 'opportunité', 'opportunités', 'offre',
    'offres', 'lot', 'programme', 'pilotage commercial', 'activités commerciales',
    'btp', 'extraction crm', 'stabilisation crm'
  ],
  'Opérations': [
    'opération', 'achat', 'expression besoin', 'relance', 'relances',
    'bordereau', 'bordereaux', 'sortie', 'sorties', 'stock', 'article',
    'entité', 'filtre', 'historique', 'journaux', 'stabilisation'
  ],
  'Paramétrage': [
    'paramétrage', 'parametrage', 'société', 'sites', 'chantier', 'magasin',
    'type de site', 'stabilisation', 'alertes', 'tableaux de bord', 'dashboard'
  ],
  'Paiement': [
    'paiement', 'mode de paiement', 'exécution paiement', 'paiements effectués'
  ],
  'Projets': [
    'projet', 'projets'
  ],
  'Global': [
    'dashboard', 'page d\'accueil', 'accueil', 'tableaux de bord', 'général',
    'globale', 'interface', 'erreur', 'server error', 'stabilisation'
  ]
};

/**
 * Normalise une chaîne pour la comparaison
 */
function normalizeString(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .trim();
}

/**
 * Analyse un résumé et identifie le module le plus approprié
 */
function identifyModuleFromResume(resume) {
  if (!resume || resume.trim().length === 0) {
    return null;
  }
  
  const normalizedResume = normalizeString(resume);
  
  // Vérifier si le résumé commence par un chemin de module (ex: "Finance/Comptabilité...")
  const pathMatch = resume.match(/^([^/]+)\//);
  if (pathMatch) {
    const pathModule = pathMatch[1].trim();
    const normalizedPath = normalizeString(pathModule);
    
    // Chercher une correspondance dans les modules disponibles
    for (const [moduleName, keywords] of Object.entries(MODULE_KEYWORDS)) {
      const normalizedModule = normalizeString(moduleName);
      if (normalizedPath === normalizedModule || normalizedPath.includes(normalizedModule)) {
        return moduleName;
      }
    }
  }
  
  // Calculer les scores pour chaque module
  const scores = {};
  
  for (const [moduleName, keywords] of Object.entries(MODULE_KEYWORDS)) {
    let score = 0;
    
    for (const keyword of keywords) {
      const normalizedKeyword = normalizeString(keyword);
      
      // Score plus élevé si le mot-clé apparaît au début du résumé
      if (normalizedResume.startsWith(normalizedKeyword)) {
        score += 10;
      }
      // Score moyen si le mot-clé est dans le résumé
      else if (normalizedResume.includes(normalizedKeyword)) {
        score += 5;
        // Bonus si le mot-clé est un mot complet (pas juste une partie)
        const regex = new RegExp(`\\b${normalizedKeyword}\\b`, 'i');
        if (regex.test(resume)) {
          score += 3;
        }
      }
    }
    
    if (score > 0) {
      scores[moduleName] = score;
    }
  }
  
  // Retourner le module avec le score le plus élevé
  if (Object.keys(scores).length === 0) {
    return null;
  }
  
  const bestModule = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])[0][0];
  
  return bestModule;
}

async function downloadAndParseSheet() {
  console.log('📥 Téléchargement du Google Sheet...');
  const response = await fetch(SHEET_URL);
  
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  let startIndex = 0;
  if (uint8Array.length >= 3 && 
      uint8Array[0] === 0xEF && 
      uint8Array[1] === 0xBB && 
      uint8Array[2] === 0xBF) {
    startIndex = 3;
  }
  
  const csvContent = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true })
    .decode(uint8Array.slice(startIndex));
  
  const rawRecords = parse(csvContent, {
    bom: true,
    skip_empty_lines: false,
    relax_quotes: true,
    relax_column_count: true,
    encoding: 'utf8',
  });
  
  // Trouver les colonnes
  const headers = rawRecords[0];
  const resumeIndex = headers.findIndex(h => {
    const clean = (h || '').toLowerCase().trim();
    return clean.includes('résumé') || clean.includes('resume');
  });
  const moduleIndex = headers.findIndex(h => {
    const clean = (h || '').toLowerCase().trim();
    return clean.includes('module');
  });
  const ticketKeyIndex = headers.findIndex(h => {
    const clean = (h || '').toLowerCase().trim();
    return clean.includes('clé') || clean.includes('ticket');
  });
  
  if (resumeIndex === -1 || moduleIndex === -1) {
    console.error('Headers:', headers);
    throw new Error('Colonnes "Résumé" ou "module" introuvables');
  }
  
  console.log(`✅ Colonnes trouvées: résumé=${resumeIndex}, module=${moduleIndex}, ticket=${ticketKeyIndex !== -1 ? ticketKeyIndex : 'N/A'}\n`);
  
  return {
    records: rawRecords,
    resumeIndex,
    moduleIndex,
    ticketKeyIndex,
  };
}

async function getModulesFromSupabase() {
  const { data: modules, error } = await supabase
    .from('modules')
    .select('id, name')
    .order('name');
  
  if (error) {
    throw new Error(`Erreur lors de la récupération des modules: ${error.message}`);
  }
  
  const moduleMap = new Map();
  modules.forEach(m => {
    moduleMap.set(normalizeString(m.name), {
      id: m.id,
      name: m.name,
    });
  });
  
  return moduleMap;
}

async function updateTicketsInSupabase(results, modulesMap) {
  console.log('\n🔄 Mise à jour des tickets dans Supabase...\n');
  
  const toUpdate = results.filter(r => r.action === 'SET' && r.ticketKey && r.ticketKey.startsWith('OD-'));
  
  if (toUpdate.length === 0) {
    console.log('⚠️  Aucun ticket à mettre à jour (pas de clés OD trouvées)\n');
    return;
  }
  
  const stats = {
    total: toUpdate.length,
    updated: 0,
    notFound: 0,
    errors: 0,
  };
  
  // Traiter par lots de 50
  const BATCH_SIZE = 50;
  const totalBatches = Math.ceil(toUpdate.length / BATCH_SIZE);
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batchStart = batchIndex * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, toUpdate.length);
    const batch = toUpdate.slice(batchStart, batchEnd);
    
    // Récupérer les tickets du lot
    const ticketKeys = batch.map(r => r.ticketKey.toUpperCase());
    
    const { data: tickets, error: fetchError } = await supabase
      .from('tickets')
      .select('id, jira_issue_key, module_id')
      .in('jira_issue_key', ticketKeys);
    
    if (fetchError) {
      console.error(`❌ Erreur lors de la récupération du lot ${batchIndex + 1}:`, fetchError.message);
      stats.errors += batch.length;
      continue;
    }
    
    // Créer un map pour lookup rapide
    const ticketMap = new Map();
    tickets.forEach(t => {
      ticketMap.set(t.jira_issue_key, t);
    });
    
    // Mettre à jour chaque ticket du lot
    for (const result of batch) {
      const ticket = ticketMap.get(result.ticketKey.toUpperCase());
      
      if (!ticket) {
        stats.notFound++;
        continue;
      }
      
      // Trouver le module
      const module = modulesMap.get(normalizeString(result.identifiedModule));
      
      if (!module) {
        console.error(`⚠️  Module "${result.identifiedModule}" introuvable pour ${result.ticketKey}`);
        stats.errors++;
        continue;
      }
      
      // Vérifier si déjà à jour
      if (ticket.module_id === module.id) {
        continue;
      }
      
      // Mettre à jour
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ module_id: module.id })
        .eq('id', ticket.id);
      
      if (updateError) {
        console.error(`❌ Erreur lors de la mise à jour de ${result.ticketKey}:`, updateError.message);
        stats.errors++;
        continue;
      }
      
      stats.updated++;
    }
    
    // Afficher la progression
    const processed = batchEnd;
    const percentage = ((processed / toUpdate.length) * 100).toFixed(1);
    if (batchIndex % 5 === 0 || batchIndex === totalBatches - 1) {
      console.log(`   ✓ Progression: ${processed}/${toUpdate.length} (${percentage}%)`);
    }
    
    // Petite pause entre les lots
    if (batchIndex < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log('\n📊 Résumé de la mise à jour:');
  console.log(`   ✅ Tickets mis à jour: ${stats.updated}`);
  console.log(`   ❌ Tickets non trouvés: ${stats.notFound}`);
  console.log(`   ⚠️  Erreurs: ${stats.errors}\n`);
  
  return stats;
}

async function main() {
  const shouldUpdate = process.argv.includes('--update');
  
  console.log('🔍 ANALYSE DES RÉSUMÉS ET IDENTIFICATION DES MODULES');
  if (shouldUpdate) {
    console.log('   Mode: ANALYSE + MISE À JOUR SUPABASE');
  } else {
    console.log('   Mode: ANALYSE UNIQUEMENT');
  }
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // 1. Télécharger et parser le Google Sheet
    const { records, resumeIndex, moduleIndex, ticketKeyIndex } = await downloadAndParseSheet();
    
    // 2. Récupérer les modules existants dans Supabase
    console.log('📦 Récupération des modules depuis Supabase...');
    const modulesMap = await getModulesFromSupabase();
    console.log(`✅ ${modulesMap.size} modules trouvés\n`);
    
    // 3. Analyser chaque ligne
    const results = [];
    let totalAnalyzed = 0;
    let withModule = 0;
    let withoutModule = 0;
    let identified = 0;
    let alreadyFilled = 0;
    
    console.log('🔍 Analyse des résumés...\n');
    
    for (let i = 1; i < records.length; i++) {
      const row = records[i];
      
      if (!row || row.length <= Math.max(resumeIndex, moduleIndex)) {
        continue;
      }
      
      const resume = (row[resumeIndex] || '').trim();
      const currentModule = (row[moduleIndex] || '').trim();
      const ticketKey = ticketKeyIndex !== -1 ? (row[ticketKeyIndex] || '').trim() : null;
      
      // Ignorer les lignes sans résumé
      if (!resume || resume.length === 0) {
        continue;
      }
      
      totalAnalyzed++;
      
      // Si le module est déjà rempli, on le garde
      if (currentModule && currentModule.length > 0) {
        alreadyFilled++;
        results.push({
          row: i + 1,
          ticketKey: ticketKey || `Ligne ${i + 1}`,
          resume: resume.substring(0, 100) + (resume.length > 100 ? '...' : ''),
          currentModule,
          identifiedModule: currentModule,
          action: 'KEEP',
        });
        continue;
      }
      
      // Analyser le résumé pour identifier le module
      const identifiedModule = identifyModuleFromResume(resume);
      
      if (identifiedModule) {
        identified++;
        results.push({
          row: i + 1,
          ticketKey: ticketKey || `Ligne ${i + 1}`,
          resume: resume.substring(0, 100) + (resume.length > 100 ? '...' : ''),
          currentModule: '',
          identifiedModule,
          action: 'SET',
        });
      } else {
        withoutModule++;
        results.push({
          row: i + 1,
          ticketKey: ticketKey || `Ligne ${i + 1}`,
          resume: resume.substring(0, 100) + (resume.length > 100 ? '...' : ''),
          currentModule: '',
          identifiedModule: null,
          action: 'UNKNOWN',
        });
      }
    }
    
    // 4. Afficher les résultats
    console.log('='.repeat(60));
    console.log('📊 RÉSULTATS DE L\'ANALYSE');
    console.log('='.repeat(60));
    console.log(`Total de tickets analysés: ${totalAnalyzed}`);
    console.log(`✅ Modules déjà remplis: ${alreadyFilled}`);
    console.log(`🔍 Modules identifiés: ${identified}`);
    console.log(`❓ Modules non identifiés: ${withoutModule}\n`);
    
    // Afficher les modules identifiés
    const toSet = results.filter(r => r.action === 'SET');
    if (toSet.length > 0) {
      console.log(`📝 Modules à définir (${toSet.length}):\n`);
      
      // Grouper par module
      const byModule = {};
      toSet.forEach(r => {
        if (!byModule[r.identifiedModule]) {
          byModule[r.identifiedModule] = [];
        }
        byModule[r.identifiedModule].push(r);
      });
      
      for (const [moduleName, items] of Object.entries(byModule)) {
        console.log(`\n  📦 ${moduleName} (${items.length} tickets):`);
        items.slice(0, 5).forEach(item => {
          console.log(`     - ${item.ticketKey}: ${item.resume}`);
        });
        if (items.length > 5) {
          console.log(`     ... et ${items.length - 5} autres`);
        }
      }
      console.log('');
    }
    
    // Afficher les non identifiés
    const unknown = results.filter(r => r.action === 'UNKNOWN');
    if (unknown.length > 0) {
      console.log(`\n❓ Tickets sans module identifié (${unknown.length}):\n`);
      unknown.slice(0, 10).forEach(item => {
        console.log(`   - ${item.ticketKey}: ${item.resume}`);
      });
      if (unknown.length > 10) {
        console.log(`   ... et ${unknown.length - 10} autres`);
      }
      console.log('');
    }
    
    // 5. Sauvegarder les résultats dans un CSV pour revue
    const csvLines = ['Ligne,Ticket,Module Identifié,Action,Résumé'];
    results.forEach(r => {
      const module = r.identifiedModule || '';
      const action = r.action === 'SET' ? 'À définir' : r.action === 'KEEP' ? 'Conserver' : 'Non identifié';
      csvLines.push(`"${r.row}","${r.ticketKey}","${module}","${action}","${(r.resume || '').replace(/"/g, '""')}"`);
    });
    
    fs.writeFileSync(
      'docs/ticket/analyse-modules-identifies.csv',
      csvLines.join('\n'),
      'utf8'
    );
    
    console.log(`💾 Résultats sauvegardés dans: docs/ticket/analyse-modules-identifies.csv\n`);
    
    // 6. Mettre à jour Supabase si demandé
    if (shouldUpdate && toSet.length > 0 && ticketKeyIndex !== -1) {
      await updateTicketsInSupabase(results, modulesMap);
    } else if (toSet.length > 0 && ticketKeyIndex !== -1) {
      console.log('='.repeat(60));
      console.log('🔄 PROCHAINES ÉTAPES');
      console.log('='.repeat(60));
      console.log(`\nVoulez-vous mettre à jour les ${toSet.length} tickets dans Supabase ?`);
      console.log('Exécutez le script avec --update pour appliquer les changements.\n');
      console.log('Exemple: node scripts/analyze-resumes-and-identify-modules.mjs --update\n');
    }
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();

