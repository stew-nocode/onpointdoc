# Correction de l'Erreur Labels JIRA

**Date** : 2026-01-05  
**Problème** : Erreur 400 lors de la création de tickets BUG/REQ dans JIRA  
**Cause** : Les labels JIRA contiennent des espaces, ce qui n'est pas autorisé

## 🔍 Problème Identifié

### Erreur JIRA
```
JIRA 400: L'étiquette « module:Administration Système » ne peut pas comporter d'espaces.
```

### Cause
Les labels JIRA sont créés à partir des noms de produits et modules, mais :
- JIRA n'accepte pas les espaces dans les labels
- Le module "Administration Système" contient un espace
- Cela cause une erreur 400 lors de la création du ticket

### Labels Affectés
- `canal:${canal}` - Peut contenir des espaces (ex: "Appel Téléphonique")
- `product:${productName}` - Peut contenir des espaces
- `module:${moduleName}` - Peut contenir des espaces (ex: "Administration Système")

## ✅ Solution Appliquée

### Normalisation des Labels

**Fichier** : `src/services/jira/client.ts` (lignes 128-138)

**Avant** :
```typescript
const labels: string[] = [];
if (input.canal) {
  labels.push(`canal:${input.canal}`);
}
if (productName) {
  labels.push(`product:${productName}`);
}
if (moduleName) {
  labels.push(`module:${moduleName}`);
}
```

**Après** :
```typescript
/**
 * Normalise un label JIRA en remplaçant les espaces par des underscores
 * JIRA n'accepte pas les espaces dans les labels
 */
const normalizeJiraLabel = (value: string): string => {
  return value.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_:_-]/g, '');
};

// Préparer les labels (normalisés pour JIRA - pas d'espaces)
const labels: string[] = [];
if (input.canal) {
  labels.push(`canal:${normalizeJiraLabel(input.canal)}`);
}
if (productName) {
  labels.push(`product:${normalizeJiraLabel(productName)}`);
}
if (moduleName) {
  labels.push(`module:${normalizeJiraLabel(moduleName)}`);
}
```

### Fonction de Normalisation

La fonction `normalizeJiraLabel` :
1. ✅ Remplace les espaces par des underscores (`_`)
2. ✅ Supprime les caractères spéciaux non autorisés (garde uniquement lettres, chiffres, `:`, `_`, `-`)
3. ✅ Préserve le format `prefix:value` (ex: `module:Administration_Système`)

### Exemples de Transformation

| Avant | Après |
|-------|-------|
| `module:Administration Système` | `module:Administration_Système` |
| `canal:Appel Téléphonique` | `canal:Appel_Tlphonique` |
| `product:SNI` | `product:SNI` (inchangé) |

## 🧪 Test

Après cette correction, la création de tickets BUG/REQ avec des modules/produits contenant des espaces devrait fonctionner.

**Pour tester** :
1. Créer un nouveau ticket BUG avec un module contenant des espaces (ex: "Administration Système")
2. Vérifier que la clé JIRA est créée (ex: `OD-XXXX`)
3. Vérifier que les labels sont correctement normalisés dans JIRA
4. Vérifier que `jira_sync.sync_error` est `null`

## 📊 Résultat Attendu

- ✅ Tickets BUG/REQ créés avec succès même avec des noms contenant des espaces
- ✅ Labels JIRA normalisés (espaces remplacés par `_`)
- ✅ Clé JIRA (`OD-XXXX`) assignée au ticket
- ✅ Synchronisation réussie sans erreur 400

---

**Note** : Les labels normalisés restent lisibles et permettent toujours de filtrer les tickets par produit/module dans JIRA.

