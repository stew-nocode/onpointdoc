# Guide du Lazy Loading - OnpointDoc

**Date:** 2025-01-20  
**Branche:** `refactor/clean-code`  
**Statut:** ✅ **IMPLÉMENTÉ**

## 🎯 Objectif

Implémenter le lazy loading des composants lourds pour améliorer les performances de l'application, réduire le bundle initial et accélérer le temps de chargement initial.

## 📋 Principes Clean Code appliqués

- **DRY** : Utilisation d'une fonction utilitaire réutilisable `createLazyDialog`
- **SRP** : Chaque wrapper lazy a une seule responsabilité (lazy loading)
- **Réutilisabilité** : Pattern standardisé pour tous les dialogs

## 🏗️ Architecture

### 1. Fonction utilitaire `createLazyDialog`

**Fichier:** `src/lib/utils/lazy-load.tsx`

```typescript
/**
 * Crée un composant dialog lazy-loadé
 * Les dialogs sont toujours client-side (ssr: false)
 * 
 * @param importFunction - Fonction qui importe le dialog
 * @param options - Options de lazy loading
 * @returns Dialog lazy-loadé
 */
export function createLazyDialog<T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  options?: LazyDialogOptions
): ComponentType<React.ComponentProps<T>> {
  return dynamic(importFunction, {
    ssr: options?.ssr ?? false,
    loading: options?.loading ?? DefaultLazyFallback
  }) as ComponentType<React.ComponentProps<T>>;
}
```

### 2. Pattern de wrapper lazy

**Structure:** Pour chaque dialog lourd, créer un fichier `*-dialog-lazy.tsx`

```typescript
/**
 * Wrapper lazy-loadé pour NewUserDialog
 * Charge le dialog uniquement quand nécessaire
 */

import { createLazyDialog } from '@/lib/utils/lazy-load';

/**
 * NewUserDialog lazy-loadé
 * Charge uniquement quand le dialog est ouvert
 */
export const NewUserDialogLazy = createLazyDialog(
  () => import('./new-user-dialog').then(mod => ({ default: mod.NewUserDialog }))
);
```

### 3. Utilisation dans les pages

**Avant:**
```typescript
import { NewUserDialog } from '@/components/users/new-user-dialog';

<NewUserDialog>
  <Button>Nouvel utilisateur</Button>
</NewUserDialog>
```

**Après:**
```typescript
import { NewUserDialogLazy } from '@/components/users/new-user-dialog-lazy';

<NewUserDialogLazy>
  <Button>Nouvel utilisateur</Button>
</NewUserDialogLazy>
```

## 📦 Dialogs lazy-loadés

### ✅ Implémentés

1. **Tickets**
   - `CreateTicketDialogLazy` ✅
   - `BulkUpdateStatusDialogLazy` ✅
   - `BulkReassignDialogLazy` ✅
   - `BulkUpdatePriorityDialogLazy` ✅

2. **Users**
   - `NewUserDialogLazy` ✅
   - `EditUserDialogLazy` ✅
   - `NewContactDialogLazy` ✅

3. **Companies**
   - `NewCompanyDialogLazy` ✅
   - `EditCompanyDialogLazy` ✅ (déjà existant)
   - `ViewCompanyDialogLazy` ✅ (déjà existant)

4. **Configuration**
   - `NewDepartmentDialogLazy` ✅
   - `NewModuleDialogLazy` ✅
   - `NewSubmoduleDialogLazy` ✅
   - `NewFeatureDialogLazy` ✅

## 🔄 Code Splitting par Route

Next.js 15 avec App Router effectue automatiquement le code splitting par route :

- **Chaque route** génère un chunk séparé
- **Imports dynamiques** créent des chunks additionnels
- **Lazy loading** crée des chunks pour les composants chargés à la demande

**Aucune action supplémentaire requise** - Next.js gère cela automatiquement.

## 🎨 Optimisation des Images

Si des images sont ajoutées à l'avenir, utiliser :

```typescript
import Image from 'next/image';

<Image
  src="/path/to/image.jpg"
  alt="Description"
  width={500}
  height={300}
  loading="lazy"
  placeholder="blur"
/>
```

## 📊 Bénéfices

### Performance

- **Bundle initial réduit** : Les dialogs lourds ne sont pas chargés au démarrage
- **Temps de chargement initial amélioré** : Seulement le code nécessaire est chargé
- **Code splitting optimal** : Chaque dialog est dans son propre chunk

### Expérience Utilisateur

- **Premier affichage plus rapide** : L'application démarre plus vite
- **Chargement à la demande** : Les dialogs sont chargés seulement quand nécessaires
- **Fallback visuel** : Indicateur de chargement pendant le fetch

## 🔍 Vérification

Pour vérifier que le lazy loading fonctionne :

1. Ouvrir les DevTools (F12)
2. Aller dans l'onglet "Network"
3. Filtrer par "JS"
4. Ouvrir un dialog lazy-loadé
5. Vérifier qu'un nouveau chunk JS est téléchargé

## 📝 Checklist pour nouveaux dialogs

- [ ] Créer le fichier `*-dialog-lazy.tsx` avec le pattern standard
- [ ] Utiliser `createLazyDialog` pour wrapper le dialog
- [ ] Importer la version lazy dans les pages
- [ ] Tester le chargement à la demande
- [ ] Vérifier le code splitting dans DevTools

## 🚀 Prochaines étapes

1. ✅ Lazy load des dialogs lourds (COMPLÉTÉ)
2. ✅ Code splitting par route (AUTOMATIQUE - Next.js)
3. ⏳ Optimisation des images (Si ajoutées plus tard)

## 📚 Références

- [Next.js Dynamic Imports](https://nextjs.org/docs/advanced-features/dynamic-import)
- [Next.js Code Splitting](https://nextjs.org/docs/advanced-features/dynamic-import#with-no-ssr)
- [React Lazy Loading](https://react.dev/reference/react/lazy)

