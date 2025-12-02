# Résumé : Widgets Performance Agents Support

## 🎯 Objectif

Créer des widgets graphiques pour suivre les performances des agents support, avec filtres flexibles (type de ticket, période, module, etc.).

---

## ✅ Contexte Technique

- ✅ **Recharts** déjà installé (`recharts@2.15.4`)
- ✅ Structure de widgets existante dans `src/components/dashboard/ceo/`
- ✅ Système de configuration dynamique via base de données
- ✅ KPIs basiques existants (`support-kpis.ts`)

---

## 💡 5 Options de Widgets Proposées

### 🥇 **Option 1 : Scorecard Performance Agent** (⭐ RECOMMANDÉ POUR MVP)

**Type**: KPI Cards + Mini Graphique

**Contenu**:
- 📊 **4 KPIs** :
  - Tickets résolus (période)
  - MTTR moyen (temps de résolution)
  - Taux de résolution (%)
  - Tickets en retard
- 📈 **Mini graphique**: Évolution sur 7 jours
- 📉 **Tendances**: vs période précédente

**Filtres**:
- Période (semaine, mois, trimestre)
- Type de ticket (BUG, REQ, ASSISTANCE, Tous)
- Module/Produit
- Agent (multiselect)

**Complexité**: ⭐⭐ (Moyenne)  
**Impact**: ⭐⭐⭐⭐⭐ (Très élevé)  
**Temps estimé**: 2-3 jours

---

### 🥈 **Option 2 : Graphique Évolution Performance** (⭐ RECOMMANDÉ)

**Type**: Graphique linéaire (Recharts LineChart)

**Contenu**:
- 📈 **3 lignes** :
  - Tickets résolus par jour/semaine
  - MTTR moyen (en jours)
  - Tickets créés (charge entrante)

**Filtres**:
- Période (7, 30, 90 jours)
- Type de ticket
- Agent(s) (comparaison multi-agents)
- Module/Produit

**Complexité**: ⭐⭐⭐ (Élevée)  
**Impact**: ⭐⭐⭐⭐ (Élevé)  
**Temps estimé**: 3-4 jours

---

### 🥉 **Option 3 : Tableau Comparatif avec Graphiques**

**Type**: Table enrichie (comme `WorkloadByAgentTable`)

**Colonnes**:
- Agent, Équipe
- Tickets Actifs, Résolus, MTTR, Taux
- Graphique mini (évolution 7 jours)

**Filtres**:
- Période, Type, Module, Tri par colonne

**Complexité**: ⭐⭐⭐ (Élevée)  
**Impact**: ⭐⭐⭐⭐ (Élevé)  
**Temps estimé**: 3-4 jours

---

### ⭐ **Option 4 : Heatmap Performance par Type** (Phase 2)

**Type**: Heatmap (matrice)

**Axes**:
- X: Type (BUG, REQ, ASSISTANCE)
- Y: Agents
- Couleur: MTTR ou Volume

**Complexité**: ⭐⭐⭐⭐ (Très élevée)  
**Impact**: ⭐⭐⭐ (Moyen)  
**Temps estimé**: 4-5 jours

---

### ⭐ **Option 5 : Radar Chart Compétences** (Phase 2)

**Type**: Radar Chart (6 dimensions)

**Dimensions**:
- Vitesse, Volume, Qualité, Réactivité, Assistance, Bugs/Requêtes

**Complexité**: ⭐⭐⭐⭐ (Très élevée)  
**Impact**: ⭐⭐⭐ (Moyen)  
**Temps estimé**: 4-5 jours

---

## 🎯 Recommandation MVP (Phase 1)

### Combinaison Recommandée

**Option 1 + Option 2** = Vue complète et actionnable

1. **Scorecard** → Vue d'ensemble rapide, comparaison entre agents
2. **Graphique Évolution** → Détection de tendances, analyse temporelle

