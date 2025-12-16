# Plan d'Alignement - Section KPI Email Marketing

## 📊 Objectif

Aligner la section KPI de la page `marketing/email` sur le pattern standardisé utilisé dans les pages **Tasks**, **Activities** et **Companies**.

---

## 🔍 État Actuel

**Structure actuelle :**
1. ✅ **Header** avec `StandardPageHeader` (lignes 50-66)
2. ✅ **Banner** de configuration (lignes 69-90) - **À CONSERVER**
3. ❌ **4 Cards de KPIs** simples (lignes 93-146) - **À REMPLACER par KPICard standardisé**
4. ✅ **Card "Campagnes récentes"** (lignes 148-167) - **À DÉPLACER dans card.children**

**Problèmes identifiés :**
- ❌ Utilisation de `Card` simples au lieu du composant standardisé `KPICard`
- ❌ Pas de lazy loading pour les KPIs (chargement immédiat)
- ❌ Pas de classe `kpi-grid-responsive` pour la mise en page
- ❌ Structure différente des autres pages (pas de `PageLayoutWithFilters`)
- ❌ Pas de service dédié pour récupérer les KPIs

**Code actuel des KPIs (lignes 93-146) :**
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <Card>
    <CardHeader>...</CardHeader>
    <CardContent>...</CardContent>
  </Card>
  // ... 3 autres Cards simples
</div>
```

---

## ✅ Pattern Standard (Tasks/Activities)

**Architecture utilisée :**
1. **Service serveur** : `getTaskKPIs()` / `getActivityKPIs()` → récupère les données
2. **Composant Client** : `TasksKPISection` → utilise `KPICard` standardisé
3. **Composant Lazy** : `TasksKPISectionLazy` → `dynamic` import avec `ssr: false`
4. **Layout** : `PageLayoutWithFilters` avec prop `kpis` qui passe au `PageContent`
5. **CSS** : Classe `kpi-grid-responsive` pour la grille responsive

---

## 📋 Plan d'Implémentation

### Step 1 : Créer le Service pour les KPIs Email Marketing

**Fichier** : `src/services/email-marketing/email-kpis.ts`

**Fonctionnalités :**
- Récupérer les statistiques depuis Brevo API ou Supabase
- Calculer les 4 KPIs :
  1. **Total Campagnes** (nombre total)
  2. **Taux d'ouverture moyen** (en %)
  3. **Taux de clic moyen** (en %)
  4. **Emails envoyés** (total)
- Calculer les tendances (optionnel pour MVP)
- Retourner un type `EmailMarketingKPIs`

**Structure type :**
```typescript
export type EmailMarketingKPIs = {
  totalCampaigns: number;
  averageOpenRate: number; // %
  averageClickRate: number; // %
  totalEmailsSent: number;
  trends?: {
    totalCampaignsTrend?: number;
    averageOpenRateTrend?: number;
    averageClickRateTrend?: number;
    totalEmailsSentTrend?: number;
  };
  chartData?: {
    campaignsData?: number[];
    openRateData?: number[];
    clickRateData?: number[];
    emailsSentData?: number[];
  };
};

export async function getEmailMarketingKPIs(): Promise<EmailMarketingKPIs> {
  // TODO: Implémenter la récupération depuis Brevo/Supabase
}
```

---

### Step 2 : Créer le Composant KPISection Client

**Fichier** : `src/components/email-marketing/email-marketing-kpi-section.tsx`

**Pattern identique à `TasksKPISection` :**
- Utilise `KPICard` standardisé
- Classe `kpi-grid-responsive` pour la mise en page
- 4 KPIs avec icônes appropriées :
  - Total Campagnes → `Mail` icon, variant `info`
  - Taux d'ouverture → `Eye` icon, variant `success`
  - Taux de clic → `MousePointerClick` icon, variant `primary`
  - Emails envoyés → `Send` icon, variant `default`
- Gestion des tendances et mini-graphiques (optionnel)

**Structure :**
```tsx
'use client';

