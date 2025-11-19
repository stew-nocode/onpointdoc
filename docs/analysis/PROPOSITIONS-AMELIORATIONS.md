# Propositions d'Améliorations - OnpointDoc

**Date** : 2025-01-18  
**Contexte** : Après l'implémentation de l'infinite scroll, du mapping Jira-Supabase complet, et du remplissage des champs assignés.

---

## 📊 Table des Matières

1. [UX/UI - Tableau des Tickets](#1-uxui---tableau-des-tickets)
2. [Fonctionnalités - Filtrage & Recherche](#2-fonctionnalités---filtrage--recherche)
3. [Fonctionnalités - Actions & Workflow](#3-fonctionnalités---actions--workflow)
4. [Dashboard & Reporting](#4-dashboard--reporting)
5. [Performance & Optimisation](#5-performance--optimisation)
6. [Fonctionnalités Manquantes](#6-fonctionnalités-manquantes)
7. [Maintenance & Qualité](#7-maintenance--qualité)

---

## 1. UX/UI - Tableau des Tickets

### 1.1. Tri par colonnes
**Priorité** : 🔴 Haute  
**Effort** : Moyen

- Permettre le tri par colonne (Titre, Date, Priorité, Statut, Assigné)
- Indicateurs visuels (flèches ↑↓) pour la colonne triée
- Persistance du tri dans l'URL (query params)
- Tri par défaut : Date de création (décroissant)

**Bénéfices** :
- Navigation plus rapide
- Conforme aux pratiques Jira
- Meilleure expérience utilisateur

---

### 1.2. Colonnes personnalisables
**Priorité** : 🟡 Moyenne  
**Effort** : Élevé

- Permettre de masquer/afficher des colonnes
- Sauvegarder les préférences dans localStorage
- Colonnes disponibles : Titre, Type, Statut, Priorité, Canal, Produit, Module, Jira, Créé le, Assigné, Rapporteur, Client

**Bénéfices** :
- Personnalisation selon les besoins
- Réduction de la surcharge visuelle

---

### 1.3. Actions rapides (bulk actions) ✅ **TESTS EFFECTUÉS**
**Priorité** : 🔴 Haute  
**Effort** : Moyen  
**Statut** : 🟡 En cours (tests structurels validés)

- Sélection multiple de tickets (checkboxes)
- Actions en masse :
  - Changer le statut
  - Réassigner
  - Changer la priorité
  - Exporter (CSV/Excel)
- Barre d'actions flottante quand sélection active

**Bénéfices** :
- Gain de temps pour les managers
- Traitement en lot efficace

**Tests** :
- ✅ 7/7 tests structurels réussis (voir `docs/tests/TEST-BULK-ACTIONS-RESULTS.md`)
- ✅ Base de données validée (colonnes, tables, relations)
- ✅ Logique d'export CSV testée
- ⏳ Routes API à créer et tester

---

### 1.4. Vue compacte/étendue
**Priorité** : 🟢 Basse  
**Effort** : Faible

- Toggle pour basculer entre vue compacte (moins d'espace) et vue étendue (plus de détails)
- Vue compacte : moins de padding, colonnes réduites
- Vue étendue : affichage de plus d'informations (description tronquée, tags)

---

## 2. Fonctionnalités - Filtrage & Recherche

### 2.1. Recherche textuelle globale
**Priorité** : 🔴 Haute  
**Effort** : Moyen

- Barre de recherche en haut du tableau
- Recherche dans : titre, description, clé Jira, nom du client
- Recherche en temps réel (debounce)
- Mise en surbrillance des termes trouvés
- Support des opérateurs : `"phrase exacte"`, `-exclure`, `OR`

**Bénéfices** :
- Trouver rapidement un ticket spécifique
- Essentiel avec 2000+ tickets

---

### 2.2. Filtres avancés (sidebar)
**Priorité** : 🔴 Haute  
**Effort** : Moyen

- Panel de filtres latéral (comme Jira)
- Filtres disponibles :
  - **Type** : BUG, REQ, ASSISTANCE (multi-sélection)
  - **Statut** : Nouveau, En_cours, Transfere, Resolue (multi-sélection)
  - **Priorité** : Critical, High, Medium, Low (multi-sélection)
  - **Assigné** : Sélection multiple d'utilisateurs
  - **Produit** : OBC, SNI, Credit Factory (multi-sélection)
  - **Module** : Filtre dynamique selon produit sélectionné
  - **Canal** : Email, WhatsApp, Appel, etc.
  - **Date de création** : Période (aujourd'hui, cette semaine, ce mois, personnalisé)
  - **Date de résolution** : Période
  - **Origine** : Supabase, Jira
  - **Avec/Sans Jira** : Tickets synchronisés ou non

**Bénéfices** :
- Filtrage précis selon besoins
- Sauvegarde de filtres favoris

---

### 2.3. Filtres sauvegardés
**Priorité** : 🟡 Moyenne  
**Effort** : Moyen

- Permettre de sauvegarder des combinaisons de filtres
- Nommer les filtres sauvegardés (ex: "Mes tickets en cours", "BUGs critiques")
- Partage de filtres entre utilisateurs (optionnel)
- Filtres par défaut selon rôle :
  - Support : "Mes tickets assignés"
  - Manager : "Tickets de mon équipe"
  - Director : "Tous les tickets"

---

### 2.4. Filtres rapides (quick filters)
**Priorité** : 🟡 Moyenne  
**Effort** : Faible

- Boutons de filtres rapides au-dessus du tableau :
  - "Mes tickets" (assigned_to = moi)
  - "Non assignés"
  - "En retard" (target_date < aujourd'hui)
  - "À valider" (statut = Transfere)
  - "Cette semaine"
  - "Ce mois"

---

## 3. Fonctionnalités - Actions & Workflow

### 3.1. Édition rapide (inline editing)
**Priorité** : 🔴 Haute  
**Effort** : Moyen

- Édition directe dans le tableau (comme Jira) :
  - Cliquer sur le statut → dropdown pour changer
  - Cliquer sur la priorité → dropdown pour changer
  - Cliquer sur l'assigné → combobox pour réassigner
- Sauvegarde automatique ou bouton "Enregistrer"
- Historique des changements (via `ticket_status_history`)

**Bénéfices** :
- Gain de temps énorme
- Workflow fluide

---

### 3.2. Actions contextuelles (menu clic droit)
**Priorité** : 🟡 Moyenne  
**Effort** : Moyen

- Menu contextuel au clic droit sur une ligne :
  - Voir les détails
  - Éditer
  - Changer le statut
  - Réassigner
  - Transférer vers Jira
  - Dupliquer
  - Supprimer (si permissions)
  - Copier le lien
  - Exporter

---

### 3.3. Workflow de validation
**Priorité** : 🟡 Moyenne  
**Effort** : Moyen

- Bouton "Valider" pour les managers (statut Transfere → Resolue)
- Confirmation avec commentaire optionnel
- Notification au créateur du ticket
- Historique de validation

---

### 3.4. Réassignation en masse
**Priorité** : 🟡 Moyenne  
**Effort** : Faible

- Sélection multiple + action "Réassigner"
- Dialog avec sélection de l'utilisateur
- Option : notifier l'utilisateur assigné

---

## 4. Dashboard & Reporting

### 4.1. Dashboard Manager (KPIs)
**Priorité** : 🔴 Haute  
**Effort** : Élevé

**Métriques à afficher** :
- **Tickets par statut** : Graphique en donut
- **Tickets par type** : Graphique en barres
- **Tickets par priorité** : Graphique en barres
- **Tickets par produit** : Graphique en barres
- **MTTR (Mean Time To Resolution)** : Temps moyen de résolution
- **Tickets créés/résolus** : Graphique temporel (7 derniers jours, 30 jours, 90 jours)
- **Charge par assigné** : Graphique en barres horizontales
- **Tickets en retard** : Liste avec target_date dépassée
- **Top 10 clients** : Par nombre de tickets
- **Top 10 modules** : Par nombre de tickets

**Filtres** :
- Période (7j, 30j, 90j, personnalisé)
- Produit
- Module
- Département

**Bénéfices** :
- Vision globale pour les managers
- Prise de décision basée sur les données

---

### 4.2. Dashboard Direction (DG/DAF)
**Priorité** : 🔴 Haute  
**Effort** : Élevé

**Métriques stratégiques** :
- **Santé produit** : Score par produit (basé sur MTTR, backlog, résolution)
- **Performance équipes** : Par département
- **Tendances** : Évolution sur 6 mois
- **Prévisions** : Projection basée sur les tendances
- **Coûts** : Estimation basée sur durée × coût horaire
- **Satisfaction client** : Si métrique disponible

**Vue consolidée** :
- Tous les produits
- Tous les départements
- Comparaisons périodiques

---

### 4.3. Rapports exportables
**Priorité** : 🟡 Moyenne  
**Effort** : Moyen

- Export CSV/Excel des tickets filtrés
- Export PDF pour rapports mensuels
- Templates de rapports :
  - Rapport hebdomadaire Support
  - Rapport mensuel Direction
  - Rapport par produit

---

### 4.4. Graphiques interactifs
**Priorité** : 🟡 Moyenne  
**Effort** : Moyen

- Utiliser une librairie de graphiques (Recharts, Chart.js)
- Graphiques interactifs (zoom, filtres au clic)
- Export des graphiques en image

---

## 5. Performance & Optimisation

### 5.1. Cache et optimisations API
**Priorité** : 🟡 Moyenne  
**Effort** : Moyen

- Cache React Query / SWR pour les données fréquentes
- Mise en cache des listes (produits, modules, utilisateurs)
- Invalidation intelligente du cache
- Pagination optimisée avec prefetching

**Bénéfices** :
- Réduction des appels API
- Interface plus réactive

---

### 5.2. Indexation base de données
**Priorité** : 🟡 Moyenne  
**Effort** : Faible

- Vérifier les index existants
- Ajouter des index composites pour les requêtes fréquentes :
  - `(status, ticket_type, created_at)`
  - `(assigned_to, status)`
  - `(product_id, module_id)`
  - `(jira_issue_key)` (si pas déjà indexé)

---

### 5.3. Lazy loading des composants
**Priorité** : 🟢 Basse  
**Effort** : Faible

- Lazy load des dialogs lourds
- Code splitting par route
- Optimisation des images (si ajoutées)

---

### 5.4. Virtualisation du tableau
**Priorité** : 🟡 Moyenne  
**Effort** : Moyen

- Si le tableau devient très long (>1000 lignes visibles)
- Utiliser `react-window` ou `@tanstack/react-virtual`
- Rendu uniquement des lignes visibles

**Bénéfices** :
- Performance constante même avec 10k+ tickets

---

## 6. Fonctionnalités Manquantes

### 6.1. Page Activités (complète)
**Priorité** : 🔴 Haute  
**Effort** : Élevé

**Fonctionnalités** :
- Liste des activités avec infinite scroll
- Création/édition d'activités
- Gestion des participants
- Liaison activités ↔ tickets (many-to-many)
- Calendrier des activités
- Pièces jointes

**État actuel** : Page vide

---

### 6.2. Page Tâches (complète)
**Priorité** : 🔴 Haute  
**Effort** : Élevé

**Fonctionnalités** :
- Liste des tâches avec infinite scroll
- Création/édition de tâches
- Statuts : À faire, En cours, Terminée
- Priorités
- Dates d'échéance
- Liaison tâches ↔ tickets (many-to-many)
- Liaison tâches ↔ activités (many-to-many)

**État actuel** : Page vide

---

### 6.3. Notifications en temps réel
**Priorité** : 🟡 Moyenne  
**Effort** : Élevé

- Utiliser Supabase Realtime pour les notifications
- Notifications pour :
  - Nouveau ticket assigné
  - Changement de statut
  - Nouveau commentaire
  - Réassignation
- Badge de notification dans la top bar
- Centre de notifications

---

### 6.4. Commentaires sur tickets
**Priorité** : 🔴 Haute  
**Effort** : Moyen

- Section commentaires dans la page détail ticket
- Ajout de commentaires
- Mentions d'utilisateurs (@nom)
- Pièces jointes dans les commentaires
- Historique complet

**État actuel** : Table `ticket_comments` existe mais pas d'UI

---

### 6.5. Historique des changements
**Priorité** : 🟡 Moyenne  
**Effort** : Moyen

- Timeline des changements dans la page détail
- Affichage de :
  - Changements de statut
  - Réassignations
  - Modifications de champs
  - Commentaires
- Filtre par type de changement

**État actuel** : Table `ticket_status_history` existe mais pas d'UI

---

### 6.6. Pièces jointes améliorées
**Priorité** : 🟡 Moyenne  
**Effort** : Moyen

- Galerie de pièces jointes
- Prévisualisation (images, PDF)
- Téléchargement en lot
- Gestion des permissions (qui peut voir/télécharger)

---

## 7. Maintenance & Qualité

### 7.1. Tests automatisés
**Priorité** : 🟡 Moyenne  
**Effort** : Élevé

- Tests unitaires (services, utilitaires)
- Tests d'intégration (API routes)
- Tests E2E (Playwright) pour les workflows critiques :
  - Création de ticket
  - Transfert vers Jira
  - Filtrage et recherche

---

### 7.2. Monitoring et logging
**Priorité** : 🟡 Moyenne  
**Effort** : Moyen

- Logging structuré des erreurs
- Monitoring des performances API
- Alertes pour erreurs critiques
- Dashboard de santé de l'application

---

### 7.3. Documentation utilisateur
**Priorité** : 🟡 Moyenne  
**Effort** : Moyen

- Guide utilisateur complet
- Tutoriels vidéo (optionnel)
- FAQ
- Aide contextuelle (tooltips, modals d'aide)

---

### 7.4. Accessibilité (a11y)
**Priorité** : 🟡 Moyenne  
**Effort** : Moyen

- Audit d'accessibilité
- Support clavier complet
- ARIA labels appropriés
- Contraste des couleurs (WCAG AA)

---

## 📋 Plan d'Action Recommandé

### Phase 1 - Priorité Haute (2-3 semaines)
1. ✅ Recherche textuelle globale
2. ✅ Filtres avancés (sidebar)
3. ✅ Tri par colonnes
4. ✅ Édition rapide (inline)
5. ✅ Actions rapides (bulk)
6. ✅ Commentaires sur tickets

### Phase 2 - Priorité Moyenne (3-4 semaines)
7. ✅ Dashboard Manager (KPIs)
8. ✅ Dashboard Direction
9. ✅ Page Activités (complète)
10. ✅ Page Tâches (complète)
11. ✅ Filtres sauvegardés
12. ✅ Historique des changements

### Phase 3 - Optimisations (2 semaines)
13. ✅ Cache et optimisations API
14. ✅ Indexation base de données
15. ✅ Tests automatisés
16. ✅ Notifications en temps réel

---

## 🎯 Métriques de Succès

- **Temps moyen de traitement d'un ticket** : Réduction de 30%
- **Satisfaction utilisateur** : Score > 4/5
- **Performance** : Temps de chargement < 2s
- **Taux d'adoption** : 90% des utilisateurs actifs

---

**Note** : Les priorités peuvent être ajustées selon les besoins métier et les retours utilisateurs.

