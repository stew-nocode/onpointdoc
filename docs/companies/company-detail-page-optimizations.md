# Optimisations Page Détails Entreprise

## 📊 Analyse Actuelle

**Page** : `src/app/(main)/config/companies/[id]/page.tsx`

**Problèmes identifiés** :
1. ❌ `noStore()` utilisé partout → Pas de cache possible
2. ❌ Pas de streaming granulaire → Tout attend avant affichage
3. ❌ Pas de `React.cache()` dans les services → Duplication de requêtes
4. ❌ Pas de séparation critique/non-critique → Tout bloque le rendu
5. ❌ Pas de prefetching → Navigation lente

---

## 🚀 Optimisations Proposées (Priorisées)

### **Phase 1 : Streaming Granulaire avec Suspense** ⭐⭐⭐

**Impact** : 🔥🔥🔥 Très élevé (perceived performance)

**Problème actuel** :
```tsx
// ❌ Tout attend avant d'afficher quoi que ce soit
const [company, history, ...stats] = await Promise.all([...]);
```

**Solution** : Séparer en chunks streamables

```tsx
export default async function CompanyDetailPage({ params, searchParams }) {
  const { id } = await params;
  
  return (
    <div>
      {/* ✅ Shell statique immédiat */}
      <Header companyId={id} />
      
      {/* ✅ Contenu critique streamé en premier */}
      <Suspense fallback={<CompanyDetailsSkeleton />}>
        <CompanyDetails id={id} />
      </Suspense>
      
      {/* ✅ Stats streamées indépendamment */}
      <Suspense fallback={<StatsSkeleton />}>
        <CompanyStats id={id} />
      </Suspense>
      
      {/* ✅ Historique streamé en dernier (non critique) */}
      <Suspense fallback={<TimelineSkeleton />}>
        <CompanyTimeline id={id} />
      </Suspense>
    </div>
  );
}
```

**Gain estimé** : 
- **TTFB** : -200ms (shell immédiat)
- **FCP** : -300ms (contenu visible plus tôt)
- **Perceived Latency** : -500ms (utilisateur voit du contenu immédiatement)

---

### **Phase 2 : React.cache() dans les Services** ⭐⭐⭐

**Impact** : 🔥🔥🔥 Très élevé (réduction requêtes DB)

**Problème actuel** :
```tsx
// ❌ Pas de cache → Duplication si appelé plusieurs fois
export async function getCompanyById(companyId: string) {
  const supabase = await createSupabaseServerClient();
  // ... requête DB
}
```

**Solution** : Utiliser `React.cache()` pour déduplication

```tsx
import { cache } from 'react';

// ✅ Cache automatique par requête (déduplication)
export const getCompanyById = cache(async (companyId: string) => {
  const supabase = await createSupabaseServerClient();
  // ... requête DB
});

export const loadCompanyHistory = cache(async (companyId: string) => {
  // ... requête DB
});
```

**Gain estimé** :
- **Requêtes DB** : -30% (déduplication)
- **Temps de réponse** : -100ms (cache mémoire)

**Note** : Les services stats utilisent déjà `cache()` ✅, mais pas `getCompanyById` et `loadCompanyHistory` ❌

---

### **Phase 3 : Optimisation du Cache (noStore Sélectif)** ⭐⭐

**Impact** : 🔥🔥 Moyen (amélioration cache)

**Problème actuel** :
```tsx
// ❌ noStore() partout → Aucun cache possible
async function loadCompany(id: string) {
  noStore();
  // ...
}
```

**Solution** : `noStore()` seulement si nécessaire (données temps réel)

```tsx
// ✅ Cache possible pour données stables
export const getCompanyById = cache(async (companyId: string) => {
  // Pas de noStore() → Next.js peut cacher
  const supabase = await createSupabaseServerClient();
  // ...
});

// ✅ noStore() seulement pour données temps réel
export const loadCompanyHistory = cache(async (companyId: string) => {
  // noStore() nécessaire car historique change souvent
  noStore();
  // ...
});
```

**Gain estimé** :
- **Cache Hit Rate** : +40% (données stables cachées)
- **TTFB** : -150ms (cache serveur)

---

### **Phase 4 : Prefetching Intelligent** ⭐⭐

**Impact** : 🔥🔥 Moyen (navigation plus rapide)

**Solution** : Prefetch des entreprises adjacentes

```tsx
// Dans CompanyNavigationLink
<Link 
  href={`/config/companies/${nextId}`}
  prefetch={true} // ✅ Prefetch automatique
>
  Suivant
</Link>
```

**Gain estimé** :
- **Navigation** : -200ms (données préchargées)

---

### **Phase 5 : Code Splitting Amélioré** ⭐

