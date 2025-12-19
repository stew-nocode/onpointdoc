# Configuration MCP Next.js DevTools

## État actuel

✅ **Package installé** : `next-devtools-mcp@latest` installé globalement
✅ **Serveur Next.js** : En cours d'exécution sur le port 3000
✅ **Configuration MCP** : Présente dans `c:\Users\datko\.cursor\mcp.json`

## Étapes pour activer le MCP

### 1. Redémarrer Cursor complètement

Le MCP Next.js DevTools nécessite un redémarrage complet de Cursor pour se connecter :

1. Fermer complètement Cursor (toutes les fenêtres)
2. Attendre quelques secondes
3. Rouvrir Cursor
4. Le MCP devrait se connecter automatiquement

### 2. Vérifier la connexion

Une fois Cursor redémarré, le MCP Next.js DevTools devrait :
- Se connecter automatiquement au serveur Next.js sur `http://localhost:3000`
- Fournir des ressources pour inspecter l'application en temps réel
- Permettre l'utilisation des outils MCP pour déboguer

### 3. Utilisation du MCP

Une fois activé, vous pouvez utiliser le MCP pour :
- Vérifier les erreurs en temps réel dans l'application
- Inspecter les routes et la structure de l'application
- Consulter les logs du serveur de développement
- Analyser les performances et les problèmes

## Configuration actuelle

Le fichier `c:\Users\datko\.cursor\mcp.json` contient :

```json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    }
  }
}
```

## État actuel (après redémarrage)

✅ **Serveur Next.js** : En cours d'exécution sur le port 3000 (PID 12000)
✅ **Endpoint MCP** : Accessible à `http://localhost:3000/_next/mcp` (retourne 406, ce qui est normal)
✅ **Configuration MCP** : Présente dans `.mcp.json` à la racine du projet
✅ **Package installé** : `next-devtools-mcp@latest` installé globalement
✅ **MCP initialisé** : L'outil `init` a été appelé avec succès
⚠️ **Détection serveur** : Le MCP ne détecte pas encore le serveur automatiquement

## Dépannage

Si le MCP ne se connecte pas après le redémarrage :

1. **Vérifier que le serveur Next.js est en cours d'exécution** :
   ```bash
   netstat -ano | findstr :3000
   ```

2. **Vérifier que le package est installé** :
   ```bash
   npm list -g next-devtools-mcp
   ```

3. **Vérifier la configuration MCP** :
   - Le fichier `.mcp.json` doit être à la racine du projet
   - Le fichier `c:\Users\datko\.cursor\mcp.json` doit également contenir la configuration

4. **Réinitialiser le MCP** :
   ```bash
   npx next-devtools-mcp init
   ```

5. **Vérifier les logs Cursor** pour voir les erreurs de connexion MCP

## Note importante

Le MCP Next.js DevTools peut prendre quelques minutes pour se connecter automatiquement au serveur. Si après 5-10 minutes le serveur n'est toujours pas détecté, il peut y avoir un problème de configuration ou de version.

**Solution alternative** : Utiliser directement les outils MCP (`nextjs_index`, `nextjs_call`) même si le serveur n'est pas automatiquement détecté. Ces outils peuvent fonctionner en spécifiant manuellement le port.

## Ressources

- Documentation officielle : https://github.com/vercel/next-devtools-mcp
- Next.js DevTools : https://nextjs.org/docs/app/guides/upgrading/version-16