**Avantages**:
- ✅ Couvre 90% des besoins
- ✅ Implémentation rapide (5-7 jours)
- ✅ Actionnable immédiatement
- ✅ Facilement extensible

---

## 📊 Métriques à Calculer

### Métriques de Base (Phase 1)

| Métrique | Calcul | Source |
|----------|--------|--------|
| **Tickets Résolus** | `COUNT(*) WHERE status IN ('Resolue', 'Terminé')` | `tickets` |
| **MTTR** | `AVG(resolved_at - created_at)` | `tickets` |
| **Taux de Résolution** | `(résolus / assignés) * 100` | Calculé |
| **Tickets en Retard** | `COUNT(*) WHERE target_date < NOW()` | `tickets` |

### Métriques Avancées (Phase 2)

- Temps de première réponse (`ticket_comments`)
- Taux de réouverture (`ticket_status_history`)
- Satisfaction client (si ajouté)

---

## 🏗️ Architecture Proposée

```
src/
├── services/
│   └── dashboard/
│       └── agent-performance.ts       # Calcul des métriques
├── components/
│   └── dashboard/
│       └── manager/                   # Nouveau dossier
│           ├── agent-performance-widget.tsx
│           ├── agent-performance-chart.tsx
│           └── agent-performance-filters.tsx
└── types/
    └── dashboard.ts                   # Extension avec AgentPerformanceData
```

---

## 🎨 Meilleures Pratiques Appliquées

✅ **Clean Code**:
- Séparation logique/affichage
- Composants < 100 lignes
- Fonctions < 20 lignes

✅ **Next.js 16**:
- Server Components par défaut
- React.cache() pour mémoïsation
- Suspense boundaries

✅ **Performance**:
- Requêtes parallèles (Promise.all)
- Cache intelligent
- Lazy loading des graphiques

✅ **UX**:
- Filtres persistés dans URL
- Loading states
- Error boundaries
- Tooltips informatifs

---

## 🚀 Plan d'Implémentation

### Phase 1 : MVP (Semaine 1)

**Jour 1-2**: Service de calcul
- [ ] `getAgentPerformanceMetrics()` function
- [ ] Requêtes Supabase optimisées
- [ ] Types TypeScript

**Jour 3-4**: Widget Scorecard
- [ ] 4 KPI Cards
- [ ] Mini graphique évolution
- [ ] Filtres basiques

**Jour 5**: Widget Graphique
- [ ] LineChart avec 3 métriques
- [ ] Filtres avancés
- [ ] Comparaison multi-agents

**Jour 6-7**: Intégration
- [ ] Ajout au registry de widgets
- [ ] Configuration DB (rôles managers)
- [ ] Tests et ajustements

---

## ❓ Questions à Valider AVANT Développement

1. **Période par défaut** : Semaine ou Mois ? → **Recommandation: Mois**
2. **Agents visibles** : Tous ou filtrable par équipe ? → **Recommandation: Tous avec filtre**
3. **Métrique prioritaire** : MTTR ou Volume ? → **Recommandation: Les deux**
4. **Comparaison** : Multi-agents dès Phase 1 ? → **Recommandation: Oui**
5. **Filtres** : Tous dès Phase 1 ? → **Recommandation: Essentiels uniquement**

---

## 📋 Checklist de Validation

Avant de commencer le code, valider :

- [ ] Options de widgets choisies (Option 1 + 2 recommandées)
- [ ] Métriques prioritaires définies
- [ ] Filtres essentiels identifiés
- [ ] Période par défaut choisie
- [ ] Rôles autorisés (Manager Support uniquement ?)
- [ ] Plan d'implémentation validé

---

## 📝 Prochaines Étapes

1. **Vous validez** les options et métriques
2. **Je développe** le service de calcul
3. **Je crée** les widgets Scorecard + Graphique
4. **On teste** ensemble et on ajuste
5. **On étend** avec les options avancées (Phase 2)

---

**Document complet**: `docs/dashboard/widget-performance-agents-support.md`


