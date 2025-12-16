# Enums de Statuts de Cycle de Vie dans Supabase

## 📋 Enum `ticket_status_t`

**Type** : ENUM PostgreSQL  
**Utilisation** : Définit les statuts standards pour les tickets

### Valeurs disponibles (8 valeurs)

1. **`Nouveau`** - Statut initial pour les tickets ASSISTANCE créés localement
2. **`En_cours`** - Ticket en cours de traitement
3. **`Transfere`** - Ticket ASSISTANCE transféré vers JIRA
4. **`Resolue`** - Ticket résolu
5. **`To_Do`** - Statut JIRA (équivalent à "À faire")
6. **`In_Progress`** - Statut JIRA (équivalent à "En cours")
7. **`Done`** - Statut JIRA (ticket terminé)
8. **`Closed`** - Statut JIRA (ticket fermé)

### ⚠️ Note importante

Le champ `status` dans la table `tickets` est de type **TEXT** (pas ENUM), ce qui permet d'accepter des statuts JIRA dynamiques supplémentaires comme :
- `Sprint Backlog`
- `Traitement en Cours`
- `Test en Cours`
- `Terminé(e)`
- `Terminé`

---

## 📊 Autres Enums liés aux Tickets

### 1. `ticket_type_t` - Type de ticket

**Valeurs** :
- `BUG` - Bug
- `REQ` - Requête
- `ASSISTANCE` - Assistance

---

### 2. `priority_t` - Priorité

**Valeurs** :
- `Low` - Faible
- `Medium` - Moyenne
- `High` - Haute
- `Critical` - Critique

---

### 3. `canal_t` - Canal de communication

**Valeurs** :
- `Whatsapp`
- `Email`
- `Appel`
- `Autre`
- `Appel Téléphonique`
- `Appel WhatsApp`
- `Chat SMS`
- `Chat WhatsApp`
- `Constat Interne`
- `E-mail`
- `En présentiel`
- `Non enregistré`
- `Online (Google Meet, Teams...)`
- `En prsentiel` (typo à corriger ?)

---

### 4. `bug_type_enum` - Type de bug

**Valeurs** (23 types) :
- `Autres`
- `Mauvais déversement des données`
- `Dysfonctionnement sur le Calcul des salaires`
- `Duplication anormale`
- `Enregistrement impossible`
- `Page d'erreur`
- `Historique vide/non exhaustif`
- `Non affichage de pages/données`
- `Lenteur Système`
- `Import de fichiers impossible`
- `Suppression impossible`
- `Récupération de données impossible`
- `Edition impossible`
- `Dysfonctionnement des filtres`
- `Error 503`
- `Impression impossible`
- `Erreur de calcul/Erreur sur Dashboard`
- `Dysfonctionnement Workflow`
- `Erreur serveur`
- `Dysfonctionnement des liens d'accès`
- `Formulaire indisponible`
- `Erreur Ajax`
- `Export de données impossible`
- `Connexion impossible`

---

### 5. `origin_t` - Origine du ticket

**Valeurs** :
- `supabase` - Créé dans l'application
- `jira` - Importé depuis JIRA

---

## 🔄 Mapping JIRA → Supabase (Statuts)

### Statuts JIRA du fichier CSV → Statuts Supabase

| Statut JIRA (CSV) | Statut Supabase | Notes |
|-------------------|-----------------|-------|
| `À faire` | `To_Do` | Statut JIRA standard |
| `En cours` | `En_cours` | Statut local ou `In_Progress` pour JIRA |
| `Terminé(e)` | `Resolue` ou `Done` | Selon le workflow |
| `Sprint Backlog` | `Sprint Backlog` | Statut JIRA dynamique (TEXT) |
| `Traitement en Cours` | `Traitement en Cours` | Statut JIRA dynamique (TEXT) |
| `Test en Cours` | `Test en Cours` | Statut JIRA dynamique (TEXT) |

### Recommandations de mapping

1. **"À faire"** → `To_Do` (enum standard)
2. **"En cours"** → `En_cours` (enum standard) ou `In_Progress` (si workflow JIRA)
3. **"Terminé(e)"** → `Resolue` (enum standard) ou `Done` (si workflow JIRA)
4. **Autres statuts JIRA** → Conserver tel quel (champ TEXT accepte n'importe quelle valeur)

---

## 📝 Résumé pour le mapping CSV → Supabase

### Statuts à mapper depuis le CSV

**Statuts identifiés dans le CSV** :
- `À faire` → `To_Do`
- `En cours` → `En_cours`
- `Terminé(e)` → `Resolue` ou `Done`

**Autres statuts possibles** (à vérifier dans le CSV) :
- `Sprint Backlog` → Conserver tel quel
- `Traitement en Cours` → Conserver tel quel
- `Test en Cours` → Conserver tel quel

---

## ✅ Conclusion

Le champ `status` étant de type **TEXT**, il peut accepter :
1. Les valeurs de l'enum `ticket_status_t` (recommandé)
2. Toute autre valeur string (pour compatibilité avec les statuts JIRA dynamiques)

**Recommandation** : Utiliser les valeurs de l'enum quand possible, sinon conserver les statuts JIRA tels quels.

