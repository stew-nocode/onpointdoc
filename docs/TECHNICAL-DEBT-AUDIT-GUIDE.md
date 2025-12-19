# 🔍 Guide d'Audit et Correction des Dettes Techniques

> **Date de création** : 2025-12-19
> **Contexte** : Déploiement Vercel - Corrections Next.js 16 & Zod 4
> **Priorité** : HAUTE - À traiter avant la prochaine release

---

## 📋 Table des Matières

1. [État Actuel](#état-actuel)
2. [Dettes Techniques Critiques](#dettes-techniques-critiques)
3. [Plan d'Action](#plan-daction)
4. [Scripts d'Audit Automatisés](#scripts-daudit-automatisés)
5. [Checklist de Validation](#checklist-de-validation)

---

## 🎯 État Actuel

### Configuration Temporaire (À CORRIGER)

```javascript
// next.config.mjs - LINES 26-31
// ❌ DETTE TECHNIQUE : TypeScript strict désactivé
typescript: {
  ignoreBuildErrors: true  // ⚠️ À RETIRER
},
eslint: {
  ignoreDuringBuilds: true  // ⚠️ À RETIRER
}
```

**Impact** :
- ❌ Les erreurs TypeScript ne sont plus détectées au build
- ❌ Accumulation de dette technique invisible
- ❌ Risque de bugs en production

---

## 🔴 Dettes Techniques Critiques

### 1. QuickFilter Type Compatibility

**Fichier** : `src/app/actions/tickets/utils.ts:49-50`

```typescript
// ❌ COMMENTÉ - À CORRIGER
// TODO: Fix type compatibility between QuickFilter and ListTicketsActionInput['quick']
// if (quickFilter && quickFilter !== 'all') input.quick = quickFilter as Exclude<QuickFilter, 'all'>;
```

**Solution** :

```typescript
// ✅ Option 1 : Ajuster le type ListTicketsActionInput
export type ListTicketsActionInput = {
  quick?: QuickFilter; // Au lieu de exclure 'all'
  // ...
};

// ✅ Option 2 : Créer un type mapping
type QuickFilterMapping = {
  'all': undefined;
  'mine': 'mine';
  'week': 'week';
  // ... autres mappings
};

function mapQuickFilter(filter: QuickFilter): QuickFilterMapping[typeof filter] {
  if (filter === 'all') return undefined;
  return filter;
}

// Usage
const mappedFilter = mapQuickFilter(quickFilter);
if (mappedFilter) input.quick = mappedFilter;
```

---

### 2. Table Supabase Manquante

**Fichier** : `src/app/api/webhooks/brevo/route.ts:99-114`

```typescript
// ❌ COMMENTÉ - TABLE MANQUANTE
// TODO: Créer la table brevo_email_events dans Supabase
```

**Solution** :

#### Étape 1 : Créer la migration SQL

```bash
# Créer la migration
supabase migration new create_brevo_email_events_table
```

#### Étape 2 : Ajouter le SQL

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_brevo_email_events_table.sql

CREATE TABLE IF NOT EXISTS brevo_email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  email text NOT NULL,
  message_id text,
  date timestamptz,
  ts bigint,
  ts_event bigint,
  subject text,
  tag text,
  sending_ip text,
  template_id integer,
  reason text,
  created_at timestamptz DEFAULT now(),

  -- Index pour performances
  CONSTRAINT brevo_email_events_event_type_check
    CHECK (event_type IN ('delivered', 'hard_bounce', 'soft_bounce', 'request', 'opened', 'click', 'unique_opened', 'unsubscribe', 'blocked', 'error'))
);

-- Indexes
CREATE INDEX idx_brevo_email_events_email ON brevo_email_events(email);
CREATE INDEX idx_brevo_email_events_event_type ON brevo_email_events(event_type);
CREATE INDEX idx_brevo_email_events_created_at ON brevo_email_events(created_at DESC);

-- RLS Policy
ALTER TABLE brevo_email_events ENABLE ROW LEVEL SECURITY;

-- Policy : Lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Allow authenticated read access" ON brevo_email_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy : Insertion via service role uniquement (webhooks)
CREATE POLICY "Allow service role insert" ON brevo_email_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);
```

#### Étape 3 : Appliquer la migration

```bash
# En local
supabase db push

# Ou via la console Supabase en production
# Copier-coller le SQL ci-dessus
```

#### Étape 4 : Régénérer les types TypeScript

```bash
# Locale
supabase gen types typescript --local > src/types/database.types.ts

# Production
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
```

#### Étape 5 : Décommenter le code

```typescript
// src/app/api/webhooks/brevo/route.ts:99-114
// ✅ DÉCOMMENTER après avoir créé la table
const supabase = createSupabaseServiceClient();

const { error: insertError } = await supabase
  .from('brevo_email_events')
  .insert(dbEvent);

if (insertError) {
  console.error('[WEBHOOK BREVO] Erreur insertion:', insertError.message);
  return NextResponse.json(
    { success: false, error: insertError.message },
    { status: 200 }
  );
}
```

---

### 3. Badge Variant Type Error

**Localisation** : Erreur détectée lors du build (non commitée)

```typescript
// Quelque part dans le code
<Badge variant="secondary" /> // ❌ 'secondary' n'existe pas
```

**Solution** :

```typescript
// ✅ Utiliser les variants disponibles
type BadgeVariant = 'info' | 'warning' | 'success' | 'danger' | 'default' | 'outline';

<Badge variant="default" />   // Pour remplacer 'secondary'
<Badge variant="outline" />   // Ou outline pour un style alternatif
```

**Fichiers à vérifier** :

```bash
# Chercher tous les usages de Badge variant
grep -r "variant=\"secondary\"" src/
grep -r "variant=.*secondary" src/
```

---

## 📝 Plan d'Action

### Phase 1 : Audit Complet (1-2h)

```bash
# 1. Réactiver TypeScript strict
# Éditer next.config.mjs et retirer :
# - typescript.ignoreBuildErrors
# - eslint.ignoreDuringBuilds

# 2. Lancer le build et noter TOUTES les erreurs
npm run build 2>&1 | tee build-errors.log

# 3. Catégoriser les erreurs
grep "Type error:" build-errors.log > type-errors.txt
grep "ESLint:" build-errors.log > eslint-errors.txt
```

### Phase 2 : Corrections Critiques (2-3h)

#### 2.1 Table Brevo (30 min)
- [ ] Créer la migration SQL
- [ ] Appliquer en local et production
- [ ] Régénérer les types
- [ ] Décommenter le code
- [ ] Tester le webhook

#### 2.2 QuickFilter Type (1h)
- [ ] Analyser le type `ListTicketsActionInput`
- [ ] Analyser le type `QuickFilter`
- [ ] Choisir entre Option 1 ou 2 (voir plus haut)
- [ ] Implémenter la solution
- [ ] Décommenter la ligne 50
- [ ] Tester les filtres rapides

#### 2.3 Badge Variants (30 min)
- [ ] Chercher tous les usages de `variant="secondary"`
- [ ] Remplacer par `variant="default"` ou `variant="outline"`
- [ ] Vérifier visuellement le rendu

### Phase 3 : Réactivation TypeScript Strict (30 min)

```javascript
// next.config.mjs
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  productionBrowserSourceMaps: false,
  // ✅ RÉACTIVÉ - TypeScript strict
  // typescript: {
  //   ignoreBuildErrors: true  // ❌ RETIRÉ
  // },
  // eslint: {
  //   ignoreDuringBuilds: true  // ❌ RETIRÉ
  // },
  experimental: {
    // ...
  }
};
```

### Phase 4 : Validation Finale (30 min)

```bash
# 1. Build local sans erreurs
npm run build

# 2. Type check manuel
npm run typecheck

# 3. Lint
npm run lint

# 4. Tests (si disponibles)
npm test

# 5. Déploiement de test
vercel
```

---

## 🤖 Scripts d'Audit Automatisés

### Script 1 : Détection des TODOs techniques

```bash
#!/bin/bash
# scripts/audit-technical-debt.sh

echo "🔍 Audit des dettes techniques..."
echo ""

echo "📌 TODOs liés au déploiement Vercel:"
grep -rn "TODO.*Fix.*type" src/ --include="*.ts" --include="*.tsx"
echo ""

echo "📌 Code commenté pour build:"
grep -rn "TODO.*Créer.*table" src/ --include="*.ts" --include="*.tsx"
echo ""

echo "📌 Type assertions (as) potentiellement dangereux:"
grep -rn " as .*;" src/ --include="*.ts" --include="*.tsx" | wc -l
echo " assertions trouvées"
echo ""

echo "📌 Ignore d'erreurs TypeScript:"
grep -rn "@ts-ignore\|@ts-expect-error" src/ --include="*.ts" --include="*.tsx"
echo ""

echo "✅ Audit terminé"
```

### Script 2 : Vérification des types Supabase

```bash
#!/bin/bash
# scripts/check-supabase-types.sh

echo "🔍 Vérification des types Supabase..."

# Vérifier si les types sont à jour
if [ -f "src/types/database.types.ts" ]; then
  echo "✅ Fichier de types trouvé"

  # Vérifier la date de dernière modification
  TYPES_DATE=$(stat -c %Y src/types/database.types.ts 2>/dev/null || stat -f %m src/types/database.types.ts)
  MIGRATION_DATE=$(find supabase/migrations -type f -name "*.sql" -exec stat -c %Y {} \; 2>/dev/null | sort -n | tail -1)

  if [ "$TYPES_DATE" -lt "$MIGRATION_DATE" ]; then
    echo "⚠️  Les types Supabase sont OBSOLÈTES"
    echo "👉 Exécuter: supabase gen types typescript --local > src/types/database.types.ts"
  else
    echo "✅ Types Supabase à jour"
  fi
else
  echo "❌ Fichier de types manquant!"
  echo "👉 Exécuter: supabase gen types typescript --local > src/types/database.types.ts"
fi
```

### Script 3 : Build avec rapport détaillé

```bash
#!/bin/bash
# scripts/build-with-report.sh

echo "🏗️  Build avec rapport détaillé..."

# Créer le dossier de rapports
mkdir -p reports

# Build et capturer les erreurs
npm run build 2>&1 | tee reports/build-$(date +%Y%m%d-%H%M%S).log

# Parser les erreurs
echo ""
echo "📊 Résumé des erreurs:"
grep -c "Type error:" reports/build-*.log | tail -1 | awk '{print $NF " erreurs TypeScript"}'
grep -c "ESLint:" reports/build-*.log | tail -1 | awk '{print $NF " erreurs ESLint"}'

# Afficher les fichiers les plus problématiques
echo ""
echo "📁 Fichiers avec le plus d'erreurs:"
grep "Type error:" reports/build-*.log | tail -1 | awk '{print $1}' | sort | uniq -c | sort -rn | head -5
```

---

## ✅ Checklist de Validation

### Avant de Commencer
- [ ] Créer une branche dédiée : `git checkout -b fix/typescript-strict-mode`
- [ ] Sauvegarder l'état actuel : `git add -A && git commit -m "WIP: avant corrections TypeScript"`

### Audit
- [ ] Exécuter `scripts/audit-technical-debt.sh`
- [ ] Exécuter `scripts/check-supabase-types.sh`
- [ ] Noter tous les TODOs dans un fichier `TODO-LIST.md`

### Corrections
- [ ] Créer la table `brevo_email_events`
- [ ] Régénérer les types Supabase
- [ ] Fixer le type `QuickFilter`
- [ ] Corriger tous les `Badge variant="secondary"`
- [ ] Retirer tous les `as` casts dangereux
- [ ] Gérer tous les cas `null`/`undefined`

### Réactivation TypeScript Strict
- [ ] Retirer `typescript.ignoreBuildErrors` de `next.config.mjs`
- [ ] Retirer `eslint.ignoreDuringBuilds` de `next.config.mjs`
- [ ] `npm run build` → 0 erreurs
- [ ] `npm run typecheck` → 0 erreurs
- [ ] `npm run lint` → 0 erreurs

### Tests
- [ ] Tester toutes les pages modifiées
- [ ] Tester les filtres rapides (tickets)
- [ ] Tester le webhook Brevo
- [ ] Tester les badges

### Déploiement
- [ ] Build local réussi
- [ ] Commit : `git commit -m "fix: correction complète des dettes techniques TypeScript"`
- [ ] Push : `git push origin fix/typescript-strict-mode`
- [ ] Déploiement preview : `vercel`
- [ ] Vérification preview
- [ ] Merge dans main
- [ ] Déploiement production : `vercel --prod`

---

## 📚 Ressources

### Documentation
- [Next.js 16 Migration Guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Zod 4 Changelog](https://zod.dev/CHANGELOG)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [Supabase Type Generation](https://supabase.com/docs/guides/api/generating-types)

### Outils
- [TypeScript Error Translator](https://ts-error-translator.vercel.app/)
- [Zod Playground](https://zod.dev/playground)

---

## 🎯 Objectif Final

```bash
# ✅ Build sans erreurs
npm run build
# → ✓ Compiled successfully

# ✅ TypeCheck sans erreurs
npm run typecheck
# → Found 0 errors

# ✅ Lint sans erreurs
npm run lint
# → ✓ No ESLint warnings or errors

# ✅ Configuration propre
# next.config.mjs sans ignoreBuildErrors
```

---

**Temps estimé total** : 4-6 heures
**Priorité** : HAUTE
**À faire avant** : Prochaine release en production
