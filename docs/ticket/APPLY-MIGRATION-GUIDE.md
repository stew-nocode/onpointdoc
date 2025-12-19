# Guide : Appliquer la migration SQL volumineuse

## Option 1 : Via Supabase CLI (Recommandé)

### Installation de Supabase CLI

**Sur Windows (PowerShell) :**
```powershell
# Installer via Scoop (si vous avez Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# OU via npm (si vous avez Node.js)
npm install -g supabase
```

**Sur macOS/Linux :**
```bash
# Via Homebrew (macOS)
brew install supabase/tap/supabase

# OU via npm
npm install -g supabase
```

### Utilisation

1. **Se connecter à Supabase :**
```bash
supabase login
```

2. **Lier le projet :**
```bash
supabase link --project-ref xjcttqaiplnoalolebls
```

3. **Appliquer la migration :**
```bash
# Depuis le répertoire du projet
cd C:\Projects\OnpointDoc
supabase db push --file supabase/migrations/2025-12-08-sync-tickets-from-sheet-1765293279327.sql
```

---

## Option 2 : Via l'interface web Supabase

1. Aller sur https://supabase.com/dashboard
2. Sélectionner le projet "ONPOINT CENTRAL"
3. Aller dans **SQL Editor**
4. Ouvrir le fichier `supabase/migrations/2025-12-08-sync-tickets-from-sheet-1765293279327.sql`
5. Copier tout le contenu
6. Coller dans l'éditeur SQL
7. Cliquer sur **Run**

---

## Option 3 : Script automatique (via API MCP)

Un script peut être créé pour exécuter automatiquement toutes les parties séquentiellement. Cette option prendra plus de temps mais ne nécessite pas d'installation.












