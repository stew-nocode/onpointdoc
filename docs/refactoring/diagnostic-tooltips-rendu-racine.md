# 🔍 Diagnostic : Tooltips Rendent Même Quand Fermés

## 📊 Problème Identifié

Les appels API continuent malgré l'optimisation. Les logs montrent toujours des appels à :
- `/api/users/{id}/stats?type=reporter`
- `/api/users/{id}/stats?type=assigned`
- `/api/tickets/{id}/stats`

## 🎯 Cause Racine

### Radix UI Tooltip Rend Toujours le Contenu

**Radix UI Tooltip peut rendre le `TooltipContent` même quand le tooltip est fermé** pour :
- Pré-calculer le positionnement
- Optimiser les animations
- Maintenir le DOM pour des performances

Cela signifie que :
1. Le composant `UserStatsTooltip` est **toujours monté** (même quand fermé)
2. Le `useEffect` se déclenche au montage
3. Même si `isOpen = false` par défaut, le composant est déjà monté

### Problème dans l'Implémentation Actuelle

Le `LazyTooltipWrapper` rend toujours le contenu :
```typescript
{React.cloneElement(content, { isOpen })}
```

Le `UserStatsTooltip` est donc toujours monté, et le `useEffect` peut se déclencher.

## 🔧 Solution : Rendu Conditionnel du Contenu

Ne rendre le contenu du tooltip **QUE quand il est ouvert**.

### Option 1 : Rendu Conditionnel dans LazyTooltipWrapper (Recommandé)

Rendre le contenu seulement si `isOpen = true` :

```typescript
export function LazyTooltipWrapper({ trigger, content }: LazyTooltipWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Tooltip open={isOpen} onOpenChange={setIsOpen}>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      {isOpen && React.cloneElement(content, { isOpen })}
    </Tooltip>
  );
}
```

### Option 2 : Désactiver le Rendu Initial dans les Tooltips

Modifier les tooltips pour ne rien rendre si `isOpen = false` :

```typescript
if (!isOpen && !hasLoadedRef.current) {
  return null; // Ne pas rendre du tout
}
```

## 📋 Fichiers à Modifier

1. `src/components/tickets/tooltips/lazy-tooltip-wrapper.tsx`
   - Ajouter un rendu conditionnel : `{isOpen && React.cloneElement(content, { isOpen })}`

2. `src/components/tickets/tooltips/user-stats-tooltip.tsx`
   - Retourner `null` si `!isOpen && !hasLoadedRef.current`

3. `src/components/tickets/tooltips/ticket-stats-tooltip.tsx`
   - Même modification

## 🎯 Bénéfices Attendus

- **0 rendu** si le tooltip est fermé
- **0 montage** du composant si le tooltip n'est jamais ouvert
- **0 appels API** si le tooltip n'est jamais ouvert
- Meilleure performance globale

---

**Statut** : 🔧 À CORRIGER
**Impact** : Élevé (50-75 appels API → 0)

