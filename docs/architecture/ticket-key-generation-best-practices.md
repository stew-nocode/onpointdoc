# Best Practices : Génération des Clés de Tickets OBS-xxx

## 🎯 Contexte

Avec la nouvelle architecture, les tickets **ASSISTANCE** ne sont plus synchronisés avec JIRA. Il est donc nécessaire de générer localement dans Supabase les clés de tickets au format **OBS-xxx** (ou **OBCS-xxx**).

## ✅ Solution Recommandée : PostgreSQL Sequence + Trigger

### Avantages

1. **Atomicité** : Garantit l'unicité des clés même en cas de création concurrente
2. **Performance** : Génération au niveau base de données (pas de round-trip application)
3. **Fiabilité** : Pas de risques de collisions ou de race conditions
4. **Simplicité** : Pas besoin de gérer la logique dans l'application
5. **Maintenance** : Facile à réinitialiser ou ajuster si nécessaire

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Application crée ticket ASSISTANCE                         │
│  INSERT INTO tickets (ticket_type='ASSISTANCE', ...)        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  TRIGGER BEFORE INSERT                                      │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 1. Vérifie si ticket_type = 'ASSISTANCE'              │ │
│  │ 2. Appelle fonction generate_ticket_key()             │ │
│  │ 3. Insère la clé dans internal_ticket_key            │ │
│  └───────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Fonction generate_ticket_key()                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 1. Utilise SEQUENCE obs_ticket_sequence               │ │
│  │ 2. Formate: 'OBS-' || nextval('obs_ticket_sequence') │ │
│  │ 3. Retourne la clé formatée                           │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Implémentation

### Étape 1 : Ajouter la colonne `internal_ticket_key`

```sql
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS internal_ticket_key TEXT UNIQUE;

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_tickets_internal_key 
ON tickets(internal_ticket_key);
```

### Étape 2 : Créer la séquence

```sql
-- Créer la séquence (démarre à 1)
CREATE SEQUENCE IF NOT EXISTS obs_ticket_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Optionnel: Si vous voulez démarrer à partir d'un numéro spécifique
-- SELECT setval('obs_ticket_sequence', 10000); -- Commence à OBS-10000
```

### Étape 3 : Créer la fonction de génération

```sql
CREATE OR REPLACE FUNCTION generate_internal_ticket_key()
RETURNS TRIGGER AS $$
BEGIN
    -- Générer la clé uniquement pour les tickets ASSISTANCE sans clé JIRA
    IF NEW.ticket_type = 'ASSISTANCE' AND NEW.internal_ticket_key IS NULL THEN
        NEW.internal_ticket_key := 'OBS-' || nextval('obs_ticket_sequence');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Étape 4 : Créer le trigger

```sql
-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS set_internal_ticket_key ON tickets;

-- Créer le trigger BEFORE INSERT
CREATE TRIGGER set_internal_ticket_key
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION generate_internal_ticket_key();
```

### Étape 5 : Migration des données existantes (optionnel)

#### ⚠️ Problème des Historiques avec Dates Passées

Si vous importez des tickets ASSISTANCE historiques qui ont déjà des clés **OBCS-xxx** dans `jira_issue_key`, vous avez **deux stratégies** :

#### Stratégie A : Continuer la Numérotation Existante (Recommandée)

**Objectif** : Éviter les doublons et maintenir la continuité des numéros.

**Approche** :
1. Extraire les numéros OBCS-xxx existants
2. Trouver le maximum
3. Initialiser la séquence à max + 1
4. Migrer les clés OBCS-xxx vers `internal_ticket_key` (optionnel)

```sql
-- 1. Trouver le numéro OBCS maximum existant
DO $$
DECLARE
    max_obcs_num INTEGER;
BEGIN
    -- Extraire le numéro maximum des clés OBCS-xxx existantes
    SELECT COALESCE(
        MAX(CASE 
            WHEN jira_issue_key LIKE 'OBCS-%' 
            THEN CAST(SUBSTRING(jira_issue_key FROM 6) AS INTEGER)
            ELSE 0
        END),
        0
    ) INTO max_obcs_num
    FROM tickets
    WHERE ticket_type = 'ASSISTANCE' 
      AND jira_issue_key LIKE 'OBCS-%';
    
    -- Initialiser la séquence au-dessus du maximum existant
    PERFORM setval('obs_ticket_sequence', max_obcs_num + 1, false);
    
    RAISE NOTICE 'Séquence initialisée à % (après OBCS-%)', max_obcs_num + 1, max_obcs_num;
END $$;

