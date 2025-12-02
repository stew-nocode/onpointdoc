# Comportement : Sections vs Widgets Individuels

## 🔍 Diagnostic : Deux Systèmes qui Coexistent

Votre codebase contient **deux systèmes d'affichage** qui coexistent :

### **Système 1 : Sections Activables** (Ancien - `unified-dashboard.tsx`)
- Sections comme `teamCharts`, `strategicCharts`, `personalCharts`
- Activable/désactivable globalement via `config.visibleSections.teamCharts`
- Si désactivé, **tous les graphiques équipe** disparaissent

### **Système 2 : Widgets Individuels** (Nouveau - `unified-dashboard-with-widgets.tsx`) ⭐ ACTUEL
- Widgets activables individuellement
- Groupement automatique par `layoutType` (kpi, chart, table, full-width)
- **PAS de sous-sections activables** - tout est au niveau widget

---

## 📊 Comportement Actuel (Système Widgets)

### **Niveau 1 : Admin Active les Widgets par Rôle**

Dans le panneau de configuration admin, l'admin peut activer/désactiver **chaque widget individuellement** pour chaque rôle :

```
Configuration Admin > Rôle "Manager"
├─ ☑️ mttrEvolution (Chart)
├─ ☑️ ticketsDistribution (Chart)
├─ ☑️ supportEvolutionChart (Chart) ← Nouveau widget Support
└─ ☐ topBugsModules (Table)
```

**Comportement** :
- ✅ Chaque widget est **indépendant**
- ✅ L'admin active les widgets **individuellement**
- ✅ Pas de groupe "Graphiques Équipe" à activer en bloc

### **Niveau 2 : Widgets Groupés par LayoutType**

Une fois activés, les widgets sont **automatiquement groupés** par leur `layoutType` :

```typescript
// Dans widget-grid.tsx
const groupedWidgets = {
  kpi: [...],      // Tous les widgets layoutType: 'kpi'
  chart: [         // Tous les widgets layoutType: 'chart'
    'mttrEvolution',
    'ticketsDistribution',
    'supportEvolutionChart',  // ← Nouveau widget Support
  ],
  table: [...],
  'full-width': [...],
};
```

**Affichage** :
```
Dashboard
├─ Section KPIs (tous les widgets kpi)
├─ Section Charts (TOUS les widgets chart activés) ← ICI
│  ├─ mttrEvolution
│  ├─ ticketsDistribution
│  └─ supportEvolutionChart ← Le nouveau widget
├─ Section Tables (tous les widgets table)
└─ Section Full-width (tous les widgets full-width)
```

### **Niveau 3 : Utilisateur Masque des Widgets**

L'utilisateur peut **masquer individuellement** des widgets via ses préférences personnelles :

```
Mes Préférences Widgets
├─ ☑️ mttrEvolution (visible)
├─ ☐ ticketsDistribution (masqué) ← Utilisateur l'a désactivé
└─ ☑️ supportEvolutionChart (visible)
```

**Comportement** :
- ✅ Les widgets masqués disparaissent
- ✅ Les widgets restants se réajustent automatiquement (flexbox)
- ✅ Pas d'impact sur les autres widgets

---

## 🎯 Réponse à Votre Question

> "Si on a plusieurs graphiques équipe, comment vont-ils se comporter ? Ils seront tous dans une sous-section activable, ou on pourra activer les graphiques individuellement ?"

### **Réponse : Widgets Individuels Activables** ⭐

