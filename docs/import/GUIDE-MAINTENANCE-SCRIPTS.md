# Guide de Maintenance des Scripts d'Import

## 📋 Objectif

Ce guide fournit les bonnes pratiques pour maintenir, améliorer et créer de nouveaux scripts d'import dans OnpointDoc.

## 🏗️ Architecture des scripts

### Structure standardisée

Tous les scripts suivent cette architecture :

```
scripts/
├── import-{entity}-{company}.js    # Import spécifique entreprise
├── import-{entity}.js              # Import générique
└── update-{entity}-{field}.js      # Mise à jour champ spécifique
```

### Composants communs

1. **Configuration environnement**
   ```javascript
   import dotenv from 'dotenv';
   import path from 'node:path';
   
   try {
     const envPath = path.resolve(process.cwd(), '.env.local');
     dotenv.config({ path: envPath });
   } catch {}
   ```

2. **Connexion Supabase**
   ```javascript
   const supabase = createClient(url, key, {
     auth: { persistSession: false }
   });
   ```

3. **Gestion des erreurs**
   - Try/catch par entité
   - Logs détaillés
   - Rapport final

4. **Détection doublons**
   - Vérification avant insertion
   - Support upsert si nécessaire

## 🔧 Patterns réutilisables

### Pattern 1 : Import avec détection doublons

```javascript
async function importEntity(data) {
  // 1. Vérifier existence
  const { data: existing } = await supabase
    .from('table')
    .select('id')
    .eq('unique_field', data.uniqueField)
    .maybeSingle();

  if (existing) {
    console.log(`⏭️  "${data.name}" existe déjà`);
    return { skipped: true };
  }

  // 2. Insérer
  const { data: inserted, error } = await supabase
    .from('table')
    .insert(data)
    .select('id')
    .single();

  if (error) throw error;
  return { success: true, id: inserted.id };
}
```

### Pattern 2 : Import avec upsert

```javascript
async function importEntityWithUpsert(data) {
  const { data: result, error } = await supabase
    .from('table')
    .upsert(data, { onConflict: 'unique_field' })
    .select('id')
    .single();

  if (error) throw error;
  return result;
}
```

### Pattern 3 : Import avec relations

```javascript
async function importEntityWithRelations(data) {
  // 1. Vérifier foreign key
  const { data: related } = await supabase
    .from('related_table')
    .select('id')
    .eq('name', data.relatedName)
    .single();

  if (!related) {
    throw new Error(`Entité liée non trouvée: ${data.relatedName}`);
  }

  // 2. Insérer avec foreign key
  const { data: inserted, error } = await supabase
    .from('table')
    .insert({ ...data, related_id: related.id })
    .select('id')
    .single();

  if (error) throw error;
  return inserted;
}
```

## 📝 Bonnes pratiques

### 1. Validation des données

```javascript
function validateData(data) {
  if (!data.email || !data.fullName) {
    throw new Error('Email et nom complet requis');
  }
  if (!isValidEmail(data.email)) {
    throw new Error('Email invalide');
  }
}
```

### 2. Gestion des valeurs optionnelles

```javascript
const jobTitle = data['Fonction']?.trim() || null;
const department = data['Département']?.trim() || null;
```

### 3. Logs structurés

```javascript
console.log(`✅ "${fullName}" importé (Email: ${email}, ID: ${id})`);
console.error(`❌ Erreur pour "${fullName}": ${error.message}`);
console.warn(`⚠️  "${fullName}" existe déjà`);
```

### 4. Rapport final

```javascript
console.log(`\n📊 Résumé:`);
console.log(`   ✅ Importés: ${successCount}`);
console.log(`   ⏭️  Ignorés: ${skippedCount}`);
console.log(`   ❌ Erreurs: ${errorCount}`);
```

## 🔄 Évolutivité

### Ajout de nouvelles fonctionnalités

1. **Support de nouveaux champs**
   - Ajouter le champ dans la validation
   - Mapper dans l'insertion
   - Documenter dans les commentaires

2. **Nouveaux types d'entités**
   - Créer un nouveau script suivant les patterns
   - Adapter la logique métier
   - Tester sur un échantillon