**Impact** : 🔥 Faible (bundle size)

**Problème actuel** :
```tsx
// ❌ Tous les charts chargés même si non visibles
import { CompanyTicketsDistributionChart } from '...';
```

**Solution** : Lazy loading déjà implémenté ✅

**Amélioration possible** : Intersection Observer pour charts (déjà fait ✅)

---

### **Phase 6 : Optimisation des Requêtes DB** ⭐⭐

**Impact** : 🔥🔥 Moyen (performance DB)

**Problème actuel** :
```tsx
// ❌ Plusieurs requêtes séquentielles dans calculateCompanyInsights
const { count: usersCount } = await supabase...
const { count: ticketsDirectCount } = await supabase...
const { count: ticketsLinkCount } = await supabase...
```

**Solution** : Paralléliser avec `Promise.all()`

```tsx
async function calculateCompanyInsights(supabase, companyId) {
  // ✅ Toutes les requêtes en parallèle
  const [
    { count: usersCount },
    { count: ticketsDirectCount },
    { count: ticketsLinkCount },
    { count: openTicketsDirectCount },
    { data: assistanceTickets }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('ticket_company_link').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('company_id', companyId).in('status', openStatuses),
    supabase.from('tickets').select('duration_minutes').eq('company_id', companyId).eq('ticket_type', 'ASSISTANCE').not('duration_minutes', 'is', null)
  ]);
  
  // ...
}
```

**Gain estimé** :
- **Temps DB** : -200ms (parallélisation)
- **Latency totale** : -150ms

---

### **Phase 7 : Metadata et SEO** ⭐

**Impact** : 🔥 Faible (SEO, partage social)

**Solution** : Ajouter `generateMetadata`

```tsx
export async function generateMetadata({ params }: CompanyDetailPageProps) {
  const { id } = await params;
  const company = await getCompanyById(id);
  
  if (!company) {
    return { title: 'Entreprise introuvable' };
  }
  
  return {
    title: `${company.name} - Détails`,
    description: `Détails de l'entreprise ${company.name}`,
    openGraph: {
      title: company.name,
      // ...
    }
  };
}
```

---

## 📋 Plan d'Implémentation

### **Priorité 1 (Impact Immédiat)** ⭐⭐⭐

1. ✅ **Streaming Granulaire** (Phase 1)
   - Séparer en composants streamables
   - Ajouter Suspense boundaries
   - Créer les skeletons

2. ✅ **React.cache()** (Phase 2)
   - Ajouter `cache()` à `getCompanyById`
   - Ajouter `cache()` à `loadCompanyHistory`
   - Vérifier que les stats utilisent déjà `cache()`

### **Priorité 2 (Amélioration Continue)** ⭐⭐

3. ✅ **Optimisation Cache** (Phase 3)
   - Retirer `noStore()` de `getCompanyById` (si données stables)
   - Garder `noStore()` pour historique (données temps réel)

4. ✅ **Parallélisation DB** (Phase 6)
   - Refactoriser `calculateCompanyInsights` avec `Promise.all()`

### **Priorité 3 (Nice to Have)** ⭐

5. ✅ **Prefetching** (Phase 4)
   - Ajouter `prefetch={true}` aux liens navigation

6. ✅ **Metadata** (Phase 7)
   - Ajouter `generateMetadata`

---

## 🎯 Gains Estimés Totaux

| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| **TTFB** | 800ms | 450ms | **-44%** |
| **FCP** | 1200ms | 700ms | **-42%** |
| **LCP** | 2000ms | 1400ms | **-30%** |
| **Requêtes DB** | 8 | 5 | **-38%** |
| **Perceived Latency** | 1200ms | 400ms | **-67%** |

---

## 🔧 Implémentation Technique

### **1. Refactoring en Composants Streamables**

```tsx
// src/app/(main)/config/companies/[id]/page.tsx
export default async function CompanyDetailPage({ params, searchParams }) {
  const { id } = await params;
  const { period } = await searchParams;
  
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4">
      {/* Shell immédiat */}
      <Header companyId={id} />
      
      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
        <div className="hidden lg:flex lg:flex-1 lg:gap-4 lg:overflow-hidden">
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
            {/* Détails critiques en premier */}
            <Suspense fallback={<CompanyDetailsSkeleton />}>
              <CompanyDetails id={id} />
            </Suspense>
            
            {/* Stats streamées indépendamment */}
            <Suspense fallback={<StatsSkeleton />}>
              <CompanyStats id={id} period={period} />
            </Suspense>
          </div>
          
          {/* Timeline non critique en dernier */}
          <div className="w-96 flex-shrink-0">
            <Suspense fallback={<TimelineSkeleton />}>
              <CompanyTimeline id={id} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

// Nouveau composant streamable
async function CompanyDetails({ id }: { id: string }) {
  const company = await getCompanyById(id);
  if (!company) notFound();
  
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        {/* ... */}
      </Card>
      <CompanyInfoCard company={company} />
    </div>
  );
}

