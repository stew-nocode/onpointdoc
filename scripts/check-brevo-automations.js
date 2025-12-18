/**
 * Script pour vérifier les automatisations Brevo
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

const apiKey = process.env.BREVO_API_KEY;
if (!apiKey) {
  console.log('❌ BREVO_API_KEY non trouvée');
  process.exit(1);
}

const cleanKey = apiKey.replace(/["']/g, '').trim();

async function checkAutomations() {
  console.log('🔍 Vérification des automatisations Brevo...\n');
  
  try {
    // Tester l'endpoint workflows (Marketing Automation)
    const response = await fetch('https://api.brevo.com/v3/workflows?limit=50', {
      headers: { 'api-key': cleanKey }
    });
    
    const data = await response.json();
    
    console.log('📊 AUTOMATISATIONS BREVO');
    console.log('========================');
    
    if (!response.ok) {
      console.log('❌ Erreur API:', response.status);
      console.log('Réponse:', JSON.stringify(data, null, 2));
      return;
    }
    
    console.log('Total workflows:', data.count || data.workflows?.length || 0);
    
    if (data.workflows && data.workflows.length > 0) {
      data.workflows.forEach((w, i) => {
        console.log(`\n${i + 1}. ${w.name}`);
        console.log('   ID:', w.id);
        console.log('   Status:', w.status);
        console.log('   Type:', w.type);
        if (w.stats) {
          console.log('   Stats:', JSON.stringify(w.stats));
        }
      });
    } else {
      console.log('\n⚠️ Aucun workflow d\'automatisation trouvé dans ton compte Brevo.');
      console.log('   Les automatisations se créent dans Brevo > Automation > Workflows');
    }
    
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
}

checkAutomations();








