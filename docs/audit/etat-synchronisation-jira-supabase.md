# État Actuel de la Synchronisation JIRA ↔ Supabase

**Date d'analyse :** 2025-01-27  
**Version :** 1.0

## 📊 Vue d'ensemble

La synchronisation entre JIRA et Supabase est **partiellement implémentée** avec une architecture hybride :
- **Sans N8N** : Appels directs à l'API JIRA depuis Next.js
- **Avec Webhooks** : Réception des événements JIRA via route API Next.js
- **N8N** : Utilisé uniquement pour l'analyse IA (non lié à la synchronisation JIRA)

---

## ✅ Ce qui est IMPLÉMENTÉ

### 1. **Flux Supabase → JIRA (Création de tickets)**

#### 1.1 Transfert Assistance → JIRA
- **Fichier** : `src/services/tickets/jira-transfer.ts`
- **Fonction** : `transferTicketToJira()`
- **Workflow** :
  1. ✅ Vérifie que le ticket est ASSISTANCE et en statut "En_cours"
  2. ✅ Met à jour le statut à "Transféré" dans Supabase
  3. ✅ Enregistre dans `ticket_status_history`
  4. ✅ Crée le ticket JIRA directement via API (sans N8N)
  5. ✅ Met à jour `jira_issue_key` dans Supabase
  6. ✅ Enregistre dans `jira_sync`
  7. ✅ Upload des pièces jointes vers JIRA

**Statut** : ✅ **FONCTIONNEL**

#### 1.2 Création directe BUG/REQ → JIRA
- **Fichier** : `src/services/jira/client.ts`
- **Fonction** : `createJiraIssue()`
- **Caractéristiques** :
  - ✅ Appel direct à l'API JIRA (sans N8N)
  - ✅ Mapping des champs (titre, description, priorité, labels)
  - ✅ Support des custom fields (produit, module, canal)
  - ✅ Format ADF pour la description (JIRA API v3)
  - ✅ Stockage de l'ID Supabase dans custom field JIRA

**Statut** : ✅ **FONCTIONNEL** (mais pas automatique à la création)

**⚠️ PROBLÈME IDENTIFIÉ** : 
- Les tickets BUG/REQ ne sont **PAS automatiquement créés dans JIRA** lors de leur création dans Supabase
- La documentation mentionne "Transfert automatique vers JIRA" mais ce n'est pas implémenté
- Il faut appeler manuellement `createJiraIssue()` ou `transferTicketToJira()`

---

### 2. **Flux JIRA → Supabase (Synchronisation)**

#### 2.1 Webhook JIRA → Next.js
- **Fichier** : `src/app/api/webhooks/jira/route.ts`
- **Endpoint** : `POST /api/webhooks/jira`
- **Formats supportés** :
  1. ✅ Format webhook JIRA natif (`webhookEvent`, `issue`)
  2. ✅ Format complet (`ticket_id`, `jira_data`)
  3. ✅ Format simplifié legacy (`event_type`, `jira_issue_key`, `updates`)

**Fonctionnalités** :
- ✅ Filtre les tickets du projet OD uniquement
- ✅ Détecte si le ticket existe dans Supabase
- ✅ Crée le ticket si absent (depuis JIRA)
- ✅ Synchronise si présent

**Statut** : ✅ **FONCTIONNEL**

#### 2.2 Synchronisation complète JIRA → Supabase
- **Fichier** : `src/services/jira/sync.ts`
- **Fonction** : `syncJiraToSupabase()`
- **Données synchronisées** :
  - ✅ Statut (avec mapping JIRA → Supabase)
  - ✅ Priorité
  - ✅ Titre et description
  - ✅ Assigné et créateur (via `jira_user_id`)
  - ✅ Résolution et fix version
  - ✅ Client/Contact (custom fields 10053, 10054, 10045)
  - ✅ Canal (custom field 10055)
  - ✅ Fonctionnalité/Module (custom field 10052)
  - ✅ Workflow status, Test status, Issue type (custom fields 10083, 10084, 10021)
  - ✅ Sprint, Related ticket, Target date, Resolved at
  - ✅ Champs spécifiques produits (custom fields 10297-10364)
  - ✅ Historique des statuts (`ticket_status_history`)
  - ✅ Pièces jointes (téléchargement depuis JIRA)
  - ✅ Métadonnées dans `jira_sync`

