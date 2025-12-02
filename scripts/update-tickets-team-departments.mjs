/**
 * Script de mise à jour des tickets "Team" avec départements
 * 
 * Processus :
 * 1. Télécharge le Google Sheet filtré (tickets "Team")
 * 2. Extrait les départements depuis "Team X" → "X"
 * 3. Crée les départements manquants dans Supabase
 * 4. Trouve les tickets via correspondance OBCS → OD
 * 5. Crée les liens dans ticket_department_link
 * 6. Mode DRY-RUN par défaut avec confirmation
 * 
 * Usage:
 *   node scripts/update-tickets-team-departments.mjs [--execute]
 */

import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Configuration
const GOOGLE_SHEET_ID = '1c4PEgIGrhLBhzF3SYLNS-XsaPUl2tJk8awmbzBOj-dQ';
const GID = '0';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=${GID}`;
const CORRESPONDENCE_FILE = join(process.cwd(), 'docs/ticket/correspondance - Jira (3).csv');

// Mode d'exécution
const isDryRun = !process.argv.includes('--execute');

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.error('   NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

/**
 * Normalise une chaîne pour la comparaison
 */
function normalizeString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Génère un code court à partir d'un nom de département
 */
function generateDepartmentCode(name) {
  if (!name) return 'GEN';
  
  // Normaliser et extraire les premières lettres
  const normalized = normalizeString(name).toUpperCase();
  const words = normalized.split(' ').filter(w => w.length > 0);
  
  if (words.length === 1) {
    // Un seul mot : prendre les 3 premières lettres
    return words[0].substring(0, 3).padEnd(3, 'X');
  } else if (words.length === 2) {
    // Deux mots : première lettre de chaque + dernière lettre du premier
    return (words[0][0] + words[1][0] + words[0][words[0].length - 1]).substring(0, 3);
  } else {
    // Plusieurs mots : première lettre de chaque (max 3)
    return words.slice(0, 3).map(w => w[0]).join('').substring(0, 3);
  }
}

/**
 * Capitalise la première lettre
 */
function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Mapping des noms anglais → français
 */
const DEPARTMENT_TRANSLATIONS = {
  'project': 'Projet',
  'support': 'Support',
  'finance': 'Finance',
  'marketing': 'Marketing',
  'commercial': 'Commercial',
  'comptabilité': 'Comptabilité',
  'comptabilite': 'Comptabilité',
  'rh': 'RH',
  'achat': 'Achat',
  'achats': 'Achat',
  'it': 'IT',
  'projet': 'Projet',
  'parc automobile': 'Parc Automobile',
  'parc': 'Parc Automobile'
};

/**
 * Normalise un nom de département depuis "Team X"
 */
function extractDepartmentName(teamName) {
  if (!teamName) return null;
  
  // Supprimer "Team" (insensible à la casse)
  let deptName = teamName.replace(/^team\s+/i, '').trim();
  
  // Nettoyer les virgules finales
  deptName = deptName.replace(/,\s*$/, '');
  
  if (!deptName) return null;
  
  // Traduction anglaise → français
  const normalized = normalizeString(deptName);
  if (DEPARTMENT_TRANSLATIONS[normalized]) {
    return DEPARTMENT_TRANSLATIONS[normalized];
  }
  
  // Capitaliser la première lettre
  return capitalizeFirst(deptName);
}

/**
 * Propose plusieurs options pour un nom de département ambigu
 */
function proposeDepartmentOptions(teamName) {
  const deptName = extractDepartmentName(teamName);
  if (!deptName) return [];
  
  const options = [deptName];
  
  // Cas spéciaux avec "&"
  if (teamName.includes('&') || teamName.toLowerCase().includes('et')) {
    const parts = teamName
      .replace(/^team\s+/i, '')
      .split(/[&,]/)
      .map(p => extractDepartmentName(p.trim()))
      .filter(Boolean);
    
    if (parts.length > 1) {
      options.push(...parts);
      // Option combinée
      options.push(parts.join(' & '));
    }
  }
  
  return [...new Set(options)]; // Dédupliquer
}

/**
 * Télécharge le Google Sheet
 */
async function downloadSheet() {
  try {
    console.log('📥 Téléchargement du Google Sheet...');
    const response = await fetch(SHEET_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const csvContent = await response.text();
    console.log(`   ✅ ${csvContent.split('\n').length} lignes téléchargées\n`);
    return csvContent;
  } catch (error) {
    console.error('❌ Erreur lors du téléchargement:', error.message);
    throw error;
  }
}

/**
 * Charge la correspondance OBCS → OD
 */
function loadCorrespondenceMap() {
  try {
    const content = readFileSync(CORRESPONDENCE_FILE, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      bom: true
    });

    const map = new Map();
    for (const record of records) {
      const odKey = record['Clé de ticket']?.trim();
      const obcsKey = record['Lien de ticket sortant (Duplicate)']?.trim();
      
      if (odKey && obcsKey && odKey.startsWith('OD-') && obcsKey.startsWith('OBCS-')) {
        map.set(obcsKey, odKey);
      }
    }

    console.log(`📋 ${map.size} correspondances OBCS → OD chargées\n`);
    return map;
  } catch (error) {
    console.error('❌ Erreur lors du chargement de la correspondance:', error.message);
    return new Map();
  }
}

/**
 * Extrait les tickets "Team" du CSV
 */
function extractTeamTickets(csvContent, correspondenceMap) {
  console.log('🔍 Extraction des tickets "Team"...');
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true
  });

  const teamTickets = [];
  const noTeam = [];
  const noCorrespondence = [];
  
  for (const record of records) {
    const obcsKey = record['Clé de ticket']?.trim();
    const teamName = record['Utilisateurs']?.trim();
    const companyName = record['Entreprises']?.trim();
    
    if (!obcsKey || !obcsKey.startsWith('OBCS-')) continue;
    
    // Filtrer uniquement les tickets "Team"
    if (!teamName || !/^team\s+/i.test(teamName)) {
      noTeam.push({ obcsKey, teamName, companyName });
      continue;
    }
    
    // Trouver la correspondance OD
    const odKey = correspondenceMap.get(obcsKey);
    if (!odKey) {
      noCorrespondence.push({ obcsKey, teamName, companyName });
      continue;
    }
    
    teamTickets.push({
      obcsKey,
      odKey,
      teamName,
      companyName,
      departmentName: extractDepartmentName(teamName)
    });
  }
  
  console.log(`   ✅ Tickets "Team" trouvés: ${teamTickets.length}`);
  console.log(`   ⏭️  Tickets non-Team ignorés: ${noTeam.length}`);
  console.log(`   ❌ Tickets sans correspondance OD: ${noCorrespondence.length}\n`);
  
  return { teamTickets, noTeam, noCorrespondence };
}

/**
 * Charge les départements existants depuis Supabase
 */
async function loadDepartments() {
  const { data, error } = await supabase
    .from('departments')
    .select('id, name, code')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('❌ Erreur lors du chargement des départements:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Crée ou récupère un département
 */
async function ensureDepartment(deptName, existingDepts) {
  // Chercher si le département existe déjà
  const normalized = normalizeString(deptName);
  const existing = existingDepts.find(d => normalizeString(d.name) === normalized);
  
  if (existing) {
    return { id: existing.id, name: existing.name, code: existing.code, created: false };
  }
  
  // Créer le département
  const code = generateDepartmentCode(deptName);
  
  if (isDryRun) {
    console.log(`   [DRY-RUN] Créerait département: "${deptName}" (code: ${code})`);
    return { id: null, name: deptName, code, created: true };
  }
  
  const { data, error } = await supabase
    .from('departments')
    .insert({
      name: deptName,
      code,
      is_active: true,
      description: `Département ${deptName}`
    })
    .select('id, name, code')
    .single();
  
  if (error) {
    console.error(`   ❌ Erreur lors de la création du département "${deptName}":`, error.message);
    return null;
  }
  
  console.log(`   ✅ Département créé: "${deptName}" (${code})`);
  return { id: data.id, name: data.name, code: data.code, created: true };
}

/**
 * Gère les départements ambigus en proposant des options
 */
async function handleAmbiguousDepartment(teamName, teamTickets, existingDepts) {
  const options = proposeDepartmentOptions(teamName);
  
  if (options.length <= 1) {
    // Pas d'ambiguïté, utiliser directement
    return await ensureDepartment(options[0] || teamName, existingDepts);
  }
  
  // Afficher les options
  console.log(`\n   ⚠️  Département ambigu pour "${teamName}":`);
  options.forEach((opt, idx) => {
    console.log(`      ${idx + 1}. ${opt}`);
  });
  
  // Pour le moment, prendre la première option
  // TODO: Implémenter une logique interactive ou de configuration
  const selected = options[0];
  console.log(`   → Utilisation de: "${selected}" (première option)\n`);
  
  return await ensureDepartment(selected, existingDepts);
}

/**
 * Trouve les tickets dans Supabase
 */
async function findTicketsInSupabase(teamTickets) {
  console.log(`🔍 Recherche de ${teamTickets.length} ticket(s) dans Supabase...`);
  
  const odKeys = teamTickets.map(t => t.odKey);
  const tickets = [];
  const notFound = [];
  
  // Traitement par lots de 100
  const batchSize = 100;
  for (let i = 0; i < odKeys.length; i += batchSize) {
    const batch = odKeys.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('tickets')
      .select('id, jira_issue_key')
      .in('jira_issue_key', batch);
    
    if (error) {
      console.error(`   ❌ Erreur lors de la recherche du lot ${Math.floor(i / batchSize) + 1}:`, error.message);
      continue;
    }
    
    if (data && data.length > 0) {
      tickets.push(...data);
    }
    
    const foundKeys = new Set(data?.map(t => t.jira_issue_key) || []);
    const missingInBatch = batch.filter(key => !foundKeys.has(key));
    notFound.push(...missingInBatch.map(key => {
      const ticket = teamTickets.find(t => t.odKey === key);
      return { odKey: key, obcsKey: ticket?.obcsKey, teamName: ticket?.teamName };
    }));
  }
  
  console.log(`   ✅ Tickets trouvés: ${tickets.length}`);
  console.log(`   ❌ Tickets non trouvés: ${notFound.length}\n`);
  
  return { tickets, notFound };
}

/**
 * Crée les liens ticket_department_link
 */
async function createDepartmentLinks(tickets, departmentMap, teamTickets) {
  console.log(`🔗 Création des liens ticket_department_link...\n`);
  
  if (!tickets || tickets.length === 0) {
    console.log('   ⚠️  Aucun ticket trouvé. Aucun lien à créer.\n');
    return { created: 0, errors: [] };
  }
  
  const linksToCreate = [];
  const errors = [];
  
  for (const ticket of tickets) {
    const teamTicket = teamTickets.find(t => t.odKey === ticket.jira_issue_key);
    if (!teamTicket) continue;
    
    const dept = departmentMap.get(teamTicket.departmentName);
    if (!dept || !dept.id) {
      errors.push({
        ticketId: ticket.id,
        odKey: ticket.jira_issue_key,
        departmentName: teamTicket.departmentName,
        reason: 'Département non trouvé ou non créé'
      });
      continue;
    }
    
    linksToCreate.push({
      ticket_id: ticket.id,
      department_id: dept.id,
      is_primary: true
    });
  }
  
  if (linksToCreate.length === 0) {
    console.log('   ⚠️  Aucun lien à créer\n');
    return { created: 0, errors };
  }
  
  if (isDryRun) {
    console.log(`   [DRY-RUN] Créerait ${linksToCreate.length} lien(s) ticket_department_link\n`);
    return { created: linksToCreate.length, errors };
  }
  
  // Vérifier les liens existants avant insertion
  const ticketIds = linksToCreate.map(l => l.ticket_id);
  const { data: existingLinks } = await supabase
    .from('ticket_department_link')
    .select('ticket_id, department_id')
    .in('ticket_id', ticketIds);
  
  const existingSet = new Set(
    existingLinks?.map(l => `${l.ticket_id}:${l.department_id}`) || []
  );
  
  const linksToInsert = linksToCreate.filter(l => {
    const key = `${l.ticket_id}:${l.department_id}`;
    return !existingSet.has(key);
  });
  
  if (linksToInsert.length === 0) {
    console.log(`   ℹ️  Tous les liens existent déjà\n`);
    return { created: 0, errors };
  }
  
  // Insertion par lots
  const batchSize = 50;
  let created = 0;
  
  for (let i = 0; i < linksToInsert.length; i += batchSize) {
    const batch = linksToInsert.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('ticket_department_link')
      .insert(batch);
    
    if (error) {
      console.error(`   ❌ Erreur lors de l'insertion du lot ${Math.floor(i / batchSize) + 1}:`, error.message);
      errors.push(...batch.map(l => ({
        ticketId: l.ticket_id,
        departmentId: l.department_id,
        reason: error.message
      })));
    } else {
      created += batch.length;
      console.log(`   ✅ Lot ${Math.floor(i / batchSize) + 1}: ${batch.length} lien(s) créé(s)`);
    }
  }
  
  console.log(`\n   ✅ Total: ${created} lien(s) créé(s)\n`);
  return { created, errors };
}

