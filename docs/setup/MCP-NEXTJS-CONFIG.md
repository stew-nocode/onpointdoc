# Configuration MCP Next.js DevTools

## Installation

Le fichier de configuration MCP a été créé à la racine du projet : `.mcp.json`

## Configuration

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

## Utilisation

1. **Démarrer le serveur de développement Next.js** :
   ```bash
   npm run dev
   ```

2. Le serveur MCP sera automatiquement disponible pour les agents de codage compatibles MCP (comme Cursor).

## Prérequis

- Next.js 16 ou version ultérieure ✅ (actuellement Next.js 16.0.5)
- Serveur de développement en cours d'exécution

## Documentation

Pour plus d'informations, consultez la [documentation officielle Next.js MCP](https://nextjs.org/docs/app/guides/mcp).

