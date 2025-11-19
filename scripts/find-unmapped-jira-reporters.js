/**
 * Script pour identifier les rapporteurs JIRA non mappés dans Supabase
 * 
 * Ce script trouve tous les rapporteurs JIRA qui :
 * 1. Ont un jira_reporter_account_id dans jira_sync
 * 2. N'ont PAS de profil correspondant dans profiles.jira_user_id
 * 3. Ont donc un tickets.created_by = NULL ou invalide
 * 
 * Usage: node scripts/find-unmapped-jira-reporters.js
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';

// Charger .env.local en priorité si présent
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch {
  // Si .env.local n'existe pas, essayer .env
  dotenv.config();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findUnmappedReporters() {
  console.log('🔍 Recherche des rapporteurs JIRA non mappés...\n');

  try {
    // 1. Récupérer tous les rapporteurs JIRA uniques depuis jira_sync
    const { data: jiraSyncData, error: jiraError } = await supabase
      .from('jira_sync')
      .select('jira_reporter_account_id, ticket_id, jira_issue_key')
      .not('jira_reporter_account_id', 'is', null);

    if (jiraError) {
      throw new Error(`Erreur lors de la récupération des données jira_sync: ${jiraError.message}`);
    }

    if (!jiraSyncData || jiraSyncData.length === 0) {
      console.log('✅ Aucun rapporteur JIRA trouvé dans jira_sync');
      return;
    }

    console.log(`📊 ${jiraSyncData.length} entrées trouvées dans jira_sync avec jira_reporter_account_id\n`);

    // 2. Récupérer tous les profils avec jira_user_id
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, jira_user_id, full_name, email')
      .not('jira_user_id', 'is', null);

    if (profilesError) {
      throw new Error(`Erreur lors de la récupération des profils: ${profilesError.message}`);
    }

    const mappedJiraIds = new Set(profilesData?.map(p => p.jira_user_id) || []);
    console.log(`👥 ${mappedJiraIds.size} profils avec jira_user_id trouvés\n`);

    // 3. Identifier les rapporteurs non mappés
    const uniqueReporters = new Map();
    
    jiraSyncData.forEach(entry => {
      const reporterId = entry.jira_reporter_account_id;
      if (!mappedJiraIds.has(reporterId)) {
        if (!uniqueReporters.has(reporterId)) {
          uniqueReporters.set(reporterId, {
            jira_account_id: reporterId,
            tickets: [],
            ticket_ids: []
          });
        }
        uniqueReporters.get(reporterId).tickets.push({
          ticket_id: entry.ticket_id,
          jira_issue_key: entry.jira_issue_key
        });
        uniqueReporters.get(reporterId).ticket_ids.push(entry.ticket_id);
      }
    });

    const unmappedCount = uniqueReporters.size;

    if (unmappedCount === 0) {
      console.log('✅ Tous les rapporteurs JIRA sont mappés !\n');
      return;
    }

    // 4. Vérifier l'état des tickets (created_by)
    const allTicketIds = Array.from(uniqueReporters.values())
      .flatMap(r => r.ticket_ids);
    
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, title, created_by, jira_issue_key')
      .in('id', allTicketIds);

    if (ticketsError) {
      console.warn(`⚠️  Erreur lors de la récupération des tickets: ${ticketsError.message}`);
    }

    const ticketsMap = new Map(ticketsData?.map(t => [t.id, t]) || []);

    // 5. Afficher les résultats
    console.log(`\n❌ ${unmappedCount} rapporteurs JIRA non mappés trouvés:\n`);
    console.log('═'.repeat(80));

    let totalTickets = 0;
    let ticketsWithNullCreatedBy = 0;

    for (const [reporterId, info] of uniqueReporters.entries()) {
      console.log(`\n📋 Rapporteur JIRA: ${reporterId}`);
      console.log(`   Nombre de tickets: ${info.tickets.length}`);
      
      const ticketsWithNull = info.tickets.filter(t => {
        const ticket = ticketsMap.get(t.ticket_id);
        return !ticket || !ticket.created_by;
      }).length;
      
      ticketsWithNullCreatedBy += ticketsWithNull;
      totalTickets += info.tickets.length;

      if (info.tickets.length <= 5) {
        console.log(`   Tickets concernés:`);
        info.tickets.forEach(t => {
          const ticket = ticketsMap.get(t.ticket_id);
          const status = ticket && ticket.created_by ? '✅ Mappé' : '❌ Non mappé';
          console.log(`     - ${t.jira_issue_key || t.ticket_id} (${ticket?.title || 'N/A'}) ${status}`);
        });
      } else {
        console.log(`   Exemples de tickets:`);
        info.tickets.slice(0, 3).forEach(t => {
          const ticket = ticketsMap.get(t.ticket_id);
          const status = ticket && ticket.created_by ? '✅' : '❌';
          console.log(`     - ${t.jira_issue_key || t.ticket_id} ${status}`);
        });
        console.log(`     ... et ${info.tickets.length - 3} autres`);
      }
    }

    console.log('\n' + '═'.repeat(80));
    console.log(`\n📊 Résumé:`);
    console.log(`   - Rapporteurs non mappés: ${unmappedCount}`);
    console.log(`   - Total tickets concernés: ${totalTickets}`);
    console.log(`   - Tickets avec created_by = NULL: ${ticketsWithNullCreatedBy}`);
    console.log(`   - Tickets avec created_by invalide: ${totalTickets - ticketsWithNullCreatedBy}`);

    // 6. Générer un rapport CSV pour faciliter le mapping
    console.log(`\n💾 Génération du rapport CSV...`);
    
    const csvRows = [
      ['JIRA Account ID', 'Nombre de tickets', 'Tickets (JIRA Keys)', 'Action requise']
    ];

    for (const [reporterId, info] of uniqueReporters.entries()) {
      const jiraKeys = info.tickets.map(t => t.jira_issue_key).filter(Boolean).join(', ');
      const action = 'Ajouter jira_user_id dans profiles ou créer nouveau profil';
      csvRows.push([
        reporterId,
        info.tickets.length.toString(),
        jiraKeys || 'N/A',
        action
      ]);
    }

    const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const reportPath = path.resolve(process.cwd(), 'docs', 'analysis', 'unmapped-jira-reporters.csv');
    writeFileSync(reportPath, csvContent, 'utf-8');
    
    console.log(`✅ Rapport sauvegardé dans: ${reportPath}\n`);

    // 7. Recommandations
    console.log('💡 Recommandations:');
    console.log('   1. Vérifier dans JIRA les noms/emails de ces rapporteurs');
    console.log('   2. Créer des profils dans Supabase pour les utilisateurs internes');
    console.log('   3. Remplir profiles.jira_user_id avec les Account IDs JIRA');
    console.log('   4. Relancer la synchronisation pour mapper les tickets existants\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
findUnmappedReporters()
  .then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