**Statut** : ✅ **FONCTIONNEL ET COMPLET**

#### 2.3 Synchronisation des commentaires
- **Fichier** : `src/services/jira/comments/sync.ts`
- **Fonction** : `syncJiraCommentToSupabase()`
- **Fonctionnalités** :
  - ✅ Création de commentaires depuis JIRA
  - ✅ Téléchargement des pièces jointes des commentaires
  - ✅ Marque `origin='jira'` pour distinguer l'origine

**Statut** : ✅ **FONCTIONNEL**

#### 2.4 Synchronisation manuelle
- **Fichier** : `src/services/jira/sync-manual.ts`
- **Fonctions** :
  - ✅ `fetchJiraIssue()` : Récupère un ticket JIRA
  - ✅ `syncTicketFromJira()` : Synchronise un ticket spécifique
  - ✅ `syncAllTicketsFromJira()` : Synchronisation en masse
- **Route API** : `GET /api/tickets/[id]/sync-jira`

**Statut** : ✅ **FONCTIONNEL**

---

## ❌ Ce qui est MANQUANT ou INCOMPLET

### 1. **Automatisation de la création BUG/REQ → JIRA**

**Problème** :
- Les tickets BUG/REQ sont créés dans Supabase mais **ne sont pas automatiquement transférés vers JIRA**
- La documentation mentionne "Transfert automatique vers JIRA" mais ce n'est pas implémenté

**Solution nécessaire** :
- Ajouter un trigger ou une action après création de ticket BUG/REQ
- Appeler `createJiraIssue()` automatiquement
- Ou utiliser N8N comme prévu dans la documentation

**Fichiers à modifier** :
- `src/services/tickets/create.ts` (si existe)
- Route API de création de tickets
- Ou workflow N8N (comme prévu dans `docs/workflows/n8n-jira-integration.md`)

---

### 2. **Intégration N8N pour la synchronisation**

**État actuel** :
- N8N est mentionné dans la documentation comme orchestrateur principal
- En réalité, tout est fait directement depuis Next.js
- N8N n'est utilisé que pour l'analyse IA (non lié à JIRA)

**Documentation vs Réalité** :
- **Documentation** : N8N gère les workflows de transfert et synchronisation
- **Réalité** : Next.js appelle directement l'API JIRA

**Options** :
1. **Garder l'approche actuelle** (directe) : Plus simple, moins de dépendances
2. **Migrer vers N8N** : Comme prévu dans la documentation, plus flexible

---

### 3. **Webhook JIRA configuré**

**État actuel** :
- La route API `/api/webhooks/jira` existe et fonctionne
- **MAIS** : Il faut configurer le webhook dans JIRA pour pointer vers cette URL

**Action nécessaire** :
- Configurer le webhook dans JIRA Settings → Webhooks
- URL : `https://votre-domaine.com/api/webhooks/jira`
- Événements : `jira:issue_created`, `jira:issue_updated`, `comment_created`

---

### 4. **Gestion des boucles de synchronisation**

**État actuel** :
- Le champ `last_update_source` existe dans `tickets`
- Il est mis à jour lors des synchronisations
- **MAIS** : Pas de logique explicite pour éviter les boucles

**Recommandation** :
- Vérifier `last_update_source` avant de synchroniser
- Ne pas synchroniser si `last_update_source='jira'` et mise à jour depuis Supabase

---

## 📋 Tableau récapitulatif

