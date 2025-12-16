# Analyse des 46 Relances de Type Indéterminé

**Date :** 2025-12-11  
**Objectif :** Analyser les 46 relances flaggées mais sans type déterminé (bug/requete) pour proposer une classification

---

## Résumé Exécutif

- **Total analysé :** 46 tickets
- **Recommandation Bug :** 8 tickets
- **Recommandation Requête :** 20 tickets
- **Recommandation Assistance (non-relance technique) :** 15 tickets
- **Vraiment indéterminé :** 3 tickets

---

## Analyse Détaillée par Catégorie

### 🔴 CATÉGORIE 1 : Relances sur Bug (8 tickets)

Ces tickets concernent des problèmes techniques ou des dysfonctionnements :

| ID | JIRA Key | Titre | Raison |
|---|---|---|---|
| `88e11c84-f186-4595-b9a4-49aa31e97e60` | OBCS-11192 | Relance Numéro de bon de commande qui ne se déverse pas | Problème technique (dysfonctionnement) |
| `768ca717-a24d-453a-9187-6b6ebe1a32a3` | OBCS-11532 | Relance traitement écart génération écritures de paie | Problème technique (écart) |
| `deb14e71-8e5c-4898-99ca-d88fdeeef3a2` | OBCS-10753 | Relance concernant le plan comptable tiers fournisseurs non enregistré dans OBC | Problème technique (données manquantes) |
| `b22b91b4-f892-448b-9823-4b2a4cbef615` | OBCS-9059 | Relance sur les numéros d'imputations | Problème technique (numéros) |
| `4c8b128b-d530-4030-b468-54791bfd996e` | OBCS-5210 | Relance sur la supression et l'importation du journal vente de 2023 | Problème technique (importation) |
| `5d855417-0686-41ef-9347-2e44eb014939` | OBCS-5157 | Relance sur le bus suivi de stock | Problème technique (bug suivi) |
| `7c357b61-1335-49e5-820f-6f93b80bfa6c` | OBCS-4840 | Relance sur opérations à supprimer | Problème technique (données à corriger) |
| `30579ae4-d3b6-47de-ad07-e16ab77fbbf2` | OBCS-4787 | Relance suppression données Paie | Problème technique (données) |

**Recommandation :** `relance_type = 'bug'`

---

### 🟢 CATÉGORIE 2 : Relances sur Requête (20 tickets)

Ces tickets concernent des demandes d'information, de modification ou d'intégration :

| ID | JIRA Key | Titre | Raison |
|---|---|---|---|
| `56231109-b411-49fd-9c4a-b9076dcb0b9b` | OBCS-6263 | Relance sur réquête en cours | **Faute d'orthographe** : "réquête" au lieu de "requête" |
| `2decfc56-05a4-4041-8cbc-0ca40aeb0838` | OBCS-5323 | Relance sur la mise à jour du PUMP du stock | Demande de modification |
| `c3684d94-637d-48d8-b15f-cf0d3c907f40` | OBCS-4650 | Relance pour données fichiers du personnel + contrat de travail | Demande de données/intégration |
| `226a7618-8ece-4c98-82ee-2358f31f24ed` | OBCS-11134 | Relance sujet de programmation multiples + exécution de règlement fournisseurs | Demande de modification |
| `3b61fdc5-526e-4bc8-8a48-5867b4c24f8b` | OBCS-8617 | Relance sur la programmation de salaire à faire | Demande d'action |
| `fafb0903-c21e-4be1-ad30-0c2ac3b42c27` | OBCS-7409 | Relance sur modèle de bulletin de paie | Demande de modification |
| `3c12a390-d736-467a-b5e8-9067b43697d1` | OBCS-7179 | Relance pour la création de deux autres entités | Demande de création |
| `854ef663-723a-46e9-a508-c134568c729d` | OBCS-6992 | Relance sur le point d'avancement du stock | Demande d'information |
| `e4d5d11f-e557-4763-a188-7c8163fb9357` | OBCS-6830 | Relance sur le point de stock | Demande d'information |
| `808f0134-e406-43c4-a550-5eb0a9a9d5e7` | OBCS-3931 | Paramétrage relance Fournisseur | Demande de paramétrage |
| `d8a66318-abf3-457c-a464-2f6e4de25cfa` | OBCS-3319 | Relance sur Etats Financiers + Données à supprimer | Demande d'action |
| `1878d560-f1ee-4084-9175-ef38c9374bb0` | OBCS-3308 | Relance pour l'historique de la comptabilité et du stock | Demande d'information |
| `8768c172-3ab1-455d-98e4-fafe7a902fa8` | OBCS-3137 | Relance pour revue Mise à jour stock initial | Demande de modification |
| `6e33f8f9-805c-4d5a-ab69-684358a61e7a` | OBCS-3000 | Relance sur les budget | Demande d'information |
| `6277e644-21e6-481d-8023-cdae5bd6d8fe` | OBCS-3932 | Relance Retour Vérification Balance | Demande de vérification |
| `25b39bee-6fbe-4926-8fee-ef80ed00ded3` | OBCS-11138 | Relance sur démarrage des RH | Demande d'action |
| `1f4b7f57-8d6b-42a1-ac7f-97597b88f2c6` | OBCS-11124 | Relance récupération de données comptable | Demande de données |
| `5f8c054d-9677-40e9-96a6-3fb25accba11` | OBCS-11123 | Relance récupération de données | Demande de données |
| `680c7822-c4e3-43e9-88d5-8794be71e38f` | OBCS-4325 | Relance et point d'étape de la collecte de données | Demande de données |
| `9a51797d-e716-4029-be97-36eee6af7cf1` | OBCS-3315 | Relance sur mail d'explication | Demande d'information |

