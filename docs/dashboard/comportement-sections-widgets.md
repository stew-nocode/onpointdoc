# Comportement des Sections et Widgets du Dashboard

## 📋 Vue d'Ensemble

Le dashboard organise les widgets en **4 sections principales** via un système de **Flexbox responsive**. Chaque section regroupe les widgets selon leur `layoutType`.

---

## 🔄 Flux de Rendu

```
DashboardWidgetGrid (reçoit widgets[])
    ↓
    ├─> Groupement par layoutType (useMemo)
    │   ├─> kpi: []
    │   ├─> chart: []
    │   ├─> table: []
    │   └─> full-width: []
    │
    ↓
    └─> Affichage conditionnel des sections
        ├─> KPIsSection (si kpi.length > 0)
        ├─> ChartsSection (si chart.length > 0)
        ├─> TablesSection (si table.length > 0)
        └─> FullWidthSection (si full-width.length > 0)
```

---

## 📊 Section 1 : KPIs

### **Structure CSS**
```css
.kpi-grid-responsive {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem; /* 16px */
}

.kpi-grid-responsive > * {
  flex: 1 1 280px;  /* grow: 1, shrink: 1, basis: 280px */
  min-width: 280px;
}
```

### **Comportement**

#### Desktop (≥ 640px)
- ✅ **Flexbox avec wrap automatique**
- ✅ **Largeur minimale** : 280px par widget KPI
- ✅ **Répartition égale** : `flex-grow: 1` = widgets s'étendent pour occuper l'espace disponible
- ✅ **Calcul automatique** :
  - Largeur conteneur 1280px : `(1280px - gaps) / 280px = ~4 widgets par ligne`
  - Largeur conteneur 900px : `(900px - gaps) / 280px = ~3 widgets par ligne`
  - Si 5 KPIs : 3 sur ligne 1, 2 sur ligne 2 (répartis équitablement)

#### Mobile (< 640px)
- ✅ **1 widget par ligne** : `flex-basis: 100%`, `min-width: 100%`

#### Hauteur
- ⚠️ **Pas de hauteur fixe imposée par CSS**
- ✅ **Le widget KPI doit définir sa propre hauteur** (généralement ~120px via le composant)

#### Exemple Visuel

```
Desktop (1280px) :
┌─────────────────────────────────────────────────────────────┐
│ [KPI 1]  [KPI 2]  [KPI 3]  [KPI 4]                         │
│ (25%)    (25%)    (25%)    (25%)                           │
└─────────────────────────────────────────────────────────────┘

Desktop (900px) :
┌──────────────────────────────────────┐
│ [KPI 1]  [KPI 2]  [KPI 3]           │
│ (33%)    (33%)    (33%)             │
│ [KPI 4]                             │
│ (100%)                              │
└──────────────────────────────────────┘

Avec 5 KPIs (1280px) :
┌─────────────────────────────────────────────────────────────┐
│ [KPI 1]  [KPI 2]  [KPI 3]  [KPI 4]                         │
│ (25%)    (25%)    (25%)    (25%)                           │
│ [KPI 5]                                                     │
│ (100%)                                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 Section 2 : Charts (Graphiques)

### **Structure CSS**
```css
.chart-grid-responsive {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem; /* 16px */
}

.chart-grid-responsive > * {
  flex: 1 1 400px;  /* grow: 1, shrink: 1, basis: 400px */
  min-width: 400px;
}
```

### **Comportement**

#### Desktop (≥ 640px)
- ✅ **Flexbox avec wrap automatique**
- ✅ **Largeur minimale** : 400px par widget Chart
- ✅ **Maximum 3 charts par ligne** sur desktop standard (1280px)
- ✅ **Calcul** : `(1280px - 2*16px gaps) / 3 = ~416px` → arrondi à 400px pour sécurité
- ✅ **Répartition égale** : `flex-grow: 1` = widgets s'étendent sur toute la largeur disponible par ligne

#### Mobile (< 640px)
- ✅ **1 widget par ligne** : `flex-basis: 100%`, `min-width: 100%`

#### Hauteur
- ✅ **Hauteur fixe : 420px** (doit être respectée par le composant Chart)
- ✅ **Structure recommandée** :
```tsx
<Card className="h-[420px] flex flex-col">
  <CardHeader className="flex-shrink-0">...</CardHeader>
  <CardContent className="flex-1 min-h-0">...</CardContent>