/**
 * Génère un rapport Markdown
 */
function generateReport({ teamTickets, departments, tickets, links, notFoundTickets, noCorrespondence }) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = join(process.cwd(), `docs/ticket/rapport-tickets-team-departments-${timestamp}.md`);
  
  const report = `# Rapport - Mise à jour Tickets "Team" avec Départements

**Date**: ${new Date().toLocaleString('fr-FR')}  
**Mode**: ${isDryRun ? '🔍 DRY-RUN (Simulation)' : '✅ EXÉCUTION RÉELLE'}

---

## 📊 Résumé Global

- **Tickets "Team" identifiés**: ${teamTickets.length}
- **Départements identifiés**: ${departments.size}
- **Départements créés**: ${Array.from(departments.values()).filter(d => d.created).length}
- **Tickets trouvés dans Supabase**: ${tickets.length}
- **Liens ticket_department_link créés**: ${links.created}
- **Tickets non trouvés**: ${notFoundTickets.length}
- **Tickets sans correspondance OD**: ${noCorrespondence.length}

---

## 🏢 Départements Identifiés

${Array.from(departments.entries())
  .map(([name, dept]) => `- **${name}** (code: ${dept.code})${dept.created ? ' ✨ *Nouveau*' : ''}`)
  .join('\n')}

---

## 📋 Statistiques par Département

${Array.from(departments.entries())
  .map(([name, dept]) => {
    const count = teamTickets.filter(t => t.departmentName === name).length;
    return `- **${name}**: ${count} ticket(s)`;
  })
  .join('\n')}

---

## ❌ Tickets Non Trouvés dans Supabase

${notFoundTickets.length > 0 
  ? notFoundTickets.map(t => `- ${t.odKey} (OBCS: ${t.obcsKey}, Team: ${t.teamName})`).join('\n')
  : 'Aucun'
}

---

## ⚠️ Tickets sans Correspondance OD

${noCorrespondence.length > 0
  ? noCorrespondence.map(t => `- ${t.obcsKey} (Team: ${t.teamName}, Entreprise: ${t.companyName})`).join('\n')
  : 'Aucun'
}

---

## 🔗 Liens Créés

- **Total créés**: ${links.created}
- **Erreurs**: ${links.errors.length}

${links.errors.length > 0
  ? `### Erreurs\n\n${links.errors.map(e => `- Ticket ${e.ticketId || e.odKey}: ${e.reason}`).join('\n')}`
  : ''
}