**Recommandation :** `relance_type = 'requete'`

---

### 🟡 CATÉGORIE 3 : Relances sur Assistance/Planning (15 tickets)

Ces tickets concernent des relances sur des séances de travail, rendez-vous, ou assistance non technique :

| ID | JIRA Key | Titre | Raison |
|---|---|---|---|
| `4385d97a-a797-4880-b992-6f43656c6e41` | OBCS-11399 | Relancer sur séance de travail avec équipe Cameroun | Planning/Séance |
| `8a0f4633-8d0e-44f4-9bcc-7872776a78ac` | OBCS-10734 | Relance présentation Agro - Export | Planning/Séance |
| `0491f787-8f85-490f-b734-c41a20375dde` | OBCS-9153 | Relance disponibilité Pour séance de travail | Planning/Séance |
| `7f6280ce-cc14-4e9c-b89a-2e2eb5cfb60e` | OBCS-8790 | Relance sur séance de présentation | Planning/Séance |
| `e54c8634-0f91-4f85-9e24-526f5cc2923c` | OBCS-5300 | Relance sur calendrier de mission | Planning |
| `0cbd36b7-a7eb-4d46-bf2e-e311a6c0dcc3` | OBCS-5060 | Relance pour le meetin | Planning/RDV |
| `b30f2339-38bd-4965-b25f-c3f1e0582278` | OBCS-4881 | Relance pour confirmation de RDV | Planning/RDV |
| `e27d2499-c29d-4715-b011-4adffdeb84c5` | OBCS-4928 | Relance pour la fin des tests | Suivi de tests |
| `308e2aa7-d58a-4e95-9d49-b592f094c085` | OBCS-4465 | Relance des users sur la formation prévue | Formation |
| `8a29dd53-37c3-4483-a400-30a85fa81805` | OBCS-4154 | Relance paiement | Paiement (non technique) |
| `9bd32b5e-950b-4346-9b1d-4965600bd0a3` | OBCS-3309 | Relance pour la séance en ligne sur le module projet | Planning/Séance |
| `14f288aa-c735-49ca-9df4-1d537a5f7891` | OBCS-3107 | Relance Mise en route OBC | Assistance générale |
| `357c58dd-0079-4401-ac35-64a2de82c100` | OBCS-2471 | Relance Rendez-vous | Planning/RDV |
| `bafee6ca-a214-4b0a-8bbf-9fc1c96df5b3` | OBCS-11867 | Relance sur paiement en attente | Paiement (non technique) |
| `cfd57ca0-0e2b-40bf-934a-0ee0bb300557` | OBCS-11545 | Relance sur facture en cours | Facturation (non technique) |