</Card>
```

#### Exemple Visuel

```
Desktop (1280px) - 2 Charts :
┌─────────────────────────────────────────────────────────────┐
│ [Chart 1]                    [Chart 2]                      │
│ (50%)                        (50%)                          │
│ (420px haut)                 (420px haut)                   │
└─────────────────────────────────────────────────────────────┘

Desktop (1280px) - 3 Charts :
┌─────────────────────────────────────────────────────────────┐
│ [Chart 1]        [Chart 2]        [Chart 3]                 │
│ (33%)            (33%)            (33%)                     │
│ (420px haut)     (420px haut)     (420px haut)              │
└─────────────────────────────────────────────────────────────┘

Desktop (1280px) - 4 Charts :
┌─────────────────────────────────────────────────────────────┐
│ [Chart 1]        [Chart 2]        [Chart 3]                 │
│ (33%)            (33%)            (33%)                     │
│ [Chart 4]                                                     │
│ (100%)                                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Section 3 : Tables

### **Structure CSS**
```css
.table-grid-responsive {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem; /* 16px */
}

.table-grid-responsive > * {
  flex: 1 1 400px;  /* grow: 1, shrink: 1, basis: 400px */
  min-width: 400px;
}
```

### **Comportement**

#### Identique à la Section Charts
- ✅ **Largeur minimale** : 400px
- ✅ **Maximum 3 tables par ligne** sur desktop standard
- ✅ **Hauteur fixe : 420px** (doit être respectée par le composant Table)
- ✅ **Même logique de répartition** que les Charts

---

## 📐 Section 4 : Full-width

### **Structure CSS**
```css
/* Pas de classe CSS spéciale */
.full-width-section {
  display: block; /* Pas de flexbox */
}

.full-width-section > * {
  width: 100%; /* Pleine largeur */
}
```

### **Comportement**

- ✅ **Pleine largeur** : chaque widget prend 100% de la largeur disponible
- ✅ **Empilement vertical** : widgets superposés avec `space-y-4` (16px gap)
- ✅ **Pas de contrainte de largeur minimale**
- ✅ **Hauteur** : définie par le widget lui-même (pas de contrainte fixe)

#### Exemple Visuel

```
Desktop/Mobile :
┌─────────────────────────────────────────────────────────────┐
│ [Full-width Widget 1]                                       │
│ (100% largeur)                                              │
│                                                             │
│ [Full-width Widget 2]                                       │
│ (100% largeur)                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Comportement Technique Détaillé

### **1. Groupement des Widgets**

```typescript
// Dans widget-grid.tsx
const groupedWidgets = useMemo(() => {
  const groups: Record<WidgetLayoutType, WidgetGroup['widgets']> = {
    kpi: [],
    chart: [],
    table: [],
    'full-width': [],
  };

  widgets.forEach((widgetId) => {
    const widgetDef = WIDGET_REGISTRY[widgetId];
    if (!widgetDef) return;

    const props = getWidgetProps(widgetId, dashboardData);
    groups[widgetDef.layoutType].push({
      id: widgetId,
      component: widgetDef.component,
      props,
    });
  });

  return groups;
}, [widgets, dashboardData]);
```

**Résultat** : Les widgets sont groupés par leur `layoutType` défini dans `WIDGET_REGISTRY`.

### **2. Mémorisation des Widgets**

```typescript
const MemoizedWidget = memo(
  ({ component: WidgetComponent, props }) => (
    <div className="w-full h-full">
      <WidgetComponent {...props} />
    </div>
  )
);
```

**Comportement** :
- ✅ **React.memo** : évite les re-renders inutiles si les props n'ont pas changé
- ✅ **Wrapper `w-full h-full`** : le widget occupe 100% de l'espace du conteneur flex

### **3. Affichage Conditionnel**

```typescript
// Section n'est affichée que si elle contient des widgets
{groupedWidgets.kpi.length > 0 && (
  <div className="space-y-4">
    <KPIsSection widgets={groupedWidgets.kpi} />
  </div>
)}
```

**Comportement** :
- ✅ **Condition** : section affichée uniquement si `length > 0`
- ✅ **Espacement vertical** : `space-y-4` (16px) entre chaque section

### **4. Adaptation Automatique**

#### Scénario : Widget désactivé

**Avant** (5 KPIs) :
```
[KPI 1] [KPI 2] [KPI 3] [KPI 4]
[KPI 5]
```

**Après désactivation de KPI 3** :
```
[KPI 1] [KPI 2] [KPI 4]
[KPI 5]
```

**Comportement** :
- ✅ Flexbox **réajuste automatiquement** la répartition
- ✅ Les widgets restants **s'étendent** pour occuper l'espace libéré

---

## 📱 Responsive Design

### **Breakpoint : 640px (sm)**

```css
@media (max-width: 639px) {
  .kpi-grid-responsive > *,
  .chart-grid-responsive > *,
  .table-grid-responsive > * {
    flex-basis: 100%;
    min-width: 100%;
  }
}
```

**Comportement Mobile** :
- ✅ **Tous les widgets** (KPI, Chart, Table) prennent **100% de la largeur**
- ✅ **1 widget par ligne** (empilement vertical)
- ✅ **Gap maintenu** : 16px entre chaque widget

---

## ✅ Contraintes pour Nouveaux Widgets

### **Widget KPI**
```tsx
// ✅ OK
<Card className="h-[120px]"> {/* Hauteur recommandée */}
  ...
