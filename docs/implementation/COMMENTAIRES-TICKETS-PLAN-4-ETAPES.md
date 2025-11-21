# Plan d'Implémentation : Commentaires sur Tickets (4 Étapes)

## Vue d'ensemble

Implémentation de la section 6.4 "Commentaires sur tickets" en respectant strictement les principes Clean Code.

**Fonctionnalités** :
- Section commentaires dans la page détail ticket
- Ajout de commentaires
- Mentions d'utilisateurs (@nom)
- Pièces jointes dans les commentaires
- Historique complet

## Architecture Clean Code

```
src/
├── services/tickets/comments/
│   ├── index.ts              # Service principal pour CRUD commentaires
│   ├── mentions.ts           # Utilitaires pour détecter/parser mentions
│   └── attachments.ts        # Service pour gérer les pièces jointes
├── components/tickets/comments/
│   ├── comments-section.tsx          # Section principale (< 100 lignes)
│   ├── comment-list.tsx              # Liste des commentaires (< 100 lignes)
│   ├── comment-item.tsx              # Item individuel (< 100 lignes)
│   ├── comment-form.tsx              # Formulaire d'ajout (< 100 lignes)
│   ├── mention-input.tsx             # Input avec autocomplétion mentions
│   └── comment-attachments.tsx       # Affichage/gestion PJ (< 100 lignes)
├── lib/validators/comment.ts         # Schémas Zod pour validation
└── hooks/tickets/use-comments.ts     # Hook pour gérer l'état des commentaires
```

## Étapes d'implémentation

### 📋 Étape 1 : Services et Types (Fondations)

**Objectif** : Créer les services et types pour gérer les commentaires.

**Fichiers à créer/modifier** :
1. `src/services/tickets/comments/index.ts` - Service CRUD commentaires
2. `src/lib/validators/comment.ts` - Validation Zod
3. `src/types/comment.ts` - Types TypeScript
4. `src/app/api/tickets/[id]/comments/route.ts` - API route POST
5. `src/app/api/tickets/[id]/comments/[commentId]/route.ts` - API route DELETE

**Fonctionnalités** :
- ✅ Créer un commentaire
- ✅ Charger les commentaires d'un ticket
- ✅ Supprimer un commentaire (avec permissions)
- ✅ Validation Zod stricte
- ✅ Gestion d'erreur avec `handleApiError`

**Tests** :
- Service peut créer un commentaire
- Service peut charger les commentaires
- Service peut supprimer un commentaire
- Validation rejette les données invalides

**Critères Clean Code** :
- Fonctions < 20 lignes ✅
- Types explicites ✅
- Documentation JSDoc ✅
- Gestion d'erreur appropriée ✅

---

### 📋 Étape 2 : Composants d'Affichage (UI Lecture)

**Objectif** : Afficher les commentaires existants dans la page détail ticket.

**Fichiers à créer** :
1. `src/components/tickets/comments/comments-section.tsx` - Section principale
2. `src/components/tickets/comments/comment-list.tsx` - Liste des commentaires
3. `src/components/tickets/comments/comment-item.tsx` - Item individuel
4. `src/hooks/tickets/use-comments.ts` - Hook pour charger/gérer les commentaires

**Fonctionnalités** :
- ✅ Afficher tous les commentaires d'un ticket
- ✅ Afficher l'auteur, la date, le contenu
- ✅ Distinguer commentaires app/JIRA (badge)
- ✅ Historique complet avec dates relatives
- ✅ Formatage du contenu (markdown/text)

**Intégration** :
- Ajouter `CommentsSection` dans `src/app/(main)/gestion/tickets/[id]/page.tsx`
- Position : Sous les détails du ticket, avant la timeline

**Critères Clean Code** :
- Composants < 100 lignes ✅
- Pas de logique métier dans les composants ✅
- Types explicites ✅
- Documentation JSDoc ✅

---

### 📋 Étape 3 : Formulaire d'Ajout avec Mentions

**Objectif** : Permettre l'ajout de commentaires avec système de mentions (@nom).

**Fichiers à créer** :
1. `src/components/tickets/comments/comment-form.tsx` - Formulaire principal
2. `src/components/tickets/comments/mention-input.tsx` - Input avec autocomplétion
3. `src/services/tickets/comments/mentions.ts` - Utilitaires mentions
4. `src/lib/utils/mention-parser.ts` - Parser pour détecter mentions

