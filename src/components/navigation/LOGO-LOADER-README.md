# LogoLoader - Animation de Chargement Style Brevo

## 🎨 Vue d'ensemble

Loader élégant avec animation du logo **ON.NEXT** inspiré de l'animation de chargement de Brevo.

### Caractéristiques

✅ **Animation fluide** - Logo qui pulse avec effet de glow
✅ **Gradient animé** - Dégradé de couleurs sur le texte (bleu → violet → rose)
✅ **Backdrop blur** - Effet premium avec flou d'arrière-plan
✅ **Points animés** - Indicateur de chargement avec bouncing dots
✅ **Barre de progression** - Animation va-et-vient indéterminée
✅ **Dark mode compatible** - S'adapte automatiquement au thème

---

## 🚀 Utilisation

### Import

```typescript
import { LogoLoader } from '@/components/navigation/logo-loader';
```

### Exemple basique

```tsx
<LogoLoader isLoading={isNavigating} />
```

### Avec texte personnalisé

```tsx
<LogoLoader
  isLoading={isLoading}
  loadingText="Chargement des données"
/>
```

### Sans les points animés

```tsx
<LogoLoader
  isLoading={isLoading}
  loadingText="Authentification"
  showDots={false}
/>
```

---

## 📐 Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isLoading` | `boolean` | **required** | Active/désactive le loader |
| `loadingText` | `string` | `"Chargement"` | Texte affiché sous le logo |
| `showDots` | `boolean` | `true` | Afficher les points animés |
| `className` | `string` | `undefined` | Classe CSS additionnelle |

---

## 🎭 Animations CSS

Toutes les animations sont définies dans `globals.css` :

### 1. **Logo Pulse** (`animate-logo-pulse`)
```css
/* Scale de 1 à 1.05 avec fade opacity */
animation: logo-pulse 2s infinite;
```

### 2. **Logo Glow** (`animate-logo-glow`)
```css
/* Cercle de glow pulsant derrière le logo */
animation: logo-glow 3s infinite;
```

### 3. **Loading Bar** (`animate-loading-bar`)
```css
/* Barre qui va de gauche à droite en continu */
animation: loading-bar 2s infinite;
```

### 4. **Gradient X** (`animate-gradient-x`)
```css
/* Gradient horizontal animé pour "ON" */
animation: gradient-x 3s infinite;
```

### 5. **Gradient X Reverse** (`animate-gradient-x-reverse`)
```css
/* Gradient horizontal inverse pour "NEXT" */
animation: gradient-x-reverse 3s infinite;
```

### 6. **Pulse Slow** (`animate-pulse-slow`)
```css
/* Pulse lent pour le point séparateur */
animation: pulse-slow 2s infinite;
```

---

## 🎨 Personnalisation

### Modifier les couleurs du gradient

Dans [logo-loader.tsx:156-172](logo-loader.tsx#L156-L172) :

```typescript
// Changer le gradient de ON
<span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
  ON
</span>

// Changer le gradient de NEXT (inversé)
<span className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600">
  NEXT
</span>
```

**Exemples de palettes alternatives** :

```typescript
// Palette verte/bleue
from-emerald-600 via-teal-600 to-cyan-600

// Palette orange/rouge
from-orange-600 via-red-600 to-pink-600

// Palette violet/rose
from-purple-600 via-fuchsia-600 to-pink-600
```

### Modifier la vitesse des animations

Dans `globals.css` :

```css
/* Plus rapide (1s au lieu de 2s) */
.animate-logo-pulse {
  animation: logo-pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Plus lent (4s au lieu de 2s) */
.animate-loading-bar {
  animation: loading-bar 4s ease-in-out infinite;
}
```

### Modifier la taille du logo

Dans [logo-loader.tsx:156](logo-loader.tsx#L156) :

```typescript
// Plus grand
<span className="text-6xl font-bold">ON.NEXT</span>

// Plus petit
<span className="text-4xl font-bold">ON.NEXT</span>
```

---

## 🔧 Intégration

### Dans PageTransition

Le loader remplace automatiquement l'ancienne barre de progression :

```typescript
// src/components/navigation/page-transition.tsx
export function PageTransition() {
  const { isNavigating } = useNavigation();
  return <LogoLoader isLoading={isNavigating} />;
}
```

### Dans AppShell (authentification)

```typescript
// src/components/layout/app-shell.tsx
if (isLoading) {
  return <LogoLoader isLoading={true} loadingText="Authentification" />;
}
```

### Dans une page spécifique

```typescript
export default function MyPage() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {isLoading && <LogoLoader isLoading={isLoading} />}
      {/* Contenu de la page */}
    </>
  );
}
```

---

## ⚡ Performance

### Optimisations appliquées

✅ **Animations CSS pures** - Pas de JavaScript pendant l'animation
✅ **GPU acceleration** - Utilise `transform` au lieu de `left/right`
✅ **RequestAnimationFrame** - Pour la gestion du mounting/unmounting
✅ **Lazy mounting** - Le composant se monte/démonte proprement
✅ **Transition fade** - 300ms pour l'entrée/sortie

### Impact bundle

- **Taille du composant** : ~3KB (minifié)
- **Animations CSS** : ~2KB (gzippé)
- **Total** : ~5KB

---

## 🎯 Comparaison : Avant vs Après

### Avant (barre de progression)

❌ Animation simple et générique
❌ Pas de branding
❌ Durée longue (1200ms)
❌ Barre + overlay = 2 animations

### Après (LogoLoader)

✅ Animation élégante et professionnelle
✅ Branding ON.NEXT visible
✅ Durée optimisée (600ms perçue)
✅ Animation unifiée

---

## 🐛 Troubleshooting

### Le loader ne s'affiche pas

Vérifiez que `isLoading` est bien `true` :

```typescript
console.log('isLoading:', isLoading);
```

### Les animations ne fonctionnent pas

Vérifiez que `globals.css` est importé dans [app/layout.tsx:11](../../app/layout.tsx#L11) :

```typescript
import './globals.css';
```

### Le texte n'a pas de gradient

Vérifiez que Tailwind compile les classes :

```bash
npm run dev
```

### Le dark mode ne fonctionne pas

Vérifiez que `ThemeProvider` enveloppe l'application.

---

## 📝 License

Fait avec ❤️ pour **OnpointDoc**

Inspiré par l'animation de chargement de **Brevo**
