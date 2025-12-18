# Proposition : Enrichissement de l'Historique Entreprise

## 📋 État Actuel

L'historique actuel inclut :
- ✅ **Tickets** : Création de tickets liés à l'entreprise
- ✅ **Utilisateurs** : Création d'utilisateurs pour l'entreprise

## 🎯 Types d'Historique Proposés

### 1. **Changements de Statut des Tickets** (Priorité : Haute)
**Type** : `ticket_status_change`

**Données** : 
- Table `ticket_status_history`
- Filtrer par tickets liés à l'entreprise
- Afficher : `status_from` → `status_to`, auteur, date

**Utilité** :
- Suivre l'évolution des tickets
- Voir les transitions importantes (ex: "Transféré vers JIRA")
- Identifier les tickets résolus rapidement

**Exemple** :
```
"Ticket #123 : Nouveau → En cours"
"Ticket #456 : En cours → Transféré (vers JIRA)"
"Ticket #789 : Test en Cours → Terminé(e)"
```

---

### 2. **Commentaires et Relances** (Priorité : Haute)
**Type** : `ticket_comment` ou `ticket_relance`

**Données** :
- Table `ticket_comments`
- Filtrer par tickets liés à l'entreprise
- Distinguer commentaires normaux vs relances

**Utilité** :
- Voir les interactions avec l'entreprise
- Suivre les relances (important pour le support)
- Identifier les tickets avec beaucoup d'échanges

**Exemple** :
```
"Commentaire sur Ticket #123 : 'Le problème persiste...'"
"Relance sur Ticket #456"
```

---

### 3. **Activités Liées** (Priorité : Moyenne)
**Type** : `activity`

**Données** :
- Table `activities` via `ticket_activity_link`
- Filtrer les activités liées aux tickets de l'entreprise
- Inclure aussi les activités avec participants externes de l'entreprise

**Utilité** :
- Voir les revues, ateliers, démos liés à l'entreprise
- Comprendre le contexte des tickets
- Suivre les activités client

**Exemple** :
```
"Revue de process : 'Optimisation module RH'"
"Atelier : 'Formation utilisateurs'"
```

---

### 4. **Tâches Liées** (Priorité : Moyenne)
**Type** : `task`

**Données** :
- Table `tasks` via `ticket_task_link`
- Filtrer les tâches liées aux tickets de l'entreprise

**Utilité** :
- Voir les actions correctives liées aux tickets
- Suivre les tâches de suivi client
- Identifier les tâches en retard

**Exemple** :
```
"Tâche : 'Corriger bug module Comptabilité'"
"Tâche : 'Documenter nouvelle fonctionnalité'"
```

---

### 5. **Transferts JIRA** (Priorité : Moyenne)
**Type** : `jira_transfer`

**Données** :
- Table `jira_sync` via tickets liés à l'entreprise
- Filtrer les transferts récents

**Utilité** :
- Voir quand les tickets sont transférés vers JIRA
- Suivre les tickets gérés par l'IT
- Identifier les tickets critiques (transférés rapidement)

**Exemple** :
```
"Ticket #123 transféré vers JIRA (OBC-456)"
"Ticket #789 synchronisé depuis JIRA"
```

---

### 6. **Modifications de l'Entreprise** (Priorité : Basse)
**Type** : `company_modification`

**Données** :
- Table `companies` (si on track les modifications)
- Ou créer une table `company_history` pour tracker les changements

**Utilité** :
- Voir les modifications de données (nom, pays, point focal, etc.)
- Historique des changements de configuration
- Traçabilité des modifications

**Exemple** :
```
"Point focal modifié : 'Jean Dupont' → 'Marie Martin'"
"Pays modifié : 'France' → 'Belgique'"
```

---

## 🎨 Organisation de l'Historique

### Option A : Timeline Unifiée (Recommandée)
**Tous les événements mélangés chronologiquement**

**Avantages** :
- ✅ Vue chronologique complète
- ✅ Facile à comprendre
- ✅ Pas de navigation supplémentaire

**Inconvénients** :
- ❌ Peut être long si beaucoup d'événements
- ❌ Difficile de filtrer par type

---

### Option B : Timeline avec Filtres
**Timeline unifiée + filtres par type**

**Avantages** :
- ✅ Vue complète par défaut
- ✅ Possibilité de filtrer par type
- ✅ Meilleure organisation

**Inconvénients** :
- ❌ Plus complexe à implémenter
- ❌ Nécessite un composant de filtres

---

### Option C : Tabs par Type
**Séparer en onglets : Tickets, Activités, Tâches, etc.**

**Avantages** :
- ✅ Organisation claire
- ✅ Facile de trouver un type spécifique

**Inconvénients** :
- ❌ Navigation supplémentaire
- ❌ Perte de vue chronologique globale

---

## 📊 Priorités d'Implémentation

### Phase 1 (Essentiel)
1. **Changements de Statut** (`ticket_status_change`)
   - Impact fort : voir l'évolution des tickets
   - Facile : table `ticket_status_history` existe déjà

2. **Commentaires/Relances** (`ticket_comment`)
   - Impact fort : interactions avec l'entreprise
   - Facile : table `ticket_comments` existe déjà

### Phase 2 (Enrichissement)
3. **Transferts JIRA** (`jira_transfer`)
   - Impact moyen : suivi des tickets IT
   - Facile : table `jira_sync` existe déjà

4. **Activités Liées** (`activity`)
   - Impact moyen : contexte des tickets
   - Moyen : nécessite jointure via `ticket_activity_link`

### Phase 3 (Avancé)
5. **Tâches Liées** (`task`)
   - Impact moyen : actions correctives
   - Moyen : nécessite jointure via `ticket_task_link`

6. **Modifications Entreprise** (`company_modification`)
   - Impact faible : rarement modifié
   - Complexe : nécessite tracking des modifications

---

## 🎯 Recommandation

**Option A (Timeline Unifiée) + Phase 1**

1. Ajouter les **changements de statut** et **commentaires** à l'historique
2. Garder la timeline unifiée (tous les événements mélangés)
3. Améliorer visuellement la distinction des types (icônes, couleurs)

**Pourquoi** :
- Impact immédiat et visible
- Facile à implémenter (tables existent)
- Enrichit significativement l'historique sans complexité

---

## 🔧 Structure Technique Proposée

### Extension du Type `CompanyHistoryItem`

```typescript
export type CompanyHistoryItem = {
  id: string;
  type: 
    | 'ticket'              // Création de ticket (existant)
    | 'user'                // Création d'utilisateur (existant)
    | 'ticket_status_change' // Changement de statut (nouveau)
    | 'ticket_comment'      // Commentaire/relance (nouveau)
    | 'jira_transfer'       // Transfert JIRA (nouveau)
    | 'activity'            // Activité liée (nouveau)
    | 'task'                // Tâche liée (nouveau)
    | 'company_modification'; // Modification entreprise (nouveau)
  title: string;
  description?: string;
  timestamp: string;
  user?: {
    id: string;
    full_name: string;
  };
  metadata?: {
    ticket_id?: string;
    ticket_type?: string;
    status_from?: string;
    status_to?: string;
    jira_key?: string;
    activity_type?: string;
    task_status?: string;
    // ... autres métadonnées
  };
};
```

---

## ✅ Prochaines Étapes

1. **Valider les types prioritaires** (Phase 1 recommandée)
2. **Enrichir `loadCompanyHistory`** avec les nouveaux types
3. **Mettre à jour `CompanyTimelineItem`** pour afficher les nouveaux types
4. **Tester avec des données réelles**

