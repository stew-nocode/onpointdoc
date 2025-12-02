# Proposition : Graphique d'Évolution - Performance Équipe Support

## 🎯 Objectif

Créer **UN SEUL graphique d'évolution dans le temps** pour suivre la performance des agents Support dans la section **Graphiques** du dashboard manager.

## 📋 Contraintes Techniques

- **Section** : Graphiques Équipe (section flexbox)
- **Largeur minimale** : 400px (`chart-grid-responsive > *`)
- **Hauteur fixe** : 420px (`h-[420px]`)
- **Filtres** : Locaux au widget (éviter conflits avec filtres globaux)
- **Stack** : Recharts + ShadCN UI + Tailwind CSS

## 💡 Propositions de Graphiques

### **Option 1 : Tickets Résolus par Agent dans le Temps** ⭐ RECOMMANDÉ

**Concept** : Multi-lignes avec une ligne par agent Support, montrant l'évolution du nombre de tickets résolus jour par jour.

**Structure** :
- **Abscisse (X)** : Dates (jour par jour sur la période)
- **Ordonnée (Y)** : Nombre de tickets résolus
- **Lignes** : Une ligne colorée par agent Support

**Filtres locaux** :
- ✅ Période (semaine/mois/trimestre) - différencié des filtres globaux par préfixe `widget-`
- ✅ Agents (multi-sélection) - liste déroulante avec cases à cocher
- ✅ Type de ticket (BUG/REQ/ASSISTANCE) - toggle buttons

**Avantages** :
- Comparaison directe entre agents
- Identification des tendances individuelles
- Vue d'ensemble de la charge de travail

**Composant** : `LineChart` (Recharts)

---

### **Option 2 : MTTR Moyen par Agent dans le Temps**

**Concept** : MTTR (temps moyen de résolution) évoluant dans le temps pour chaque agent.

**Structure** :
- **Abscisse (X)** : Dates (semaine par semaine)
- **Ordonnée (Y)** : MTTR en jours
- **Lignes** : Une ligne par agent

**Filtres locaux** :
- ✅ Période (semaine/mois/trimestre)
- ✅ Agents (multi-sélection)
- ✅ Type de ticket

**Avantages** :
- Suivi de l'amélioration de la réactivité
- Identification des agents avec MTTR élevé

**Composant** : `LineChart` ou `AreaChart` (Recharts)

---

### **Option 3 : Volume de Tickets (Ouverts vs Résolus) dans le Temps**

**Concept** : Comparaison entre tickets ouverts et résolus au fil du temps pour l'équipe Support.

**Structure** :
- **Abscisse (X)** : Dates (jour par jour)
- **Ordonnée (Y)** : Nombre de tickets
- **2 lignes** : Tickets ouverts (rouge) / Tickets résolus (vert)

**Filtres locaux** :
- ✅ Période
- ✅ Type de ticket
- ✅ Produit (optionnel)

**Avantages** :
- Visualisation de la charge vs capacité
- Identification des périodes de surcharge

**Composant** : `LineChart` ou `AreaChart` avec 2 séries (Recharts)

---

### **Option 4 : Performance Globale Équipe (Combinaison Multi-Métriques)**

**Concept** : Graphique avec 3 métriques clés évoluant dans le temps (résolus, MTTR, taux de résolution).

**Structure** :
- **Abscisse (X)** : Dates (semaine par semaine)
- **Ordonnée Y1** : Nombre de tickets résolus
- **Ordonnée Y2** : MTTR en jours
- **Ordonnée Y3** : Taux de résolution (%)

**3 lignes** : Résolus (vert), MTTR (bleu), Taux (orange)

**Filtres locaux** :
- ✅ Période
- ✅ Type de ticket

**Avantages** :
- Vue d'ensemble complète
- Corrélation entre métriques

**Composant** : `LineChart` avec 3 séries et 2 axes Y (Recharts)

---

## 🔧 Architecture Technique

### 1. Structure des Fichiers

