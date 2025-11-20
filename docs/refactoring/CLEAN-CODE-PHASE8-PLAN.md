# Phase 8 - Refactoring Composants selon Clean Code : PLAN

**Date:** 2025-01-19  
**Branche:** `refactor/clean-code`  
**Statut:** 🟡 **EN PLANIFICATION**

## 🎯 Objectif

Refactoriser les composants React pour respecter les principes SOLID et Clean Code, en séparant la logique métier de la présentation.

## 📋 Analyse Initiale

### Composants Identifiés pour Refactoring

#### 1. **`ticket-form.tsx` (533 lignes)** 🔴 **PRIORITÉ HAUTE**

**Problèmes identifiés:**
- ❌ Composant trop long (533 lignes, limite recommandée : 100)
- ❌ Multiple responsabilités : formulaire, logique de filtrage, gestion fichiers, validation
- ❌ Plusieurs `useEffect` complexes
- ❌ Logique métier mélangée avec présentation
- ❌ Duplication de logique de filtrage (modules, submodules, features)

**Plan de refactoring:**
```typescript
// Diviser en sous-composants:
- TicketFormTypeSelector      // Sélection du type (ASSISTANCE/BUG/REQ)
- TicketFormBasicFields       // Champs de base (titre, description)
- TicketFormProductHierarchy  // Sélecteurs produit/module/submodule/feature
- TicketFormContactChannel    // Contact et canal
- TicketFormAttachments       // Upload de fichiers
- TicketFormActions           // Boutons submit/reset

// Hooks personnalisés:
- useTicketFormFilters        // Logique de filtrage modules/submodules/features
- useTicketFormValidation     // Validation spécifique
- useFileUpload               // Gestion upload fichiers
```

#### 2. **`app-shell.tsx`** 🟡 **PRIORITÉ MOYENNE**

**Problèmes identifiés:**
- ❌ Logique d'authentification dans le composant
- ❌ `as any` pour le rôle (ligne 40)
- ❌ Duplication de la logique de vérification auth

**Plan de refactoring:**
```typescript
// Créer un hook personnalisé:
- useAuth()                   // Gestion authentification + rôle
- useAuthRedirect()           // Redirection si non authentifié

// Composant simplifié:
- AppShell                    // Uniquement présentation
```

#### 3. **`new-company-dialog.tsx`** 🟡 **PRIORITÉ MOYENNE**

**Problèmes identifiés:**
- ❌ Logique de chargement des données dans le composant (lignes 41-66)
- ❌ Duplication avec d'autres dialogs (pattern répété)

**Plan de refactoring:**
```typescript
// Créer des hooks personnalisés:
- useCountries()              // Chargement des pays
- useSectors()                // Chargement des secteurs
- useProfiles()               // Chargement des profils

// Ou service générique:
- useSupabaseQuery<T>()       // Hook générique pour requêtes Supabase
```

#### 4. **Autres composants avec patterns répétés**

**Composants identifiés:**
- `new-user-dialog.tsx` - Chargement companies, modules
- `new-contact-dialog.tsx` - Chargement companies
- `edit-user-dialog.tsx` - Chargement companies, modules
- `edit-contact-dialog.tsx` - Chargement companies
- `tickets-infinite-scroll.tsx` - Logique de filtrage complexe

## 🏗️ Architecture Proposée

### Structure de Hooks Personnalisés

```
src/
└── hooks/
    ├── auth/
    │   ├── use-auth.ts              # Hook principal d'authentification
    │   └── use-auth-redirect.ts     # Redirection si non auth
    ├── supabase/
    │   ├── use-supabase-query.ts    # Hook générique pour requêtes
    │   ├── use-countries.ts         # Hook pour pays
    │   ├── use-sectors.ts           # Hook pour secteurs
    │   └── use-profiles.ts          # Hook pour profils
    ├── tickets/
    │   ├── use-ticket-form.ts       # Logique formulaire ticket
    │   ├── use-ticket-filters.ts    # Filtrage tickets
    │   └── use-ticket-selection.ts  # Sélection multiple tickets
    └── forms/
        ├── use-file-upload.ts       # Upload de fichiers
        └── use-form-validation.ts   # Validation générique
```

### Structure de Composants Refactorisés

```
src/
└── components/
    ├── forms/
    │   └── ticket/
    │       ├── ticket-form.tsx              # Composant principal (simple)
    │       ├── ticket-form-type-selector.tsx
    │       ├── ticket-form-basic-fields.tsx
    │       ├── ticket-form-product-hierarchy.tsx
    │       ├── ticket-form-contact-channel.tsx
    │       ├── ticket-form-attachments.tsx
    │       └── ticket-form-actions.tsx
    └── layout/
        └── app-shell.tsx                    # Composant simplifié
```

## 📝 Principes à Appliquer

### 1. **Single Responsibility Principle (SRP)**

Chaque composant/hook = une seule responsabilité :
- ❌ `TicketForm` fait tout (formulaire + filtrage + upload + validation)
- ✅ `TicketForm` orchestre, sous-composants spécialisés

### 2. **Separation of Concerns**

Séparer logique métier de présentation :
- ❌ Logique dans les composants
- ✅ Logique dans les hooks/services, composants = présentation uniquement

### 3. **DRY (Don't Repeat Yourself)**

Extraire les patterns répétés :
- ❌ Chargement Supabase répété dans chaque dialog
- ✅ Hook `useSupabaseQuery` réutilisable

### 4. **Composition over Inheritance**

Préférer la composition :
- ✅ Composants petits et spécialisés
- ✅ Composition dans composants parents

### 5. **Custom Hooks pour la Logique**

Toute logique réutilisable → hook :
- ✅ `useAuth()` pour authentification
- ✅ `useSupabaseQuery()` pour requêtes
- ✅ `useTicketFormFilters()` pour filtrage

## 🎯 Objectifs de la Phase 8

1. **Réduire la complexité** des composants
2. **Extraire la logique métier** dans des hooks
3. **Éliminer les duplications** de code
4. **Améliorer la testabilité** des composants
5. **Faciliter la maintenance** future

## 📊 Métriques Cibles

### Avant Phase 8:
- ❌ Composants > 100 lignes : ~5 composants
- ❌ Composants avec logique métier : ~10 composants
- ❌ Hooks personnalisés : 0
- ❌ Duplications de patterns : Élevé

### Après Phase 8:
- ✅ Composants > 100 lignes : 0
- ✅ Composants avec logique métier : 0
- ✅ Hooks personnalisés : ~10 hooks
- ✅ Duplications de patterns : Minimal

## 🚀 Plan d'Exécution

### Étape 1: Créer les hooks de base
1. `useAuth()` - Authentification
2. `useSupabaseQuery<T>()` - Requêtes génériques
3. `useFileUpload()` - Upload fichiers

### Étape 2: Refactoriser les composants simples
1. `app-shell.tsx` - Utiliser `useAuth()`
2. `new-company-dialog.tsx` - Utiliser `useSupabaseQuery()`
3. `new-user-dialog.tsx` - Utiliser hooks

### Étape 3: Refactoriser ticket-form.tsx
1. Extraire sous-composants
2. Créer `useTicketFormFilters()`
3. Créer `useTicketFormValidation()`
4. Simplifier composant principal

### Étape 4: Tests et validation
1. Tests unitaires pour hooks
2. Tests d'intégration pour composants
3. Vérification métriques

---

**Phase 8 - Plan créé. Prêt à démarrer.** ✅