**Recommandation :** Garder `relance_type = NULL` (ce sont des relances d'assistance/planning, pas des relances techniques sur Bug/Requête)

---

### ⚪ CATÉGORIE 4 : Vraiment Indéterminé (3 tickets)

Ces tickets sont trop vagues pour être catégorisés :

| ID | JIRA Key | Titre | Raison |
|---|---|---|---|
| `383acb25-b6cd-4a09-86a1-c0afce8cea83` | OBCS-4768 | ASSISTANCE SUR RELANCE CLIENT | Trop vague (relance client = fonctionnalité métier) |
| `c0e55f60-e58a-4193-8901-85e6acdd0508` | OBCS-4767 | ASSISTANCE SUR RELANCE CLIENT | Trop vague (relance client = fonctionnalité métier) |
| `a97e46d9-8782-4350-8e46-f758c08a8905` | OBCS-4673 | Relance sur les tests | Trop vague (tests de quoi ?) |

**Recommandation :** Garder `relance_type = NULL` (nécessite analyse manuelle)

---

## Recommandations Globales

### Option 1 : Classification Automatique (Recommandée)
- **8 tickets** → `relance_type = 'bug'`
- **20 tickets** → `relance_type = 'requete'`
- **18 tickets** → Garder `relance_type = NULL` (assistance/planning ou indéterminé)

### Option 2 : Garder Tous Indéterminés
- Tous les 46 tickets restent avec `relance_type = NULL`
- Avantage : Pas de risque de mauvaise classification
- Inconvénient : Perte d'information pour les 28 tickets classifiables

### Option 3 : Classification Manuelle
- Analyser manuellement les 3 tickets vraiment indéterminés
- Classifier automatiquement les 43 autres selon les recommandations

---

## Script de Classification Proposé

Un script peut être créé pour appliquer automatiquement ces classifications :

```sql
-- Relances sur Bug (8 tickets)
UPDATE tickets SET relance_type = 'bug' WHERE id IN (
  '88e11c84-f186-4595-b9a4-49aa31e97e60',
  '768ca717-a24d-453a-9187-6b6ebe1a32a3',
  'deb14e71-8e5c-4898-99ca-d88fdeeef3a2',
  'b22b91b4-f892-448b-9823-4b2a4cbef615',
  '4c8b128b-d530-4030-b468-54791bfd996e',
  '5d855417-0686-41ef-9347-2e44eb014939',
  '7c357b61-1335-49e5-820f-6f93b80bfa6c',
  '30579ae4-d3b6-47de-ad07-e16ab77fbbf2'
);

-- Relances sur Requête (20 tickets)
UPDATE tickets SET relance_type = 'requete' WHERE id IN (
  '56231109-b411-49fd-9c4a-b9076dcb0b9b',
  '2decfc56-05a4-4041-8cbc-0ca40aeb0838',
  'c3684d94-637d-48d8-b15f-cf0d3c907f40',
  '226a7618-8ece-4c98-82ee-2358f31f24ed',
  '3b61fdc5-526e-4bc8-8a48-5867b4c24f8b',
  'fafb0903-c21e-4be1-ad30-0c2ac3b42c27',
  '3c12a390-d736-467a-b5e8-9067b43697d1',
  '854ef663-723a-46e9-a508-c134568c729d',
  'e4d5d11f-e557-4763-a188-7c8163fb9357',
  '808f0134-e406-43c4-a550-5eb0a9a9d5e7',
  'd8a66318-abf3-457c-a464-2f6e4de25cfa',
  '1878d560-f1ee-4084-9175-ef38c9374bb0',
  '8768c172-3ab1-455d-98e4-fafe7a902fa8',
  '6e33f8f9-805c-4d5a-ab69-684358a61e7a',
  '6277e644-21e6-481d-8023-cdae5bd6d8fe',
  '25b39bee-6fbe-4926-8fee-ef80ed00ded3',
  '1f4b7f57-8d6b-42a1-ac7f-97597b88f2c6',
  '5f8c054d-9677-40e9-96a6-3fb25accba11',
  '680c7822-c4e3-43e9-88d5-8794be71e38f',
  '9a51797d-e716-4029-be97-36eee6af7cf1'
);
```

---

## Notes Importantes

1. **Faute d'orthographe détectée :** Le ticket OBCS-6263 contient "réquête" au lieu de "requête" - c'est pourquoi il n'a pas été détecté automatiquement.

2. **Relances non techniques :** 15 tickets concernent des relances sur planning, séances, paiements - ce ne sont pas des relances techniques sur Bug/Requête. Il est logique de les garder avec `relance_type = NULL`.

3. **Amélioration du script :** Le script pourrait être amélioré pour :
   - Détecter les fautes d'orthographe courantes ("réquête", "requete")
   - Ajouter plus de mots-clés contextuels
   - Analyser les patterns récurrents

---

**Prochaine étape :** Attendre validation avant d'appliquer les classifications.


