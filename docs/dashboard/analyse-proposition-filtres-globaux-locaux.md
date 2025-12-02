# Analyse : Proposition Filtres Globaux vs Locaux

**Date** : 2025-01-XX  
**Proposition** : Période globale + Filtres spécifiques par widget  
**Statut** : ✅ **EXCELLENTE PROPOSITION - RECOMMANDÉE**

---

## 🎯 PROPOSITION

### Architecture proposée

- **Période** : **Filtre GLOBAL** pour toute la page dashboard
  - Tous les widgets partagent la même période
  - Géré au niveau du dashboard principal
  - Cohérence entre tous les widgets

- **Dimensions et Agents** : **Filtres LOCAUX** spécifiques au widget
  - Chaque widget peut avoir ses propres filtres spécifiques
  - Exemple : "Évolution Performance Support" garde les filtres "Dimensions" et "Agents"
  - Flexibilité pour chaque widget selon ses besoins

---

## ✅ AVANTAGES DE CETTE APPROCHE

### 1. **Résout les conflits identifiés** 🔴 → ✅

**Avant** :
- Conflit entre `globalPeriod` (dashboard) et période locale (widget)
- Synchronisation complexe avec `useEffect`
- Perte de configuration utilisateur

**Après** :
- Plus de conflit : période = toujours globale
- Plus besoin de synchronisation
- Configuration utilisateur préservée

---

### 2. **Simplifie l'architecture** 🟡 → ✅

**Avant** :
- 3 endroits pour gérer la période (dashboard, server-v2, filters-v2)
- Logique de synchronisation complexe
- Double gestion d'état

**Après** :
- 1 seul endroit pour la période (dashboard)
- Widgets reçoivent la période en prop (lecture seule)
- Architecture claire et simple

---

### 3. **Améliore l'UX** 🟢 → ✅

**Avant** :
- Période différente par widget = confusion
- Utilisateur doit configurer la période pour chaque widget

**Après** :
- Période unique = cohérence visuelle
- Changement de période = tous les widgets se mettent à jour ensemble
- Expérience utilisateur fluide et intuitive

---

### 4. **S'aligne avec l'existant** ✅

**Infrastructure déjà en place** :
- `PeriodSelector` existe déjà (`src/components/dashboard/ceo/period-selector.tsx`)
- Utilisé dans `unified-dashboard-with-widgets.tsx` ligne 213
- Le dashboard gère déjà `period` comme état global
- Les widgets reçoivent déjà `period` via `dashboardData.period`

**Conclusion** : La proposition s'intègre parfaitement avec l'architecture existante !

---

## 📊 COMPARAISON AVANT/APRÈS

| Aspect | Avant | Après |
|--------|-------|-------|
| **Gestion période** | 3 endroits (conflits) | 1 endroit (dashboard) |
| **Synchronisation** | Complexe (useEffect) | Aucune nécessaire |
| **Conflits** | Oui (globalPeriod vs local) | Non |
| **Appels API** | 3 appels au clic "Appliquer" | 1 appel par widget |
| **UX** | Période par widget | Période globale cohérente |
| **Maintenabilité** | Complexe | Simple |

---

## 🔧 MODIFICATIONS NÉCESSAIRES

### 1. **Supprimer la gestion locale de période dans le widget**

**Fichier** : `src/components/dashboard/manager/support-evolution-chart-server-v2.tsx`

**Changements** :
- ❌ Supprimer le `useEffect` de synchronisation (lignes 168-170)
- ❌ Supprimer `period` de `localFilters`
- ✅ Utiliser directement `globalPeriod` (prop)
- ✅ `localFilters` ne contient plus que `selectedAgents` et `selectedDimensions`

**Code actuel** :
```typescript
const [localFilters, setLocalFilters] = useState<{
  period: Period | string;  // ❌ À supprimer
  selectedAgents: string[];
  selectedDimensions: SupportDimension[];
}>({
  period: globalPeriod,  // ❌ À supprimer
  selectedAgents: [],
  selectedDimensions: ['BUG', 'REQ', 'ASSISTANCE', 'assistanceTime'],
});

// ❌ À supprimer
useEffect(() => {
  setLocalFilters((prev) => ({ ...prev, period: globalPeriod }));
}, [globalPeriod]);
```

**Code après** :
```typescript
const [localFilters, setLocalFilters] = useState<{
  selectedAgents: string[];
  selectedDimensions: SupportDimension[];
}>({
  selectedAgents: [],
  selectedDimensions: ['BUG', 'REQ', 'ASSISTANCE', 'assistanceTime'],
});

// Utiliser directement globalPeriod dans le fetch
const params = new URLSearchParams({
  period: globalPeriod.toString(),  // ✅ Utilise globalPeriod directement
  dimensions: localFilters.selectedDimensions.join(','),
});
```

---

### 2. **Simplifier les filtres du widget**

**Fichier** : `src/components/dashboard/manager/support-evolution-filters-v2.tsx`

**Changements** :
- ❌ Supprimer la section "Période" du popover de filtres
- ❌ Supprimer `draftPeriod` et `handlePeriodChange`
- ✅ Garder uniquement "Dimensions" et "Agents"
- ✅ Simplifier `handleApply` pour ne plus gérer la période

