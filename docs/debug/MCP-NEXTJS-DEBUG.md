# 🔍 Debug MCP Next.js

**Date**: 2025-01-16  
**Problème**: MCP Next.js non détecté malgré serveur en cours d'exécution  
**Statut**: 🔍 En cours de diagnostic

---

## 📊 État Actuel

### Serveur Next.js

- ✅ **Version** : Next.js 16.0.5 (MCP activé par défaut)
- ✅ **Port** : 3000 (PID 4456)
- ✅ **Serveur en cours d'exécution** : Oui
- ❌ **MCP détecté** : Non

### Configuration

- ✅ `next.config.mjs` : Configuration standard
- ✅ `package.json` : Next.js 16.0.5 installé
- ✅ Script dev : `next dev -H 127.0.0.1 -p 3000`

---

## 🔍 Diagnostic

### 1. Vérification de l'Endpoint MCP

L'endpoint `/_next/mcp` retourne :
- **Code HTTP** : 406 (Not Acceptable)
- **Signification** : Le serveur répond mais n'accepte pas la requête

**Causes possibles** :
1. Le serveur Next.js n'a pas été redémarré après l'installation
2. Le MCP nécessite une configuration spécifique
3. Le serveur écoute sur 127.0.0.1 au lieu de localhost

### 2. Problèmes Identifiés

#### Problème 1 : Adresse IP
Le serveur écoute sur `127.0.0.1` au lieu de `localhost`. Le MCP Next.js pourrait nécessiter `localhost`.

#### Problème 2 : Cache
Le cache Next.js a été nettoyé, mais le serveur n'a pas été redémarré avec les nouvelles configurations.

---

## ✅ Solutions à Tester

### Solution 1 : Redémarrer le Serveur

**Action** :
1. Arrêter le serveur actuel (Ctrl+C)
2. Supprimer le cache `.next` (déjà fait)
3. Redémarrer avec `npm run dev`

**Commande** :
```bash
npm run dev
```

### Solution 2 : Vérifier la Configuration MCP

Le MCP Next.js est activé par défaut dans Next.js 16+, mais vérifions si une configuration est nécessaire.

**Fichier à vérifier** : `next.config.mjs`

**Ajout possible** (si nécessaire) :
```javascript
experimental: {
  // MCP est activé par défaut dans Next.js 16+
}
```

### Solution 3 : Utiliser localhost au lieu de 127.0.0.1

**Modifier** `package.json` :
```json
"dev": "next dev -H localhost -p 3000"
```

**Ou** dans `next.config.mjs` :
```javascript
// Le serveur écoute déjà correctement
```

---

## 🔄 Actions Immédiates

### 1. Redémarrer le Serveur

**Commande** :
```bash
# Arrêter le serveur actuel (Ctrl+C)
# Puis redémarrer
npm run dev
```

### 2. Vérifier avec MCP

Après redémarrage, utiliser :
- `mcp_next-devtools_nextjs_index` : Pour découvrir les serveurs
- `mcp_next-devtools_nextjs_call` : Pour appeler les outils MCP

### 3. Vérifier les Erreurs

Utiliser `nextjs_call` pour obtenir les erreurs :
```javascript
// Une fois le serveur détecté
nextjs_call({
  port: "3000",
  toolName: "get_errors"
})
```

---

## 📋 Checklist de Diagnostic

- [ ] ✅ Serveur Next.js en cours d'exécution (PID 4456)
- [ ] ✅ Version Next.js 16.0.5 (MCP activé par défaut)
- [ ] ✅ Port 3000 utilisé
- [ ] ❌ MCP non détecté
- [ ] ⏳ Cache nettoyé (`.next` supprimé)
- [ ] ⏳ Serveur à redémarrer

---

## 🎯 Résultat Attendu

Après redémarrage du serveur :
- ✅ Le MCP Next.js devrait être détecté
- ✅ `nextjs_index` devrait retourner le serveur
- ✅ Les outils MCP devraient être disponibles

---

## 📚 Ressources

- [Next.js MCP Documentation](https://nextjs.org/docs)
- [MCP Next.js DevTools](./MCP-NEXTJS-SETUP.md)

---

**Note** : Le MCP Next.js est activé par défaut dans Next.js 16+. Le problème vient probablement du fait que le serveur n'a pas été redémarré après les modifications ou que le cache contient une ancienne version.

