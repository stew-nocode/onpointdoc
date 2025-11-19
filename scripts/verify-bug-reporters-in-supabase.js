/**
 * Script pour vérifier les rapporteurs des BUGs dans Supabase
 * 
 * Ce script :
 * 1. Récupère tous les rapporteurs JIRA des tickets BUG depuis jira_sync
 * 2. Vérifie s'ils existent dans profiles
 * 3. Identifie les informations manquantes
 * 
 * Usage: node scripts/verify-bug-reporters-in-supabase.js
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

async function verifyBugReporters() {
  console.log('🔍 Vérification des rapporteurs des BUGs dans Supabase...\n');

  try {
    // 1. Récupérer tous les rapporteurs JIRA des tickets BUG
    const { data: bugTickets, error: ticketsError } = await supabase
      .from('jira_sync')
      .select(`
        jira_reporter_account_id,
        ticket_id,
        jira_issue_key,
        tickets!inner (
          id,
          title,
          ticket_type,
          created_by,
          status
        )
      `)
      .not('jira_reporter_account_id', 'is', null)
      .eq('tickets.ticket_type', 'BUG');

    if (ticketsError) {
      throw new Error(`Erreur lors de la récupération des tickets BUG: ${ticketsError.message}`);
    }

    if (!bugTickets || bugTickets.length === 0) {
      console.log('✅ Aucun ticket BUG trouvé avec rapporteur JIRA');
      return;
    }

    console.log(`📊 ${bugTickets.length} tickets BUG trouvés avec rapporteur JIRA\n`);

    // 2. Extraire les rapporteurs uniques
    const uniqueReporters = new Map();
    
    bugTickets.forEach(entry => {
      const reporterId = entry.jira_reporter_account_id;
      if (!uniqueReporters.has(reporterId)) {
        uniqueReporters.set(reporterId, {
          jira_account_id: reporterId,
          tickets: []
        });
      }
      uniqueReporters.get(reporterId).tickets.push({
        ticket_id: entry.ticket_id,
        jira_issue_key: entry.jira_issue_key,
        title: entry.tickets?.title || 'N/A',
        created_by: entry.tickets?.created_by || null,
        status: entry.tickets?.status || 'N/A'
      });
    });

    console.log(`👥 ${uniqueReporters.size} rapporteurs uniques trouvés\n`);

    // 3. Vérifier l'existence dans profiles
    const allReporterIds = Array.from(uniqueReporters.keys());
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, jira_user_id, full_name, email, role, department, is_active, company_id')
      .in('jira_user_id', allReporterIds);

    if (profilesError) {
      throw new Error(`Erreur lors de la récupération des profils: ${profilesError.message}`);
    }

    const profilesMap = new Map(profiles?.map(p => [p.jira_user_id, p]) || []);

    // 4. Analyser les résultats
    const reportersStatus = {
      exists: [],
      missing: [],
      incomplete: []
    };

    for (const [reporterId, info] of uniqueReporters.entries()) {
      const profile = profilesMap.get(reporterId);
      
      if (!profile) {
        reportersStatus.missing.push({
          jira_account_id: reporterId,
          tickets: info.tickets,
          missing_fields: ['profil complet']
        });
      } else {
        // Vérifier les champs manquants
        const missingFields = [];
        if (!profile.full_name) missingFields.push('full_name');
        if (!profile.email) missingFields.push('email');
        if (!profile.role) missingFields.push('role');
        if (!profile.department && !profile.department_id) missingFields.push('department/department_id');
        if (profile.is_active === null) missingFields.push('is_active');

        if (missingFields.length > 0) {
          reportersStatus.incomplete.push({
            jira_account_id: reporterId,
            profile_id: profile.id,
            full_name: profile.full_name || 'N/A',
            email: profile.email || 'N/A',
            role: profile.role || 'N/A',
            department: profile.department || 'N/A',
            is_active: profile.is_active,
            tickets: info.tickets,
            missing_fields: missingFields
          });
        } else {
          reportersStatus.exists.push({
            jira_account_id: reporterId,
            profile_id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            role: profile.role,
            department: profile.department || 'N/A',
            is_active: profile.is_active,
            tickets_count: info.tickets.length
          });
        }
      }
    }

    // 5. Afficher les résultats
    console.log('═'.repeat(80));
    console.log('\n📋 RÉSULTATS DE L\'ANALYSE\n');
    console.log('═'.repeat(80));

    // Rapporteurs existants et complets
    if (reportersStatus.exists.length > 0) {
      console.log(`\n✅ ${reportersStatus.exists.length} rapporteurs existants et complets:\n`);
      reportersStatus.exists.forEach(r => {
        console.log(`   - ${r.full_name} (${r.email})`);
        console.log(`     ID JIRA: ${r.jira_account_id}`);
        console.log(`     Profil ID: ${r.profile_id}`);
        console.log(`     Rôle: ${r.role}, Département: ${r.department}`);
        console.log(`     Tickets: ${r.tickets_count}`);
        console.log('');
      });
    }

    // Rapporteurs avec informations manquantes
    if (reportersStatus.incomplete.length > 0) {
      console.log(`\n⚠️  ${reportersStatus.incomplete.length} rapporteurs existants mais avec informations manquantes:\n`);
      reportersStatus.incomplete.forEach(r => {
        console.log(`   - ${r.full_name || 'NOM MANQUANT'} (${r.email || 'EMAIL MANQUANT'})`);
        console.log(`     ID JIRA: ${r.jira_account_id}`);
        console.log(`     Profil ID: ${r.profile_id}`);
        console.log(`     Rôle: ${r.role}, Département: ${r.department}`);
        console.log(`     ❌ Champs manquants: ${r.missing_fields.join(', ')}`);
        console.log(`     Tickets: ${r.tickets.length}`);
        if (r.tickets.length <= 3) {
          r.tickets.forEach(t => {
            console.log(`       - ${t.jira_issue_key}: ${t.title}`);
          });
        }
        console.log('');
      });
    }

    // Rapporteurs manquants
    if (reportersStatus.missing.length > 0) {
      console.log(`\n❌ ${reportersStatus.missing.length} rapporteurs NON trouvés dans Supabase:\n`);
      reportersStatus.missing.forEach(r => {
        console.log(`   - ID JIRA: ${r.jira_account_id}`);
        console.log(`     ❌ Aucun profil trouvé avec ce jira_user_id`);
        console.log(`     Tickets concernés: ${r.tickets.length}`);
        if (r.tickets.length <= 5) {
          r.tickets.forEach(t => {
            const status = t.created_by ? '✅' : '❌';
            console.log(`       ${status} ${t.jira_issue_key}: ${t.title} (created_by: ${t.created_by || 'NULL'})`);
          });
        } else {
          r.tickets.slice(0, 3).forEach(t => {
            const status = t.created_by ? '✅' : '❌';
            console.log(`       ${status} ${t.jira_issue_key}: ${t.title}`);
          });
          console.log(`       ... et ${r.tickets.length - 3} autres`);
        }
        console.log('');
      });
    }

    // Statistiques
    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 STATISTIQUES GLOBALES:\n');
    console.log(`   ✅ Rapporteurs complets: ${reportersStatus.exists.length}`);
    console.log(`   ⚠️  Rapporteurs incomplets: ${reportersStatus.incomplete.length}`);
    console.log(`   ❌ Rapporteurs manquants: ${reportersStatus.missing.length}`);
    console.log(`   📋 Total rapporteurs uniques: ${uniqueReporters.size}`);
    
    const totalTickets = bugTickets.length;
    const ticketsWithMissingReporters = reportersStatus.missing.reduce((sum, r) => sum + r.tickets.length, 0);
    const ticketsWithIncompleteReporters = reportersStatus.incomplete.reduce((sum, r) => sum + r.tickets.length, 0);
    
    console.log(`\n   📝 Total tickets BUG: ${totalTickets}`);
    console.log(`   ❌ Tickets avec rapporteurs manquants: ${ticketsWithMissingReporters}`);
    console.log(`   ⚠️  Tickets avec rapporteurs incomplets: ${ticketsWithIncompleteReporters}`);

    // Recommandations
    console.log('\n' + '═'.repeat(80));
    console.log('\n💡 RECOMMANDATIONS:\n');
    
    if (reportersStatus.missing.length > 0) {
      console.log('1. Créer les profils manquants:');
      console.log('   - Récupérer les noms/emails depuis JIRA pour chaque Account ID');
      console.log('   - Créer les profils dans Supabase avec jira_user_id');
      console.log('   - Remplir tous les champs requis (full_name, email, role, etc.)\n');
    }
    
    if (reportersStatus.incomplete.length > 0) {
      console.log('2. Compléter les profils existants:');
      reportersStatus.incomplete.forEach(r => {
        console.log(`   - Profil ID ${r.profile_id}: ajouter ${r.missing_fields.join(', ')}`);
      });
      console.log('');
    }
    
    console.log('3. Après correction, relancer la synchronisation pour mapper les tickets existants\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter le script
verifyBugReporters()
  .then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

