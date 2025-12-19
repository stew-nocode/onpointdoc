#!/bin/bash
# scripts/validate-fixes.sh
# Validation des corrections TypeScript

set -e

echo "✅ Validation des Corrections"
echo "============================="
echo ""

VALIDATION_FAILED=0

# 1. Build TypeScript
echo "1. Compilation TypeScript..."
if npm run build 2>&1 | grep -q "Type error"; then
  echo "   ❌ Des erreurs TypeScript persistent"
  echo "   Premières erreurs:"
  npm run build 2>&1 | grep "Type error" | head -5 | sed 's/^/      /'
  VALIDATION_FAILED=1
else
  echo "   ✅ Aucune erreur TypeScript"
fi
echo ""

# 2. Vérifier revalidateTag
echo "2. Vérification revalidateTag..."
if grep -r "revalidateTag(" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -qv ", '"; then
  echo "   ❌ Des revalidateTag sans 2ème argument persistent"
  echo "   Fichiers concernés:"
  grep -r "revalidateTag(" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v ", '" | head -3 | sed 's/^/      /'
  VALIDATION_FAILED=1
else
  echo "   ✅ Tous les revalidateTag ont 2 arguments"
fi
echo ""

# 3. Vérifier Zod
echo "3. Vérification Zod 4..."
if grep -r "\.error\.errors" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -q .; then
  echo "   ❌ Des .errors persistent (devrait être .issues)"
  echo "   Fichiers concernés:"
  grep -r "\.error\.errors" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -3 | sed 's/^/      /'
  VALIDATION_FAILED=1
else
  echo "   ✅ Tous les Zod utilisent .issues"
fi
echo ""

# 4. Vérifier isApplicationError
echo "4. Vérification isApplicationError..."
if grep -r "createError\.isApplicationError" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -q .; then
  echo "   ❌ Des utilisations incorrectes persistent"
  echo "   Fichiers concernés:"
  grep -r "createError\.isApplicationError" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -3 | sed 's/^/      /'
  VALIDATION_FAILED=1
else
  echo "   ✅ Toutes les utilisations sont correctes"
fi
echo ""

# 5. Vérifier TypeScript strict mode
echo "5. Vérification TypeScript strict mode..."
if grep -q "ignoreBuildErrors: true" next.config.mjs 2>/dev/null || grep -q "ignoreBuildErrors: true" next.config.ts 2>/dev/null; then
  echo "   ⚠️  TypeScript strict mode toujours DÉSACTIVÉ"
  echo "   Action requise: Réactiver dans next.config.mjs"
  VALIDATION_FAILED=1
else
  echo "   ✅ TypeScript strict mode ACTIVÉ"
fi
echo ""

# Résumé
echo "============================="
if [ "$VALIDATION_FAILED" -eq 0 ]; then
  echo "✅ Toutes les validations passent !"
  echo ""
  echo "🎉 Prêt pour le commit et le déploiement !"
  exit 0
else
  echo "❌ Des validations ont échoué"
  echo ""
  echo "⚠️  Corrigez les problèmes ci-dessus avant de continuer"
  exit 1
fi

