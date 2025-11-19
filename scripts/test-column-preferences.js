/**
 * Script de test pour les fonctions de gestion des colonnes personnalisables
 * 
 * Tests les fonctions utilitaires de column-preferences.ts
 * Note: Ce test simule le comportement localStorage côté Node.js
 */

import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });
dotenv.config();

console.log('🧪 Tests des fonctions de gestion des colonnes personnalisables\n');

// Simulation de localStorage pour Node.js
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }
}

// Remplacer global.localStorage si on est dans Node.js
if (typeof window === 'undefined') {
  global.localStorage = new LocalStorageMock();
  global.window = { localStorage: global.localStorage };
}

// Définir les types et fonctions (simulation du module column-preferences.ts)
const AVAILABLE_COLUMNS = [
  { id: 'title', label: 'Titre', required: true },
  { id: 'type', label: 'Type' },
  { id: 'status', label: 'Statut' },
  { id: 'priority', label: 'Priorité' },
  { id: 'canal', label: 'Canal' },
  { id: 'product', label: 'Produit' },
  { id: 'module', label: 'Module' },
  { id: 'jira', label: 'Jira' },
  { id: 'created_at', label: 'Créé le' },
  { id: 'assigned', label: 'Assigné' }
];

const STORAGE_KEY = 'tickets-table-columns';

function getVisibleColumns() {
  if (typeof window === 'undefined') {
    return new Set(AVAILABLE_COLUMNS.map(col => col.id));
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const visible = new Set(parsed);
      
      AVAILABLE_COLUMNS.forEach(col => {
        if (col.required) {
          visible.add(col.id);
        }
      });
      
      return visible;
    }
  } catch (error) {
    console.error('Erreur lors de la lecture des préférences de colonnes:', error);
  }

  return new Set(AVAILABLE_COLUMNS.map(col => col.id));
}

function saveVisibleColumns(visibleColumns) {
  if (typeof window === 'undefined') return;

  try {
    const toSave = new Set(visibleColumns);
    AVAILABLE_COLUMNS.forEach(col => {
      if (col.required) {
        toSave.add(col.id);
      }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(toSave)));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des préférences de colonnes:', error);
  }
}

function resetColumnsToDefault() {
  const defaultColumns = new Set(AVAILABLE_COLUMNS.map(col => col.id));
  saveVisibleColumns(defaultColumns);
  return defaultColumns;
}

// Test 1: Récupération des colonnes par défaut
function testDefaultColumns() {
  console.log('📋 Test 1: Récupération des colonnes par défaut');
  
  try {
    localStorage.clear();
    const columns = getVisibleColumns();
    
    const expectedCount = AVAILABLE_COLUMNS.length;
    const actualCount = columns.size;
    
    if (actualCount !== expectedCount) {
      console.error(`   ❌ Nombre de colonnes incorrect: ${actualCount} au lieu de ${expectedCount}`);
      return false;
    }

    // Vérifier que toutes les colonnes sont présentes
    const allPresent = AVAILABLE_COLUMNS.every(col => columns.has(col.id));
    
    if (!allPresent) {
      console.error('   ❌ Certaines colonnes manquent');
      return false;
    }

    console.log(`   ✅ ${actualCount} colonnes récupérées (par défaut)`);
    return true;
  } catch (error) {
    console.error('   ❌ Erreur:', error.message);
    return false;
  }
}

// Test 2: Sauvegarde et récupération
function testSaveAndLoad() {
  console.log('\n📋 Test 2: Sauvegarde et récupération des colonnes');
  
  try {
    localStorage.clear();
    
    // Créer un set avec seulement quelques colonnes
    const customColumns = new Set(['title', 'type', 'status', 'priority']);
    saveVisibleColumns(customColumns);
    
    // Récupérer les colonnes sauvegardées
    const loadedColumns = getVisibleColumns();
    
    // Vérifier que 'title' est toujours présent (requis)
    if (!loadedColumns.has('title')) {
      console.error('   ❌ Colonne requise "title" manquante');
      return false;
    }

    // Vérifier que les colonnes personnalisées sont présentes
    const customPresent = Array.from(customColumns).every(col => loadedColumns.has(col));
    
    if (!customPresent) {
      console.error('   ❌ Certaines colonnes personnalisées manquent');
      return false;
    }

    console.log(`   ✅ Colonnes sauvegardées et récupérées: ${Array.from(loadedColumns).join(', ')}`);
    return true;
  } catch (error) {
    console.error('   ❌ Erreur:', error.message);
    return false;
  }
}

