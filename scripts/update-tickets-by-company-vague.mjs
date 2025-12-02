/**
 * Script de mise à jour des tickets par vagues (entreprise par entreprise)
 * 
 * Processus :
 * 1. Analyse le fichier CSV
 * 2. Groupe les tickets par entreprise
 * 3. Pour chaque entreprise :
 *    - Affiche les données et pose des questions
 *    - Attend validation/clarification
 *    - Exécute la mise à jour
 *    - Continue avec la suivante
 * 
 * Mise à jour : company_id + contact_user_id uniquement
 */

import { readFileSync } from 'fs';
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

const CSV_FILE = join(process.cwd(), 'docs/ticket/tickets-analyse.csv');
const CORRESPONDENCE_FILE = join(process.cwd(), 'docs/ticket/correspondance - Jira (3).csv');

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
 * Normalise une chaîne pour la comparaison (accents, casse, espaces)
 */
function normalizeString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .trim()
    .replace(/\s+/g, ' '); // Normalise les espaces
}

/**
 * Calcule la similarité entre deux chaînes (0-1)
 */
function similarity(str1, str2) {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Distance de Levenshtein simplifiée
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
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

    return map;
  } catch (error) {
    console.error('❌ Erreur lors du chargement de la correspondance:', error.message);
    return new Map();
  }
}

/**
 * Charge les entreprises depuis Supabase
 */
