# Proposition d'Insights - Tableau des Entreprises

## 💡 Concept : Colonnes d'Insights Agregés

Au lieu d'afficher uniquement les informations descriptives (pays, secteurs, etc.), ajoutons des **insights statistiques** qui donnent une vue d'ensemble de l'activité de chaque entreprise directement dans le tableau.

---

## 📊 Relations Disponibles

D'après le schéma de base de données :

1. **`profiles.company_id`** → Utilisateurs liés à l'entreprise
2. **`tickets.company_id`** → Tickets liés à l'entreprise (relation directe)
3. **`ticket_company_link`** → Table de liaison many-to-many (tickets ↔ companies)
4. **`company_sector_link`** → Secteurs (déjà géré)

---

## ✅ Insights Proposés

### **1. Nombre d'utilisateurs** 👥
- **Label** : "Utilisateurs" ou "Contacts"
- **Icon** : 👤 User icon
- **Format** : Nombre entier (ex: "12")
- **Calcul** : `COUNT(profiles WHERE company_id = company.id)`
- **Triable** : ✅ Oui (`sort=users_count`)
- **Filtre** : QuickFilter "Avec utilisateurs" / "Sans utilisateurs"
- **Tooltip** : "12 utilisateurs associés"
- **Couleur** : Badge info si > 0, gris si 0

**Justification** : Permet de voir rapidement quelles entreprises ont des contacts/utilisateurs associés.

---

### **2. Total tickets** 🎫
- **Label** : "Tickets"
- **Icon** : 🎫 Ticket icon
- **Format** : Nombre entier (ex: "45")
- **Calcul** : `COUNT(tickets WHERE company_id = company.id)` + liaison via `ticket_company_link`
- **Triable** : ✅ Oui (`sort=tickets_count`)
- **Filtre** : QuickFilter "Avec tickets" / "Sans tickets"
- **Tooltip** : "45 tickets au total"
- **Couleur** : Badge primary

**Justification** : Indicateur clé de l'activité support pour chaque entreprise.

---

### **3. Tickets ouverts** 🔴 (Optionnel mais recommandé)
- **Label** : "Ouverts"
- **Icon** : 🔴 Circle icon
- **Format** : Nombre entier (ex: "8")
- **Calcul** : `COUNT(tickets WHERE company_id = company.id AND status NOT IN ('Termine', 'Annule', 'Transfere'))`
- **Triable** : ✅ Oui (`sort=open_tickets_count`)
- **Couleur** : Badge danger si > 0, neutre si 0
- **Tooltip** : "8 tickets ouverts"

**Justification** : Permet d'identifier rapidement les entreprises avec des tickets en cours.

---

### **4. Durée d'assistance cumulée** ⏱️ (Recommandé)
- **Label** : "Durée assist."
- **Icon** : ⏱️ Timer icon ou 🕐 Clock icon
- **Format** : Durée formatée (ex: "24h 30m" ou "1450 min")
- **Calcul** : `SUM(duration_minutes) WHERE ticket_type = 'ASSISTANCE' AND company_id = company.id AND duration_minutes IS NOT NULL`
- **Triable** : ✅ Oui (`sort=assistance_duration`)
- **Filtre** : QuickFilter "Avec assistance" / "Sans assistance"
- **Couleur** : Badge info ou primary
- **Tooltip** : "24h 30min d'assistance cumulée" ou "1 450 minutes"
- **Format d'affichage** : 
  - Si < 60 min : "45 min"
  - Si >= 60 min : "2h 15min" (heures + minutes)
  - Si >= 24h : "2j 3h" (jours + heures) ou simplement heures "51h"

**Justification** : Indicateur clé de la charge support pour chaque entreprise. Permet d'identifier les entreprises qui consomment le plus de temps d'assistance.

---

### **5. Tickets ce mois** 📅 (Optionnel)
- **Label** : "Ce mois"
- **Icon** : 📅 Calendar icon
- **Format** : Nombre entier (ex: "5")
- **Calcul** : `COUNT(tickets WHERE company_id = company.id AND created_at >= start_of_month)`
- **Triable** : ✅ Oui (`sort=monthly_tickets_count`)
- **Couleur** : Badge success
- **Tooltip** : "5 tickets créés ce mois"

**Justification** : Indicateur d'activité récente.

---

## 📋 Structure Proposée Finale (Révisée)

### Ordre d'affichage (gauche → droite) :

1. **Nom** ⭐ (obligatoire)
2. **Pays** ⭐ (prioritaire)
3. **Point focal** ⭐ (prioritaire)
4. **Secteurs** (recommandé)
5. **👥 Utilisateurs** ⭐⭐ (INSIGHT - prioritaire)
6. **🎫 Tickets** ⭐⭐ (INSIGHT - prioritaire)
7. **🔴 Ouverts** ⭐ (INSIGHT - recommandé)
8. **⏱️ Durée assist.** ⭐⭐ (INSIGHT - prioritaire)
9. **Date de création** (recommandé)
10. **Actions** ⭐ (obligatoire)

