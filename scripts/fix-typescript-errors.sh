#!/bin/bash
# scripts/fix-typescript-errors.sh
# Correction automatique partielle des erreurs TypeScript

set -e

echo "🔧 Correction Automatique des Erreurs TypeScript"
echo "================================================"
echo ""

# Créer un backup
BACKUP_DIR=".backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📦 Backup créé dans: $BACKUP_DIR"
echo ""

# 1. Corriger revalidateTag
echo "1. Correction revalidateTag..."
FIXED_REVALIDATE=0
while IFS= read -r file; do
  if [ -f "$file" ]; then
    # Créer un backup
    cp "$file" "$BACKUP_DIR/$(basename $file).bak"
    
    # Remplacer revalidateTag('tag'); par revalidateTag('tag', 'max');
    sed -i.tmp "s/revalidateTag('\([^']*\)');/revalidateTag('\1', 'max');/g" "$file"
    rm -f "$file.tmp"
    
    FIXED_REVALIDATE=$((FIXED_REVALIDATE + 1))
  fi
done < <(grep -rl "revalidateTag(" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v ", '")

if [ "$FIXED_REVALIDATE" -gt 0 ]; then
  echo "   ✅ $FIXED_REVALIDATE fichier(s) corrigé(s)"
else
  echo "   ℹ️  Aucun fichier à corriger"
fi
echo ""

# 2. Corriger Zod errors
echo "2. Correction Zod 4..."
FIXED_ZOD=0
while IFS= read -r file; do
  if [ -f "$file" ]; then
    # Créer un backup si pas déjà fait
    if [ ! -f "$BACKUP_DIR/$(basename $file).bak" ]; then
      cp "$file" "$BACKUP_DIR/$(basename $file).bak"
    fi
    
    # Remplacer .error.errors par .error.issues
    sed -i.tmp "s/\.error\.errors/.error.issues/g" "$file"
    rm -f "$file.tmp"
    
    FIXED_ZOD=$((FIXED_ZOD + 1))
  fi
done < <(grep -rl "\.error\.errors" src/ --include="*.ts" --include="*.tsx" 2>/dev/null)

if [ "$FIXED_ZOD" -gt 0 ]; then
  echo "   ✅ $FIXED_ZOD fichier(s) corrigé(s)"
else
  echo "   ℹ️  Aucun fichier à corriger"
fi
echo ""

# 3. Résumé
echo "========================================"
echo "✅ Corrections automatiques terminées"
echo ""
echo "📊 Résumé:"
echo "   revalidateTag corrigés: $FIXED_REVALIDATE"
echo "   Zod errors corrigés: $FIXED_ZOD"
echo ""
echo "📦 Backup sauvegardé dans: $BACKUP_DIR"
echo ""
echo "⚠️  PROCHAINES ÉTAPES:"
echo "   1. Vérifier les changements: git diff"
echo "   2. Tester le build: npm run build"
echo "   3. Si tout est OK, supprimer le backup: rm -rf $BACKUP_DIR"
echo "   4. Si problème, restaurer: cp $BACKUP_DIR/*.bak <fichier_original>"
echo ""

