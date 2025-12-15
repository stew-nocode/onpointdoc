-- Migration : Ajouter le champ comment_type à ticket_comments
-- 
-- Description : Permet de différencier les commentaires des relances.
-- - 'comment' : Commentaire standard (peut être synchronisé avec JIRA)
-- - 'followup' : Relance interne (ne sera pas synchronisée avec JIRA)
--
-- Valeur par défaut : 'comment' pour rétrocompatibilité

BEGIN;

-- Ajouter la colonne comment_type avec valeur par défaut
ALTER TABLE ticket_comments 
ADD COLUMN IF NOT EXISTS comment_type TEXT DEFAULT 'comment' 
CHECK (comment_type IN ('comment', 'followup'));

-- Mettre à jour les commentaires existants qui contiennent "relance" dans le contenu
-- pour les marquer comme followup (optionnel, basé sur le contenu)
UPDATE ticket_comments 
SET comment_type = 'followup' 
WHERE content ILIKE '%relance%' 
  AND comment_type = 'comment';

-- Créer un index pour améliorer les performances des requêtes filtrées
CREATE INDEX IF NOT EXISTS idx_ticket_comments_comment_type 
ON ticket_comments(ticket_id, comment_type);

COMMENT ON COLUMN ticket_comments.comment_type IS 
'Type de commentaire : comment (commentaire standard) ou followup (relance interne)';

COMMIT;

