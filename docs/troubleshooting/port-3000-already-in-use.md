# 🔧 Résolution : Port 3000 Déjà Utilisé (EADDRINUSE)

## 📊 Problème

Erreur lors du démarrage de Next.js :
```
Error: listen EADDRINUSE: address already in use 127.0.0.1:3000
```

## 🎯 Cause

Un autre processus Node.js/Next.js utilise déjà le port 3000. Cela peut arriver si :
- Un serveur de développement précédent n'a pas été correctement arrêté
- Un autre processus utilise le port 3000

## ✅ Solution

### Option 1 : Arrêter le Processus (Recommandé)

**Windows PowerShell** :
```powershell
# 1. Trouver le processus utilisant le port 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess

# 2. Arrêter le processus (remplacer PID par l'ID trouvé)
Stop-Process -Id <PID> -Force

# 3. Vérifier que le port est libre
Get-NetTCPConnection -LocalPort 3000
```

### Option 2 : Utiliser un Autre Port

Modifier le script dans `package.json` :
```json
{
  "scripts": {
    "dev": "next dev -H 127.0.0.1 -p 3001"
  }
}
```

### Option 3 : Tuer Tous les Processus Node (Extrême)

```powershell
# Arrêter tous les processus Node.js
Get-Process node | Stop-Process -Force
```

**⚠️ Attention** : Cela arrêtera TOUS les processus Node.js en cours, pas seulement Next.js.

## 🔄 Procédure Recommandée

1. ✅ Vérifier quel processus utilise le port
2. ✅ Arrêter ce processus proprement
3. ✅ Redémarrer le serveur Next.js

---

**Statut** : ✅ RÉSOLU - Port libéré, prêt pour redémarrage

