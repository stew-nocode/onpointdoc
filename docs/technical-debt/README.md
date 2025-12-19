# Guide de Correction des Dettes Techniques

Ce dossier contient la documentation et les scripts pour auditer et corriger les dettes techniques TypeScript identifiées lors du déploiement Vercel.

## 📁 Fichiers

- **`AUDIT-ET-CORRECTION-DETTES-TECHNIQUES.md`** : Guide complet d'audit et de correction
- **`../scripts/audit-typescript.sh`** : Script d'audit automatique
- **`../scripts/fix-typescript-errors.sh`** : Script de correction automatique
- **`../scripts/validate-fixes.sh`** : Script de validation des corrections

## 🚀 Utilisation Rapide

### 1. Audit Initial

```bash
# Lancer l'audit complet
./scripts/audit-typescript.sh
```

Cet audit va :
- ✅ Vérifier l'état du TypeScript strict mode
- ✅ Compter les erreurs TypeScript
- ✅ Identifier les problèmes par catégorie
- ✅ Générer un rapport détaillé

### 2. Correction Automatique

```bash
# Corriger automatiquement les erreurs simples
./scripts/fix-typescript-errors.sh
```

Ce script corrige :
- ✅ `revalidateTag()` → `revalidateTag(..., 'max')`
- ✅ `.error.errors` → `.error.issues` (Zod 4)

**⚠️ Important** : Vérifiez les changements avec `git diff` avant de commiter !

### 3. Validation

```bash
# Valider que toutes les corrections sont correctes
./scripts/validate-fixes.sh
```

Ce script vérifie :
- ✅ Build TypeScript sans erreurs
- ✅ Tous les patterns corrigés
- ✅ TypeScript strict mode activé

## 📋 Processus Complet

### Étape 1 : Audit

```bash
./scripts/audit-typescript.sh > audit-report.txt
cat audit-report.txt
```

### Étape 2 : Correction Automatique

```bash
./scripts/fix-typescript-errors.sh
git diff  # Vérifier les changements
```

### Étape 3 : Corrections Manuelles

Consultez `AUDIT-ET-CORRECTION-DETTES-TECHNIQUES.md` pour les corrections manuelles nécessaires :
- Gestion des `searchParams` optionnels
- Correction des types `Period`
- Gestion des valeurs nullable

### Étape 4 : Validation

```bash
./scripts/validate-fixes.sh
```

Si toutes les validations passent, vous pouvez commiter et déployer !

## 🎯 Objectifs

- [ ] TypeScript strict mode réactivé
- [ ] 0 erreur TypeScript au build
- [ ] Tous les patterns Next.js 16 corrigés
- [ ] Tous les patterns Zod 4 corrigés
- [ ] Documentation des patterns à jour

## 📚 Documentation

Pour plus de détails, consultez :
- **Guide complet** : `AUDIT-ET-CORRECTION-DETTES-TECHNIQUES.md`
- **Next.js 16** : https://nextjs.org/docs/app/guides/upgrading/version-16
- **Zod 4** : https://zod.dev/CHANGELOG

## 🆘 Support

En cas de problème :
1. Vérifiez les logs : `npm run build 2>&1 | tee build-output.txt`
2. Consultez le guide : `AUDIT-ET-CORRECTION-DETTES-TECHNIQUES.md`
3. Analysez les erreurs : `grep "Type error" build-output.txt`

