/**
 * Script d'identification et de flagging des relances historiques
 * 
 * Processus :
 * 1. Identifie les relances via objet_principal explicite
 * 2. Identifie les relances via mots-clés dans titre/description
 * 3. Détermine le type (bug/requete) selon le contexte
 * 4. Met à jour is_relance et relance_type
 * 5. Mode DRY-RUN par défaut avec confirmation
 * 
 * Usage:
 *   node scripts/flag-relances-historical.mjs [--execute]
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '..', '.env.local') });

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
 * Détermine si un ticket est une relance et son type
 */
function identifyRelance(ticket) {
  const { objet_principal, title, description } = ticket;
  const titleLower = (title || '').toLowerCase();
  const descLower = (description || '').toLowerCase();
  const objetLower = (objet_principal || '').toLowerCase();

  // 1. Relances explicites via objet_principal
  if (objetLower.includes('relance sur bug')) {
    return { isRelance: true, type: 'bug' };
  }
  if (objetLower.includes('relance sur requête') || objetLower.includes('relance sur requete')) {
    return { isRelance: true, type: 'requete' };
  }

  // 2. Relances via mots-clés dans titre/description
  const hasRelance = titleLower.includes('relance') || descLower.includes('relance');
  if (!hasRelance) {
    return { isRelance: false, type: null };
  }

  // Déterminer le type selon le contexte
  const bugKeywords = ['bug', 'erreur', 'dysfonctionnement', 'problème technique', 'correction'];
  const requeteKeywords = ['requête', 'requete', 'demande', 'intégration', 'modification', 'ajustement'];

  const hasBugContext = bugKeywords.some(kw => titleLower.includes(kw) || descLower.includes(kw));
  const hasRequeteContext = requeteKeywords.some(kw => titleLower.includes(kw) || descLower.includes(kw));

  if (hasBugContext && !hasRequeteContext) {
    return { isRelance: true, type: 'bug' };
  }
  if (hasRequeteContext && !hasBugContext) {
    return { isRelance: true, type: 'requete' };
  }
  if (hasBugContext && hasRequeteContext) {
    // Si les deux, prioriser selon objet_principal
    if (objetLower.includes('bug')) return { isRelance: true, type: 'bug' };
    if (objetLower.includes('requête') || objetLower.includes('requete')) return { isRelance: true, type: 'requete' };
    // Par défaut, considérer comme requête (plus fréquent)
    return { isRelance: true, type: 'requete' };
  }

  // Relance sans contexte clair
  return { isRelance: true, type: null };
}

/**
 * Traite tous les tickets Assistance
 */
async function flagRelances() {
  console.log('🔍 Recherche des tickets Assistance...\n');

  // Récupérer tous les tickets Assistance
  const { data: tickets, error: fetchError } = await supabase
    .from('tickets')
    .select('id, title, description, objet_principal, is_relance, relance_type')
    .eq('ticket_type', 'ASSISTANCE');

  if (fetchError) {
    console.error('❌ Erreur lors de la récupération des tickets:', fetchError);
    process.exit(1);
  }

  if (!tickets || tickets.length === 0) {
    console.log('ℹ️  Aucun ticket Assistance trouvé');
    return;
  }

  console.log(`📊 ${tickets.length} tickets Assistance trouvés\n`);

  // Identifier les relances
  const updates = [];
  const stats = {
    total: tickets.length,
    alreadyFlagged: 0,
    newRelances: 0,
    bugRelances: 0,
    requeteRelances: 0,
    unclearRelances: 0,
    noRelance: 0
  };

  for (const ticket of tickets) {
    const { isRelance, type } = identifyRelance(ticket);

    // Si déjà flaggé correctement, ignorer
    if (ticket.is_relance === isRelance && ticket.relance_type === type) {
      stats.alreadyFlagged++;
      continue;
    }

    if (isRelance) {
      // Toujours mettre à jour si c'est une relance, même si déjà partiellement flaggé
      updates.push({
        id: ticket.id,
        is_relance: true,
        relance_type: type
      });

      stats.newRelances++;
      if (type === 'bug') stats.bugRelances++;
      else if (type === 'requete') stats.requeteRelances++;
      else stats.unclearRelances++;
    } else {
      // Ne pas mettre à jour les non-relances si déjà flaggé (garder l'historique)
      if (!ticket.is_relance) {
        stats.noRelance++;
      }
    }
  }

  // Afficher les statistiques
  console.log('📈 Statistiques:');
  console.log(`   Total tickets: ${stats.total}`);
  console.log(`   Déjà flaggés correctement: ${stats.alreadyFlagged}`);
  console.log(`   Nouvelles relances à flagger: ${stats.newRelances}`);
  console.log(`   ├─ Relances sur Bug: ${stats.bugRelances}`);
  console.log(`   ├─ Relances sur Requête: ${stats.requeteRelances}`);
  console.log(`   └─ Relances type indéterminé: ${stats.unclearRelances}`);
  console.log(`   Non-relances: ${stats.noRelance}\n`);

  if (updates.length === 0) {
    console.log('✅ Aucune mise à jour nécessaire\n');
    return;
  }

  // Afficher quelques exemples
  console.log('📝 Exemples de tickets à mettre à jour:');
  const examples = updates.slice(0, 5);
  for (const update of examples) {
    const ticket = tickets.find(t => t.id === update.id);
    console.log(`   - ${ticket.title.substring(0, 60)}...`);
    console.log(`     → is_relance: true, relance_type: ${update.relance_type || 'null'}`);
  }
  if (updates.length > 5) {
    console.log(`   ... et ${updates.length - 5} autres\n`);
  }

  // Exécuter les mises à jour
  if (isDryRun) {
    console.log('🔍 Mode DRY-RUN - Aucune modification effectuée');
    console.log('💡 Pour appliquer les modifications, relancez avec: node scripts/flag-relances-historical.mjs --execute\n');
    return;
  }

  console.log('⏳ Mise à jour en cours...\n');

  let successCount = 0;
  let errorCount = 0;

  // Mise à jour par batch de 100
  for (let i = 0; i < updates.length; i += 100) {
    const batch = updates.slice(i, i + 100);
    
    for (const update of batch) {
      const { error } = await supabase
        .from('tickets')
        .update({
          is_relance: update.is_relance,
          relance_type: update.relance_type
        })
        .eq('id', update.id);

      if (error) {
        console.error(`❌ Erreur pour ticket ${update.id}:`, error.message);
        errorCount++;
      } else {
        successCount++;
      }
    }

    if (i + 100 < updates.length) {
      console.log(`   Progression: ${Math.min(i + 100, updates.length)}/${updates.length}`);
    }
  }

  console.log('\n✅ Mise à jour terminée:');
  console.log(`   ✅ Succès: ${successCount}`);
  if (errorCount > 0) {
    console.log(`   ❌ Erreurs: ${errorCount}`);
  }
  console.log();
}

// Exécution
flagRelances().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});