-- 2. Optionnel : Migrer les clés OBCS-xxx vers internal_ticket_key
-- Convertir OBCS-10765 -> OBS-10765 pour cohérence
UPDATE tickets
SET internal_ticket_key = 'OBS-' || SUBSTRING(jira_issue_key FROM 6)
WHERE ticket_type = 'ASSISTANCE' 
  AND jira_issue_key LIKE 'OBCS-%'
  AND internal_ticket_key IS NULL;
```

**Avantages** :
- ✅ Continuité des numéros (pas de OBS-1 après OBCS-12156)
- ✅ Pas de collision de numéros
- ✅ Cohérence historique

**Inconvénients** :
- ⚠️ Les nouveaux tickets commencent à un numéro élevé (ex: OBS-12157)
- ⚠️ La clé ne correspond pas chronologiquement à la date de création

#### Stratégie B : Recommencer à 1 (Pour Nouveaux Tickets Uniquement)

**Objectif** : Avoir des numéros séquentiels à partir de maintenant.

**Approche** :
1. Garder les anciennes clés OBCS-xxx dans `jira_issue_key`
2. La séquence démarre à 1 pour les nouveaux tickets uniquement
3. Afficher `internal_ticket_key` pour nouveaux, `jira_issue_key` pour anciens

```sql
-- Démarre la séquence à 1 (par défaut)
-- Les tickets historiques gardent leur jira_issue_key (OBCS-xxx)
-- Les nouveaux tickets auront internal_ticket_key (OBS-1, OBS-2, etc.)
```

**Avantages** :
- ✅ Numéros simples pour nouveaux tickets (OBS-1, OBS-2...)
- ✅ Pas de migration nécessaire

**Inconvénients** :
- ⚠️ Discontinuité entre anciens (OBCS-12156) et nouveaux (OBS-1)
- ⚠️ Deux systèmes de clés en parallèle (plus complexe à afficher)

#### Stratégie C : Migration Complète avec Réinitialisation

Si vous voulez vraiment recommencer à 1 et migrer tous les tickets :

```sql
-- Générer les clés pour TOUS les tickets ASSISTANCE (anciens + nouveaux)
DO $$
DECLARE
    ticket_rec RECORD;
    next_seq_val INTEGER := 1;
BEGIN
    -- Parcourir TOUS les tickets ASSISTANCE par date de création
    FOR ticket_rec IN 
        SELECT id, jira_issue_key
        FROM tickets 
        WHERE ticket_type = 'ASSISTANCE'
        ORDER BY created_at ASC
    LOOP
        -- Générer une nouvelle clé OBS-xxx pour tous
        UPDATE tickets
        SET internal_ticket_key = 'OBS-' || next_seq_val
        WHERE id = ticket_rec.id;
        
        next_seq_val := next_seq_val + 1;
    END LOOP;
    
    -- Initialiser la séquence pour les prochains tickets
    PERFORM setval('obs_ticket_sequence', next_seq_val, false);
    
    RAISE NOTICE 'Migration terminée. Prochain ticket: OBS-%', next_seq_val;
END $$;
```

**⚠️ Attention** : Cette stratégie **change les clés** des tickets existants. Les références externes (emails, documents) qui mentionnent OBCS-10765 ne fonctionneront plus.

#### Recommandation

**Pour votre cas** (7408 tickets ASSISTANCE avec OBCS-xxx jusqu'à ~12156) :

👉 **Stratégie A est recommandée** pour maintenir la continuité et éviter les collisions.

## 🔄 Gestion des Différents Types de Tickets

### Tickets ASSISTANCE
- ✅ **internal_ticket_key** : Généré automatiquement (OBS-xxx)
- ❌ **jira_issue_key** : NULL (pas de synchronisation JIRA)

### Tickets BUG/REQ
- ❌ **internal_ticket_key** : NULL (utilisent JIRA)
- ✅ **jira_issue_key** : Clé JIRA (PROJ-xxx, générée par JIRA)

### Tickets ASSISTANCE transférés (ancien comportement)
- ✅ **internal_ticket_key** : Peut avoir une clé OBS-xxx (si créé avant transfert)
- ✅ **jira_issue_key** : Clé JIRA après transfert

## 🎨 Affichage dans l'Application

### Logique d'affichage recommandée

```typescript
function getTicketDisplayKey(ticket: Ticket): string {
  // Pour ASSISTANCE: priorité à internal_ticket_key, sinon jira_issue_key (historique)
  if (ticket.ticket_type === 'ASSISTANCE') {
    // Nouveaux tickets : internal_ticket_key (OBS-xxx)
    if (ticket.internal_ticket_key) {
      return ticket.internal_ticket_key;
    }
    // Anciens tickets (avant migration) : jira_issue_key (OBCS-xxx)
    if (ticket.jira_issue_key) {
      return ticket.jira_issue_key;
    }
    return 'OBS-En attente';
  }
  
  // Pour BUG/REQ: afficher jira_issue_key
  if (ticket.ticket_type === 'BUG' || ticket.ticket_type === 'REQ') {
    return ticket.jira_issue_key || 'En attente JIRA';
  }
  
  return 'N/A';
}
```

### Priorité d'affichage

1. **ASSISTANCE (nouveaux)** : `internal_ticket_key` (OBS-xxx)
2. **ASSISTANCE (anciens, avant migration)** : `jira_issue_key` (OBCS-xxx) si `internal_ticket_key` est NULL
3. **BUG/REQ** : `jira_issue_key` (PROJ-xxx)
4. **ASSISTANCE transféré** : `internal_ticket_key` OU `jira_issue_key` (selon préférence métier)

## 📊 Exemples de Clés Générées

```
OBS-1
OBS-2
OBS-3
...
OBS-1000
OBS-1001
```

## ⚙️ Gestion Avancée

### Réinitialiser la séquence

```sql
-- Réinitialiser à 1
ALTER SEQUENCE obs_ticket_sequence RESTART WITH 1;

