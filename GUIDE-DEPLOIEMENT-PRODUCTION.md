# 🚀 Guide Simple : Déployer en Production

## 📍 Situation Actuelle

- **Branche actuelle :** `fix/planning-calendar-visibility`
- **Contenu :** Corrections TypeScript strict mode ✅
- **Build validé :** 0 erreurs TypeScript ✅
- **Objectif :** Déployer ces corrections en production

---

## 🎯 Étapes pour Déployer

### Option 1 : Via GitHub (Recommandé - Plus Simple) ⭐

#### Étape 1 : Vérifier que votre PR est prête
1. Allez sur : https://github.com/stew-nocode/onpointdoc/pulls
2. Vérifiez que votre PR `fix/planning-calendar-visibility` existe
3. Si elle n'existe pas, créez-la :
   - URL directe : https://github.com/stew-nocode/onpointdoc/compare/main...fix/planning-calendar-visibility

#### Étape 2 : Merger la PR dans main
1. Sur la page de votre PR, cliquez sur **"Merge pull request"**
2. Confirmez le merge
3. ✅ Votre code est maintenant dans `main`

#### Étape 3 : Vercel déploie automatiquement
- Si Vercel est connecté à votre repo GitHub, il va **automatiquement** déployer
- Vérifiez sur : https://vercel.com/dashboard

---

### Option 2 : Via la Ligne de Commande (Git)

Si vous préférez utiliser Git directement :

#### Étape 1 : Passer sur la branche main
```bash
git checkout main
```

#### Étape 2 : Récupérer les dernières modifications
```bash
git pull origin main
```

#### Étape 3 : Merger votre branche
```bash
git merge fix/planning-calendar-visibility
```

#### Étape 4 : Pousser sur GitHub
```bash
git push origin main
```

#### Étape 5 : Vercel déploie automatiquement
- Vercel détecte le push sur `main` et déploie automatiquement

---

## ✅ Vérifications Avant Déploiement

### 1. Build Local Réussi
```bash
npm run build
```
**Résultat attendu :** ✅ Compiled successfully, 0 erreurs TypeScript

### 2. Tests Locaux (si vous en avez)
```bash
npm run lint
npm run typecheck
```

### 3. Vérifier les Fichiers Modifiés
```bash
git status
```
Assurez-vous qu'il n'y a pas de fichiers sensibles (`.env.local`, tokens, etc.)

---

## 🔍 Après le Déploiement

### Vérifier le Déploiement Vercel

1. **Aller sur Vercel Dashboard**
   - https://vercel.com/dashboard
   - Trouvez votre projet `onpointdoc`

2. **Vérifier le Build**
   - Regardez la dernière "Deployment"
   - Statut doit être ✅ "Ready"

3. **Tester l'Application**
   - Cliquez sur le lien de déploiement
   - Testez que tout fonctionne

### Vérifier les Logs

Si quelque chose ne va pas :
1. Allez sur Vercel Dashboard
2. Cliquez sur la dernière deployment
3. Regardez les "Build Logs" pour voir les erreurs

---

## 🚨 En Cas de Problème

### Le Build Échoue sur Vercel

1. **Vérifier les logs Vercel**
   - Allez sur Vercel Dashboard → Votre projet → Build Logs

2. **Vérifier les Variables d'Environnement**
   - Vercel Dashboard → Settings → Environment Variables
   - Assurez-vous que toutes les variables nécessaires sont configurées

3. **Tester Localement**
   ```bash
   npm run build
   ```
   Si ça échoue localement, ça échouera sur Vercel

### Rollback (Retour en Arrière)

Si le déploiement cause des problèmes :

1. **Sur Vercel :**
   - Allez sur votre projet
   - Trouvez une ancienne deployment qui fonctionnait
   - Cliquez sur "..." → "Promote to Production"

2. **Sur GitHub :**
   - Revenir à un commit précédent si nécessaire

---

## 📝 Résumé des Commandes

```bash
# 1. Vérifier que tout est OK
npm run build

# 2. Passer sur main
git checkout main

# 3. Récupérer les dernières modifs
git pull origin main

# 4. Merger votre branche
git merge fix/planning-calendar-visibility

# 5. Pousser sur GitHub
git push origin main

# 6. Vercel déploie automatiquement ! 🎉
```

---

## 🎯 Recommandation

**Je recommande l'Option 1 (via GitHub PR)** car :
- ✅ Plus simple et visuel
- ✅ Permet de voir les changements avant de merger
- ✅ Historique clair dans GitHub
- ✅ Possibilité de review avant merge

---

## ❓ Questions Fréquentes

### Q: Dois-je créer une PR ou merger directement ?
**R:** Créez une PR, c'est plus sûr et permet de voir les changements.

### Q: Vercel va-t-il déployer automatiquement ?
**R:** Oui, si Vercel est connecté à votre repo GitHub et surveille la branche `main`.

### Q: Combien de temps prend le déploiement ?
**R:** Généralement 2-5 minutes pour un build Next.js.

### Q: Puis-je annuler un déploiement ?
**R:** Oui, via Vercel Dashboard → Promouvoir une ancienne version.

---

**Besoin d'aide ?** Dites-moi à quelle étape vous êtes bloqué ! 🚀