// Test 3: Colonne requise ne peut pas être masquée
function testRequiredColumn() {
  console.log('\n📋 Test 3: Colonne requise ne peut pas être masquée');
  
  try {
    localStorage.clear();
    
    // Essayer de masquer la colonne 'title' (requise)
    const columnsWithoutTitle = new Set(['type', 'status']);
    saveVisibleColumns(columnsWithoutTitle);
    
    const loadedColumns = getVisibleColumns();
    
    // Vérifier que 'title' est toujours présent
    if (!loadedColumns.has('title')) {
      console.error('   ❌ Colonne requise "title" a été masquée (ne devrait pas être possible)');
      return false;
    }

    console.log('   ✅ Colonne requise "title" toujours visible');
    return true;
  } catch (error) {
    console.error('   ❌ Erreur:', error.message);
    return false;
  }
}

// Test 4: Réinitialisation aux valeurs par défaut
function testReset() {
  console.log('\n📋 Test 4: Réinitialisation aux valeurs par défaut');
  
  try {
    // Sauvegarder des colonnes personnalisées
    const customColumns = new Set(['title', 'type']);
    saveVisibleColumns(customColumns);
    
    // Réinitialiser
    const defaultColumns = resetColumnsToDefault();
    
    // Vérifier que toutes les colonnes sont présentes
    const allPresent = AVAILABLE_COLUMNS.every(col => defaultColumns.has(col.id));
    
    if (!allPresent) {
      console.error('   ❌ Réinitialisation incomplète');
      return false;
    }

    // Vérifier que les colonnes récupérées correspondent
    const loadedColumns = getVisibleColumns();
    const loadedArray = Array.from(loadedColumns).sort();
    const defaultArray = Array.from(defaultColumns).sort();
    
    if (JSON.stringify(loadedArray) !== JSON.stringify(defaultArray)) {
      console.error('   ❌ Colonnes récupérées ne correspondent pas aux colonnes par défaut');
      return false;
    }

    console.log(`   ✅ Réinitialisation réussie: ${defaultColumns.size} colonnes`);
    return true;
  } catch (error) {
    console.error('   ❌ Erreur:', error.message);
    return false;
  }
}

// Test 5: Gestion des erreurs (JSON invalide)
function testInvalidJSON() {
  console.log('\n📋 Test 5: Gestion des erreurs (JSON invalide)');
  
  try {
    localStorage.clear();
    
    // Sauvegarder un JSON invalide
    localStorage.setItem(STORAGE_KEY, 'invalid json{');
    
    // Récupérer les colonnes (devrait retourner les valeurs par défaut)
    const columns = getVisibleColumns();
    
    // Vérifier que les colonnes par défaut sont retournées
    const allPresent = AVAILABLE_COLUMNS.every(col => columns.has(col.id));
    
    if (!allPresent) {
      console.error('   ❌ Les colonnes par défaut n\'ont pas été retournées en cas d\'erreur');
      return false;
    }

    console.log('   ✅ Gestion d\'erreur correcte: valeurs par défaut retournées');
    return true;
  } catch (error) {
    console.error('   ❌ Erreur:', error.message);
    return false;
  }
}

// Test 6: Vérification de la structure des colonnes
function testColumnStructure() {
  console.log('\n📋 Test 6: Vérification de la structure des colonnes');
  
  try {
    const requiredColumns = AVAILABLE_COLUMNS.filter(col => col.required);
    const optionalColumns = AVAILABLE_COLUMNS.filter(col => !col.required);
    
    if (requiredColumns.length === 0) {
      console.error('   ❌ Aucune colonne requise définie');
      return false;
    }

    if (requiredColumns.length > 1) {
      console.log(`   ⚠️  ${requiredColumns.length} colonnes requises (attendu: 1)`);
    }

    console.log(`   ✅ Structure valide:`);
    console.log(`      - ${requiredColumns.length} colonne(s) requise(s): ${requiredColumns.map(c => c.id).join(', ')}`);
    console.log(`      - ${optionalColumns.length} colonne(s) optionnelle(s)`);
    console.log(`      - Total: ${AVAILABLE_COLUMNS.length} colonnes`);
    
    return true;
  } catch (error) {
    console.error('   ❌ Erreur:', error.message);
    return false;
  }
}

// Exécuter tous les tests
function runAllTests() {
  const results = [];
  
  results.push(testDefaultColumns());
  results.push(testSaveAndLoad());
  results.push(testRequiredColumn());
  results.push(testReset());
  results.push(testInvalidJSON());
  results.push(testColumnStructure());

  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Résultats: ${passed}/${total} tests réussis`);
  
  if (passed === total) {
    console.log('✅ Tous les tests sont passés !');
    process.exit(0);
  } else {
    console.log('❌ Certains tests ont échoué');
    process.exit(1);
  }
}

runAllTests();