---

## 🎨 Format d'Affichage des Insights

### Option A : Colonnes séparées (Recommandé pour desktop)
```
| Nom        | Pays | Focal | Utilisateurs | Tickets | Ouverts | Actions |
|------------|------|-------|--------------|---------|---------|---------|
| Acme Corp  | FR   | Jean  | 👤 12       | 🎫 45  | 🔴 8   | [⚙️]    |
```

### Option B : Colonne combinée "Activité" (Recommandé pour mobile/tablet)
```
| Nom        | Pays | Activité                                | Actions |
|------------|------|-----------------------------------------|---------|
| Acme Corp  | FR   | 👤 12 • 🎫 45 • 🔴 8 • ⏱️ 24h 30m    | [⚙️]    |
```

**Recommandation** : **Option A** pour plus de clarté et de triabilité.

---

## 🚀 Implémentation Technique

### 1. Service Serveur : Agréger les insights
```typescript
// src/services/companies/list-companies-paginated.ts
export async function listCompaniesPaginated(
  offset: number,
  limit: number,
  search?: string,
  quickFilter?: CompanyQuickFilter,
  sort?: CompanySortColumn,
  direction?: SortDirection
): Promise<CompaniesPaginatedResult> {
  const supabase = await createSupabaseServerClient();
  
  // Requête principale pour les entreprises
  let query = supabase
    .from('companies')
    .select(`
      id,
      name,
      country_id,
      focal_user_id,
      created_at,
      jira_company_id
    `);
  
  // ... filtres, tri, pagination
  
  const { data: companies } = await query;
  
  // Pour chaque entreprise, calculer les insights séparément
  // (Supabase ne supporte pas facilement les SUM conditionnels dans une seule requête)
  const companiesWithInsights = await Promise.all(
    companies.map(async (company) => {
      const [usersCount, ticketsCount, openTicketsCount, assistanceDuration] = await Promise.all([
        // Nombre d'utilisateurs
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', company.id),
        
        // Total tickets (via company_id + ticket_company_link)
        supabase
          .rpc('count_tickets_for_company', { company_id_param: company.id }),
        
        // Tickets ouverts
        supabase
          .from('tickets')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', company.id)
          .not('status', 'in', '(Termine,Annule,Transfere)'),
        
        // Durée d'assistance cumulée
        supabase
          .from('tickets')
          .select('duration_minutes')
          .eq('company_id', company.id)
          .eq('ticket_type', 'ASSISTANCE')
          .not('duration_minutes', 'is', null)
      ]);
      
      // Calculer la somme des duration_minutes
      const totalDuration = (assistanceDuration.data || []).reduce(
        (sum, ticket) => sum + (ticket.duration_minutes || 0),
        0
      );
      
      return {
        ...company,
        users_count: usersCount.count || 0,
        tickets_count: ticketsCount.count || 0,
        open_tickets_count: openTicketsCount.count || 0,
        assistance_duration_minutes: totalDuration
      };
    })
  );
  
  // ... retourner les résultats
}
```

**Note** : Pour optimiser les performances, considérer créer une fonction SQL ou une vue matérialisée qui calcule ces agrégations.

### 2. Type avec insights
```typescript
// src/types/company-with-relations.ts
export type CompanyWithRelations = {
  id: string;
  name: string;
  country_id: string | null;
  focal_user_id: string | null;
  created_at: string;
  jira_company_id: number | null;
  // Relations
  country?: { id: string; name: string } | null;
  focal_user?: { id: string; full_name: string } | null;
  sectors?: Array<{ name: string }>;
  // Insights (agrégés)
  users_count: number;
  tickets_count: number;
  open_tickets_count: number;
  assistance_duration_minutes: number; // Durée cumulée en minutes
  monthly_tickets_count?: number; // Optionnel
};
```

### 3. Fonction utilitaire pour formater la durée
```typescript
// src/components/companies/utils/format-assistance-duration.ts
/**
 * Formate une durée en minutes en format lisible
 * 
 * @param minutes - Durée en minutes
 * @returns Format lisible (ex: "45 min", "2h 15min", "2j 3h")
 */
export function formatAssistanceDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (remainingHours === 0) {
    return `${days}j`;
  }
  return `${days}j ${remainingHours}h`;
}
```

### 4. Composant de cellule insight
```typescript
// src/components/companies/company-insight-cell.tsx
export function CompanyInsightCell({
  icon,
  value,
  tooltip,
  variant = 'default'
}: {
  icon: React.ReactNode;
  value: number | string; // Nombre ou texte formaté
  tooltip: string;
  variant?: 'default' | 'danger' | 'success' | 'info';
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={variant}>
          {icon} {value}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
```