| Fonctionnalité | Statut | Fichier | Notes |
|----------------|--------|---------|-------|
| **Transfert Assistance → JIRA** | ✅ Fonctionnel | `src/services/tickets/jira-transfer.ts` | Appel direct API |
| **Création BUG/REQ → JIRA** | ⚠️ Partiel | `src/services/jira/client.ts` | Fonction existe mais pas automatique |
| **Webhook JIRA → Supabase** | ✅ Fonctionnel | `src/app/api/webhooks/jira/route.ts` | Route prête, webhook à configurer |
| **Sync complète JIRA → Supabase** | ✅ Fonctionnel | `src/services/jira/sync.ts` | Très complet |
| **Sync commentaires** | ✅ Fonctionnel | `src/services/jira/comments/sync.ts` | Avec pièces jointes |
| **Sync manuelle** | ✅ Fonctionnel | `src/services/jira/sync-manual.ts` | Pour correction/test |
| **Automatisation BUG/REQ** | ❌ Manquant | - | À implémenter |
| **Intégration N8N** | ⚠️ Partiel | - | N8N utilisé pour IA, pas pour JIRA |
| **Configuration webhook JIRA** | ⚠️ À faire | - | Route prête, config JIRA manquante |

---

## 🎯 Recommandations

### Priorité 1 : Automatiser la création BUG/REQ → JIRA

**Option A : Direct (recommandé pour simplicité)**
- Ajouter un appel à `createJiraIssue()` après création d'un ticket BUG/REQ
- Dans la route API de création de tickets

**Option B : Via N8N (comme prévu dans la doc)**
- Créer un workflow N8N qui écoute les créations de tickets BUG/REQ
- N8N crée le ticket JIRA et met à jour Supabase

### Priorité 2 : Configurer le webhook JIRA

- Configurer le webhook dans JIRA pour pointer vers `/api/webhooks/jira`
- Tester avec un changement de statut dans JIRA

### Priorité 3 : Améliorer la gestion des boucles

- Ajouter une vérification de `last_update_source` avant synchronisation
- Documenter le comportement attendu

### Priorité 4 : Décider de l'architecture N8N

- **Option A** : Garder l'approche directe (actuelle) - Plus simple
- **Option B** : Migrer vers N8N - Plus flexible, comme prévu dans la doc

---

## 📝 Notes techniques

### Architecture actuelle

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Supabase  │ ──────> │  Next.js    │ ──────> │    JIRA     │
│  (Frontend) │         │  (API)      │         │  (Backend)  │
└─────────────┘         └─────────────┘         └─────────────┘
       ▲                        │                       │
       │                        │                       │
       └────────────────────────┴───────────────────────┘
                    (Webhooks JIRA)
```

**Différence avec la documentation** :
- Documentation prévoit N8N comme orchestrateur
- Réalité : Next.js appelle directement JIRA

### Variables d'environnement nécessaires

```env
JIRA_URL=https://votre-entreprise.atlassian.net
JIRA_USERNAME=email@example.com
JIRA_TOKEN=votre-api-token
JIRA_SUPABASE_TICKET_ID_FIELD=customfield_10001
```

---

## 🔍 Points d'attention

1. **Pas de N8N pour JIRA** : L'architecture actuelle contourne N8N, contrairement à la documentation
2. **Automatisation manquante** : BUG/REQ ne sont pas automatiquement créés dans JIRA
3. **Webhook non configuré** : La route existe mais JIRA n'est pas configuré pour l'appeler
4. **Mapping des statuts** : Vérifier que tous les statuts JIRA sont correctement mappés vers Supabase

---

## ✅ Conclusion

**État général** : **70% fonctionnel**

- ✅ La synchronisation JIRA → Supabase est complète et fonctionnelle
- ✅ Le transfert Assistance → JIRA fonctionne
- ⚠️ La création automatique BUG/REQ → JIRA manque
- ⚠️ Le webhook JIRA doit être configuré
- ⚠️ L'architecture diffère de la documentation (pas de N8N pour JIRA)

**Prochaine étape recommandée** : Automatiser la création BUG/REQ → JIRA


