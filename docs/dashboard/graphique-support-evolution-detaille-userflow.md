# Graphique d'Évolution Support - Détails Métriques & Userflow

## 🎯 Objectif

Créer **UN SEUL graphique d'évolution dans le temps** pour suivre les métriques clés de l'équipe Support avec focus sur :
- ⏱️ **Temps d'assistance** (`duration_minutes`) - TRÈS IMPORTANT
- 📊 **Nombre de tickets ouverts** (charge de travail active)
- ✅ **Nombre de tickets résolus** (productivité)
- 📈 **MTTR** (Mean Time To Resolution - temps moyen de résolution)
- 🏷️ **Répartition par type** (BUG, REQ, ASSISTANCE)

## 📊 Métriques Clés pour le Support

### 1. ⏱️ Temps d'Assistance (`duration_minutes`)

**Définition** : Temps passé par l'agent pour résoudre un ticket ASSISTANCE, enregistré directement dans le champ `duration_minutes`.

**Importance** :
- Mesure la **productivité réelle** des agents
- Permet d'identifier les tickets qui prennent trop de temps
- Aide à planifier les ressources (ex: si temps moyen = 45 min, un agent peut traiter ~10 tickets/jour)
- **Métrique clé pour les managers** pour évaluer la charge de travail

**Calcul** :
- Pour les tickets ASSISTANCE avec `duration_minutes` renseigné
- Agrégation : Somme ou moyenne par agent par jour/semaine

**Exemple** :
- Agent A : 450 minutes d'assistance sur la semaine (7.5h)
- Agent B : 320 minutes d'assistance sur la semaine (5.3h)

---

### 2. 📊 Tickets Ouverts (Charge Active)

**Définition** : Tickets en statut "Nouveau", "En_cours", "Transfere" (non résolus).

**Importance** :
- Indique la **charge de travail active** de l'équipe
- Permet d'identifier les périodes de surcharge
- Aide à équilibrer la charge entre agents
- Alert si nombre élevé = équipe débordée

**Calcul** :
- Tickets avec `status NOT IN ('Resolue', 'Terminé', 'Terminé(e)')`
- Comptage par agent, par jour

---

### 3. ✅ Tickets Résolus (Productivité)

**Définition** : Tickets résolus dans la période (`status IN ('Resolue', 'Terminé', 'Terminé(e)')`).

**Importance** :
- Mesure la **productivité** de l'équipe
- Permet de comparer les performances entre agents
- Tendance : augmentation = meilleure performance
- Corrélation avec temps d'assistance = efficacité

**Calcul** :
- Tickets avec `resolved_at` dans la période
- Comptage par agent, par jour

---

### 4. 📈 MTTR (Mean Time To Resolution)

**Définition** : Temps moyen entre `created_at` et `resolved_at` d'un ticket.

**Importance** :
- Mesure la **réactivité** de l'équipe
- Tendance négative = amélioration (moins de temps = mieux)
- Différence entre agents = identifier les meilleures pratiques
- Objectif : réduire le MTTR = meilleure satisfaction client

**Calcul** :
- `(resolved_at - created_at)` en jours
- Moyenne par agent, par période

---

### 5. 🏷️ Répartition par Type de Ticket

**Définition** : Répartition entre BUG, REQ, ASSISTANCE.

**Importance** :
- Comprendre la **nature du travail**
- ASSISTANCE = résolution directe (temps court)
- BUG/REQ = transfert vers IT (suivi)
- Planification : plus d'ASSISTANCE = besoin plus d'agents

---

## 💡 Options de Graphiques Détaillées

### **Option A : Multi-Métriques - Évolution Globale Équipe** ⭐ RECOMMANDÉ

**Concept** : Graphique avec 3 axes Y montrant l'évolution dans le temps de 3 métriques clés.

**Structure** :
- **Abscisse (X)** : Dates (jour par jour ou semaine par semaine selon période)
- **Ordonnée Y1** (gauche) : Nombre de tickets (Ouverts, Résolus)
- **Ordonnée Y2** (droite) : Temps d'assistance (minutes)
- **Ordonnée Y3** (droite, optionnel) : MTTR (jours)