-- Réinitialiser à une valeur spécifique
SELECT setval('obs_ticket_sequence', 10000);
```

### Vérifier la prochaine valeur

```sql
SELECT nextval('obs_ticket_sequence');
```

### Trouver la dernière clé utilisée

```sql
SELECT MAX(CAST(SUBSTRING(internal_ticket_key FROM 5) AS INTEGER))
FROM tickets
WHERE internal_ticket_key LIKE 'OBS-%';
```

## 🚨 Points d'Attention

### 1. Unicité
- La contrainte `UNIQUE` sur `internal_ticket_key` garantit l'unicité
- La séquence PostgreSQL garantit l'atomicité (pas de collisions)

### 2. Performance
- La séquence utilise le cache (CACHE 1 par défaut)
- Pour un volume très élevé, on peut augmenter le cache (ex: CACHE 10)

### 3. Migration depuis JIRA et Historiques
- Les tickets déjà synchronisés avec JIRA peuvent avoir `jira_issue_key` dans le format OBCS-xxx
- ⚠️ **Problème des historiques** : Si vous importez des tickets avec dates passées, il faut décider :
  - **Stratégie A** : Continuer la numérotation (OBS-12157 après OBCS-12156) → Recommandée
  - **Stratégie B** : Recommencer à 1 pour nouveaux tickets uniquement
  - **Stratégie C** : Réassigner tous les tickets de 1 à N (change les clés existantes)
- Voir section "Migration des données existantes" pour les détails

### 4. Format de clé personnalisé
- Si vous voulez un format différent (ex: OBCS-xxx au lieu de OBS-xxx), modifier la fonction
- Si vous voulez inclure l'année (ex: OBS-2025-xxx), ajuster la fonction

## 🔐 Sécurité

### RLS (Row Level Security)
- La colonne `internal_ticket_key` n'affecte pas les politiques RLS existantes
- Elle est simplement un identifiant visible pour l'utilisateur

### Validation
- Le trigger s'exécute avant l'insertion, garantissant que tous les tickets ASSISTANCE ont une clé
- Pas besoin de validation côté application

## 📝 Checklist d'Implémentation

- [ ] Ajouter la colonne `internal_ticket_key` à la table `tickets`
- [ ] Créer la séquence `obs_ticket_sequence`
- [ ] Créer la fonction `generate_internal_ticket_key()`
- [ ] Créer le trigger `set_internal_ticket_key`
- [ ] Migrer les tickets existants (optionnel)
- [ ] Mettre à jour l'application pour afficher `internal_ticket_key` pour ASSISTANCE
- [ ] Tester la création de nouveaux tickets ASSISTANCE
- [ ] Vérifier l'unicité des clés générées
- [ ] Documenter dans le code de l'application

## 🎯 Alternatives Non Recommandées

### ❌ Génération côté application
- **Problème** : Risque de race conditions, collisions possibles
- **Pourquoi éviter** : Nécessite une transaction séparée pour réserver un numéro

### ❌ Utiliser MAX() + 1
- **Problème** : Race conditions, problèmes de concurrence
- **Pourquoi éviter** : Deux insertions simultanées peuvent obtenir le même MAX()

### ❌ UUID ou ID aléatoire
- **Problème** : Pas lisible pour les utilisateurs (OBS-550e8400-e29b-41d4-a716-446655440000)
- **Pourquoi éviter** : Les clés doivent être séquentielles et lisibles

## 📚 Références

- [PostgreSQL Sequences Documentation](https://www.postgresql.org/docs/current/sql-createsequence.html)
- [PostgreSQL Triggers Documentation](https://www.postgresql.org/docs/current/triggers.html)
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions)