---

## 📝 Notes

${isDryRun 
  ? '⚠️ Ce rapport est une simulation (DRY-RUN). Pour exécuter réellement, ajoutez `--execute` à la commande.'
  : '✅ Exécution réelle effectuée.'
}
`;

  writeFileSync(reportPath, report, 'utf-8');
  console.log(`📄 Rapport généré: ${reportPath}\n`);
  
  return reportPath;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Script de mise à jour des tickets "Team" avec départements\n');
  console.log(`Mode: ${isDryRun ? '🔍 DRY-RUN (Simulation)' : '✅ EXÉCUTION RÉELLE'}\n`);
  
  try {
    // 1. Télécharger le Google Sheet
    const csvContent = await downloadSheet();
    
    // 2. Charger la correspondance OBCS → OD
    const correspondenceMap = loadCorrespondenceMap();
    
    // 3. Extraire les tickets "Team"
    const { teamTickets, noTeam, noCorrespondence } = extractTeamTickets(csvContent, correspondenceMap);
    
    if (teamTickets.length === 0) {
      console.log('⚠️  Aucun ticket "Team" trouvé. Arrêt du script.');
      return;
    }
    
    // 4. Charger les départements existants
    console.log('📋 Chargement des départements existants...');
    const existingDepts = await loadDepartments();
    console.log(`   ✅ ${existingDepts.length} département(s) trouvé(s)\n`);
    
    // 5. Identifier et créer les départements nécessaires
    console.log('🏢 Traitement des départements...\n');
    const departmentMap = new Map();
    const uniqueDepartmentNames = [...new Set(teamTickets.map(t => t.departmentName).filter(Boolean))];
    
    for (const deptName of uniqueDepartmentNames) {
      const teamTicket = teamTickets.find(t => t.departmentName === deptName);
      const dept = await handleAmbiguousDepartment(teamTicket?.teamName || deptName, teamTickets, existingDepts);
      
      if (dept) {
        departmentMap.set(deptName, dept);
      }
    }
    
    console.log(`\n✅ ${departmentMap.size} département(s) traité(s)\n`);
    
    // 6. Trouver les tickets dans Supabase
    const ticketsResult = await findTicketsInSupabase(teamTickets);
    const { tickets, notFound } = ticketsResult;
    
    // 7. Créer les liens ticket_department_link
    const links = await createDepartmentLinks(tickets, departmentMap, teamTickets);
    
    // 8. Générer le rapport
    generateReport({
      teamTickets,
      departments: departmentMap,
      tickets,
      links,
      notFoundTickets: notFound,
      noCorrespondence
    });
    
    console.log('✅ Traitement terminé !\n');
    
    if (isDryRun) {
      console.log('💡 Pour exécuter réellement, relancez avec: node scripts/update-tickets-team-departments.mjs --execute\n');
    }
    
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