**Lignes** :
1. 🟢 **Tickets Résolus** (ligne verte) - Y1 gauche
2. 🔴 **Tickets Ouverts** (ligne rouge) - Y1 gauche
3. 🟡 **Temps d'Assistance** (ligne jaune) - Y2 droite (en minutes)
4. 🔵 **MTTR Moyen** (ligne bleue) - Y3 droite (en jours, optionnel)

**Filtres locaux** :
- ✅ **Période** : Semaine / Mois / Trimestre / Année (toggle buttons)
- ✅ **Type de ticket** : Tous / ASSISTANCE uniquement / BUG / REQ (toggle buttons)
- ✅ **Agent(s)** : Multi-sélection (Select avec checkboxes) - "Tous" par défaut
- ✅ **Vue** : Par agent / Par équipe (radio buttons)

**Avantages** :
- ✅ Vue d'ensemble complète (volume + temps)
- ✅ Corrélation entre métriques (ex: tickets ouverts ↑ = temps d'assistance ↑ ?)
- ✅ Identification des tendances globales
- ✅ Évite la surcharge visuelle (3-4 lignes max)

**Composant** : `LineChart` avec 2 axes Y (Recharts)

---

### **Option B : Temps d'Assistance + Tickets par Agent** 🔥 FOCUS PRODUCTIVITÉ

**Concept** : Graphique multi-lignes avec une ligne par agent, montrant 2 métriques en superposition.

**Structure** :
- **Abscisse (X)** : Dates (jour par jour)
- **Ordonnée Y1** (gauche) : Nombre de tickets résolus
- **Ordonnée Y2** (droite) : Temps d'assistance (minutes)

**Lignes par agent** :
- **Agent 1** : 
  - Ligne solide verte (tickets résolus)
  - Ligne pointillée verte (temps d'assistance)
- **Agent 2** :
  - Ligne solide bleue (tickets résolus)
  - Ligne pointillée bleue (temps d'assistance)
- ... (jusqu'à 5 agents max pour lisibilité)

**Filtres locaux** :
- ✅ **Période** : Semaine / Mois / Trimestre
- ✅ **Type de ticket** : Tous / ASSISTANCE uniquement
- ✅ **Agents** : Multi-sélection (maximum 5 sélectionnables)
- ✅ **Métrique principale** : Tickets Résolus / Temps d'Assistance (radio)

**Avantages** :
- ✅ Comparaison directe entre agents
- ✅ Identification des meilleurs performeurs
- ✅ Visualisation de la charge individuelle
- ⚠️ Limité à 5 agents max (lisibilité)

**Composant** : `LineChart` avec lignes groupées par agent (Recharts)

---

### **Option C : Heatmap Temps d'Assistance** 📊 FOCUS TEMPS

**Concept** : Heatmap montrant l'évolution du temps d'assistance par agent et par jour.

**Structure** :
- **Abscisse (X)** : Dates (jour par jour)
- **Ordonnée (Y)** : Agents Support (liste)
- **Couleur** : Intensité du temps d'assistance (vert = faible, rouge = élevé)

**Filtres locaux** :
- ✅ **Période** : Semaine / Mois (heatmap fonctionne mieux sur court terme)
- ✅ **Type** : ASSISTANCE uniquement (temps d'assistance = ASSISTANCE)
- ✅ **Agents** : Multi-sélection

**Avantages** :
- ✅ Visualisation immédiate des pics de charge
- ✅ Identification des agents surchargés
- ✅ Pattern de répartition dans le temps
- ⚠️ Moins adapté pour tendances long terme

**Composant** : Heatmap personnalisé (Recharts) ou Table avec couleurs

---

### **Option D : Stacked Area - Volume + Temps** 📈 FOCUS CHARGE

**Concept** : Graphique en aires empilées montrant l'évolution de la charge.

**Structure** :
- **Abscisse (X)** : Dates (semaine par semaine)
- **Ordonnée Y1** (gauche) : Nombre de tickets (aire empilée)
- **Ordonnée Y2** (droite) : Temps d'assistance total (ligne)

**Aires empilées** :
- 🟢 Zone verte : Tickets Résolus
- 🟡 Zone jaune : Tickets En Cours
- 🔴 Zone rouge : Tickets Nouveaux

**Ligne** :
- 🔵 Ligne bleue : Temps d'assistance total (minutes)

**Filtres locaux** :
- ✅ **Période** : Mois / Trimestre / Année
- ✅ **Type** : Tous / ASSISTANCE uniquement
- ✅ **Vue** : Par équipe / Par agent (radio)

**Avantages** :
- ✅ Visualisation de la charge globale (aire empilée)
- ✅ Identification des périodes de surcharge
- ✅ Corrélation volume / temps
- ⚠️ Moins adapté pour comparaison agents individuels

**Composant** : `AreaChart` empilé + `LineChart` (Recharts)

---

## 🎯 Recommandation Finale : Option A (Multi-Métriques) ⭐

**Pourquoi** :
1. ✅ Couvre **toutes les métriques importantes** (temps d'assistance, tickets ouverts/résolus, MTTR)
2. ✅ **Vue d'ensemble** pour le manager Support
3. ✅ **Filtres flexibles** pour approfondir (par agent, par type)
4. ✅ **Pas de surcharge visuelle** (3-4 lignes max)
5. ✅ **Adaptable** selon les besoins (on peut masquer certaines lignes)

---

## 📋 Userflow Complet

### **Scénario 1 : Manager Support consulte la performance globale**

```
1. [DASHBOARD] Manager Support arrive sur la page Dashboard
   └─> Voir section "Graphiques Équipe"
       └─> Widget "Évolution Performance Support" visible
       
2. [INITIALISATION] Widget charge avec valeurs par défaut :
   └─> Période : "Mois" (mois en cours)
   └─> Type : "Tous"
   └─> Agents : "Tous" (équipe complète)
   └─> Vue : "Par équipe"
   
3. [AFFICHAGE] Graphique affiche :
   └─> Abscisse : Dates du mois (1er au dernier jour)
   └─> 4 lignes :
       ├─> Ligne verte : Tickets Résolus (par jour)
       ├─> Ligne rouge : Tickets Ouverts (par jour)
       ├─> Ligne jaune : Temps d'Assistance total (minutes par jour)
       └─> Ligne bleue : MTTR Moyen (jours par jour)
   
4. [INTERPRÉTATION] Manager voit :
   └─> Tendance générale : Résolus ↑, Ouverts ↓ = Bon signe
   └─> Pic de temps d'assistance le 15 = Jour chargé
   └─> MTTR stable autour de 2 jours = Bonne réactivité
```

---

### **Scénario 2 : Analyse d'un agent spécifique**

```
1. [FILTRE AGENT] Manager clique sur le filtre "Agents"
   └─> Dropdown s'ouvre avec liste des agents Support
       ├─> ☑️ Agent A
       ├─> ☐ Agent B
       ├─> ☐ Agent C
       └─> [X] Fermer
   
2. [SÉLECTION] Manager sélectionne "Agent A"
   └─> Filtre se met à jour : "Agent A" sélectionné
   └─> Graphique recharge automatiquement
   
3. [NOUVEL AFFICHAGE] Graphique montre uniquement les données de l'Agent A :
   └─> Ligne verte : Tickets résolus par Agent A
   └─> Ligne jaune : Temps d'assistance d'Agent A (en minutes)
   └─> Ligne bleue : MTTR d'Agent A
   
4. [OBSERVATION] Manager constate :
   └─> Agent A résout 5-6 tickets/jour en moyenne
   └─> Temps d'assistance moyen : 45 min/ticket
   └─> MTTR : 1.5 jours = Excellent
   └─> Conclusion : Agent performant
```

---

### **Scénario 3 : Focus sur les tickets ASSISTANCE uniquement**

```
1. [FILTRE TYPE] Manager clique sur le filtre "Type de ticket"
   └─> Toggle buttons :
       ├─> [Tous] ← Actif
       ├─> [ASSISTANCE]
       ├─> [BUG]
       └─> [REQ]
   
2. [SÉLECTION] Manager clique sur "ASSISTANCE"
   └─> Filtre se met à jour : Type = "ASSISTANCE"
   └─> Graphique recharge avec uniquement les tickets ASSISTANCE
   
3. [NOUVEL AFFICHAGE] Graphique montre :
   └─> Ligne verte : Tickets ASSISTANCE résolus
   └─> Ligne jaune : Temps d'assistance (ASSISTANCE uniquement)
   └─> Ligne bleue : MTTR ASSISTANCE (généralement < 1 jour)
   
4. [ANALYSE] Manager analyse :
   └─> Volume ASSISTANCE : 80 tickets/mois
   └─> Temps moyen : 35 min/ticket
   └─> MTTR : 0.8 jours = Résolution rapide
   └─> Insight : Temps d'assistance cohérent avec volume
```

---

### **Scénario 4 : Comparaison de deux agents**

```
1. [FILTRE MULTI-AGENTS] Manager ouvre le filtre "Agents"
   └─> Sélectionne plusieurs agents :
       ├─> ☑️ Agent A
       ├─> ☑️ Agent B
       └─> ☐ Agent C
   
2. [CHANGEMENT VUE] Manager clique sur "Vue : Par agent"
   └─> Graphique se transforme : 2 lignes par métrique
       ├─> Ligne verte solide : Agent A (tickets résolus)
       ├─> Ligne verte pointillée : Agent B (tickets résolus)
       ├─> Ligne jaune solide : Agent A (temps d'assistance)
       └─> Ligne jaune pointillée : Agent B (temps d'assistance)
   
3. [COMPARAISON] Manager compare :
   └─> Agent A : 6 tickets/jour, 45 min/ticket
   └─> Agent B : 4 tickets/jour, 60 min/ticket
   └─> Conclusion : Agent A plus productif (volume + vitesse)
   
4. [ACTION] Manager peut :
   └─> Identifier les meilleures pratiques d'Agent A
   └─> Former Agent B sur les points faibles
```

---

### **Scénario 5 : Analyse d'une période spécifique**

```
1. [FILTRE PÉRIODE] Manager clique sur le filtre "Période"
   └─> Toggle buttons :
       ├─> [Semaine]
       ├─> [Mois] ← Actif
       ├─> [Trimestre]
       └─> [Année]
   
2. [SÉLECTION] Manager clique sur "Trimestre"
   └─> Période se met à jour : 3 derniers mois
   └─> Graphique recharge avec données trimestrielles
   └─> Abscisse : Semaines (au lieu de jours)
   
3. [TENDANCE] Manager observe :
   └─> Semaine 1-4 : Temps d'assistance élevé (période chargée)
   └─> Semaine 5-8 : Stabilisation
   └─> Semaine 9-12 : Amélioration (temps ↓, résolus ↑)
   └─> Conclusion : Équipe s'améliore dans le temps
```

---

### **Scénario 6 : Détection d'une anomalie**

```
1. [OBSERVATION] Manager voit sur le graphique :
   └─> Pic anormal de "Tickets Ouverts" le 20/01
   └─> Ligne rouge monte à 45 tickets (normalement 20-25)
   └─> Ligne verte (résolus) ne suit pas
   
2. [INVESTIGATION] Manager ajuste les filtres :
   └─> Période : Semaine du 20/01
   └─> Type : Tous
   └─> Agents : Tous
   
3. [ANALYSE] Manager zoom sur la période :
   └─> Le 20/01 : 15 nouveaux tickets créés (anormalement élevé)
   └─> Temps d'assistance : 60 min/ticket (normal)
   └─> MTTR : 2.5 jours (légèrement au-dessus de la moyenne)
   
4. [ACTION] Manager :
   └─> Identifie la cause : Problème produit majeur ce jour-là
   └─> Prend des mesures : Réaffectation temporaire des agents
   └─> Documente : Ajoute un commentaire pour référence future
```

---

## 🎨 Composants UI (ShadCN)

### Structure du Widget

```tsx
<Card className="h-[420px] flex flex-col min-w-[400px]">
  {/* En-tête avec titre et filtres */}
  <CardHeader className="pb-3 flex-shrink-0 space-y-3">
    <div className="flex items-center justify-between">
      <CardTitle className="text-sm font-semibold">
        Évolution Performance Support
      </CardTitle>
      <Button variant="ghost" size="sm" onClick={toggleFilters}>
        <Filter className="h-4 w-4" />
      </Button>
    </div>
    
    {/* Filtres locaux (pliable) */}
    {showFilters && (
      <SupportEvolutionFilters
        period={localFilters.period}
        ticketType={localFilters.ticketType}
        agents={localFilters.agents}
        viewMode={localFilters.viewMode}
        onPeriodChange={...}
        onTicketTypeChange={...}
        onAgentsChange={...}
        onViewModeChange={...}
        availableAgents={availableAgents}
      />
    )}
  </CardHeader>
  
  {/* Graphique */}
  <CardContent className="flex-1 min-h-0">
    <ChartContainer config={chartConfig} className="h-full w-full">
      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
        {/* Lignes dynamiques selon filtres */}
      </LineChart>
    </ChartContainer>
  </CardContent>
</Card>
```

### Composants de Filtres

1. **Période** : `ToggleGroup` (ShadCN)
   ```tsx
   <ToggleGroup type="single" value={period} onValueChange={...}>
     <ToggleGroupItem value="week">Semaine</ToggleGroupItem>
     <ToggleGroupItem value="month">Mois</ToggleGroupItem>
     <ToggleGroupItem value="quarter">Trimestre</ToggleGroupItem>
     <ToggleGroupItem value="year">Année</ToggleGroupItem>
   </ToggleGroup>
   ```

2. **Type de ticket** : `ToggleGroup` (ShadCN)
   ```tsx
   <ToggleGroup type="single" value={ticketType} onValueChange={...}>
     <ToggleGroupItem value="all">Tous</ToggleGroupItem>
     <ToggleGroupItem value="ASSISTANCE">ASSISTANCE</ToggleGroupItem>
     <ToggleGroupItem value="BUG">BUG</ToggleGroupItem>
     <ToggleGroupItem value="REQ">REQ</ToggleGroupItem>
   </ToggleGroup>
   ```

3. **Agents** : `Popover` + `Checkbox` (ShadCN)
   ```tsx
   <Popover>
     <PopoverTrigger asChild>
       <Button variant="outline">
         Agents ({selectedAgents.length})
       </Button>
     </PopoverTrigger>
     <PopoverContent>
       {agents.map(agent => (
         <Checkbox
           checked={selectedAgents.includes(agent.id)}
           onCheckedChange={...}
         >
           {agent.name}
         </Checkbox>
       ))}
     </PopoverContent>
   </Popover>
   ```

4. **Vue** : `RadioGroup` (ShadCN)
   ```tsx
   <RadioGroup value={viewMode} onValueChange={...}>
     <RadioGroupItem value="team">Par équipe</RadioGroupItem>
     <RadioGroupItem value="agent">Par agent</RadioGroupItem>
   </RadioGroup>
   ```

---

## 📊 Format des Données

```typescript
type SupportEvolutionDataPoint = {
  date: string; // ISO date: "2025-01-15"
  
  // Métriques globales (si vue "équipe")
  ticketsResolved?: number;
  ticketsOpened?: number;
  totalAssistanceTime?: number; // minutes
  averageMTTR?: number; // jours
  
  // Métriques par agent (si vue "agent")
  byAgent?: {
    [agentId: string]: {
      agentName: string;
      ticketsResolved: number;
      ticketsOpened: number;
      assistanceTime: number; // minutes
      mttr: number; // jours
    };
  };
};

type SupportEvolutionData = {
  period: Period;
  ticketType?: 'BUG' | 'REQ' | 'ASSISTANCE';
  viewMode: 'team' | 'agent';
  selectedAgents?: string[]; // Si undefined = tous
  data: SupportEvolutionDataPoint[];
};
```

---

## 🚀 Prochaines Étapes

1. ✅ Valider l'Option A (Multi-Métriques)
2. Créer le service de données (`support-evolution-data.ts`)
3. Implémenter les types TypeScript
4. Créer le composant graphique avec filtres
5. Intégrer dans le registry des widgets
6. Activer dans la base de données pour le rôle "manager"


