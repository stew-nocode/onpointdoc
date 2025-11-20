/**
 * Script de test pour valider le parser ADF
 */

import { parseADFToHTML } from '../src/lib/utils/adf-parser.ts';

// Exemple ADF réel extrait de Jira
const testADF = `{
  "type": "doc",
  "version": 1,
  "content": [
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Petit récap _ : Dans les différents processus du module Agro , il est nécessaire de pouvoir émettre des "
        },
        {
          "type": "text",
          "text": "Notes de Débit",
          "marks": [{"type": "strong"}]
        },
        {
          "type": "text",
          "text": " afin de corriger ou ajuster certains montants facturés ou à facturer (frais supplémentaires, pénalités, ajustements qualité, etc.)."
        }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Intégrer une fonctionnalité permettant de créer des Notes de Débit."
        }
      ]
    }
  ]
}`;

console.log('🧪 Test du parser ADF...\n');

try {
  const html = parseADFToHTML(testADF);
  
  console.log('✅ Parsing réussi !\n');
  console.log('📄 HTML généré:');
  console.log('─'.repeat(60));
  console.log(html);
  console.log('─'.repeat(60));
  
  // Vérifications basiques
  const checks = {
    'Contient des balises <p>': html.includes('<p>'),
    'Contient du texte': html.length > 0,
    'Contient du gras': html.includes('<strong>'),
    'Pas de caractères non échappés': !html.includes('<script>') && !html.includes('javascript:'),
  };
  
  console.log('\n✅ Vérifications:');
  Object.entries(checks).forEach(([check, passed]) => {
    console.log(`   ${passed ? '✓' : '✗'} ${check}`);
  });
  
  const allPassed = Object.values(checks).every(v => v);
  
  if (allPassed) {
    console.log('\n🎉 Tous les tests sont passés !');
    process.exit(0);
  } else {
    console.log('\n❌ Certains tests ont échoué');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Erreur lors du test:', error);
  process.exit(1);
}

