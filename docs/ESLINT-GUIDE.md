# Guide ESLint - Bonnes Pratiques

Ce guide documente les règles ESLint du projet et comment éviter les erreurs courantes.

## 📋 Table des matières

1. [Configuration du projet](#configuration-du-projet)
2. [Erreurs courantes et solutions](#erreurs-courantes-et-solutions)
3. [Règles désactivées et pourquoi](#règles-désactivées-et-pourquoi)
4. [Bonnes pratiques React/Next.js](#bonnes-pratiques-reactnextjs)
5. [Workflow de développement](#workflow-de-développement)

---

## Configuration du projet

### Fichier de configuration

Le projet utilise `eslint.config.js` avec les règles suivantes :

```javascript
{
  rules: {
    'react-hooks/set-state-in-effect': 'off',      // Désactivée (trop stricte)
    'react-hooks/static-components': 'warn',       // Warning au lieu d'erreur
    'react-hooks/refs': 'warn',                    // Warning au lieu d'erreur
  }
}
```

### Vérification du lint

```bash
# Vérifier les erreurs
npm run lint

# Corriger automatiquement ce qui peut l'être
npm run lint -- --fix
```

---

## Erreurs courantes et solutions

### 1. ❌ `react/no-unescaped-entities` - Apostrophes non échappées

**Erreur :**
```tsx
<p>L'utilisateur n'a pas accès</p>
```

**✅ Solution :**
```tsx
<p>L&apos;utilisateur n&apos;a pas accès</p>
```

**Astuce :** Utilisez `&apos;` pour les apostrophes dans JSX.

---

### 2. ❌ `react-hooks/exhaustive-deps` - Dépendances manquantes

**Erreur :**
```tsx
useEffect(() => {
  fetchData(userId);
}, []); // ⚠️ userId est manquant
```

**✅ Solution A - Ajouter la dépendance :**
```tsx
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

**✅ Solution B - Utiliser useCallback pour stabiliser :**
```tsx
const fetchDataCallback = useCallback(() => {
  fetchData(userId);
}, [userId]);

useEffect(() => {
  fetchDataCallback();
}, [fetchDataCallback]);
```

**✅ Solution C - Si intentionnel, documenter :**
```tsx
useEffect(() => {
  // On veut exécuter une seule fois au montage, pas à chaque changement de userId
  // eslint-disable-next-line react-hooks/exhaustive-deps
  fetchData(userId);
}, []);
```

---

### 3. ⚠️ `react-hooks/refs` - Mise à jour de ref pendant le render

**Erreur :**
```tsx
function MyComponent() {
  const myRef = useRef();
  myRef.current = someValue; // ❌ Mise à jour pendant le render

  return <div />;
}
```

**✅ Solution - Utiliser useEffect :**
```tsx
function MyComponent() {
  const myRef = useRef();

  useEffect(() => {
    myRef.current = someValue; // ✅ Mise à jour dans un effet
  });

  return <div />;
}
```

---

### 4. ⚠️ `react-hooks/static-components` - Composants créés pendant le render

**Erreur :**
```tsx
function MyComponent() {
  const DynamicComponent = () => <div>Hello</div>; // ❌ Créé à chaque render
  return <DynamicComponent />;
}
```

**✅ Solution A - Déclarer hors du composant :**
```tsx
const DynamicComponent = () => <div>Hello</div>; // ✅ Créé une seule fois

function MyComponent() {
  return <DynamicComponent />;
}
```

**✅ Solution B - Utiliser useMemo pour les composants dynamiques :**
```tsx
function MyComponent({ iconName }) {
  const IconComponent = useMemo(() => {
    return getIconByName(iconName); // Référence stable
  }, [iconName]);

  return <IconComponent />;
}
```

---

### 5. 🚫 `react-hooks/set-state-in-effect` (Désactivée)

**Cette règle est désactivée** car elle génère trop de faux positifs.

**Pattern acceptable - Synchronisation d'état :**
```tsx
function MyComponent({ open }) {
  const [isOpen, setIsOpen] = useState(false);

  // ✅ OK : Synchroniser avec une prop
  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  return <Dialog open={isOpen} />;
}
```

**Pattern acceptable - Initialisation :**
```tsx
function MyComponent() {
  const [mounted, setMounted] = useState(false);

  // ✅ OK : Éviter les problèmes d'hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return <ClientOnlyComponent />;
}
```

**⚠️ À éviter - Boucle infinie :**
```tsx
useEffect(() => {
  setCount(count + 1); // ❌ Cause une boucle infinie
}, [count]);
```

---

### 6. 🖼️ `@next/next/no-img-element` - Optimisation des images

**Erreur :**
```tsx
<img src="/logo.png" alt="Logo" />
```

**✅ Solution - Utiliser next/image :**
```tsx
import Image from 'next/image';

<Image src="/logo.png" alt="Logo" width={200} height={50} />
```

**Exceptions acceptables :**
- Images externes non optimisables
- Images dynamiques en base64
- Prévisualisation temporaire

**Dans ces cas, documenter :**
```tsx
{/* Prévisualisation d'upload, next/image non applicable */}
{/* eslint-disable-next-line @next/next/no-img-element */}
<img src={previewUrl} alt="Preview" />
```

---

## Règles désactivées et pourquoi

### `react-hooks/set-state-in-effect: 'off'`

**Raison :** Cette règle est trop stricte et génère beaucoup de faux positifs.

**Cas légitimes où setState dans useEffect est nécessaire :**
1. Synchronisation avec des props externes
2. Initialisation après montage (hydration)
3. Réinitialisation basée sur des changements de filtres
4. Gestion d'animations et de transitions

**Vigilance requise :**
- Toujours avoir une condition de sortie
- Éviter les dépendances circulaires
- Utiliser des refs pour les valeurs précédentes si nécessaire

---

## Bonnes pratiques React/Next.js

### ✅ Gestion des états dérivés

**Préférer les valeurs calculées aux effets :**

```tsx
// ❌ Éviter
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// ✅ Préférer
const fullName = useMemo(() => {
  return `${firstName} ${lastName}`;
}, [firstName, lastName]);

// ✅ Encore mieux si pas coûteux
const fullName = `${firstName} ${lastName}`;
```

### ✅ Stabilisation des callbacks

**Utiliser useCallback pour les fonctions passées en props :**

```tsx
// ❌ Fonction recréée à chaque render
const handleClick = () => {
  doSomething(value);
};

// ✅ Fonction stable
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);
```

### ✅ Gestion des refs

**Pattern correct pour mettre à jour une ref :**

```tsx
function MyComponent() {
  const latestCallback = useRef(callback);

  // ✅ Mise à jour dans useEffect
  useEffect(() => {
    latestCallback.current = callback;
  });

  const handleEvent = useCallback(() => {
    latestCallback.current();
  }, []);

  return <button onClick={handleEvent}>Click</button>;
}
```

### ✅ Éviter l'hydration mismatch

**Pattern pour composants client-only :**

```tsx
'use client';

function ClientComponent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Retourner un placeholder identique côté serveur
    return <div className="h-10 w-32 bg-gray-200 animate-pulse" />;
  }

  // Rendu côté client uniquement
  return <div>{new Date().toLocaleString()}</div>;
}
```

### ✅ Optimisation des listes

**Toujours utiliser des clés stables :**

```tsx
// ❌ Éviter les index comme clés
items.map((item, index) => <Item key={index} {...item} />)

// ✅ Utiliser des IDs uniques
items.map(item => <Item key={item.id} {...item} />)
```

---

## Workflow de développement

### Avant de commit

```bash
# 1. Vérifier le lint
npm run lint

# 2. Corriger automatiquement
npm run lint -- --fix

# 3. Vérifier le build
npm run build
```

### Configuration IDE recommandée (VS Code)

**Extensions :**
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)

**Settings.json :**
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### Hooks Git (optionnel)

**Installer husky pour lint automatique :**

```bash
npm install --save-dev husky lint-staged
npx husky install
```

**.husky/pre-commit :**
```bash
#!/bin/sh
npm run lint
```

---

## Résumé des commandes

| Commande | Description |
|----------|-------------|
| `npm run lint` | Vérifier les erreurs ESLint |
| `npm run lint -- --fix` | Corriger automatiquement |
| `npm run build` | Vérifier que le projet compile |

---

## Contacts et support

En cas de doute sur une règle ESLint :
1. Consulter ce guide
2. Vérifier la documentation ESLint : https://eslint.org/docs/rules/
3. Vérifier les règles React : https://github.com/jsx-eslint/eslint-plugin-react
4. Demander en équipe avant de désactiver une règle

**Dernière mise à jour :** 2025-12-20

