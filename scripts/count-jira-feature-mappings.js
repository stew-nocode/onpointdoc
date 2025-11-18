import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const { data, count, error } = await supabase
  .from('jira_feature_mapping')
  .select('jira_feature_value, feature_id', { count: 'exact' });

if (error) {
  console.error('❌ Erreur:', error);
  process.exit(1);
}

console.log(`\n✅ Total mappings créés: ${count || data?.length || 0}\n`);

if (data && data.length > 0) {
  console.log('Mappings existants:');
  data.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.jira_feature_value} → ${m.feature_id ? '✅' : '❌'}`);
  });
}