### 5. Composant spécifique pour la durée d'assistance
```typescript
// src/components/companies/company-assistance-duration-cell.tsx
import { Clock } from 'lucide-react';
import { formatAssistanceDuration } from './utils/format-assistance-duration';
import { CompanyInsightCell } from './company-insight-cell';

export function CompanyAssistanceDurationCell({
  durationMinutes
}: {
  durationMinutes: number;
}) {
  const formatted = formatAssistanceDuration(durationMinutes);
  const tooltip = durationMinutes === 0 
    ? "Aucune assistance enregistrée"
    : `${durationMinutes} minutes d'assistance cumulée (${formatted})`;
  
  return (
    <CompanyInsightCell
      icon={<Clock className="h-3 w-3" />}
      value={durationMinutes === 0 ? "-" : formatted}
      tooltip={tooltip}
      variant={durationMinutes > 0 ? 'info' : 'default'}
    />
  );
}
```

---

## ⚡ Performance

### Optimisations nécessaires :

1. **Agrégations côté serveur** :
   - Utiliser `COUNT()` avec subqueries ou `LEFT JOIN` avec agrégation
   - Éviter de charger toutes les relations (utiliser seulement les counts)

2. **Index sur foreign keys** :
   - `CREATE INDEX idx_profiles_company_id ON profiles(company_id)`
   - `CREATE INDEX idx_tickets_company_id ON tickets(company_id)`
   - `CREATE INDEX idx_tickets_company_type_duration ON tickets(company_id, ticket_type, duration_minutes) WHERE ticket_type = 'ASSISTANCE' AND duration_minutes IS NOT NULL`
   - Vérifier si ces index existent déjà

3. **Optimisation requête durée d'assistance** :
   - Utiliser une sous-requête ou une fonction SQL pour calculer `SUM(duration_minutes)` directement en SQL
   - Éviter de charger tous les tickets pour faire le calcul en JavaScript

3. **Cache des insights** :
   - Pour les insights qui changent peu (utilisateurs), considérer un cache
   - Les tickets changent fréquemment → pas de cache

---

## 🎯 QuickFilters avec Insights

Ajout de filtres rapides basés sur les insights :

- **`all`** : Toutes les entreprises
- **`with_users`** : Avec utilisateurs (users_count > 0)
- **`without_users`** : Sans utilisateurs (users_count = 0)
- **`with_tickets`** : Avec tickets (tickets_count > 0)
- **`with_open_tickets`** : Avec tickets ouverts (open_tickets_count > 0)
- **`with_assistance`** : Avec assistance (assistance_duration_minutes > 0)
- **`active`** : Avec tickets ce mois (monthly_tickets_count > 0)

---

## ✅ Comparaison avec Autres Pages

| Insight | Tickets | Activités | Tâches | Entreprises (proposé) |
|---------|---------|-----------|--------|----------------------|
| Statut | ✅ (colonnes) | ✅ (colonnes) | ✅ (colonnes) | ❌ (n/a) |
| Priorité | ✅ | ❌ | ❌ | ❌ (n/a) |
| Assigné | ✅ | ✅ | ✅ | ✅ (Point focal) |
| **Liens/Aggrégations** | | | | |
| Nombre utilisateurs | ❌ | ❌ | ❌ | ✅ **Utilisateurs** |
| Nombre tickets | ❌ | ❌ | ❌ | ✅ **Tickets** |
| Tickets ouverts | ❌ | ❌ | ❌ | ✅ **Ouverts** |
| Durée assistance | ❌ | ❌ | ❌ | ✅ **Durée assist.** |
| Date création | ✅ | ✅ | ✅ | ✅ |

---

## 💡 Avantages des Insights

1. **Vue d'ensemble immédiate** : Pas besoin d'ouvrir chaque entreprise pour voir son activité
2. **Tri par activité** : Identifier rapidement les entreprises les plus actives
3. **Filtrage intelligent** : Trouver les entreprises avec tickets ouverts, sans contacts, etc.
4. **Cohérence avec le contexte métier** : Les entreprises sont importantes pour le support, montrer leur activité est pertinent

---

## ✅ Recommandation Finale

**Insights prioritaires à implémenter :**
1. ✅ **Nombre d'utilisateurs** (contacts associés)
2. ✅ **Total tickets** (tous types confondus)
3. ✅ **Tickets ouverts** (en cours)
4. ✅ **Durée d'assistance cumulée** (temps support total - prioritaire)

**Insights optionnels (v2) :**
- Tickets ce mois (activité récente)
- Répartition par type de ticket (BUG/REQ/ASSISTANCE)
- MTTR moyen pour l'entreprise

---

**À valider par l'utilisateur avant implémentation.**
