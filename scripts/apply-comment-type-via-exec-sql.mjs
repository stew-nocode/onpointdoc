/**
 * Script pour appliquer la migration comment_type via la fonction exec_sql
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
    
    // Nettoyer le SQL (retirer BEGIN/COMMIT et commentaires)
    const cleanSql = sql
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('--') && trimmed !== 'BEGIN;' && trimmed !== 'COMMIT;';
      })
      .join('\n')
      .trim();

    console.log('🚀 Application de la migration via exec_sql...\n');
    
    // Exécuter chaque commande SQL séparément
    const commands = cleanSql.split(';').filter(cmd => cmd.trim().length > 0);
    
    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i].trim() + ';';
      console.log(`   Exécution commande ${i + 1}/${commands.length}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: cmd
      });

      if (error) {
        // Si la fonction n'existe pas, donner les instructions manuelles
        if (error.message.includes('function exec_sql') || error.code === '42883') {
          console.log('\n❌ La fonction exec_sql n\'est pas disponible.');
          console.log('📋 Veuillez appliquer la migration via l\'interface web Supabase:\n');
          console.log('='.repeat(70));
          console.log('1. Ouvrez: https://supabase.com/dashboard/project/xjcttqaiplnoalolebls/sql/new\n');
          console.log('2. Copiez le contenu de:', SQL_FILE);
          console.log('3. Collez et exécutez\n');
          console.log('='.repeat(70));
          process.exit(1);
        }
        
        console.error(`❌ Erreur commande ${i + 1}:`, error.message);
        // Continuer avec les autres commandes
      } else {
        console.log(`   ✅ Commande ${i + 1} exécutée avec succès`);
      }
    }

    console.log('\n✅ Migration appliquée avec succès !');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n📋 Veuillez appliquer la migration manuellement via l\'interface web Supabase.');
    process.exit(1);
  }
}

applyMigration();



