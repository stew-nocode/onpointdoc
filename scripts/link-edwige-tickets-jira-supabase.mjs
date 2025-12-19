#!/usr/bin/env node

/**
 * Script pour lier les tickets Bug et Requêtes rapportés par "Edwidge Kouassi" dans JIRA
 * au profil "Edwige KOUASSI" dans Supabase
 * 
 * Processus:
 * 1. Trouve le profil "Edwige KOUASSI" (agent) dans Supabase
 * 2. Récupère tous les tickets OD depuis Supabase pour le produit OBC
 * 3. Pour chaque ticket, vérifie dans JIRA si le reporter est "Edwidge Kouassi"
 * 4. Met à jour le champ created_by dans Supabase
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env.local
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

// Configuration JIRA
const jiraUrl = process.env.JIRA_URL || process.env.JIRA_BASE_URL;
const jiraUsername = process.env.JIRA_USERNAME || process.env.JIRA_EMAIL || process.env.JIRA_API_EMAIL;
const jiraToken = process.env.JIRA_TOKEN || process.env.JIRA_API_TOKEN;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌ Variables Supabase manquantes');
  process.exit(1);
}

if (!jiraUrl || !jiraUsername || !jiraToken) {
  console.error('❌ Variables JIRA manquantes');
  process.exit(1);
}

const JIRA_URL = jiraUrl.replace(/^["']|["']$/g, '').replace(/\/$/, '').trim();
const JIRA_EMAIL = jiraUsername.replace(/^["']|["']$/g, '').trim();
const JIRA_API_TOKEN = jiraToken.replace(/^["']|["']$/g, '').replace(/\s+/g, '').trim();
const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false }
});

// AccountId JIRA de "Edwidge Kouassi" (trouvé précédemment)
const EDWIDGE_JIRA_USER_ID = '5fb4dd9e2730d800765b5774';

console.log('════════════════════════════════════════════════════════════════════════════════');
console.log('🔗 LIAISON DES TICKETS "EDWIDGE KOUASSI" → "EDWIGE KOUASSI"');
console.log('════════════════════════════════════════════════════════════════════════════════\n');

async function linkEdwigeTickets() {
  try {
    // 1. Trouver le profil "Edwige KOUASSI" (agent) dans Supabase
    console.log('🔍 Recherche du profil "Edwige KOUASSI" dans Supabase...');
    const { data: edwigeProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, jira_user_id, role')
      .ilike('full_name', '%edwige%kouassi%')
      .eq('role', 'agent')
      .limit(1)
      .single();

    if (profileError || !edwigeProfile) {
      console.error('❌ Profil "Edwige KOUASSI" (agent) non trouvé dans Supabase');
      console.error('   Erreur:', profileError?.message);
      return;
    }

    console.log(`✅ Profil trouvé: ${edwigeProfile.full_name} (${edwigeProfile.email})`);
    console.log(`   ID Supabase: ${edwigeProfile.id}`);
    console.log(`   JIRA User ID: ${edwigeProfile.jira_user_id || 'N/A'}\n`);

    // 2. Trouver le produit OBC
    console.log('🔍 Recherche du produit OBC...');
    const { data: obcProduct, error: productError } = await supabase
      .from('products')
      .select('id, name, jira_product_id')
      .ilike('name', '%obc%')
      .limit(1)
      .single();

    if (productError || !obcProduct) {
      console.error('❌ Produit OBC non trouvé dans Supabase');
      console.error('   Erreur:', productError?.message);
      return;
    }

    console.log(`✅ Produit trouvé: ${obcProduct.name} (ID: ${obcProduct.id})\n`);

    // 3. Récupérer tous les tickets OD pour le produit OBC (type BUG ou REQ)
    console.log('📥 Récupération des tickets OD pour le produit OBC (BUG/REQ)...');
    const { data: odTickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, jira_issue_key, title, ticket_type, product_id, created_by')
      .like('jira_issue_key', 'OD-%')
      .eq('product_id', obcProduct.id)
      .in('ticket_type', ['BUG', 'REQ'])
      .order('jira_issue_key', { ascending: true });

    if (ticketsError) {
      console.error('❌ Erreur lors de la récupération des tickets:', ticketsError.message);
      return;
    }

    console.log(`✅ ${odTickets.length} tickets OD (BUG/REQ) trouvés pour le produit OBC\n`);

    if (odTickets.length === 0) {
      console.log('⚠️  Aucun ticket à traiter.');
      return;
    }

    // 4. Pour chaque ticket, vérifier dans JIRA si le reporter est "Edwidge Kouassi"
    console.log('🔍 Vérification des reporters dans JIRA...\n');
    const ticketsToUpdate = [];
    let processed = 0;

    for (const ticket of odTickets) {
      const odKey = ticket.jira_issue_key;
      processed++;

      try {
        // Récupérer le ticket COMPLET depuis JIRA (tous les champs)
        const response = await fetch(
          `${JIRA_URL}/rest/api/3/issue/${odKey}?fields=*all`,
          {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Accept': 'application/json'
            }
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            continue; // Ticket non trouvé dans JIRA
          }
          if (response.status === 429) {
            console.log(`   ⏳ Rate limit atteint, attente de 5 secondes...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            continue;
          }
          continue;
        }

        const jiraTicket = await response.json();
        const reporter = jiraTicket.fields?.reporter;

        // Vérifier si le reporter est "Edwidge Kouassi" (par accountId ou displayName)
        if (reporter) {
          const isEdwidge = 
            reporter.accountId === EDWIDGE_JIRA_USER_ID ||
            reporter.displayName?.toLowerCase().includes('edwidge') ||
            reporter.displayName?.toLowerCase().includes('edwige');

          if (isEdwidge) {
            ticketsToUpdate.push({
              ticketId: ticket.id,
              jiraKey: odKey,
              title: ticket.title,
              ticketType: ticket.ticket_type,
              currentCreatedBy: ticket.created_by,
              reporterName: reporter.displayName,
              reporterAccountId: reporter.accountId
            });
            console.log(`✅ ${odKey}: Reporter = "${reporter.displayName}" (${reporter.accountId})`);
          }
        }

        if (processed % 50 === 0) {
          console.log(`   📊 ${processed}/${odTickets.length} tickets vérifiés... (${ticketsToUpdate.length} à mettre à jour)`);
        }

        // Pause pour éviter le rate limiting
        if (processed % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.error(`   ❌ Erreur pour ${odKey}: ${error.message}`);
      }
    }

    console.log(`\n✅ ${ticketsToUpdate.length} tickets à mettre à jour\n`);

    if (ticketsToUpdate.length === 0) {
      console.log('⚠️  Aucun ticket rapporté par "Edwidge Kouassi" trouvé.');
      return;
    }

    // 5. Afficher le résumé
    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log('📋 TICKETS À METTRE À JOUR');
    console.log('════════════════════════════════════════════════════════════════════════════════\n');

    ticketsToUpdate.slice(0, 10).forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.jiraKey} (${item.ticketType})`);
      console.log(`   ${item.title.substring(0, 80)}...`);
      console.log(`   Reporter JIRA: "${item.reporterName}"`);
      if (item.currentCreatedBy) {
        console.log(`   ⚠️  Déjà lié à un autre utilisateur (sera remplacé)`);
      }
      console.log('');
    });

    if (ticketsToUpdate.length > 10) {
      console.log(`   ... et ${ticketsToUpdate.length - 10} autres tickets\n`);
    }

    // 6. Demander confirmation avant mise à jour
    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log('⚠️  CONFIRMATION');
    console.log('════════════════════════════════════════════════════════════════════════════════\n');
    console.log(`📊 Résumé:`);
    console.log(`   - ${ticketsToUpdate.length} tickets à mettre à jour`);
    console.log(`   - Profil cible: ${edwigeProfile.full_name} (${edwigeProfile.id})`);
    console.log(`   - Produit: ${obcProduct.name}\n`);
    console.log('💡 Pour mettre à jour, relancez le script avec l\'option --confirm\n');

    // 7. Mettre à jour les tickets (si confirmé)
    if (process.argv.includes('--confirm')) {
      console.log('🔄 Mise à jour des tickets...\n');
      let updated = 0;
      let errors = 0;

      for (const item of ticketsToUpdate) {
        const { error: updateError } = await supabase
          .from('tickets')
          .update({ created_by: edwigeProfile.id })
          .eq('id', item.ticketId);

        if (updateError) {
          console.error(`   ❌ Erreur pour ${item.jiraKey}: ${updateError.message}`);
          errors++;
        } else {
          console.log(`   ✅ ${item.jiraKey} mis à jour`);
          updated++;
        }
      }

      console.log('\n════════════════════════════════════════════════════════════════════════════════');
      console.log('📊 RÉSULTAT');
      console.log('════════════════════════════════════════════════════════════════════════════════');
      console.log(`   ✅ Tickets mis à jour: ${updated}`);
      console.log(`   ❌ Erreurs: ${errors}\n`);
    } else {
      console.log('💡 Pour confirmer la mise à jour, relancez avec:');
      console.log(`   node scripts/link-edwige-tickets-jira-supabase.mjs --confirm\n`);
    }

  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

linkEdwigeTickets();