async function loadCompanies() {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    console.error('❌ Erreur lors du chargement des entreprises:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Charge les profils depuis Supabase
 */
async function loadProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, company_id')
    .order('full_name', { ascending: true });

  if (error) {
    console.error('❌ Erreur lors du chargement des profils:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Trouve une entreprise par similarité de nom
 */
function findCompanyByName(companyName, companies, threshold = 0.7) {
  if (!companyName) return null;

  // Exact match
  const exact = companies.find(c => normalizeString(c.name) === normalizeString(companyName));
  if (exact) return exact;

  // Similarité
  const matches = companies
    .map(c => ({ company: c, score: similarity(c.name, companyName) }))
    .filter(m => m.score >= threshold)
    .sort((a, b) => b.score - a.score);

  return matches.length > 0 ? matches[0].company : null;
}

/**
 * Trouve un profil par similarité de nom
 */
function findProfileByName(userName, profiles, threshold = 0.7) {
  if (!userName || userName === 'Non renseigné') return null;

  // Exact match sur full_name
  const exact = profiles.find(p => normalizeString(p.full_name) === normalizeString(userName));
  if (exact) return exact;

  // Similarité
  const matches = profiles
    .map(p => ({ profile: p, score: similarity(p.full_name || '', userName) }))
    .filter(m => m.score >= threshold)
    .sort((a, b) => b.score - a.score);

  return matches.length > 0 ? matches[0].profile : null;
}

/**
 * Analyse le fichier CSV et groupe par entreprise
 */
function analyzeAndGroupByCompany(csvRecords, correspondenceMap) {
  // Identifier les colonnes
  const headers = Object.keys(csvRecords[0] || {});
  const ticketKeyCol = headers.find(h => 
    h.toLowerCase().includes('clé') || h.toLowerCase().includes('key') || h.toLowerCase().includes('obcs')
  );
  const companyCol = headers.find(h => 
    h.toLowerCase().includes('entreprise') || h.toLowerCase().includes('company')
  );
  const userCol = headers.find(h => 
    h.toLowerCase().includes('utilisateur') || h.toLowerCase().includes('user') || h.toLowerCase().includes('profile')
  );

  if (!ticketKeyCol || !companyCol || !userCol) {
    console.error('❌ Colonnes non trouvées dans le CSV');
    console.error('   Colonnes disponibles:', headers.join(', '));
    return null;
  }

  console.log(`✅ Colonnes identifiées :`);
  console.log(`   - Clé ticket : "${ticketKeyCol}"`);
  console.log(`   - Entreprise : "${companyCol}"`);
  console.log(`   - Utilisateurs : "${userCol}"\n`);

  // Grouper par entreprise
  const ticketsByCompany = new Map();

  for (const record of csvRecords) {
    const obcsKey = (record[ticketKeyCol] || '').trim();
    const company = (record[companyCol] || '').trim();
    const user = (record[userCol] || '').trim();

    if (!obcsKey || !obcsKey.startsWith('OBCS-')) {
      continue;
    }

    // Ignorer si pas de correspondance OD
    const odKey = correspondenceMap.get(obcsKey);
    if (!odKey) {
      continue; // Ignorer les tickets sans correspondance OD
    }

    if (!company) {
      continue;
    }

    if (!ticketsByCompany.has(company)) {
      ticketsByCompany.set(company, []);
    }

    ticketsByCompany.get(company).push({
      obcs: obcsKey,
      od: odKey,
      company,
      user: user || 'Non renseigné'
    });
  }

  return { ticketsByCompany, columns: { ticketKeyCol, companyCol, userCol } };
}

/**
 * Affiche les informations d'une entreprise et pose des questions
 */
function displayCompanyInfo(companyName, tickets, companies, profiles) {
  console.log('\n' + '='.repeat(80));
  console.log(`🏢 ENTREPRISE : ${companyName}`);
  console.log('='.repeat(80));
  console.log(`\n📊 Statistiques :`);
  console.log(`   - Nombre de tickets : ${tickets.length}`);
  
  const users = [...new Set(tickets.map(t => t.user))];
  console.log(`   - Utilisateurs concernés : ${users.length}`);
  users.forEach(u => {
    const count = tickets.filter(t => t.user === u).length;
    console.log(`     • ${u} : ${count} ticket(s)`);
  });

  // Vérifier si l'entreprise existe dans Supabase
  const companyMatch = findCompanyByName(companyName, companies);
  if (companyMatch) {
    console.log(`\n✅ Entreprise trouvée dans Supabase :`);
    console.log(`   - ID : ${companyMatch.id}`);
    console.log(`   - Nom : ${companyMatch.name}`);
  } else {
    console.log(`\n⚠️  Entreprise NON trouvée dans Supabase`);
    console.log(`   Recherche par similarité...`);
    const similar = companies
      .map(c => ({ company: c, score: similarity(c.name, companyName) }))
      .filter(m => m.score >= 0.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    if (similar.length > 0) {
      console.log(`   Entreprises similaires trouvées :`);
      similar.forEach(({ company, score }) => {
        console.log(`     • ${company.name} (score: ${(score * 100).toFixed(0)}%) - ID: ${company.id}`);
      });
    }
  }

  // Vérifier les utilisateurs
  console.log(`\n👥 Analyse des utilisateurs :`);
  const userMatches = new Map();
  for (const userName of users) {
    if (userName === 'Non renseigné') {
      userMatches.set(userName, null);
      continue;
    }

    const profileMatch = findProfileByName(userName, profiles);
    if (profileMatch) {
      userMatches.set(userName, profileMatch);
      console.log(`   ✅ "${userName}" → ${profileMatch.full_name} (ID: ${profileMatch.id})`);
    } else {
      userMatches.set(userName, null);
      console.log(`   ⚠️  "${userName}" → NON TROUVÉ`);
      
      // Afficher les profils similaires
      const similar = profiles
        .map(p => ({ profile: p, score: similarity(p.full_name || '', userName) }))
        .filter(m => m.score >= 0.5)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      
      if (similar.length > 0) {
        console.log(`      Profils similaires :`);
        similar.forEach(({ profile, score }) => {
          console.log(`        • ${profile.full_name} (${profile.email || 'pas d\'email'}) - score: ${(score * 100).toFixed(0)}%`);
        });
      }
    }
  }

  // Afficher quelques exemples de tickets
  console.log(`\n📋 Exemples de tickets (5 premiers) :`);
  tickets.slice(0, 5).forEach((ticket, i) => {
    console.log(`   ${i + 1}. ${ticket.od} (OBCS: ${ticket.obcs}) - Utilisateur: ${ticket.user}`);
  });
  if (tickets.length > 5) {
    console.log(`   ... et ${tickets.length - 5} autre(s) ticket(s)`);
  }

  return { companyMatch, userMatches };
}

/**
 * Met à jour les tickets d'une entreprise
 */
async function updateTicketsForCompany(companyId, tickets, userMatches, isDryRun = true) {
  console.log(`\n${isDryRun ? '🔍 DRY-RUN' : '✅ MISE À JOUR'} des tickets...\n`);

  const results = {
    total: tickets.length,
    updated: 0,
    notFound: 0,
    errors: []
  };

  // Grouper par utilisateur pour optimisation
  const ticketsByUser = new Map();
  for (const ticket of tickets) {
    const profileId = userMatches.get(ticket.user)?.id || null;
    if (!ticketsByUser.has(profileId)) {
      ticketsByUser.set(profileId, []);
    }
    ticketsByUser.get(profileId, []).push(ticket);
  }

  // Mise à jour par lot (par utilisateur)
  for (const [profileId, userTickets] of ticketsByUser.entries()) {
    const odKeys = userTickets.map(t => t.od);

    if (isDryRun) {
      console.log(`   [DRY-RUN] Mise à jour de ${userTickets.length} ticket(s) pour l'utilisateur ${profileId || 'N/A'}`);
      for (const ticket of userTickets) {
        console.log(`     - ${ticket.od}: company_id=${companyId}, contact_user_id=${profileId || 'NULL'}`);
      }
      results.updated += userTickets.length;
      continue;
    }

    // Vérifier si les tickets existent
    const { data: existingTickets, error: checkError } = await supabase
      .from('tickets')
      .select('id, jira_issue_key, company_id, contact_user_id')
      .in('jira_issue_key', odKeys);

    if (checkError) {
      console.error(`   ❌ Erreur lors de la vérification des tickets:`, checkError.message);
      results.errors.push({ type: 'check_error', error: checkError.message, count: userTickets.length });
      continue;
    }

    const existingKeys = new Set(existingTickets?.map(t => t.jira_issue_key) || []);
    const notFound = odKeys.filter(k => !existingKeys.has(k));
    
    if (notFound.length > 0) {
      console.log(`   ⚠️  Tickets non trouvés dans Supabase : ${notFound.join(', ')}`);
      results.notFound += notFound.length;
    }

    const foundTickets = existingTickets?.filter(t => existingKeys.has(t.jira_issue_key)) || [];
    
    if (foundTickets.length === 0) {
      continue;
    }

    // Préparer les mises à jour
    const updates = foundTickets.map(t => ({
      id: t.id,
      company_id: companyId,
      contact_user_id: profileId
    }));

    // Mise à jour par batch (50 à la fois)
    const batchSize = 50;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      for (const update of batch) {
        const { error: updateError } = await supabase
          .from('tickets')
          .update({
            company_id: update.company_id,
            contact_user_id: update.contact_user_id
          })
          .eq('id', update.id);

        if (updateError) {
          console.error(`   ❌ Erreur lors de la mise à jour du ticket ${update.id}:`, updateError.message);
          results.errors.push({ ticketId: update.id, error: updateError.message });
        } else {
          results.updated++;
        }
      }
    }
  }

  return results;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🔍 MISE À JOUR DES TICKETS PAR VAGUES (ENTREPRISE PAR ENTREPRISE)');
  console.log('='.repeat(80));
  console.log('');

  // Mode dry-run par défaut
  const args = process.argv.slice(2);
  const isDryRun = !args.includes('--execute');

  if (isDryRun) {
    console.log('⚠️  MODE DRY-RUN activé (simulation uniquement)');
    console.log('   Pour exécuter réellement, ajoutez le flag --execute\n');
  }

  // 1. Charger les correspondances OBCS → OD
  console.log('📋 Chargement de la correspondance OBCS → OD...');
  const correspondenceMap = loadCorrespondenceMap();
  console.log(`   ✅ ${correspondenceMap.size} correspondances chargées\n`);

  // 2. Charger les données Supabase
  console.log('📋 Chargement des données Supabase...');
  const [companies, profiles] = await Promise.all([
    loadCompanies(),
    loadProfiles()
  ]);
  console.log(`   ✅ ${companies.length} entreprises chargées`);
  console.log(`   ✅ ${profiles.length} profils chargés\n`);

  // 3. Analyser le fichier CSV
  console.log('📋 Analyse du fichier CSV...');
  try {
    const content = readFileSync(CSV_FILE, 'utf-8');
    
    if (content.trim().startsWith('<!DOCTYPE html') || content.includes('<html')) {
      console.error('❌ Le fichier téléchargé est une page HTML d\'authentification.');
      console.error('   Veuillez télécharger manuellement le CSV depuis Google Sheets.');
      console.error('   Placez-le dans : docs/ticket/tickets-analyse.csv');
      process.exit(1);
    }

    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      relax_column_count: true
    });

    console.log(`   ✅ ${records.length} lignes analysées\n`);

    // 4. Grouper par entreprise
    const analysis = analyzeAndGroupByCompany(records, correspondenceMap);
    if (!analysis) {
      process.exit(1);
    }

    const { ticketsByCompany } = analysis;
    const companiesList = Array.from(ticketsByCompany.keys()).sort();

    console.log(`📊 ${companiesList.length} entreprises identifiées\n`);

    // 5. Traiter chaque entreprise
    for (let i = 0; i < companiesList.length; i++) {
      const companyName = companiesList[i];
      const tickets = ticketsByCompany.get(companyName);

      // Afficher les informations et poser des questions
      const { companyMatch, userMatches } = displayCompanyInfo(companyName, tickets, companies, profiles);

      // Poser les questions de clarification
      console.log(`\n❓ QUESTIONS DE CLARIFICATION :\n`);
      console.log(`   1. L'entreprise "${companyName}" correspond-elle à l'entreprise trouvée dans Supabase ?`);
      if (companyMatch) {
        console.log(`      → OUI : ID ${companyMatch.id} - Nom: ${companyMatch.name}`);
      } else {
        console.log(`      → NON : Aucune correspondance trouvée`);
      }
      
      const usersWithoutMatch = Array.from(userMatches.entries()).filter(([name, profile]) => !profile && name !== 'Non renseigné');
      if (usersWithoutMatch.length > 0) {
        console.log(`\n   2. Pour les utilisateurs non trouvés, comment procéder ?`);
        usersWithoutMatch.forEach(([name]) => {
          console.log(`      - "${name}" : À ignorer ou créer ?`);
        });
      }

      // Attendre l'input de l'utilisateur (simulation pour l'instant)
      console.log(`\n   [En attente de vos clarifications...]`);
      console.log(`   (Le script s'arrête ici pour validation manuelle)`);
      
      // Pour l'instant, on s'arrête après la première entreprise
      // Dans la version finale, on attendra les réponses
      if (i === 0) {
        console.log(`\n   💡 Une fois les clarifications données, le script continuera avec les autres entreprises.`);
        break;
      }
    }

    console.log(`\n✅ Analyse terminée\n`);

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('❌ Fichier non trouvé. Veuillez télécharger le CSV depuis Google Sheets.');
      console.error('   Placez-le dans : docs/ticket/tickets-analyse.csv');
    } else {
      console.error('❌ Erreur:', error.message);
      console.error(error);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