import { KPICard } from '@/components/dashboard/kpi-card';
import type { EmailMarketingKPIs } from '@/services/email-marketing/email-kpis';

export function EmailMarketingKPISection({ kpis }: { kpis: EmailMarketingKPIs }) {
  return (
    <div className="kpi-grid-responsive gap-4">
      <div className="w-full">
        <KPICard
          title="Total Campagnes"
          value={kpis.totalCampaigns}
          icon="mail"
          variant="info"
          // ... tendances et chartData
        />
      </div>
      // ... 3 autres KPIs
    </div>
  );
}
```

---

### Step 3 : Créer le Composant Lazy

**Fichier** : `src/components/email-marketing/email-marketing-kpi-section-lazy.tsx`

**Pattern identique à `TasksKPISectionLazy` :**
- Utilise `dynamic` import de Next.js
- `ssr: false` (les KPIs dépendent des données utilisateur/temps réel)
- Loading state avec `Loader2` et skeleton cards

**Structure :**
```tsx
'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const EmailMarketingKPISection = dynamic(
  () => import('./email-marketing-kpi-section').then((mod) => ({ default: mod.EmailMarketingKPISection })),
  {
    loading: () => (
      <div className="kpi-grid-responsive gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-full h-32 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ))}
      </div>
    ),
    ssr: false
  }
);

export function EmailMarketingKPISectionLazy({ kpis }: { kpis: EmailMarketingKPIs }) {
  return <EmailMarketingKPISection kpis={kpis} />;
}
```

---

### Step 4 : Mettre à Jour la Page Marketing/Email

**Fichier** : `src/app/(main)/marketing/email/page.tsx`

**Changements :**
1. Remplacer `StandardPageHeader` par `PageLayoutWithFilters`
2. Appeler `getEmailMarketingKPIs()` côté serveur
3. Passer les KPIs au composant lazy via la prop `kpis`
4. Supprimer les 4 `Card` simples (lignes 93-146)

**Structure :**
```tsx
import { PageLayoutWithFilters } from '@/components/layout/page';
import { EmailMarketingKPISectionLazy } from '@/components/email-marketing/email-marketing-kpi-section-lazy';
import { getEmailMarketingKPIs } from '@/services/email-marketing/email-kpis';

export default async function EmailMarketingPage() {
  const kpis = await getEmailMarketingKPIs();
  
  return (
    <PageLayoutWithFilters
      sidebar={null}
      header={{
        icon: 'Mail',
        title: 'Email Marketing',
        description: 'Gestion des campagnes email Brevo',
        actions: (
          <>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Synchroniser
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle campagne
            </Button>
          </>
        )
      }}
      kpis={<EmailMarketingKPISectionLazy kpis={kpis} />}
      card={{
        title: 'Campagnes récentes',
        titleSuffix: undefined,
        // ...
      }}
    >
      {/* Liste des campagnes */}
    </PageLayoutWithFilters>
  );
}
```

---

### Step 5 : Ajouter les Exports dans l'Index

**Fichier** : `src/components/email-marketing/index.ts` (à créer si n'existe pas)

```typescript
export { EmailMarketingKPISection } from './email-marketing-kpi-section';
export { EmailMarketingKPISectionLazy } from './email-marketing-kpi-section-lazy';
```

---

## ✅ Validation Context7

**Lazy Loading (validé) :**
- ✅ Next.js recommande `dynamic` import pour les Client Components
- ✅ `ssr: false` approprié pour les KPIs dépendants de données utilisateur
- ✅ Améliore les performances initiales (code splitting)

**Composants (validé) :**
- ✅ Server Component (page) → fetch données
- ✅ Client Component (KPISection) → interactivité avec icônes
- ✅ Pattern de séparation Server/Client respecté

**Performance (validé) :**
- ✅ Code splitting automatique avec `dynamic`
- ✅ Pas de blocage du rendu initial
- ✅ Chargement progressif des KPIs

---

## 📝 Checklist d'Implémentation

### Phase 1 : Service et Types
- [ ] Créer `src/services/email-marketing/email-kpis.ts`
- [ ] Définir le type `EmailMarketingKPIs`
- [ ] Implémenter `getEmailMarketingKPIs()` (avec placeholder pour MVP)

### Phase 2 : Composants KPI
- [ ] Créer `src/components/email-marketing/email-marketing-kpi-section.tsx`
- [ ] Créer `src/components/email-marketing/email-marketing-kpi-section-lazy.tsx`
- [ ] Utiliser `KPICard` standardisé
- [ ] Appliquer la classe `kpi-grid-responsive`

### Phase 3 : Support Banner dans PageContent

**Position du Banner :**
Le Banner doit être placé **entre le Header et les KPIs** pour maintenir la hiérarchie visuelle :
- Header (titre de la page)
- **Banner** (messages d'information/configuration - peut être fermé)
- KPIs (statistiques)
- Card (contenu principal)

**Changements :**
- [ ] Ajouter prop `banner?: ReactNode` à `PageContentProps` dans `src/components/layout/page/types.ts`
- [ ] Mettre à jour `PageContent` pour afficher le banner entre Header et KPIs (ligne 38)
- [ ] Mettre à jour `PageLayoutWithFilters` pour accepter et passer la prop `banner` à `PageContent`

**Structure PageContent après modification :**
```tsx
<div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
  <PageHeader {...} />
  
  {banner && <div>{banner}</div>}  // ← Banner ici, entre Header et KPIs
  
  {kpis && <PageKPISection>{kpis}</PageKPISection>}
  
  <PageCard {...}>
    {children}
  </PageCard>
