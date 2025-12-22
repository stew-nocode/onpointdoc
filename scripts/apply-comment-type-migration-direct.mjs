/**
 * Script pour appliquer la migration comment_type à ticket_comments
 * Utilise l'API Supabase avec SERVICE_ROLE_KEY pour exécuter les commandes SQL directement
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger .env.local
const envPath = join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Erreur: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquants dans .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function applyMigration() {
  try {
    console.log('🚀 Application de la migration comment_type...\n');

    // Étape 1: Vérifier si la colonne existe déjà
    console.log('1️⃣  Vérification de l\'existence de la colonne...');
    const { data: existingColumns, error: checkError } = await supabase
      .from('ticket_comments')
      .select('comment_type')
      .limit(1);

    if (!checkError && existingColumns !== null) {
      console.log('✅ La colonne comment_type existe déjà !');
      return;
    }

    // Si erreur différente de "column does not exist", on continue
    if (checkError && !checkError.message.includes('does not exist') && !checkError.message.includes('42703')) {
      console.log('⚠️  Erreur lors de la vérification:', checkError.message);
      console.log('   Continuons quand même...\n');
    }

    // Étape 2: Ajouter la colonne via une requête SQL brute
    // Note: Supabase JS client ne permet pas d'exécuter ALTER TABLE directement
    // Il faut utiliser l'interface web ou psql
    
    console.log('❌ L\'API Supabase JS ne permet pas d\'exécuter ALTER TABLE directement.');
    console.log('📋 Veuillez appliquer la migration via l\'interface web Supabase:\n');
    console.log('='.repeat(70));
    console.log('1. Ouvrez votre navigateur et allez sur:');
    console.log('   https://supabase.com/dashboard/project/xjcttqaiplnoalolebls/sql/new\n');
    console.log('2. Copiez et collez ce SQL:\n');
    console.log('-- Ajouter la colonne comment_type');
    console.log('ALTER TABLE ticket_comments');
    console.log('ADD COLUMN IF NOT EXISTS comment_type TEXT DEFAULT \'comment\'');
    console.log('CHECK (comment_type IN (\'comment\', \'followup\'));');
    console.log('');
    console.log('-- Créer l\'index');
    console.log('CREATE INDEX IF NOT EXISTS idx_ticket_comments_comment_type');
    console.log('ON ticket_comments(ticket_id, comment_type);');
    console.log('');
    console.log('-- Mettre à jour les commentaires existants');
    console.log('UPDATE ticket_comments');
    console.log('SET comment_type = \'followup\'');
    console.log('WHERE content ILIKE \'%relance%\';');
    console.log('');
    console.log('3. Cliquez sur "Run" ou appuyez sur Ctrl+Enter\n');
    console.log('='.repeat(70));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

applyMigration();



