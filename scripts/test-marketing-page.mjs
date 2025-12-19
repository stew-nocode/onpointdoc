#!/usr/bin/env node
/**
 * Test de la page Marketing Email
 * Vérifie que la page est accessible et s'affiche correctement
 */

console.log('🧪 Test de la page Marketing Email\n');
console.log('━'.repeat(60) + '\n');

const testUrl = 'http://localhost:3000/marketing/email';

async function testMarketingPage() {
  console.log(`📍 URL testée: ${testUrl}\n`);

  try {
    console.log('⏳ Chargement de la page...');

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Test Script)'
      }
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}\n`);

    if (response.status === 200) {
      const html = await response.text();

      // Vérifications du contenu
      const checks = [
        { name: 'Titre "Email Marketing"', found: html.includes('Email Marketing') },
        { name: 'Bouton "Synchroniser"', found: html.includes('Synchroniser') },
        { name: 'Bouton "Nouvelle campagne"', found: html.includes('Nouvelle campagne') },
        { name: 'Message de configuration', found: html.includes('Configuration requise') },
        { name: 'Section statistiques', found: html.includes('Total Campagnes') || html.includes('Campagnes') },
      ];

      console.log('✅ Vérifications du contenu:\n');

      let allPassed = true;
      checks.forEach(check => {
        const icon = check.found ? '✅' : '❌';
        console.log(`   ${icon} ${check.name}`);
        if (!check.found) allPassed = false;
      });

      console.log('\n' + '━'.repeat(60));

      if (allPassed) {
        console.log('\n🎉 La page Marketing fonctionne parfaitement!\n');
        console.log('📝 Prochaines étapes:');
        console.log('   1. Configurez votre clé API Brevo dans .env.local');
        console.log('   2. Ouvrez: http://localhost:3000/marketing/email');
        console.log('   3. Cliquez sur "Synchroniser" pour importer vos campagnes\n');
      } else {
        console.log('\n⚠️  Certains éléments sont manquants sur la page\n');
      }

    } else if (response.status === 401 || response.status === 403) {
      console.log('🔐 La page nécessite une authentification\n');
      console.log('💡 Pour tester:');
      console.log('   1. Connectez-vous sur http://localhost:3000');
      console.log('   2. Utilisez un compte avec le département Marketing (MKT)');
      console.log('   3. Ou un compte director/admin\n');
    } else if (response.status === 404) {
      console.log('❌ La page n\'existe pas (404)\n');
      console.log('💡 Vérifiez que le fichier existe:');
      console.log('   src/app/(main)/marketing/email/page.tsx\n');
    } else {
      console.log(`⚠️  Réponse inattendue: ${response.status}\n`);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.log('\n💡 Assurez-vous que le serveur dev tourne:');
    console.log('   npm run dev\n');
    process.exit(1);
  }
}

testMarketingPage();
