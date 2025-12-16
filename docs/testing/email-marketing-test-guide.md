# Guide de Test - Page Email Marketing

**Date :** 2025-12-15  
**URL de test :** `/marketing/email`

---

## 🎯 Objectifs de Test

1. Vérifier que la page charge sans erreur
2. Valider l'affichage de tous les composants
3. Tester le lazy loading des KPIs
4. Vérifier la cohérence avec les autres pages
5. Valider la gestion des données (vides ou réelles)

---

## 📋 Étapes de Test

### Test 1 : Chargement de Base

**Objectif :** Vérifier que la page se charge sans erreur

**Actions :**
1. Naviguer vers `/marketing/email`
2. Vérifier la console du navigateur (F12) - **Aucune erreur**
3. Vérifier la console serveur - **Aucune erreur**

**Résultat attendu :**
- ✅ Page charge sans erreur
- ✅ Pas d'erreurs dans la console
- ✅ Structure de base visible

---

### Test 2 : Vérification du Header

**Objectif :** Valider l'affichage du header standardisé

**Vérifications :**
- [ ] Icône "Mail" visible à gauche du titre
- [ ] Titre "Email Marketing" affiché
- [ ] Description "Gestion des campagnes email Brevo" affichée
- [ ] Bouton "Synchroniser" visible (outline, avec icône RefreshCw)
- [ ] Bouton "Nouvelle campagne" visible (primary, avec icône Plus)

**Résultat attendu :**
- ✅ Tous les éléments du header sont visibles et correctement positionnés

---

### Test 3 : Vérification du Banner

**Objectif :** Valider l'affichage et le fonctionnement du banner

**Vérifications :**
- [ ] Banner "🚀 Configuration requise" visible **entre Header et KPIs**
- [ ] Description "Avant d'utiliser l'email marketing, vous devez :" affichée
- [ ] Liste à puces avec 3 éléments visible :
  - Appliquer la migration Supabase
  - Configurer votre clé API Brevo
  - Synchroniser les campagnes
- [ ] Code snippets (`BannerCode`) visibles et formatés
- [ ] Bouton de fermeture (X) visible en haut à droite
- [ ] **Test de fermeture :** Cliquer sur X → Banner disparaît
- [ ] **Test de persistance :** Rafraîchir la page → Banner reste fermé (sessionStorage)

**Résultat attendu :**
- ✅ Banner correctement positionné et fonctionnel

---

### Test 4 : Vérification des KPIs (Loading State)

**Objectif :** Valider le lazy loading et le state de chargement

**Vérifications initiales (première seconde) :**
- [ ] 4 skeleton cards visibles pendant le chargement
- [ ] Skeleton cards avec loader (Loader2 spinning)
- [ ] Grille responsive visible

**Résultat attendu :**
- ✅ Loading state fonctionne correctement

---

### Test 5 : Vérification des KPIs (Données)

**Objectif :** Valider l'affichage des 4 KPIs

**KPI 1 : Total Campagnes**
- [ ] Icône Mail (enveloppe) visible
- [ ] Variant "info" (fond bleu clair / bordure bleue)
- [ ] Titre "Total Campagnes" visible
- [ ] Valeur numérique affichée (peut être 0 si aucune campagne)
- [ ] Description "Campagnes créées" visible
- [ ] **Si données :** Tendances et mini-graphique (optionnel)

**KPI 2 : Taux d'ouverture moyen**
- [ ] Icône Eye (œil) visible
- [ ] Variant "success" (fond vert clair / bordure verte)
- [ ] Titre "Taux d'ouverture moyen" visible
- [ ] Valeur formatée avec "%" (ex: "42.5%")
- [ ] Description "Toutes campagnes confondues" visible
- [ ] Subtitle "Performance moyenne" visible

**KPI 3 : Taux de clic moyen**
- [ ] Icône MousePointerClick (souris qui clique) visible
- [ ] Variant "default" (fond blanc / bordure grise)
- [ ] Titre "Taux de clic moyen" visible
- [ ] Valeur formatée avec "%" (ex: "8.3%")
- [ ] Description "Engagement moyen" visible
- [ ] Subtitle "Performance moyenne" visible

**KPI 4 : Emails envoyés**
- [ ] Icône Send (avion en papier) visible
- [ ] Variant "default" (fond blanc / bordure grise)
- [ ] Titre "Emails envoyés" visible
- [ ] Valeur formatée :
  - Si < 1000 : nombre brut (ex: "542")
  - Si >= 1000 : format k (ex: "1.2k")
  - Si >= 1000000 : format M (ex: "2.5M")
