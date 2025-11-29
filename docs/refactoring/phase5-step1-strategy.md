# Phase 5 - Étape 1 : Stratégie d'Extraction de la Logique de Chargement

## 📊 Analyse

### Code à Extraire (~150 lignes)

**Fichier actuel** : `src/components/tickets/tickets-infinite-scroll.tsx`

**Sections à extraire** :
1. **État du chargement** (lignes ~102-110)
   - `tickets`, `setTickets`
   - `hasMore`, `setHasMore`
   - `isLoading`, `setIsLoading`
   - `error`, `setError`
   - `ticketsLengthRef`
   - `isLoadingRef`, `hasMoreRef`

2. **Logique de chargement** (lignes ~257-430)
   - `loadMoreRef` et sa fonction `loadMoreRef.current`
   - Gestion des erreurs avec retry
   - Fusion des tickets
   - Gestion de la pagination

3. **Références des filtres** (lignes ~201-235)
   - `filtersRef` et sa mise à jour
   - Synchronisation avec les filtres

4. **Réinitialisation sur changement de filtres** (lignes ~145-172)
   - `filterKey` et logique de réinitialisation

## 🎯 Hook à Créer

**Fichier** : `src/hooks/tickets/use-tickets-infinite-load.ts`

### Interface du Hook

```typescript
type UseTicketsInfiniteLoadProps = {
  initialTickets: TicketWithRelations[];
  initialHasMore: boolean;
  type?: string;
  status?: string;
  search?: string;
  quickFilter?: QuickFilter;
  currentProfileId?: string;
  currentSort: TicketSortColumn;
  currentSortDirection: SortDirection;
  searchParams: ReadonlyURLSearchParams;
};

type UseTicketsInfiniteLoadReturn = {
  tickets: TicketWithRelations[];
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  filterKey: string;
};
```

### Responsabilités

1. **Gestion de l'état** : tickets, hasMore, isLoading, error
2. **Chargement paginé** : logique fetch avec retry
3. **Fusion des tickets** : éviter les doublons
4. **Gestion des filtres** : réinitialisation automatique
5. **Performance** : refs pour éviter les re-renders

## ⚠️ Risques Identifiés

1. **Réinitialisation des tickets** : Doit se faire quand les filtres changent
2. **Références stables** : Les refs doivent rester stables
3. **Synchronisation filtres** : Doit être réactif aux changements
4. **Scroll restoration** : Doit fonctionner avec le hook (étape 2)

## ✅ Plan d'Implémentation

### Phase 1 : Créer le Hook
1. Créer le fichier `use-tickets-infinite-load.ts`
2. Définir les types TypeScript
3. Extraire la gestion de l'état

### Phase 2 : Extraire la Logique de Chargement
1. Extraire `loadMoreRef.current`
2. Extraire la gestion des erreurs
3. Extraire la fusion des tickets

### Phase 3 : Extraire la Gestion des Filtres
1. Extraire `filtersRef` et sa logique
2. Extraire `filterKey` et réinitialisation

### Phase 4 : Intégrer dans le Composant
1. Remplacer le code par l'utilisation du hook
2. Tester la fonctionnalité
3. Vérifier les performances

### Phase 5 : Tests et Validation
1. Tester le chargement paginé
2. Tester le changement de filtres
3. Tester la gestion des erreurs
4. Vérifier qu'il n'y a pas de régressions

## 📝 Notes Importantes

- Le hook doit rester **pure** et **testable**
- Utiliser des **refs** pour éviter les re-renders
- Gérer la **réinitialisation** automatique des tickets
- Conserver la **logique de retry** pour les erreurs réseau
- Maintenir la **performance** actuelle

---

**Statut** : 📋 Plan prêt pour implémentation
**Complexité** : Moyenne à élevée
**Risque** : Moyen
**Impact** : ~150 lignes en moins

