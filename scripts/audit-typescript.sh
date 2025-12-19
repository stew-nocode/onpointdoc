#!/bin/bash
# scripts/audit-typescript.sh
# Audit complet des dettes techniques TypeScript

set -e

echo "🔍 Audit TypeScript - Dettes Techniques"
echo "========================================"
echo ""

# 1. Vérifier TypeScript strict
echo "1. Vérification TypeScript strict mode..."
if grep -q "ignoreBuildErrors: true" next.config.mjs 2>/dev/null || grep -q "ignoreBuildErrors: true" next.config.ts 2>/dev/null; then
  echo "   ❌ TypeScript strict mode DÉSACTIVÉ"
  STRICT_DISABLED=true
else
  echo "   ✅ TypeScript strict mode ACTIVÉ"
  STRICT_DISABLED=false
fi
echo ""

# 2. Compter les erreurs de build
echo "2. Compilation TypeScript..."
BUILD_OUTPUT=$(npm run build 2>&1 | tee build-output.txt)
ERROR_COUNT=$(grep -c "Type error" build-output.txt 2>/dev/null || echo "0")
if [ "$ERROR_COUNT" -gt 0 ]; then
  echo "   ❌ Erreurs trouvées: $ERROR_COUNT"
  echo "   Premières erreurs:"
  grep "Type error" build-output.txt | head -3 | sed 's/^/      /'
else
  echo "   ✅ Aucune erreur TypeScript"
fi
echo ""

# 3. Vérifier revalidateTag
echo "3. Vérification revalidateTag..."
REVALIDATE_COUNT=$(grep -r "revalidateTag(" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v ", '" | wc -l | tr -d ' ')
if [ "$REVALIDATE_COUNT" -gt 0 ]; then
  echo "   ❌ revalidateTag sans 2ème argument: $REVALIDATE_COUNT"
  echo "   Fichiers concernés:"
  grep -r "revalidateTag(" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v ", '" | head -3 | sed 's/^/      /'
else
  echo "   ✅ Tous les revalidateTag ont 2 arguments"
fi
echo ""

# 4. Vérifier Zod errors
echo "4. Vérification Zod 4..."
ZOD_ERRORS=$(grep -r "\.error\.errors" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
if [ "$ZOD_ERRORS" -gt 0 ]; then
  echo "   ❌ Utilisations de .errors au lieu de .issues: $ZOD_ERRORS"
  echo "   Fichiers concernés:"
  grep -r "\.error\.errors" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -3 | sed 's/^/      /'
else
  echo "   ✅ Tous les Zod utilisent .issues"
fi
echo ""

# 5. Vérifier searchParams
echo "5. Vérification searchParams optionnels..."
SEARCHPARAMS_COUNT=$(grep -r "getCachedSearchParams(searchParams)" src/ --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
if [ "$SEARCHPARAMS_COUNT" -gt 0 ]; then
  echo "   ⚠️  Utilisations de searchParams à vérifier: $SEARCHPARAMS_COUNT"
  echo "   (Vérification manuelle requise)"
else
  echo "   ✅ Aucun searchParams non géré trouvé"
fi
echo ""

# 6. Vérifier isApplicationError
echo "6. Vérification isApplicationError..."
ISAPP_COUNT=$(grep -r "createError\.isApplicationError" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
if [ "$ISAPP_COUNT" -gt 0 ]; then
  echo "   ❌ Utilisations incorrectes: $ISAPP_COUNT"
  echo "   Fichiers concernés:"
  grep -r "createError\.isApplicationError" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -3 | sed 's/^/      /'
else
  echo "   ✅ Toutes les utilisations sont correctes"
fi
echo ""

# 7. Vérifier les casts 'as' suspects
echo "7. Vérification des casts 'as' (code smell)..."
AS_COUNT=$(grep -r " as " src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "//" | grep -v "as const" | wc -l | tr -d ' ')
if [ "$AS_COUNT" -gt 0 ]; then
  echo "   ⚠️  Nombre de casts 'as' trouvés: $AS_COUNT"
  echo "   (Vérification manuelle recommandée pour les casts suspects)"
else
  echo "   ✅ Aucun cast 'as' trouvé"
fi
echo ""

# 8. Résumé
echo "========================================"
echo "📊 RÉSUMÉ"
echo "   TypeScript strict: $([ "$STRICT_DISABLED" = true ] && echo "❌ DÉSACTIVÉ" || echo "✅ ACTIVÉ")"
echo "   Erreurs TypeScript: $ERROR_COUNT"
echo "   revalidateTag à corriger: $REVALIDATE_COUNT"
echo "   Zod errors à corriger: $ZOD_ERRORS"
echo "   searchParams à vérifier: $SEARCHPARAMS_COUNT"
echo "   isApplicationError à corriger: $ISAPP_COUNT"
echo "   Casts 'as' suspects: $AS_COUNT"
echo ""

# 9. Score de dette technique
TOTAL_ISSUES=$((ERROR_COUNT + REVALIDATE_COUNT + ZOD_ERRORS + ISAPP_COUNT))
if [ "$TOTAL_ISSUES" -eq 0 ]; then
  echo "✅ Aucune dette technique détectée !"
  exit 0
elif [ "$TOTAL_ISSUES" -lt 5 ]; then
  echo "🟡 Dette technique faible: $TOTAL_ISSUES problème(s)"
  exit 0
elif [ "$TOTAL_ISSUES" -lt 10 ]; then
  echo "🟠 Dette technique modérée: $TOTAL_ISSUES problème(s)"
  exit 1
else
  echo "🔴 Dette technique élevée: $TOTAL_ISSUES problème(s)"
  exit 1
fi

