/**
 * Script pour appliquer la migration comment_type à ticket_comments
 * Utilise l'API Supabase avec SERVICE_ROLE_KEY
 */

import { readFileSync } from 'fs';
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

const SQL_FILE = join(process.cwd(), 'supabase', 'migrations', '2025-12-11-add-comment-type-to-ticket-comments.sql');

async function applyMigration() {
  try {
    console.log('📝 Lecture de la migration...');
    const sql = readFileSync(SQL_FILE, 'utf-8');
    
    // Nettoyer le SQL (retirer les commentaires et lignes vides pour l'API)
    const cleanSql = sql
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('--') && trimmed !== 'BEGIN;' && trimmed !== 'COMMIT;';
      })
      .join('\n')
      .trim();

    console.log('🚀 Application de la migration...');
    
    // Utiliser rpc pour exécuter le SQL
    // Note: Supabase ne permet pas d'exécuter du SQL arbitraire via l'API
    // Il faut utiliser l'interface web ou psql
    // Mais on peut vérifier si la colonne existe déjà
    
    const { data: checkColumn, error: checkError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
            AND table_name = 'ticket_comments' 
            AND column_name = 'comment_type';
        `
      });

    if (checkError) {
      // La fonction exec_sql n'existe peut-être pas, on va utiliser une autre approche
      console.log('⚠️  La fonction exec_sql n\'est pas disponible.');
      console.log('📋 Instructions pour appliquer la migration manuellement:\n');
      console.log('='.repeat(70));
      console.log('1. Ouvrez votre navigateur et allez sur:');
      console.log('   https://supabase.com/dashboard/project/xjcttqaiplnoalolebls/sql/new\n');
      console.log('2. Copiez le contenu du fichier:');
      console.log(`   ${SQL_FILE}\n`);
      console.log('3. Collez dans l\'éditeur SQL de Supabase\n');
      console.log('4. Cliquez sur "Run" ou appuyez sur Ctrl+Enter\n');
      console.log('='.repeat(70));
      process.exit(0);
    }

    // Si la colonne existe déjà
    if (checkColumn && checkColumn.length > 0) {
      console.log('✅ La colonne comment_type existe déjà !');
      process.exit(0);
    }

    // Essayer d'appliquer via exec_sql si disponible
    const { data, error } = await supabase.rpc('exec_sql', {
      query: cleanSql
    });

    if (error) {
      console.error('❌ Erreur lors de l\'application de la migration:', error);
      console.log('\n📋 Veuillez appliquer la migration manuellement via l\'interface web Supabase.');
      process.exit(1);
    }

    console.log('✅ Migration appliquée avec succès !');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n📋 Veuillez appliquer la migration manuellement via l\'interface web Supabase.');
    process.exit(1);
  }
}

applyMigration();



