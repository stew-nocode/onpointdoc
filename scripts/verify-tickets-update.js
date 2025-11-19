/**
 * Script pour vérifier pourquoi les tickets n'ont pas été mis à jour
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch {
  dotenv.config();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verify() {
  // Vérifier EVA BASSE
  const evaJiraId = '712020:d4a5e54b-dc78-41d8-a397-cc5dbd0461f0';
  const evaProfileId = '62494f26-691b-4332-b831-07741d927779';
  
  console.log('🔍 Vérification pour EVA BASSE...\n');
  
  // Récupérer les tickets depuis jira_sync
  const { data: jiraSync, error } = await supabase
    .from('jira_sync')
    .select(`
      ticket_id,
      jira_issue_key,
      jira_reporter_account_id,
      tickets!inner (
        id,
        title,
        created_by
      )
    `)
    .eq('jira_reporter_account_id', evaJiraId)
    .limit(10);

  if (error) {
    console.error('Erreur:', error.message);
    return;
  }

  console.log(`📊 ${jiraSync?.length || 0} tickets trouvés dans jira_sync avec ce rapporteur\n`);
  
  if (jiraSync && jiraSync.length > 0) {
    console.log('Exemples:');
    jiraSync.forEach(entry => {
      const ticket = entry.tickets;
      console.log(`  - ${entry.jira_issue_key}: created_by = ${ticket?.created_by || 'NULL'}`);
      if (ticket?.created_by !== evaProfileId) {
        console.log(`    ⚠️  Doit être mis à jour vers ${evaProfileId}`);
      }
    });
  }
}

verify().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