```
src/
├── components/
│   └── dashboard/
│       └── manager/
│           ├── support-evolution-chart.tsx          # Composant principal
│           ├── support-evolution-chart-server.tsx   # Client wrapper avec fetch
│           ├── support-evolution-chart-skeleton.tsx # Loading state
│           └── filters/
│               └── support-evolution-filters.tsx    # Filtres locaux du widget
├── services/
│   └── dashboard/
│       └── support-evolution-data.ts                # Service de récupération données
└── types/
    └── dashboard-support-evolution.ts               # Types TypeScript
```

### 2. Filtres Locaux (Sans Conflit Global)

**Stratégie** : État local React (`useState`) + préfixe unique pour les paramètres URL si nécessaire

```typescript
// ✅ Filtres locaux (état React uniquement)
const [localFilters, setLocalFilters] = useState({
  period: 'month',
  agents: [] as string[],
  ticketType: undefined as 'BUG' | 'REQ' | 'ASSISTANCE' | undefined
});

// ❌ PAS de mise à jour des URL params globaux
// Les filtres globaux restent dans DashboardFiltersSidebar
```

**Préfixe pour URL (optionnel)** :
- Global : `period`, `products`, `teams`
- Widget : `widget-support-evolution-period`, `widget-support-evolution-agents`

### 3. Format des Données

```typescript
type SupportEvolutionDataPoint = {
  date: string; // ISO date string
  agent1_resolved: number;
  agent2_resolved: number;
  agent3_resolved: number;
  // ... ou dynamique selon les agents filtrés
};

type SupportEvolutionData = {
  period: Period;
  agents: Array<{
    id: string;
    name: string;
    color: string; // Pour la ligne du graphique
  }>;
  data: SupportEvolutionDataPoint[];
};
```

### 4. Service de Données

```typescript
// src/services/dashboard/support-evolution-data.ts
export async function getSupportEvolutionData(
  period: Period,
  agentIds?: string[],
  ticketType?: 'BUG' | 'REQ' | 'ASSISTANCE'
): Promise<SupportEvolutionData> {
  // Requête Supabase groupée par date et agent
  // Agrégation des tickets résolus par jour
}
```

## 🎨 Composants UI (ShadCN)

### Filtres Locaux
- `Select` (ShadCN) pour période
- `MultiSelect` (ShadCN) ou `Checkbox` group pour agents
- `ToggleGroup` (ShadCN) pour type de ticket
- Placement : Dans le `CardHeader` du widget

### Graphique
- `Card` (ShadCN) avec `h-[420px]`
- `ChartContainer` (ShadCN UI)
- `LineChart` (Recharts) avec multiple `Line`

## ✅ Recommandation Finale

**Option 1 : Tickets Résolus par Agent dans le Temps** ⭐

**Raisons** :
1. Métrique la plus intuitive pour les managers
2. Comparaison directe entre agents
3. Identification facile des tendances
4. Filtres locaux simples à implémenter

**Structure du composant** :
```tsx
<Card className="h-[420px] flex flex-col">
  <CardHeader className="pb-3 flex-shrink-0">
    <div className="flex items-center justify-between">
      <CardTitle>Évolution Performance Agents Support</CardTitle>
      <SupportEvolutionFilters 
        filters={localFilters}
        onFiltersChange={setLocalFilters}
        agents={availableAgents}
      />
    </div>
  </CardHeader>
  <CardContent className="flex-1 min-h-0">
    <ChartContainer config={chartConfig}>
      <LineChart data={chartData}>
        {/* Lignes dynamiques selon agents filtrés */}
      </LineChart>
    </ChartContainer>
  </CardContent>
</Card>
```

## 🚀 Prochaines Étapes

1. Valider l'option choisie
2. Créer le service de données (`support-evolution-data.ts`)
3. Créer les types TypeScript
4. Implémenter le composant graphique
5. Ajouter les filtres locaux
6. Intégrer dans le registry des widgets
7. Activer dans la base de données pour le rôle "manager"

