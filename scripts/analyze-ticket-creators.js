/**
 * Script pour analyser les créateurs de tickets
 * 
 * Identifie qui a créé le plus de tickets et affiche les statistiques
 * 
 * Usage: node scripts/analyze-ticket-creators.js
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

async function analyzeTicketCreators() {
  console.log('📊 Analyse des créateurs de tickets...\n');

  try {
    // 1. Récupérer tous les tickets avec leurs créateurs
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select(`
        id,
        title,
        ticket_type,
        created_by,
        created_at,
        status,
        profiles!tickets_created_by_fkey (
          id,
          full_name,
          email,
          role,
          jira_user_id,
          departments (
            name,
            code
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (ticketsError) {
      throw new Error(`Erreur lors de la récupération des tickets: ${ticketsError.message}`);
    }

    if (!tickets || tickets.length === 0) {
      console.log('✅ Aucun ticket trouvé');
      return;
    }

    console.log(`📋 ${tickets.length} tickets trouvés au total\n`);

    // 2. Compter les tickets par créateur
    const creatorStats = new Map();
    let nullCreators = 0;
    let nullCreatorTickets = [];

    tickets.forEach(ticket => {
      if (!ticket.created_by) {
        nullCreators++;
        nullCreatorTickets.push({
          id: ticket.id,
          title: ticket.title,
          ticket_type: ticket.ticket_type,
          created_at: ticket.created_at
        });
      } else {
        const profile = ticket.profiles;
        if (profile) {
          const creatorId = profile.id;
          if (!creatorStats.has(creatorId)) {
            creatorStats.set(creatorId, {
              profile: profile,
              count: 0,
              byType: {
                BUG: 0,
                REQ: 0,
                ASSISTANCE: 0
              },
              tickets: []
            });
          }
          const stats = creatorStats.get(creatorId);
          stats.count++;
          stats.byType[ticket.ticket_type] = (stats.byType[ticket.ticket_type] || 0) + 1;
          stats.tickets.push({
            id: ticket.id,
            title: ticket.title,
            ticket_type: ticket.ticket_type,
            created_at: ticket.created_at,
            status: ticket.status
          });
        }
      }
    });

    // 3. Trier par nombre de tickets (décroissant)
    const sortedCreators = Array.from(creatorStats.entries())
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.count - a.count);

    // 4. Afficher les résultats
    console.log('═'.repeat(80));
    console.log('📊 TOP CRÉATEURS DE TICKETS');
    console.log('═'.repeat(80));
    console.log('');

    if (sortedCreators.length === 0) {
      console.log('⚠️  Aucun créateur identifié');
    } else {
      console.log(`🏆 Top 20 créateurs de tickets:\n`);
      
      sortedCreators.slice(0, 20).forEach((creator, index) => {
        const profile = creator.profile;
        const dept = profile.departments ? `${profile.departments.name} (${profile.departments.code})` : 'N/A';
        
        console.log(`${(index + 1).toString().padStart(2, ' ')}. ${profile.full_name || 'N/A'}`);
        console.log(`    📧 Email: ${profile.email || 'N/A'}`);
        console.log(`    👤 Rôle: ${profile.role || 'N/A'}`);
        console.log(`    🏢 Département: ${dept}`);
        console.log(`    🔑 JIRA ID: ${profile.jira_user_id || 'N/A'}`);
        console.log(`    📊 Total tickets: ${creator.count}`);
        console.log(`       - BUG: ${creator.byType.BUG || 0}`);
        console.log(`       - REQ: ${creator.byType.REQ || 0}`);
        console.log(`       - ASSISTANCE: ${creator.byType.ASSISTANCE || 0}`);
        console.log('');
      });
    }

    // 5. Afficher les tickets sans créateur
    if (nullCreators > 0) {
      console.log('═'.repeat(80));
      console.log(`⚠️  TICKETS SANS CRÉATEUR (created_by = NULL)`);
      console.log('═'.repeat(80));
      console.log(`\n📋 ${nullCreators} tickets sans créateur identifié\n`);
      
      // Grouper par type
      const byType = {
        BUG: nullCreatorTickets.filter(t => t.ticket_type === 'BUG'),
        REQ: nullCreatorTickets.filter(t => t.ticket_type === 'REQ'),
        ASSISTANCE: nullCreatorTickets.filter(t => t.ticket_type === 'ASSISTANCE')
      };

      console.log(`   - BUG: ${byType.BUG.length}`);
      console.log(`   - REQ: ${byType.REQ.length}`);
      console.log(`   - ASSISTANCE: ${byType.ASSISTANCE.length}`);
      
      if (nullCreatorTickets.length <= 20) {
        console.log('\n📝 Liste des tickets:');
        nullCreatorTickets.forEach((ticket, index) => {
          console.log(`   ${(index + 1).toString().padStart(2, ' ')}. [${ticket.ticket_type}] ${ticket.title}`);
          console.log(`      ID: ${ticket.id}`);
          console.log(`      Créé le: ${new Date(ticket.created_at).toLocaleDateString('fr-FR')}`);
        });
      } else {
        console.log('\n📝 Exemples de tickets (20 premiers):');
        nullCreatorTickets.slice(0, 20).forEach((ticket, index) => {
          console.log(`   ${(index + 1).toString().padStart(2, ' ')}. [${ticket.ticket_type}] ${ticket.title}`);
          console.log(`      ID: ${ticket.id}`);
        });
      }
      console.log('');
    }

    // 6. Statistiques globales
    console.log('═'.repeat(80));
    console.log('📈 STATISTIQUES GLOBALES');
    console.log('═'.repeat(80));
    console.log('');
    console.log(`📋 Total tickets: ${tickets.length}`);
    console.log(`✅ Tickets avec créateur: ${tickets.length - nullCreators}`);
    console.log(`❌ Tickets sans créateur: ${nullCreators}`);
    console.log(`👥 Créateurs uniques: ${sortedCreators.length}`);
    console.log('');

    // Statistiques par type
    const byType = {
      BUG: tickets.filter(t => t.ticket_type === 'BUG').length,
      REQ: tickets.filter(t => t.ticket_type === 'REQ').length,
      ASSISTANCE: tickets.filter(t => t.ticket_type === 'ASSISTANCE').length
    };
    console.log('📊 Répartition par type:');
    console.log(`   - BUG: ${byType.BUG}`);
    console.log(`   - REQ: ${byType.REQ}`);
    console.log(`   - ASSISTANCE: ${byType.ASSISTANCE}`);
    console.log('');

    // Top créateur
    if (sortedCreators.length > 0) {
      const topCreator = sortedCreators[0];
      console.log('═'.repeat(80));
      console.log('🏆 CRÉATEUR #1');
      console.log('═'.repeat(80));
      console.log('');
      console.log(`👤 Nom: ${topCreator.profile.full_name || 'N/A'}`);
      console.log(`📧 Email: ${topCreator.profile.email || 'N/A'}`);
      console.log(`👤 Rôle: ${topCreator.profile.role || 'N/A'}`);
      console.log(`📊 Total tickets créés: ${topCreator.count}`);
      console.log(`   - BUG: ${topCreator.byType.BUG || 0}`);
      console.log(`   - REQ: ${topCreator.byType.REQ || 0}`);
      console.log(`   - ASSISTANCE: ${topCreator.byType.ASSISTANCE || 0}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter le script
analyzeTicketCreators()
  .then(() => {
    console.log('✅ Analyse terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