- [ ] Description "Total toutes campagnes" visible
- [ ] Subtitle "Volume total" visible

**Résultat attendu :**
- ✅ Tous les KPIs affichés correctement avec bonnes icônes et formatage

---

### Test 6 : Vérification de la Card "Campagnes récentes"

**Objectif :** Valider l'affichage de la card principale

**Vérifications :**
- [ ] Card visible avec titre "Campagnes récentes"
- [ ] Contenu placeholder affiché :
  - Icône Mail (grande, centrée, opacité 50%)
  - Texte "Aucune campagne" (grand, bold)
  - Texte "Configurez votre clé API Brevo..."
- [ ] Suspense fallback fonctionne (CampaignsLoader)

**Résultat attendu :**
- ✅ Card principale affichée correctement

---

### Test 7 : Test Responsive

**Objectif :** Valider que la page s'adapte aux différentes tailles d'écran

**Tests à effectuer :**
1. **Mobile (< 768px) :**
   - [ ] KPIs en 1 colonne
   - [ ] Header responsive
   - [ ] Banner adapté

2. **Tablette (768px - 1024px) :**
   - [ ] KPIs en 2 colonnes
   - [ ] Layout adapté

3. **Desktop (> 1024px) :**
   - [ ] KPIs en 4 colonnes
   - [ ] Layout optimal

**Résultat attendu :**
- ✅ Page responsive sur toutes les tailles

---

### Test 8 : Test avec Données Réelles (Optionnel)

**Objectif :** Valider le calcul des KPIs avec des données réelles

**Prérequis :** Insérer des campagnes de test dans `brevo_email_campaigns`

**Actions :**
1. Se connecter à Supabase
2. Insérer quelques campagnes de test :
   ```sql
   INSERT INTO brevo_email_campaigns (
     brevo_campaign_id, campaign_name, status,
     emails_sent, open_rate, click_rate
   ) VALUES
   (1, 'Campagne Test 1', 'sent', 1000, 42.5, 8.3),
   (2, 'Campagne Test 2', 'sent', 500, 35.0, 6.5);
   ```
3. Rafraîchir la page `/marketing/email`
4. Vérifier les KPIs :
   - Total Campagnes = 2
   - Taux d'ouverture moyen = (42.5 + 35.0) / 2 = 38.75%
   - Taux de clic moyen = (8.3 + 6.5) / 2 = 7.4%
   - Emails envoyés = 1500

**Résultat attendu :**
- ✅ Calculs corrects avec données réelles

---

### Test 9 : Comparaison avec Autres Pages

**Objectif :** Vérifier la cohérence visuelle et structurelle

**Comparaisons :**
1. **Avec `/gestion/tickets` :**
   - [ ] Même structure de layout
   - [ ] Même style de KPIs
   - [ ] Même pattern de banner

2. **Avec `/gestion/activites` :**
   - [ ] Même lazy loading pattern
   - [ ] Même structure de composants

3. **Avec `/gestion/taches` :**
   - [ ] Même style de KPICards
   - [ ] Même fonctions helper

**Résultat attendu :**
- ✅ Page parfaitement alignée avec les autres pages

---

## 🐛 Erreurs Connues / Problèmes Potentiels

### Problème 1 : Données vides
**Symptôme :** Tous les KPIs affichent 0  
**Normal :** Si aucune campagne n'existe dans la DB  
**Solution :** Créer des campagnes de test (voir Test 8)

### Problème 2 : Erreurs RLS
**Symptôme :** Erreur 403 Forbidden  
**Cause :** Permissions Supabase  
**Solution :** Vérifier que l'utilisateur a le rôle Marketing ou Manager/Director/Admin

### Problème 3 : Formatage incorrect
**Symptôme :** Pourcentages affichés incorrectement  
**Vérifier :** Les taux dans la DB sont en pourcentage (0-100), pas en décimal (0-1)

---

## ✅ Résultat Final

**Tous les tests doivent passer :**
- [ ] Page charge sans erreur
- [ ] Header correct
- [ ] Banner fonctionnel
- [ ] KPIs affichés correctement
- [ ] Responsive design OK
- [ ] Cohérence avec autres pages
- [ ] (Optionnel) Calculs corrects avec données réelles

---

## 📝 Notes

- Les KPIs afficheront 0 si aucune campagne n'existe (normal pour MVP)
- Le lazy loading améliore les performances initiales
- Le banner peut être fermé et reste fermé via sessionStorage
