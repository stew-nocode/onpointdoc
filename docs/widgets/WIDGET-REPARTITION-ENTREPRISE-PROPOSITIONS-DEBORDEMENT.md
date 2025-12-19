# 📊 Solutions pour Gérer le Débordement - Répartition par Entreprise

**Date**: 2025-01-16  
**Problème**: Pie chart avec trop d'entreprises (>10) cause un débordement visuel dans la légende

---

## 🔍 Analyse du Problème

### Problème Identifié
- **26 tickets** répartis sur **11+ entreprises**
- Légende horizontale déborde
- Graphique devient illisible
- Expérience utilisateur dégradée

### Bonnes Pratiques (Context7 + Recharts)
D'après l'analyse des best practices Recharts et des patterns courants :

1. **Regroupement des petites valeurs** ("Others")
2. **Limitation du nombre d'éléments affichés** (Top N)
3. **Légende scrollable ou paginée**
4. **Légende verticale ou en colonnes**

---

## 🎯 Solutions Proposées

### **Option 1 : Regroupement "Autres" (RECOMMANDÉE)** ⭐

**Principe** : Afficher les Top N entreprises et regrouper le reste dans "Autres"

#### Avantages
- ✅ Graphique lisible (maximum 8-10 segments)
- ✅ Meilleure UX
- ✅ Pattern standard (Google Charts, Highcharts)
- ✅ Facile à implémenter

#### Implémentation
```typescript
// Constantes
const MAX_COMPANIES_TO_SHOW = 8; // Top 8 entreprises
const MIN_PERCENTAGE_FOR_OTHERS = 2; // Minimum 2% pour être affiché individuellement

// Logique
1. Trier les entreprises par nombre de tickets (décroissant)
2. Prendre les Top MAX_COMPANIES_TO_SHOW
3. Calculer le total des autres
4. Si total > 0, ajouter une entrée "Autres (X entreprises)"
```

#### Exemple de données transformées
```
Avant: 11 entreprises
Après: 
- Top 8 entreprises (individuellement)
- "Autres (3 entreprises)" = 5 tickets
```

---

### **Option 2 : Légende Scrollable** 

**Principe** : Afficher toutes les entreprises mais avec légende scrollable

#### Avantages
- ✅ Toutes les entreprises visibles
- ✅ Pas de perte d'information

#### Inconvénients
- ⚠️ Légende peut être longue
- ⚠️ Nécessite interaction utilisateur (scroll)

#### Implémentation
```typescript
// Légende personnalisée avec ScrollArea (ShadCN)
<ScrollArea className="h-32 w-full">
  <ChartLegend 
    content={<ChartLegendContent nameKey="key" />}
    verticalAlign="bottom"
  />
</ScrollArea>
```

---

### **Option 3 : Légende en Colonnes (2-3 colonnes)**

**Principe** : Légende en grille au lieu d'une ligne horizontale

#### Avantages
- ✅ Meilleure utilisation de l'espace
- ✅ Plus d'entreprises visibles

#### Inconvénients
- ⚠️ Nécessite légende personnalisée
- ⚠️ Peut quand même déborder si trop d'entreprises

#### Implémentation
```typescript
// Légende personnalisée avec grid layout
<div className="grid grid-cols-2 gap-2">
  {companies.map(company => (
    <div key={company.id} className="flex items-center gap-2">
      <div className="w-3 h-3 rounded" style={{ backgroundColor: company.color }} />
      <span className="text-sm">{company.name}</span>
    </div>
  ))}
</div>
```

---

### **Option 4 : Filtre "Top N" avec Toggle**

**Principe** : Permettre à l'utilisateur de choisir combien d'entreprises afficher

#### Avantages
- ✅ Contrôle utilisateur
- ✅ Flexible

#### Inconvénients
- ⚠️ Ajoute de la complexité UI
- ⚠️ Peut être confus

---

## 🎯 Recommandation Finale

### **Solution Hybride : Option 1 + Option 2**

1. **Par défaut** : Regroupement "Autres" (Top 8 entreprises)
2. **Optionnel** : Bouton "Afficher toutes" qui déplie une légende scrollable complète

#### Avantages de la solution hybride
- ✅ UX optimale par défaut (graphique lisible)
- ✅ Accès à toutes les données si nécessaire
- ✅ Meilleur compromis

---

## 📋 Paramètres à Définir

### Constantes
```typescript
const MAX_COMPANIES_TO_SHOW = 8; // Nombre d'entreprises à afficher individuellement
const MIN_TICKETS_FOR_INDIVIDUAL = 1; // Minimum de tickets pour afficher individuellement
```

### Comportement
- **Si ≤ MAX_COMPANIES_TO_SHOW** : Afficher toutes les entreprises
- **Si > MAX_COMPANIES_TO_SHOW** : 
  - Top MAX_COMPANIES_TO_SHOW entreprises individuelles
  - "Autres (X entreprises)" regroupées

---

## 🔧 Structure de Données Proposée

```typescript
type CompanyDistributionWithOthers = {
  companies: CompanyDistribution[]; // Top N entreprises
  others?: {
    count: number; // Nombre total de tickets "autres"
    companiesCount: number; // Nombre d'entreprises regroupées
    companies: CompanyDistribution[]; // Liste complète pour tooltip/détails
  };
  total: number;
};
```

---

## 📊 Exemple Visuel

### Avant (11 entreprises)
```
[Pie chart avec 11 segments illisibles]
[Légende qui déborde]
```

### Après (Solution recommandée)
```
[Pie chart avec 8 segments + 1 segment "Autres"]
[Légende compacte : 9 éléments]
[Tooltip "Autres" affiche les détails des 3 entreprises regroupées]
```

---

## ✅ Validation Requise

Avant implémentation, valider :
- [ ] Nombre maximum d'entreprises à afficher (8 ? 10 ?)
- [ ] Seuil minimum pour afficher individuellement (1 ticket ? 2 tickets ?)
- [ ] Affichage des détails "Autres" (tooltip ? popover ?)
- [ ] Option pour afficher toutes les entreprises

---

## 🚀 Prochaines Étapes

1. **Valider la solution** avec l'utilisateur
2. **Définir les constantes** (MAX_COMPANIES_TO_SHOW)
3. **Implémenter le regroupement** dans `transformPieData()`
4. **Ajouter tooltip pour "Autres"** avec détails
5. **Tester avec données réelles** (11+ entreprises)

---

**Statut**: ⏳ **EN ATTENTE DE VALIDATION**

