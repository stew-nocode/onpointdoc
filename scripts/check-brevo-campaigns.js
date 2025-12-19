/**
 * Script pour vérifier les données Brevo directement via l'API
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

const apiKey = process.env.BREVO_API_KEY;
if (!apiKey) {
  console.log('❌ BREVO_API_KEY non trouvée dans .env.local');
  process.exit(1);
}

const cleanKey = apiKey.replace(/["']/g, '').trim();

async function checkBrevo() {
  console.log('🔍 Vérification des campagnes Brevo...\n');
  
  try {
    const response = await fetch('https://api.brevo.com/v3/emailCampaigns?limit=10&statistics=globalStats', {
      headers: { 'api-key': cleanKey }
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Erreur API:', response.status, error);
      return;
    }
    
    const data = await response.json();
    
    console.log('📊 RÉSUMÉ BREVO');
    console.log('================');
    console.log(`Total campagnes: ${data.count}`);
    console.log(`Récupérées: ${data.campaigns?.length || 0}\n`);
    
    console.log('📧 DÉTAIL DES CAMPAGNES (Top 5)');
    console.log('================================');
    
    data.campaigns?.slice(0, 5).forEach((c, i) => {
      const stats = c.statistics?.globalStats || {};
      console.log(`\n${i + 1}. ${c.name}`);
      console.log(`   Status: ${c.status}`);
      console.log(`   Envoyés: ${stats.sent || 0}`);
      console.log(`   Délivrés: ${stats.delivered || 0}`);
      console.log(`   Ouvertures uniques: ${stats.uniqueViews || stats.uniqueOpens || 0}`);
      console.log(`   Taux ouverture: ${stats.viewed || stats.openRate || 0}%`);
      console.log(`   Clics uniques: ${stats.uniqueClicks || 0}`);
      console.log(`   Taux de clics: ${stats.clickers || stats.clickRate || 0}%`);
    });
    
    // Vérifier les taux > 100 (problème potentiel)
    console.log('\n\n🔍 VÉRIFICATION DES TAUX:');
    data.campaigns?.forEach(c => {
      const stats = c.statistics?.globalStats || {};
      const viewed = stats.viewed || 0;
      const clickers = stats.clickers || 0;
      const opensRate = stats.opensRate || 0;
      
      if (viewed > 100 || clickers > 100 || opensRate > 100) {
        console.log(`⚠️ ${c.name}: viewed=${viewed}, clickers=${clickers}, opensRate=${opensRate}`);
      }
    });
    
    // Afficher les stats brutes de la première campagne pour debug
    if (data.campaigns?.[0]?.statistics) {
      console.log('\n\n🔬 STATS BRUTES (1ère campagne):');
      console.log(JSON.stringify(data.campaigns[0].statistics, null, 2));
    }
    
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
}

checkBrevo();