</div>
```

### Phase 4 : Mise à Jour de la Page
- [ ] Mettre à jour `src/app/(main)/marketing/email/page.tsx`
- [ ] Remplacer `StandardPageHeader` par `PageLayoutWithFilters`
- [ ] Appeler `getEmailMarketingKPIs()` côté serveur
- [ ] Passer le Banner via prop `banner` (composant réutilisable indépendant)
- [ ] Passer les KPIs via prop `kpis` (remplace les 4 Cards simples)
- [ ] Déplacer le contenu "Campagnes récentes" dans `card.children`
- [ ] Supprimer les 4 `Card` simples (lignes 93-146)
- [ ] Supprimer le wrapper `container mx-auto p-6` (géré par `PageContent`)

### Phase 5 : Tests et Validation
- [ ] Vérifier le rendu des KPIs
- [ ] Tester le lazy loading
- [ ] Vérifier la responsive design
- [ ] Valider la cohérence avec les autres pages

---

## 🎯 Résultat Attendu

**Avant :**
- Structure : `container` → `StandardPageHeader` → `Banner` → 4 Cards KPIs → Card Campagnes
- 4 Cards simples avec structure manuelle
- Pas de lazy loading
- Structure différente des autres pages
- Banner et Card séparés au même niveau

**Après :**
- Structure : `PageLayoutWithFilters` avec :
  - `header` : Header standardisé
  - `banner` : Banner réutilisable (composant indépendant, fermable)
  - `kpis` : 4 KPICards standardisées avec lazy loading
  - `card.children` : Liste des campagnes
- 4 KPICards standardisées avec tendances et mini-graphiques
- Lazy loading avec `dynamic` import
- Structure identique aux pages Tasks/Activities
- Banner conservé mais intégré dans la structure standardisée
- Code réutilisable et maintenable
- Performance optimisée (code splitting)

**Éléments conservés :**
- ✅ Banner de configuration (déplacé dans `card.children`)
- ✅ Contenu "Campagnes récentes" (déplacé dans `card.children`)
- ✅ Loader `CampaignsLoader` (réutilisé)

---

## 🔄 Prochaines Étapes (Post-MVP)

1. Implémenter la vraie récupération depuis Brevo API
2. Ajouter les tendances (comparaison période précédente)
3. Ajouter les mini-graphiques (données historiques)
4. Ajouter la gestion d'erreur pour l'API Brevo
5. Ajouter le cache pour les KPIs (si nécessaire)