</Card>

// ⚠️ Le composant doit avoir une largeur minimale de 280px (gérée par CSS)
```

### **Widget Chart** ⭐ (Pour Support Evolution)
```tsx
// ✅ OK
<Card className="h-[420px] flex flex-col min-w-[400px]">
  <CardHeader className="flex-shrink-0">
    {/* Titre + filtres */}
  </CardHeader>
  <CardContent className="flex-1 min-h-0">
    {/* Graphique */}
  </CardContent>
</Card>

// ⚠️ CONTRAINTES :
// - Hauteur fixe : 420px
// - Largeur minimale : 400px (gérée par CSS)
// - Flexbox interne : flex-col pour gérer le header + content
```

### **Widget Table**
```tsx
// ✅ OK
<Card className="h-[420px] flex flex-col min-w-[400px]">
  ...
</Card>

// ⚠️ Même contraintes que Chart
```

### **Widget Full-width**
```tsx
// ✅ OK
<Card className="w-full">
  {/* Hauteur libre */}
</Card>

// ⚠️ Aucune contrainte de largeur/hauteur
```

---

## 🎯 Règles d'Or

### **1. Respecter les Hauteurs Fixes**
- ✅ **Charts** : 420px
- ✅ **Tables** : 420px
- ✅ **KPIs** : ~120px (recommandé, non imposé)

### **2. Utiliser Flexbox Interne**
```tsx
// ✅ BON PATTERN pour Chart/Table
<Card className="h-[420px] flex flex-col">
  <CardHeader className="flex-shrink-0">Titre</CardHeader>
  <CardContent className="flex-1 min-h-0">
    Contenu (graphique/table)
  </CardContent>
</Card>
```

### **3. Ne Pas Définir de Largeur**
- ❌ **Éviter** : `width: 500px` ou `w-[500px]`
- ✅ **Laisser Flexbox gérer** : `flex: 1 1 400px` fait le travail

### **4. Gérer le Responsive**
- ✅ **Tester mobile** : vérifier que le widget s'adapte à 100% largeur
- ✅ **Éviter les largeurs fixes** qui cassent le responsive

---

## 🔍 Cas Spécifique : Widget Support Evolution

### **Recommandation**

```tsx
// ✅ CORRECT pour Section Charts
export function SupportEvolutionChart({ data }) {
  return (
    <Card className="h-[420px] flex flex-col min-w-[400px]">
      <CardHeader className="pb-3 flex-shrink-0 space-y-3">
        {/* Titre + Filtres */}
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ChartContainer className="h-full w-full">
          <LineChart data={chartData}>
            {/* Graphique */}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```

**Configuration Registry** :
```typescript
supportEvolutionChart: {
  component: SupportEvolutionChartServer,
  layoutType: 'chart', // ✅ Important : 'chart' et non 'full-width'
  title: 'Évolution Performance Support',
  description: 'Suivi des métriques Support dans le temps',
}
```

**Comportement Attendu** :
- ✅ S'affiche dans la section **Charts** (Graphiques Équipe)
- ✅ Largeur minimale : 400px (gérée par CSS)
- ✅ Hauteur fixe : 420px (respectée par le composant)
- ✅ Répartition automatique avec les autres charts
- ✅ Maximum 3 charts par ligne sur desktop
- ✅ 1 chart par ligne sur mobile

---

## 📝 Checklist pour Nouveau Widget Chart

- [ ] `layoutType: 'chart'` dans le registry
- [ ] Composant avec `h-[420px]`
- [ ] Structure `flex flex-col` avec `flex-shrink-0` pour header
- [ ] `flex-1 min-h-0` pour le content (graphique)
- [ ] Largeur minimale : 400px (gérée par CSS, pas besoin de définir)
- [ ] Test responsive : vérifier sur mobile (< 640px)
- [ ] Pas de largeur fixe dans le composant