**Fonctionnalités** :
- ✅ Textarea pour saisir le commentaire
- ✅ Autocomplétion lors de la saisie de `@`
- ✅ Liste déroulante des utilisateurs disponibles
- ✅ Affichage visuel des mentions dans le texte
- ✅ Parser pour détecter et stocker les mentions

**API Route** :
- Modifier `POST /api/tickets/[id]/comments` pour gérer les mentions
- Stocker les mentions dans le champ `content` (format: `@[userId:nom] texte`)

**Critères Clean Code** :
- Composants < 100 lignes ✅
- Fonctions utilitaires < 20 lignes ✅
- Types explicites ✅
- Documentation JSDoc ✅

---

### 📋 Étape 4 : Pièces Jointes dans Commentaires

**Objectif** : Permettre l'ajout et l'affichage de pièces jointes dans les commentaires.

**Fichiers à créer** :
1. `src/components/tickets/comments/comment-attachments.tsx` - Gestion PJ
2. `src/services/tickets/comments/attachments.ts` - Service upload/téléchargement
3. `src/app/api/tickets/[id]/comments/[commentId]/attachments/route.ts` - API upload
4. Migration Supabase : Table `comment_attachments` (si nécessaire)

**Fonctionnalités** :
- ✅ Upload de fichiers dans un commentaire
- ✅ Affichage des pièces jointes sous le commentaire
- ✅ Téléchargement des pièces jointes
- ✅ Prévisualisation des images
- ✅ Gestion des types de fichiers (images, PDF, etc.)

**Schema Base de Données** (si nécessaire) :
```sql
CREATE TABLE IF NOT EXISTS comment_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES ticket_comments(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Critères Clean Code** :
- Composants < 100 lignes ✅
- Services < 100 lignes ✅
- Fonctions < 20 lignes ✅
- Types explicites ✅
- Documentation JSDoc ✅

---

## Ordre d'implémentation recommandé

1. **Étape 1** : Services et Types (Fondations)
   - Permet d'avoir la base pour les autres étapes
   - Testable indépendamment
   
2. **Étape 2** : Composants d'Affichage (UI Lecture)
   - Utilise les services de l'Étape 1
   - Permet de visualiser les commentaires existants
   
3. **Étape 3** : Formulaire d'Ajout avec Mentions
   - Utilise les services de l'Étape 1
   - Ajoute la fonctionnalité d'écriture
   
4. **Étape 4** : Pièces Jointes
   - Utilise les services et composants des étapes précédentes
   - Ajoute la fonctionnalité avancée

## Critères de succès

### Clean Code
- ✅ Tous les composants < 100 lignes
- ✅ Toutes les fonctions < 20 lignes
- ✅ Types explicites partout
- ✅ Documentation JSDoc complète
- ✅ Pas de `console.log` ou `as any`
- ✅ Gestion d'erreur avec `handleApiError`

### Fonctionnalités
- ✅ Section commentaires visible dans la page détail ticket
- ✅ Ajout de commentaires fonctionnel
- ✅ Mentions @nom avec autocomplétion
- ✅ Pièces jointes uploadables et affichables
- ✅ Historique complet des commentaires

### Tests
- ✅ Services testables unitairement
- ✅ Composants testables (props, rendering)
- ✅ Validation Zod fonctionnelle

## Notes techniques

### Mentions (@nom)
- Format de stockage : `@[userId:full_name]` dans le contenu
- Affichage : Remplacer par `@full_name` avec lien vers le profil
- Autocomplétion : Charger les utilisateurs disponibles pour le ticket

### Pièces jointes
- Storage Supabase : Bucket `comment-attachments`
- Structure : `{ticketId}/{commentId}/{timestamp}-{filename}`
- RLS : Basé sur les permissions des commentaires

### Performance
- Charger les commentaires avec pagination (si > 50)
- Lazy loading des pièces jointes
- Cache des profils utilisateurs

---

## Prochaine étape

**Commencer par l'Étape 1 : Services et Types**

Voulez-vous que je procède avec l'Étape 1 maintenant ?