3. **Amélioration des performances**
   - Utiliser `insert` avec array au lieu de boucle
   - Ajouter des index si nécessaire
   - Optimiser les requêtes

### Exemple : Ajout support batch insert

```javascript
// Au lieu de boucler
for (const item of data) {
  await supabase.from('table').insert(item);
}

// Utiliser batch
const chunks = chunkArray(data, 100); // Par lots de 100
for (const chunk of chunks) {
  await supabase.from('table').insert(chunk);
}
```

## 🧪 Tests

### Tests manuels

1. **Test sur échantillon**
   ```javascript
   const testData = data.slice(0, 2); // 2 premiers éléments
   ```

2. **Vérification dans Supabase**
   ```sql
   SELECT * FROM table WHERE email = 'test@example.com';
   ```

3. **Validation des relations**
   ```sql
   SELECT t.*, r.name 
   FROM table t 
   JOIN related_table r ON t.related_id = r.id;
   ```

### Tests automatisés (futur)

```javascript
// scripts/__tests__/import-contacts.test.js
import { importContact } from '../import-contacts-aric.js';

test('should import contact successfully', async () => {
  const result = await importContact({
    'Nom Complet': 'Test User',
    'Email': 'test@example.com'
  });
  expect(result.success).toBe(true);
});
```

## 🐛 Dépannage

### Problèmes courants

1. **Erreur "ON CONFLICT"**
   - Vérifier les contraintes uniques
   - Utiliser `onConflict` correctement
   - Vérifier les colonnes de conflit

2. **Erreur RLS**
   - Vérifier l'utilisation du service role
   - Vérifier les policies RLS
   - Tester avec un utilisateur admin

3. **Erreur foreign key**
   - Vérifier que l'entité liée existe
   - Vérifier le type de la clé (UUID vs TEXT)
   - Vérifier les noms de colonnes

### Debug

```javascript
// Activer les logs Supabase
const supabase = createClient(url, key, {
  auth: { persistSession: false },
  db: { schema: 'public' },
  global: { headers: { 'x-debug': 'true' } }
});

// Logs détaillés
console.log('Données à insérer:', JSON.stringify(data, null, 2));
```

## 📚 Documentation

### Commenter le code

```javascript
/**
 * Importe un contact client
 * @param {Object} contactData - Données du contact
 * @param {string} companyId - ID de l'entreprise
 * @returns {Promise<Object>} Résultat de l'import
 */
async function importContact(contactData, companyId) {
  // ...
}
```

### Documenter les spécificités

```javascript
// NOTE: Ce script gère les contacts sans email
// Les contacts sans email sont identifiés par nom + entreprise
if (!email) {
  // Recherche par nom uniquement
  query = query.eq('full_name', fullName);
}
```

## 🔐 Sécurité

### Bonnes pratiques

1. **Ne jamais commiter les credentials**
   - Utiliser `.env.local` (dans `.gitignore`)
   - Ne pas hardcoder les clés

2. **Validation des entrées**
   - Valider tous les champs utilisateur
   - Sanitizer les données si nécessaire

3. **Gestion des erreurs**
   - Ne pas exposer les détails d'erreur en production
   - Logger les erreurs sans données sensibles

## 📈 Métriques et monitoring

### Ajouter des métriques

```javascript
const metrics = {
  startTime: Date.now(),
  processed: 0,
  success: 0,
  errors: 0
};

// À la fin
const duration = (Date.now() - metrics.startTime) / 1000;
console.log(`⏱️  Durée: ${duration}s`);
console.log(`📊 Taux de succès: ${(metrics.success / metrics.processed * 100).toFixed(2)}%`);
```

## 🎯 Checklist pour nouveaux scripts

- [ ] Structure conforme aux patterns
- [ ] Gestion des erreurs complète
- [ ] Détection des doublons
- [ ] Logs détaillés
- [ ] Rapport final
- [ ] Documentation dans les commentaires
- [ ] Test sur échantillon
- [ ] Validation des foreign keys
- [ ] Vérification RLS si nécessaire
- [ ] Mise à jour de ce guide si nouveau pattern

---

**Dernière mise à jour** : 2025-01-17

