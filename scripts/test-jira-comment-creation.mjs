/**
 * Script de test pour vérifier la création de commentaires Supabase → JIRA
 * 
 * Usage:
 *   node scripts/test-jira-comment-creation.mjs <ticket_id> [comment_content]
 * 
 * Exemple:
 *   node scripts/test-jira-comment-creation.mjs abc123 "Test commentaire depuis Supabase"
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Charger les variables d'environnement
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Teste la création d'un commentaire sur un ticket lié à JIRA
 */
async function testCommentCreation() {
  const ticketId = process.argv[2];
  const commentContent = process.argv[3] || 'Test commentaire depuis Supabase - ' + new Date().toISOString();

  if (!ticketId) {
    console.error('❌ Usage: node scripts/test-jira-comment-creation.mjs <ticket_id> [comment_content]');
    process.exit(1);
  }

  console.log('🧪 Test de création de commentaire Supabase → JIRA\n');
  console.log(`📋 Ticket ID: ${ticketId}`);
  console.log(`💬 Contenu: ${commentContent}\n`);

  try {
    // 1. Vérifier que le ticket existe et a une jira_issue_key
    console.log('1️⃣  Vérification du ticket...');
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, title, jira_issue_key, ticket_type')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error('❌ Ticket non trouvé:', ticketError?.message);
      process.exit(1);
    }

    console.log(`   ✅ Ticket trouvé: ${ticket.title}`);
    console.log(`   📌 Type: ${ticket.ticket_type}`);

    if (!ticket.jira_issue_key) {
      console.warn('⚠️  ATTENTION: Ce ticket n\'a pas de jira_issue_key');
      console.warn('   Le commentaire sera créé dans Supabase mais PAS dans JIRA');
      console.warn('   Pour tester la synchronisation JIRA, utilisez un ticket avec jira_issue_key\n');
    } else {
      console.log(`   🔗 JIRA Issue Key: ${ticket.jira_issue_key}\n`);
    }

    // 2. Compter les commentaires avant
    console.log('2️⃣  Comptage des commentaires existants...');
    const { count: countBefore } = await supabase
      .from('ticket_comments')
      .select('*', { count: 'exact', head: true })
      .eq('ticket_id', ticketId);

    console.log(`   📊 Commentaires avant: ${countBefore || 0}\n`);

    // 3. Créer le commentaire via l'API Next.js (simulation)
    // Note: On ne peut pas appeler directement createComment car il nécessite une session utilisateur
    // On va créer directement dans Supabase pour le test, mais en production c'est via l'API
    console.log('3️⃣  Création du commentaire dans Supabase...');
    
    // Pour un vrai test, il faudrait appeler l'API Next.js avec authentification
    // Ici on simule juste la création directe dans Supabase
    const { data: comment, error: commentError } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id: ticketId,
        content: commentContent,
        origin: 'app',
        comment_type: 'comment',
        user_id: null // Pour le test, on met null (en production ce serait l'ID de l'utilisateur)
      })
      .select('id, content, origin, created_at')
      .single();

    if (commentError || !comment) {
      console.error('❌ Erreur lors de la création du commentaire:', commentError?.message);
      process.exit(1);
    }

    console.log(`   ✅ Commentaire créé dans Supabase`);
    console.log(`   📝 ID: ${comment.id}`);
    console.log(`   🏷️  Origin: ${comment.origin}`);
    console.log(`   📅 Créé le: ${comment.created_at}\n`);

    // 4. Vérifier que le commentaire existe
    console.log('4️⃣  Vérification du commentaire créé...');
    const { data: verifyComment, error: verifyError } = await supabase
      .from('ticket_comments')
      .select('*')
      .eq('id', comment.id)
      .single();

    if (verifyError || !verifyComment) {
      console.error('❌ Erreur lors de la vérification:', verifyError?.message);
      process.exit(1);
    }

    console.log(`   ✅ Commentaire vérifié dans Supabase\n`);

    // 5. Si le ticket a une jira_issue_key, vérifier dans JIRA (manuellement)
    if (ticket.jira_issue_key) {
      console.log('5️⃣  Vérification JIRA (à faire manuellement)...');
      console.log(`   🔗 URL JIRA: ${process.env.JIRA_URL || 'NON CONFIGURÉ'}/browse/${ticket.jira_issue_key}`);
      console.log(`   📋 Instructions:`);
      console.log(`      1. Ouvrez le ticket JIRA ${ticket.jira_issue_key}`);
      console.log(`      2. Vérifiez que le commentaire "${commentContent.substring(0, 50)}..." apparaît`);
      console.log(`      3. Le commentaire devrait avoir été créé automatiquement\n`);
    }

    // 6. Résumé
    console.log('✅ Test terminé avec succès!\n');
    console.log('📊 Résumé:');
    console.log(`   - Ticket: ${ticket.title} (${ticket.ticket_type})`);
    console.log(`   - Commentaire créé: ${comment.id}`);
    console.log(`   - Origin: ${comment.origin}`);
    if (ticket.jira_issue_key) {
      console.log(`   - JIRA: ${ticket.jira_issue_key} (vérification manuelle requise)`);
    } else {
      console.log(`   - JIRA: Non applicable (pas de jira_issue_key)`);
    }

    console.log('\n💡 Note: Pour tester la création automatique dans JIRA,');
    console.log('   utilisez un ticket avec jira_issue_key et créez le commentaire');
    console.log('   via l\'interface utilisateur (qui appellera createComment avec synchronisation JIRA)');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    process.exit(1);
  }
}

// Exécuter le test
testCommentCreation();


