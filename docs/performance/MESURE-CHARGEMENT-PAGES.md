# 📊 Mesure du chargement des pages en local

**Date**: 2025-01-16  
**Objectif**: Guide pour mesurer le temps de chargement des pages en développement local

---

## 🚀 Utilisation rapide

### 1. Démarrer l'application

```bash
npm run dev
```

### 2. Ouvrir le Performance Monitor

1. Naviguer vers `http://localhost:3000`
2. Cliquer sur le bouton **📊** en bas à droite de l'écran
3. Le monitor s'ouvre avec toutes les métriques

---

## 📈 Métriques disponibles

### Temps de chargement de la page

Le monitor affiche automatiquement :

- **Chargement total** : Temps total de chargement de la page (ms)
  - ✅ Vert : < 1000ms (excellent)
  - ⚠️ Jaune : 1000-2000ms (acceptable)
  - ❌ Rouge : > 2000ms (à optimiser)

- **DOMContentLoaded** : Temps jusqu'à ce que le DOM soit prêt (ms)

- **Load complet** : Temps jusqu'à ce que toutes les ressources soient chargées (ms)

- **Page** : URL de la page mesurée

### Core Web Vitals

- **LCP** (Largest Contentful Paint) : Temps de chargement du contenu principal
- **FID/INP** : Réactivité aux interactions
- **CLS** : Stabilité visuelle
- **FCP** : Temps jusqu'au premier rendu
- **TTFB** : Temps jusqu'à la première réponse serveur

---

## 🔍 Mesurer une page spécifique

### Méthode 1 : Via le Performance Monitor (automatique)

Le monitor mesure automatiquement chaque page lors de la navigation. Il suffit de :

1. Ouvrir le monitor
2. Naviguer vers la page à mesurer
3. Les métriques se mettent à jour automatiquement

### Méthode 2 : Via le hook `usePageLoadTime` (dans un composant)

```typescript
import { usePageLoadTime } from '@/hooks/performance';

function MyPage() {
  const { pageLoadTime, domContentLoaded, fullLoadTime, pagePath } = usePageLoadTime({
    logToConsole: true, // Affiche les métriques dans la console
  });

  return (
    <div>
      {pageLoadTime && (
        <p>Temps de chargement: {pageLoadTime.toFixed(0)}ms</p>
      )}
    </div>
  );
}
```

### Méthode 3 : Via la console du navigateur

Les métriques sont automatiquement loggées dans la console en développement :

```
📄 [Page Load] /dashboard
  ⏱️  Total: 1234.56ms
  ⏱️  DOMContentLoaded: 567.89ms
  ⏱️  Load Complete: 1234.56ms
```

---

## 📊 Interprétation des résultats

### Temps de chargement recommandés

| Type de page | Excellent | Acceptable | À optimiser |
|--------------|-----------|------------|-------------|
| **Page simple** | < 500ms | 500-1000ms | > 1000ms |
| **Page avec données** | < 1000ms | 1000-2000ms | > 2000ms |
| **Dashboard** | < 1500ms | 1500-3000ms | > 3000ms |

### Seuils Core Web Vitals

| Métrique | ✅ Good | ⚠️ Needs Improvement | ❌ Poor |
|----------|---------|----------------------|---------|
| **LCP** | ≤ 2.5s | 2.5s - 4.0s | > 4.0s |
| **FID** | ≤ 100ms | 100ms - 300ms | > 300ms |
| **INP** | ≤ 200ms | 200ms - 500ms | > 500ms |
| **CLS** | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |
| **FCP** | ≤ 1.8s | 1.8s - 3.0s | > 3.0s |
| **TTFB** | ≤ 800ms | 800ms - 1.8s | > 1.8s |

---

## 🛠️ Outils supplémentaires

### Chrome DevTools

Pour des mesures plus détaillées :

1. Ouvrir Chrome DevTools (F12)
2. Aller dans l'onglet **Performance**
3. Cliquer sur **Record** (⏺️)
4. Recharger la page
5. Arrêter l'enregistrement
6. Analyser le timeline

### Lighthouse

Pour un audit complet :

1. Ouvrir Chrome DevTools (F12)
2. Aller dans l'onglet **Lighthouse**
3. Sélectionner **Performance**
4. Cliquer sur **Generate report**
5. Analyser les recommandations

### Network Tab

Pour analyser les requêtes réseau :

1. Ouvrir Chrome DevTools (F12)
2. Aller dans l'onglet **Network**
3. Recharger la page
4. Voir le temps de chargement de chaque ressource

---

## 🎯 Bonnes pratiques

### 1. Mesurer plusieurs fois

Les temps peuvent varier. Mesurez 3-5 fois et prenez la moyenne.

### 2. Vider le cache

Pour des mesures réalistes, vider le cache du navigateur (Ctrl+Shift+Delete) ou utiliser le mode **Incognito**.

### 3. Simuler des conditions réseau

Dans Chrome DevTools → Network, sélectionner :
- **Slow 3G** : Pour simuler une connexion lente
- **Fast 3G** : Pour simuler une connexion moyenne
- **Offline** : Pour tester le mode hors ligne

### 4. Mesurer sur différentes pages

- Page d'accueil
- Page avec beaucoup de données
- Page avec formulaires
- Dashboard

---

## 🚨 Dépannage

### Le monitor ne s'affiche pas

**Vérifications** :
1. ✅ L'application est en mode développement (`npm run dev`)
2. ✅ Le bouton 📊 est visible en bas à droite
3. ✅ Vérifier la console pour d'éventuelles erreurs

### Les métriques ne se remplissent pas

**Causes possibles** :
1. ⚠️ La page vient de se charger (attendre quelques secondes)
2. ⚠️ Performance API non supportée (vérifier la version du navigateur)
3. ⚠️ La page est déjà chargée (recharger la page)

**Solution** : Recharger la page (F5) pour déclencher une nouvelle mesure.

### Temps de chargement anormalement élevés

**Causes possibles** :
1. ⚠️ Requêtes API lentes (vérifier les appels réseau)
2. ⚠️ Images non optimisées (utiliser Next.js Image)
3. ⚠️ Trop de composants qui se re-rendent (utiliser `useRenderCount`)
4. ⚠️ Bundle JavaScript trop volumineux (analyser avec `npm run build`)

**Solutions** :
- Utiliser `useRenderCount` pour identifier les re-renders excessifs
- Optimiser les images avec Next.js Image
- Lazy load des composants lourds
- Analyser le bundle avec `@next/bundle-analyzer`

---

## 📚 Ressources

- [Performance Monitoring - Documentation complète](./PERFORMANCE-MONITORING.md)
- [Web Vitals - Google](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

---

## ✅ Checklist de mesure

Avant de considérer une page comme optimisée :

- [ ] **Temps de chargement total** < 2000ms
- [ ] **DOMContentLoaded** < 1000ms
- [ ] **LCP** < 2.5s (✅ Good)
- [ ] **FID/INP** < 200ms (✅ Good)
- [ ] **CLS** < 0.1 (✅ Good)
- [ ] **FCP** < 1.8s (✅ Good)
- [ ] **TTFB** < 800ms (✅ Good)
- [ ] Pas de re-renders excessifs (vérifier avec `useRenderCount`)
- [ ] Images optimisées (Next.js Image)
- [ ] Bundle JavaScript optimisé

---

**Note** : Ce système de monitoring est **100% gratuit** et utilise uniquement les APIs natives du navigateur et de React. Il fonctionne uniquement en mode développement pour ne pas impacter les performances en production.

