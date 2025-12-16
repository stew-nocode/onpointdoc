# Checklist de Validation - Page Email Marketing

**Date :** 2025-12-15  
**Objectif :** Valider l'alignement de la page Email Marketing avec les autres pages (Tickets, Activities, Tasks)

---

## ✅ Checklist de Validation

### Phase 1 : Compilation et Erreurs

- [x] **Pas d'erreurs de compilation TypeScript**
  - ✅ Vérifié avec `read_lints` - Aucune erreur

- [x] **Tous les imports sont corrects**
  - ✅ Tous les imports vérifiés

- [x] **Types alignés avec les autres composants**
  - ✅ `EmailMarketingKPIs` aligné avec `TaskKPIs` et `ActivityKPIs`
  - ✅ Props `hasProfile` ajoutée pour cohérence

---

### Phase 2 : Structure de la Page

- [ ] **Page utilise `PageLayoutWithFilters`**
  - À vérifier visuellement dans le navigateur

- [ ] **Header standardisé affiché correctement**
  - Icon "Mail" visible
  - Titre "Email Marketing"
  - Description "Gestion des campagnes email Brevo"
  - Boutons "Synchroniser" et "Nouvelle campagne" visibles

- [ ] **Banner affiché entre Header et KPIs**
  - Banner "Configuration requise" visible
  - Contenu du banner correct
  - Banner peut être fermé (vérifier storageKey)

- [ ] **Section KPIs affichée**
  - 4 KPICards standardisées visibles
  - Grille responsive (kpi-grid-responsive)

- [ ] **Card "Campagnes récentes" affichée**
  - Titre visible
  - Contenu placeholder affiché (Suspense)

---

### Phase 3 : Composants KPI

- [ ] **EmailMarketingKPISectionLazy charge correctement**
  - Loading state affiché au chargement initial
  - Composant final affiché après chargement

- [ ] **4 KPIs affichés correctement :**

  - [ ] **Total Campagnes**
    - Icône Mail visible
    - Variant "info" (couleur bleue)
    - Valeur numérique affichée
    - Description "Campagnes créées"

  - [ ] **Taux d'ouverture moyen**
    - Icône Eye visible
    - Variant "success" (couleur verte)
    - Valeur formatée avec "%" (ex: "42.5%")
    - Description "Toutes campagnes confondues"
    - Subtitle "Performance moyenne"

  - [ ] **Taux de clic moyen**
    - Icône MousePointerClick visible
    - Variant "default"
    - Valeur formatée avec "%" (ex: "8.3%")
    - Description "Engagement moyen"
    - Subtitle "Performance moyenne"

  - [ ] **Emails envoyés**
    - Icône Send visible
    - Variant "default"
    - Valeur formatée (ex: "1.2k", "2.5M" ou nombre brut)
    - Description "Total toutes campagnes"
    - Subtitle "Volume total"

---

### Phase 4 : Service et Données

- [ ] **Service `getEmailMarketingKPIs()` fonctionne**
  - Vérifier qu'il n'y a pas d'erreur dans la console
  - Vérifier les valeurs retournées (même si 0)

- [ ] **Gestion des données vides**
  - Si aucune campagne : Total = 0
  - Si aucun taux : Taux = 0.0%
  - Si aucun email : Total = 0

- [ ] **Requêtes Supabase correctes**
  - Pas d'erreur RLS (Row Level Security)
  - Permissions Marketing vérifiées

---

### Phase 5 : Performance et UX

- [ ] **Lazy loading fonctionne**
  - Skeleton cards visibles au chargement
  - KPIs chargés après (code splitting)

- [ ] **Responsive design**
  - Grille KPIs s'adapte sur mobile (1 colonne)
  - Grille KPIs s'adapte sur tablette (2 colonnes)
  - Grille KPIs s'adapte sur desktop (4 colonnes)

- [ ] **Banner dismissible**
  - Banner peut être fermé
  - Banner ne réapparaît pas après fermeture (sessionStorage)

---

### Phase 6 : Cohérence avec les Autres Pages

- [ ] **Structure identique à `/gestion/tickets`**
  - Même layout (PageLayoutWithFilters)
  - Même pattern KPIs
  - Même pattern Banner

- [ ] **Structure identique à `/gestion/activites`**
  - Même pattern de lazy loading
  - Même structure de composants

- [ ] **Structure identique à `/gestion/taches`**
  - Même pattern de KPICards
  - Même fonctions helper (isTrendPositive)

---

## 🐛 Problèmes Potentiels à Vérifier

### Problème 1 : Données vides (table brevo_email_campaigns vide)
**Symptôme :** Tous les KPIs affichent 0  
**Attendu :** Valeurs à 0 sont normales si aucune campagne n'existe  
**Action :** Créer quelques campagnes de test dans Supabase pour valider les calculs

### Problème 2 : Erreurs RLS
**Symptôme :** Erreur 403 ou données non chargées  
**Attendu :** L'utilisateur doit avoir le rôle Marketing ou Manager/Director/Admin  
**Action :** Vérifier les permissions dans Supabase

### Problème 3 : Formatage des pourcentages
**Symptôme :** Valeurs incorrectes (ex: 4250% au lieu de 42.5%)  
**Attendu :** Les taux sont stockés en pourcentage (0-100) dans la DB  
**Action :** Vérifier que `open_rate` et `click_rate` sont bien en pourcentage (0-100)

---

## 📝 Notes de Test

### Test 1 : Affichage de base
```
1. Naviguer vers /marketing/email
2. Vérifier que la page charge sans erreur
3. Vérifier l'affichage de tous les éléments
```

### Test 2 : Données réelles
```
1. Insérer quelques campagnes dans brevo_email_campaigns
2. Rafraîchir la page
3. Vérifier que les KPIs affichent les bonnes valeurs
```

### Test 3 : Responsive
```
1. Tester sur différentes tailles d'écran
2. Vérifier que la grille s'adapte
```

---

## ✅ Résultat Final

- [ ] Tous les tests passent
- [ ] Aucune erreur console
- [ ] Page alignée avec les autres pages
- [ ] Performance acceptable
- [ ] UX cohérente

---

**Prochaines étapes après validation :**
1. Implémenter la liste des campagnes avec infinite scroll
2. Ajouter les tendances aux KPIs (si données disponibles)
3. Implémenter la synchronisation Brevo
