/**
 * Script pour analyser les rapporteurs JIRA et identifier qui crée le plus de tickets
 * 
 * Usage: node scripts/analyze-jira-reporters.js
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeJiraReporters() {
  console.log('📊 Analyse des rapporteurs JIRA...\n');

  try {
    // 1. Récupérer tous les tickets avec leurs rapporteurs JIRA
    const { data: jiraSync, error: jiraError } = await supabase
      .from('jira_sync')
      .select(`
        ticket_id,
        jira_issue_key,
        jira_reporter_account_id,
        jira_assignee_account_id,
        tickets!inner (
          id,
          title,
          ticket_type,
          created_by,
          status,
          created_at
        )
      `)
      .not('jira_reporter_account_id', 'is', null);

    if (jiraError) {
      throw new Error(`Erreur lors de la récupération des données JIRA: ${jiraError.message}`);
    }

    if (!jiraSync || jiraSync.length === 0) {
      console.log('✅ Aucun ticket JIRA trouvé');
      return;
    }

    console.log(`📋 ${jiraSync.length} tickets JIRA trouvés\n`);

    // 2. Compter les tickets par rapporteur JIRA
    const reporterStats = new Map();
    let ticketsWithNullCreatedBy = 0;

    jiraSync.forEach(entry => {
      const reporterId = entry.jira_reporter_account_id;
      const ticket = entry.tickets;
      
      if (!reporterStats.has(reporterId)) {
        reporterStats.set(reporterId, {
          jira_account_id: reporterId,
          count: 0,
          byType: {
            BUG: 0,
            REQ: 0,
            ASSISTANCE: 0
          },
          tickets: [],
          hasProfile: false,
          profileId: null
        });
      }
      
      const stats = reporterStats.get(reporterId);
      stats.count++;
      stats.byType[ticket.ticket_type] = (stats.byType[ticket.ticket_type] || 0) + 1;
      stats.tickets.push({
        ticket_id: ticket.id,
        jira_issue_key: entry.jira_issue_key,
        title: ticket.title,
        ticket_type: ticket.ticket_type,
        created_by: ticket.created_by,
        status: ticket.status
      });

      if (!ticket.created_by) {
        ticketsWithNullCreatedBy++;
      }
    });

    // 3. Vérifier quels rapporteurs ont un profil dans Supabase
    const allReporterIds = Array.from(reporterStats.keys());
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, jira_user_id, departments(name, code)')
      .in('jira_user_id', allReporterIds);

    if (profilesError) {
      console.warn(`⚠️  Erreur lors de la récupération des profils: ${profilesError.message}`);
    } else {
      // Marquer les rapporteurs qui ont un profil
      profiles?.forEach(profile => {
        if (profile.jira_user_id && reporterStats.has(profile.jira_user_id)) {
          const stats = reporterStats.get(profile.jira_user_id);
          stats.hasProfile = true;
          stats.profileId = profile.id;
          stats.profile = profile;
        }
      });
    }

    // 4. Trier par nombre de tickets (décroissant)
    const sortedReporters = Array.from(reporterStats.values())
      .sort((a, b) => b.count - a.count);

    // 5. Afficher les résultats
    console.log('═'.repeat(80));
    console.log('📊 TOP RAPPORTEURS JIRA (Créateurs de tickets)');
    console.log('═'.repeat(80));
    console.log('');

    if (sortedReporters.length === 0) {
      console.log('⚠️  Aucun rapporteur identifié');
    } else {
      console.log(`🏆 Top 30 rapporteurs JIRA:\n`);
      
      sortedReporters.slice(0, 30).forEach((reporter, index) => {
        const status = reporter.hasProfile ? '✅' : '❌';
        const profile = reporter.profile;
        
        console.log(`${(index + 1).toString().padStart(2, ' ')}. ${status} ${profile?.full_name || 'NON MAPPÉ'}`);
        if (profile) {
          console.log(`    📧 Email: ${profile.email || 'N/A'}`);
          console.log(`    👤 Rôle: ${profile.role || 'N/A'}`);
          const dept = profile.departments ? `${profile.departments.name} (${profile.departments.code})` : 'N/A';
          console.log(`    🏢 Département: ${dept}`);
        }
        console.log(`    🔑 JIRA Account ID: ${reporter.jira_account_id}`);
        console.log(`    📊 Total tickets: ${reporter.count}`);
        console.log(`       - BUG: ${reporter.byType.BUG || 0}`);
        console.log(`       - REQ: ${reporter.byType.REQ || 0}`);
        console.log(`       - ASSISTANCE: ${reporter.byType.ASSISTANCE || 0}`);
        
        // Vérifier combien de tickets ont created_by = NULL
        const nullCreatedBy = reporter.tickets.filter(t => !t.created_by).length;
        if (nullCreatedBy > 0) {
          console.log(`    ⚠️  Tickets avec created_by=NULL: ${nullCreatedBy}`);
        }
        console.log('');
      });
    }

    // 6. Statistiques globales
    console.log('═'.repeat(80));
    console.log('📈 STATISTIQUES GLOBALES');
    console.log('═'.repeat(80));
    console.log('');
    console.log(`📋 Total tickets JIRA: ${jiraSync.length}`);
    console.log(`👥 Rapporteurs uniques: ${sortedReporters.length}`);
    console.log(`✅ Rapporteurs mappés (avec profil): ${sortedReporters.filter(r => r.hasProfile).length}`);
    console.log(`❌ Rapporteurs non mappés (sans profil): ${sortedReporters.filter(r => !r.hasProfile).length}`);
    console.log(`⚠️  Tickets avec created_by=NULL: ${ticketsWithNullCreatedBy}`);
    console.log('');

    // Statistiques par type
    const byType = {
      BUG: jiraSync.filter(e => e.tickets.ticket_type === 'BUG').length,
      REQ: jiraSync.filter(e => e.tickets.ticket_type === 'REQ').length,
      ASSISTANCE: jiraSync.filter(e => e.tickets.ticket_type === 'ASSISTANCE').length
    };
    console.log('📊 Répartition par type:');
    console.log(`   - BUG: ${byType.BUG}`);
    console.log(`   - REQ: ${byType.REQ}`);
    console.log(`   - ASSISTANCE: ${byType.ASSISTANCE}`);
    console.log('');

    // Top rapporteur
    if (sortedReporters.length > 0) {
      const topReporter = sortedReporters[0];
      console.log('═'.repeat(80));
      console.log('🏆 RAPPORTEUR #1');
      console.log('═'.repeat(80));
      console.log('');
      console.log(`👤 Nom: ${topReporter.profile?.full_name || 'NON MAPPÉ'}`);
      console.log(`📧 Email: ${topReporter.profile?.email || 'N/A'}`);
      console.log(`👤 Rôle: ${topReporter.profile?.role || 'N/A'}`);
      console.log(`🔑 JIRA Account ID: ${topReporter.jira_account_id}`);
      console.log(`📊 Total tickets créés: ${topReporter.count}`);
      console.log(`   - BUG: ${topReporter.byType.BUG || 0}`);
      console.log(`   - REQ: ${topReporter.byType.REQ || 0}`);
      console.log(`   - ASSISTANCE: ${topReporter.byType.ASSISTANCE || 0}`);
      console.log(`✅ Profil dans Supabase: ${topReporter.hasProfile ? 'OUI' : 'NON'}`);
      if (!topReporter.hasProfile) {
        console.log(`⚠️  ACTION REQUISE: Créer le profil avec jira_user_id = "${topReporter.jira_account_id}"`);
      }
      console.log('');
    }

    // Liste des rapporteurs non mappés
    const unmappedReporters = sortedReporters.filter(r => !r.hasProfile);
    if (unmappedReporters.length > 0) {
      console.log('═'.repeat(80));
      console.log('❌ RAPPORTEURS NON MAPPÉS (Action requise)');
      console.log('═'.repeat(80));
      console.log(`\n📋 ${unmappedReporters.length} rapporteurs sans profil dans Supabase\n`);
      
      unmappedReporters.forEach((reporter, index) => {
        console.log(`${(index + 1).toString().padStart(2, ' ')}. JIRA Account ID: ${reporter.jira_account_id}`);
        console.log(`    📊 Tickets: ${reporter.count}`);
        console.log(`    ⚠️  Créer le profil avec jira_user_id = "${reporter.jira_account_id}"`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter le script
analyzeJiraReporters()
  .then(() => {
    console.log('✅ Analyse terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