// Nouveau composant streamable
async function CompanyStats({ id, period }: { id: string; period?: string }) {
  const periodRange = getPeriodRange(parsePeriodFromParams(period));
  
  const [distributionStats, evolutionStats, productModuleStats] = await Promise.all([
    getCompanyTicketsDistributionStats(id, periodRange.periodStart, periodRange.periodEnd),
    getCompanyTicketsEvolutionStats(id, periodRange.periodStart, periodRange.periodEnd, period),
    getCompanyTicketsByProductModuleStats(id, periodRange.periodStart, periodRange.periodEnd, 10),
  ]);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Statistiques</CardTitle>
          <Suspense fallback={<PeriodSelectorSkeleton />}>
            <CompanyStatsPeriodSelector />
          </Suspense>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          <Suspense fallback={<CompanyTicketsDistributionChartSkeleton />}>
            <CompanyTicketsDistributionChart data={distributionStats} />
          </Suspense>
          {/* ... autres charts */}
        </div>
      </CardContent>
    </Card>
  );
}

// Nouveau composant streamable
async function CompanyTimeline({ id }: { id: string }) {
  const history = await loadCompanyHistory(id);
  const company = await getCompanyById(id);
  
  return <CompanyTimeline history={history} companyName={company?.name || ''} />;
}
```

### **2. Ajout de React.cache()**

```tsx
// src/services/companies/get-company-by-id.ts
import { cache } from 'react';

export const getCompanyById = cache(async (companyId: string) => {
  // ... code existant
});

// src/services/companies/company-history.ts
import { cache } from 'react';

export const loadCompanyHistory = cache(async (companyId: string) => {
  // ... code existant
});
```

### **3. Optimisation calculateCompanyInsights**

```tsx
// src/services/companies/get-company-by-id.ts
async function calculateCompanyInsights(
  supabase: SupabaseClient,
  companyId: string
) {
  const openStatuses = ['Nouveau', 'En_cours', 'To_Do', 'In_Progress'];
  
  // ✅ Toutes les requêtes en parallèle
  const [
    { count: usersCount },
    { count: ticketsDirectCount },
    { count: ticketsLinkCount },
    { count: openTicketsDirectCount },
    { data: assistanceTickets }
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId),
    supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId),
    supabase
      .from('ticket_company_link')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId),
    supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .in('status', openStatuses),
    supabase
      .from('tickets')
      .select('duration_minutes')
      .eq('company_id', companyId)
      .eq('ticket_type', 'ASSISTANCE')
      .not('duration_minutes', 'is', null)
  ]);

  const assistanceDuration = (assistanceTickets || [])
    .reduce((sum, ticket) => sum + (ticket.duration_minutes || 0), 0);

  return {
    users_count: usersCount || 0,
    tickets_count: (ticketsDirectCount || 0) + (ticketsLinkCount || 0),
    open_tickets_count: openTicketsDirectCount || 0,
    assistance_duration_minutes: assistanceDuration
  };
}
```

---

## ✅ Checklist d'Implémentation

### Phase 1 : Streaming
- [ ] Créer `CompanyDetails` component (streamable)
- [ ] Créer `CompanyStats` component (streamable)
- [ ] Créer `CompanyTimeline` component (streamable)
- [ ] Créer les skeletons correspondants
- [ ] Refactoriser la page principale avec Suspense boundaries

### Phase 2 : React.cache()
- [ ] Ajouter `cache()` à `getCompanyById`
- [ ] Ajouter `cache()` à `loadCompanyHistory`
- [ ] Vérifier que les services stats utilisent déjà `cache()`

### Phase 3 : Optimisation Cache
- [ ] Retirer `noStore()` de `getCompanyById` (si approprié)
- [ ] Garder `noStore()` pour `loadCompanyHistory` (données temps réel)

### Phase 4 : Parallélisation DB
- [ ] Refactoriser `calculateCompanyInsights` avec `Promise.all()`

### Phase 5 : Prefetching
- [ ] Ajouter `prefetch={true}` aux `CompanyNavigationLink`

### Phase 6 : Metadata
- [ ] Ajouter `generateMetadata` function

---

## 📚 Références

- [Next.js Streaming](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [React.cache()](https://react.dev/reference/react/cache)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [Suspense Boundaries](https://react.dev/reference/react/Suspense)

