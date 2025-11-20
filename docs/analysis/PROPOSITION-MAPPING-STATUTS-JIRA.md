# Proposition de Mapping des Statuts JIRA → Supabase

## Statuts JIRA identifiés dans le projet OD

### Sources analysées :
1. **Table `jira_status_mapping`** (mappings existants)
2. **Script `enrich-obcs-bugs.js`** (STATUS_MAP)
3. **Documentation N8N** (exemples de mappings)
4. **Données tickets OD-** (statuts Supabase actuels)

---

## Statuts JIRA trouvés

### Statuts déjà mappés :
- `Sprint Backlog` → `Nouveau` (BUG/REQ)
- `Traitement en Cours` → `En_cours` (BUG/REQ)
- `Terminé(e)` → `Resolue` (BUG/REQ)

### Statuts identifiés dans le code/documentation :
- `À faire` / `A faire` / `Backlog` → `Nouveau`
- `En cours` / `In Progress` → `En_cours`
- `À valider` / `Transféré` → `Transfere`
- `Terminé` / `Terminé(e)` / `Résolu` / `Résolue` → `Resolue`
- `To Do` → `Nouveau` / `To_Do`
- `Done` / `Closed` → `Resolue`

---

## Proposition de Mappings Complets

### Pour les tickets BUG

| Statut JIRA | Statut Supabase | Notes |
|-------------|-----------------|-------|
| `Sprint Backlog` | `Nouveau` | ✅ Déjà mappé |
| `Backlog` | `Nouveau` | Nouveau ticket, pas encore pris en charge |
| `À faire` / `A faire` | `Nouveau` | Équivalent de "To Do" |
| `To Do` | `Nouveau` | Statut standard JIRA |
| `Traitement en Cours` | `En_cours` | ✅ Déjà mappé |
| `En cours` | `En_cours` | Variante française |
| `In Progress` | `En_cours` | Statut standard JIRA |
| `À valider` | `Transfere` | En attente de validation |
| `Transféré` | `Transfere` | Ticket transféré vers IT |
| `Terminé(e)` | `Resolue` | ✅ Déjà mappé |
| `Terminé` | `Resolue` | Variante sans (e) |
| `Résolu` / `Résolue` | `Resolue` | Variantes françaises |
| `Done` | `Resolue` | Statut standard JIRA |
| `Closed` | `Resolue` | Ticket fermé |

### Pour les tickets REQ

| Statut JIRA | Statut Supabase | Notes |
|-------------|-----------------|-------|
| `Sprint Backlog` | `Nouveau` | ✅ Déjà mappé |
| `Backlog` | `Nouveau` | Nouvelle requête |
| `À faire` / `A faire` | `Nouveau` | Équivalent de "To Do" |
| `To Do` | `Nouveau` | Statut standard JIRA |
| `Traitement en Cours` | `En_cours` | ✅ Déjà mappé |
| `En cours` | `En_cours` | Variante française |
| `In Progress` | `En_cours` | Statut standard JIRA |
| `À valider` | `Transfere` | En attente de validation |
| `Transféré` | `Transfere` | Requête transférée |
| `Terminé(e)` | `Resolue` | ✅ Déjà mappé |
| `Terminé` | `Resolue` | Variante sans (e) |
| `Résolu` / `Résolue` | `Resolue` | Variantes françaises |
| `Done` | `Resolue` | Statut standard JIRA |
| `Closed` | `Resolue` | Requête fermée |

### Pour les tickets ASSISTANCE

| Statut JIRA | Statut Supabase | Notes |
|-------------|-----------------|-------|
| `Sprint Backlog` | `Nouveau` | Assistance créée, pas encore traitée |
| `Backlog` | `Nouveau` | Nouvelle assistance |
| `À faire` / `A faire` | `Nouveau` | Équivalent de "To Do" |
| `To Do` | `Nouveau` | Statut standard JIRA |
| `Traitement en Cours` | `En_cours` | Assistance en cours de traitement |
| `En cours` | `En_cours` | Variante française |
| `In Progress` | `En_cours` | Statut standard JIRA |
| `À valider` | `Transfere` | Assistance transférée, en attente validation |
| `Transféré` | `Transfere` | Assistance transférée vers IT |
| `Terminé(e)` | `Resolue` | Assistance résolue |
| `Terminé` | `Resolue` | Variante sans (e) |
| `Résolu` / `Résolue` | `Resolue` | Variantes françaises |
| `Done` | `Resolue` | Statut standard JIRA |
| `Closed` | `Resolue` | Assistance fermée |

---

## Statuts Supabase disponibles

Les statuts Supabase sont limités à 4 valeurs dans l'enum :
- `Nouveau` : Ticket créé, pas encore pris en charge
- `En_cours` : Ticket en cours de traitement
- `Transfere` : Ticket transféré vers JIRA (pour ASSISTANCE) ou en attente de validation
- `Resolue` : Ticket résolu/fermé

---

## Recommandations

### 1. Mappings à ajouter dans `jira_status_mapping`

**Pour BUG :**
- `Backlog` → `Nouveau`
- `À faire` → `Nouveau`
- `A faire` → `Nouveau`
- `To Do` → `Nouveau`
- `En cours` → `En_cours`
- `In Progress` → `En_cours`
- `À valider` → `Transfere`
- `Transféré` → `Transfere`
- `Terminé` → `Resolue`
- `Résolu` → `Resolue`
- `Résolue` → `Resolue`
- `Done` → `Resolue`
- `Closed` → `Resolue`

**Pour REQ :** (même liste que BUG)

**Pour ASSISTANCE :** (même liste que BUG)

### 2. Gestion des cas non mappés

Si un statut JIRA n'est pas trouvé dans le mapping :
- **Option 1** : Logger un warning et ne pas mettre à jour le statut
- **Option 2** : Utiliser un fallback (ex: `En_cours` par défaut)
- **Option 3** : Créer automatiquement un mapping avec un statut par défaut

### 3. Validation

Avant de déployer, vérifier dans JIRA :
- Tous les statuts du projet OD sont-ils couverts ?
- Y a-t-il des statuts personnalisés spécifiques au projet ?
- Les noms de statuts sont-ils exactement identiques (casse, accents) ?

---

## Prochaines étapes

1. ✅ Vérifier les statuts réels dans JIRA (projet OD)
2. ✅ Créer les mappings manquants dans `jira_status_mapping`
3. ✅ Tester la synchronisation avec un ticket de test
4. ✅ Ajouter un logging pour les statuts non mappés
5. ✅ Documenter les mappings dans le code