1. ✅ **Chaque graphique est activable individuellement** (par l'admin pour le rôle)
2. ✅ **PAS de sous-section "Graphiques Équipe" activable** en bloc
3. ✅ Tous les widgets `layoutType: 'chart'` sont **groupés automatiquement** dans la section "Charts"
4. ✅ Si l'admin active 3 graphiques équipe, ils apparaissent tous ensemble dans la section Charts

### **Exemple Concret**

**Configuration Admin pour Rôle "Manager"** :
```
Widgets activés :
├─ mttrEvolution (chart) ✅
├─ ticketsDistribution (chart) ✅
├─ supportEvolutionChart (chart) ✅ ← Nouveau
└─ workloadByAgent (table) ✅
```

**Affichage Dashboard Manager** :
```
┌─────────────────────────────────────────┐
│ Section Charts (3 graphiques)          │
│                                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│ │ MTTR     │ │Distrib.  │ │Support   ││
│ │Evolution │ │Tickets   │ │Evolution ││
│ │          │ │          │ │          ││
│ └──────────┘ └──────────┘ └──────────┘│
│                                         │
│ (Flexbox : 3 par ligne ou moins selon  │
│  largeur écran)                         │
└─────────────────────────────────────────┘
```

**Si Admin désactive `supportEvolutionChart`** :
```
┌─────────────────────────────────────────┐
│ Section Charts (2 graphiques restants) │
│                                         │
│ ┌──────────┐ ┌──────────┐              │
│ │ MTTR     │ │Distrib.  │              │
│ │Evolution │ │Tickets   │              │
│ │          │ │          │              │
│ └──────────┘ └──────────┘              │
│                                         │
│ (Flexbox réajuste : 2 widgets, 50%     │
│  chacun sur desktop)                    │
└─────────────────────────────────────────┘
```

---

## 🔄 Relation Sections vs Widgets

### **Dans le Code Actuel**

**Ancien système (unified-dashboard.tsx)** - Utilisé pour CEO/Direction :
```tsx
{config.visibleSections.teamCharts && data.team && (
  <div>Graphiques Équipe</div>
)}
```
- ✅ Sections activables globalement
- ✅ Si `teamCharts = false`, **tous** les graphiques équipe disparaissent

**Nouveau système (unified-dashboard-with-widgets.tsx)** - Utilisé pour Managers/Agents :
```tsx
<DashboardWidgetGrid
  widgets={widgetConfig.visibleWidgets}  // Liste de widgets individuels
  dashboardData={dashboardData}
/>
```
- ✅ Widgets individuels activables
- ✅ Groupement automatique par `layoutType`
- ✅ **PAS de sous-sections** - tout est au niveau widget

---

## 🎨 Comportement Visuel

### **Section Charts avec Plusieurs Widgets**

**Desktop (1280px)** - 3 widgets chart activés :
```
┌──────────────────────────────────────────────────────┐
│ Section: Charts                                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│ │ Widget 1    │ │ Widget 2    │ │ Widget 3    │   │
│ │ (chart)     │ │ (chart)     │ │ (chart)     │   │
│ │             │ │             │ │             │   │
│ │ Graphique   │ │ Graphique   │ │ Graphique   │   │
│ │             │ │             │ │             │   │
│ └─────────────┘ └─────────────┘ └─────────────┘   │
│                                                      │
│ (Flexbox : 3 widgets, ~33% chacun)                  │
└──────────────────────────────────────────────────────┘
```

**Si 4 widgets chart activés** :
```
┌──────────────────────────────────────────────────────┐
│ Section: Charts                                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│ │ Widget 1    │ │ Widget 2    │ │ Widget 3    │   │
│ └─────────────┘ └─────────────┘ └─────────────┘   │
│                                                      │
│ ┌────────────────────────────────────────────────┐  │
│ │ Widget 4                                      │  │
│ │ (100% largeur, car seul sur sa ligne)        │  │
│ └────────────────────────────────────────────────┘  │
│                                                      │
│ (Flexbox : 3 sur ligne 1, 1 sur ligne 2)            │
└──────────────────────────────────────────────────────┘
```

---

## ✅ Conclusion

### **Pour le Widget Support Evolution**

1. ✅ **Admin active le widget** `supportEvolutionChart` pour le rôle "Manager"
2. ✅ **Widget apparaît** dans la section "Charts" (avec les autres graphiques)
3. ✅ **Pas de sous-section activable** - c'est un widget individuel
4. ✅ **Utilisateur peut masquer** ce widget individuellement via préférences
5. ✅ **Flexbox gère** automatiquement la répartition avec les autres charts

### **Avantages du Système Actuel**

- ✅ **Flexibilité** : chaque widget est indépendant
- ✅ **Granularité** : activation widget par widget
- ✅ **Personnalisation** : utilisateur peut masquer ce qu'il veut
- ✅ **Automatique** : groupement par layoutType sans configuration supplémentaire

### **Pas de Sous-Sections Activables**

- ❌ Pas de switch "Graphiques Équipe" qui active/désactive tous les graphiques équipe en bloc
- ✅ L'admin active/désactive **chaque widget individuellement**
- ✅ Tous les widgets chart activés apparaissent ensemble dans la section Charts

---

## 🚀 Implication pour le Nouveau Widget

Quand vous créez le widget `supportEvolutionChart` :

1. ✅ Ajouter dans `WIDGET_REGISTRY` avec `layoutType: 'chart'`
2. ✅ Admin l'active pour le rôle "Manager" (individuellement)
3. ✅ Widget apparaît automatiquement dans la section Charts
4. ✅ Flexbox gère la répartition avec les autres charts
5. ✅ Utilisateur peut le masquer individuellement s'il veut

**Pas besoin de** :
- ❌ Créer une sous-section "Graphiques Équipe"
- ❌ Gérer l'activation de groupe
- ❌ Configurer manuellement le groupement

**Tout est automatique** grâce au système de widgets individuels + groupement par `layoutType` !