**Code actuel** :
```typescript
type SupportEvolutionFiltersV2Props = {
  period: Period | string;  // ❌ À supprimer
  selectedAgents: string[];
  selectedDimensions: SupportDimension[];
  // ...
  onPeriodChange: (period: Period | string) => void;  // ❌ À supprimer
  onAgentsChange: (agentIds: string[]) => void;
  onDimensionsChange: (dimensions: SupportDimension[]) => void;
};
```

**Code après** :
```typescript
type SupportEvolutionFiltersV2Props = {
  // period supprimé - vient du dashboard global
  selectedAgents: string[];
  selectedDimensions: SupportDimension[];
  // ...
  // onPeriodChange supprimé
  onAgentsChange: (agentIds: string[]) => void;
  onDimensionsChange: (dimensions: SupportDimension[]) => void;
  onFiltersApply: (filters: {  // ✅ Nouveau callback unifié
    selectedAgents: string[];
    selectedDimensions: SupportDimension[];
  }) => void;
};
```

---

### 3. **Mettre à jour le composant de présentation**

**Fichier** : `src/components/dashboard/manager/support-evolution-chart-v2.tsx`

**Changements** :
- ❌ Supprimer les callbacks `onPeriodChange`
- ✅ Passer uniquement `onAgentsChange` et `onDimensionsChange` (ou `onFiltersApply`)
- ✅ Le widget reçoit `period` via `data.period` (déjà le cas)

---

### 4. **Mettre à jour le registry des widgets**

**Fichier** : `src/components/dashboard/widgets/registry.ts`

**Vérification** :
- ✅ Le widget reçoit déjà `period` via `dashboardData.period`
- ✅ Le mapper `WIDGET_DATA_MAPPERS` doit passer `period` au widget

**Code actuel** (ligne ~80) :
```typescript
supportEvolutionChart: (data) => {
  return { period: data.period };  // ✅ Déjà correct
},
```

---

## 📋 PLAN D'IMPLÉMENTATION

### Phase 1 : Nettoyer le widget Support Evolution (Priorité 1)

1. ✅ Supprimer la gestion locale de période dans `support-evolution-chart-server-v2.tsx`
2. ✅ Utiliser directement `globalPeriod` dans les appels API
3. ✅ Supprimer la section "Période" des filtres dans `support-evolution-filters-v2.tsx`
4. ✅ Unifier les callbacks (Option 1 du rapport précédent)

**Résultat** : Plus de conflit, période toujours globale

---

### Phase 2 : Unifier les callbacks (Priorité 2)

1. ✅ Modifier `SupportEvolutionFiltersV2` pour accepter `onFiltersApply`
2. ✅ Modifier `support-evolution-chart-v2.tsx` pour passer un seul callback
3. ✅ Tester qu'un seul appel API est fait au clic "Appliquer"

**Résultat** : Performance optimisée, un seul appel API

---

### Phase 3 : Vérifier les autres widgets (Priorité 3)

1. ✅ Vérifier que les autres widgets utilisent bien `period` global
2. ✅ S'assurer qu'aucun widget ne gère sa propre période locale
3. ✅ Documenter le pattern pour les futurs widgets

**Résultat** : Architecture cohérente

---

## 🎯 AVANTAGES TECHNIQUES

### Performance
- ✅ Moins de re-renders (période gérée une seule fois)
- ✅ Moins d'appels API (pas de synchronisation)
- ✅ Code plus simple = moins de bugs

### Maintenabilité
- ✅ Architecture claire : global vs local
- ✅ Moins de code à maintenir
- ✅ Pattern réutilisable pour futurs widgets

### UX
- ✅ Cohérence : tous les widgets sur la même période
- ✅ Simplicité : un seul endroit pour changer la période
- ✅ Flexibilité : chaque widget garde ses filtres spécifiques

---

## ⚠️ POINTS D'ATTENTION

### 1. **Compatibilité avec les autres widgets**

**Vérification nécessaire** :
- Les autres widgets (MTTR, Tickets, etc.) utilisent-ils déjà `period` global ?
- Y a-t-il d'autres widgets qui gèrent leur propre période ?

**Action** : Auditer tous les widgets avant de déployer

---

### 2. **Migration des données utilisateur**

**Question** :
- Y a-t-il des préférences utilisateur stockées pour la période du widget Support Evolution ?

**Action** : Si oui, migrer vers les préférences globales

---

### 3. **URL Parameters**

**Vérification** :
- Le dashboard gère-t-il déjà `period` dans les URL params ?
- Les widgets doivent-ils aussi gérer leurs filtres locaux dans l'URL ?

**Action** : Décider si les filtres locaux doivent être dans l'URL (probablement non pour simplifier)

---

## ✅ RECOMMANDATION FINALE

**Verdict** : ✅ **EXCELLENTE PROPOSITION - À IMPLÉMENTER**

**Raisons** :
1. ✅ Résout tous les conflits identifiés
2. ✅ Simplifie l'architecture
3. ✅ Améliore l'UX
4. ✅ S'aligne avec l'existant
5. ✅ Facile à implémenter

**Prochaines étapes** :
1. Valider cette proposition
2. Implémenter Phase 1 (nettoyer le widget)
3. Implémenter Phase 2 (unifier les callbacks)
4. Tester et valider

---

**Conclusion** : Cette proposition est la solution idéale pour résoudre les problèmes identifiés tout en améliorant l'architecture globale. Elle mérite d'être implémentée rapidement.

