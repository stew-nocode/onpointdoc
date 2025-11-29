#!/usr/bin/env node

/**
 * Script pour corriger les tickets créés avec un contact_user_id qui correspond
 * à un utilisateur interne (agent/manager). Ces tickets doivent être traités
 * comme des "constat interne" sans contact utilisateur.
 * 
 * Usage: node scripts/fix-tickets-agent-clients.mjs
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
    .replace(/\s+/g, ' ')
    .replace(/[^A-Z0-9\s]/g, '');
}

/**
 * Calcule la similarité entre deux noms
 */
function calculateSimilarity(name1, name2) {
  const normalized1 = normalizeName(name1);
  const normalized2 = normalizeName(name2);
  
  if (normalized1 === normalized2) {
    return 100;
  }
  
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return 90;
  }
  
  const words1 = normalized1.split(' ').filter(w => w.length > 2);
  const words2 = normalized2.split(' ').filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) {
    return 0;
  }
  
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

async function main() {
  try {
    console.log('═'.repeat(80));
    console.log('🔧 CORRECTION DES TICKETS AGENTS/CLIENTS');
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

    // 3. Identifier les correspondances entre internes et externes
    console.log('🔍 Identification des correspondances...');
    const internalIds = new Set(internalUsers?.map(u => u.id) || []);
    const internalToExternalMap = new Map(); // internal_id -> external_id

    for (const internal of internalUsers || []) {
      if (!internal.full_name) continue;
      
      for (const external of externalUsers || []) {
        if (!external.full_name) continue;
        
        const similarity = calculateSimilarity(internal.full_name, external.full_name);
        
        if (similarity >= 80) {
          internalToExternalMap.set(internal.id, external.id);
          console.log(`   ✅ "${internal.full_name}" (interne) ↔ "${external.full_name}" (externe) - ${similarity}%`);
        }
      }
    }

    const externalIdsToCheck = Array.from(internalToExternalMap.values());
    console.log(`\n✅ ${externalIdsToCheck.length} correspondance(s) trouvée(s)\n`);

    // 4. Récupérer tous les tickets avec un contact_user_id dans la liste des IDs externes
    console.log('📥 Récupération des tickets concernés...');
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, title, ticket_type, canal, contact_user_id, created_at, created_by')
      .in('contact_user_id', externalIdsToCheck)
      .order('created_at', { ascending: false });

    if (ticketsError) {
      throw new Error(`Erreur lors de la récupération des tickets: ${ticketsError.message}`);
    }

    console.log(`✅ ${tickets?.length || 0} ticket(s) trouvé(s) avec un contact utilisateur interne\n`);

    if (!tickets || tickets.length === 0) {
      console.log('✅ Aucun ticket à corriger\n');
      return;
    }

    // 5. Afficher les tickets à corriger
    console.log('═'.repeat(80));
    console.log('📋 TICKETS À CORRIGER');
    console.log('═'.repeat(80));
    console.log('');

    tickets.forEach((ticket, idx) => {
      const externalId = ticket.contact_user_id;
      const internalId = Array.from(internalToExternalMap.entries())
        .find(([_, extId]) => extId === externalId)?.[0];
      const internalUser = internalUsers?.find(u => u.id === internalId);
      
      console.log(`   ${idx + 1}. Ticket ID: ${ticket.id}`);
      console.log(`      Titre: ${ticket.title}`);
      console.log(`      Type: ${ticket.ticket_type}`);
      console.log(`      Canal actuel: ${ticket.canal || 'N/A'}`);
      console.log(`      Contact (externe): ${externalId}`);
      if (internalUser) {
        console.log(`      → Agent/Manager interne: ${internalUser.full_name} (${internalUser.role})`);
      }
      console.log('');
    });

    // 6. Mettre à jour les tickets
    console.log('═'.repeat(80));
    console.log('🔧 CORRECTION DES TICKETS');
    console.log('═'.repeat(80));
    console.log('');

    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const ticket of tickets) {
      try {
        // Mettre à jour le ticket
        const { error: updateError } = await supabase
          .from('tickets')
          .update({
            canal: 'Constat Interne',
            contact_user_id: null,
            last_update_source: 'supabase'
          })
          .eq('id', ticket.id);

        if (updateError) {
          console.error(`   ❌ Erreur pour le ticket ${ticket.id}: ${updateError.message}`);
          errors.push({ ticketId: ticket.id, error: updateError.message });
          errorCount++;
        } else {
          console.log(`   ✅ Ticket "${ticket.title}" (${ticket.id}) corrigé`);
          updatedCount++;
        }
      } catch (err) {
        console.error(`   ❌ Erreur pour le ticket ${ticket.id}: ${err.message}`);
        errors.push({ ticketId: ticket.id, error: err.message });
        errorCount++;
      }
    }

    // 7. Résumé
    console.log('');
    console.log('═'.repeat(80));
    console.log('📊 RÉSULTAT');
    console.log('═'.repeat(80));
    console.log(`   ✅ ${updatedCount} ticket(s) corrigé(s)`);
    console.log(`   ❌ ${errorCount} erreur(s)`);
    console.log('');

    if (errors.length > 0) {
      console.log('❌ Erreurs détaillées:');
      errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. Ticket ${err.ticketId}: ${err.error}`);
      });
      console.log('');
    }

    console.log('═'.repeat(80));
    console.log('✅ Correction terminée');
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





