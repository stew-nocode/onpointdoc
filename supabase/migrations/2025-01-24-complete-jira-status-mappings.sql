-- Migration : Compléter les mappings de statuts JIRA → Supabase
-- Ajoute tous les mappings manquants pour BUG, REQ et ASSISTANCE

-- Supprimer les doublons potentiels avant insertion
DELETE FROM jira_status_mapping 
WHERE (jira_status_name, ticket_type) IN (
  SELECT jira_status_name, ticket_type 
  FROM jira_status_mapping 
  GROUP BY jira_status_name, ticket_type 
  HAVING COUNT(*) > 1
);

-- Mappings pour BUG
INSERT INTO jira_status_mapping (jira_status_name, supabase_status, ticket_type)
VALUES
  -- Statuts "Nouveau" / "To Do"
  ('Backlog', 'Nouveau', 'BUG'),
  ('À faire', 'Nouveau', 'BUG'),
  ('A faire', 'Nouveau', 'BUG'),
  ('To Do', 'Nouveau', 'BUG'),
  
  -- Statuts "En cours" / "In Progress"
  ('En cours', 'En_cours', 'BUG'),
  ('In Progress', 'En_cours', 'BUG'),
  
  -- Statuts "Transféré" / "À valider"
  ('À valider', 'Transfere', 'BUG'),
  ('Transféré', 'Transfere', 'BUG'),
  
  -- Statuts "Résolu" / "Done" / "Closed"
  ('Terminé', 'Resolue', 'BUG'),
  ('Résolu', 'Resolue', 'BUG'),
  ('Résolue', 'Resolue', 'BUG'),
  ('Done', 'Resolue', 'BUG'),
  ('Closed', 'Resolue', 'BUG')
ON CONFLICT (jira_status_name, ticket_type) DO NOTHING;

-- Mappings pour REQ
INSERT INTO jira_status_mapping (jira_status_name, supabase_status, ticket_type)
VALUES
  -- Statuts "Nouveau" / "To Do"
  ('Backlog', 'Nouveau', 'REQ'),
  ('À faire', 'Nouveau', 'REQ'),
  ('A faire', 'Nouveau', 'REQ'),
  ('To Do', 'Nouveau', 'REQ'),
  
  -- Statuts "En cours" / "In Progress"
  ('En cours', 'En_cours', 'REQ'),
  ('In Progress', 'En_cours', 'REQ'),
  
  -- Statuts "Transféré" / "À valider"
  ('À valider', 'Transfere', 'REQ'),
  ('Transféré', 'Transfere', 'REQ'),
  
  -- Statuts "Résolu" / "Done" / "Closed"
  ('Terminé', 'Resolue', 'REQ'),
  ('Résolu', 'Resolue', 'REQ'),
  ('Résolue', 'Resolue', 'REQ'),
  ('Done', 'Resolue', 'REQ'),
  ('Closed', 'Resolue', 'REQ')
ON CONFLICT (jira_status_name, ticket_type) DO NOTHING;

-- Mappings pour ASSISTANCE
INSERT INTO jira_status_mapping (jira_status_name, supabase_status, ticket_type)
VALUES
  -- Statuts "Nouveau" / "To Do"
  ('Sprint Backlog', 'Nouveau', 'ASSISTANCE'),
  ('Backlog', 'Nouveau', 'ASSISTANCE'),
  ('À faire', 'Nouveau', 'ASSISTANCE'),
  ('A faire', 'Nouveau', 'ASSISTANCE'),
  ('To Do', 'Nouveau', 'ASSISTANCE'),
  
  -- Statuts "En cours" / "In Progress"
  ('Traitement en Cours', 'En_cours', 'ASSISTANCE'),
  ('En cours', 'En_cours', 'ASSISTANCE'),
  ('In Progress', 'En_cours', 'ASSISTANCE'),
  
  -- Statuts "Transféré" / "À valider"
  ('À valider', 'Transfere', 'ASSISTANCE'),
  ('Transféré', 'Transfere', 'ASSISTANCE'),
  
  -- Statuts "Résolu" / "Done" / "Closed"
  ('Terminé(e)', 'Resolue', 'ASSISTANCE'),
  ('Terminé', 'Resolue', 'ASSISTANCE'),
  ('Résolu', 'Resolue', 'ASSISTANCE'),
  ('Résolue', 'Resolue', 'ASSISTANCE'),
  ('Done', 'Resolue', 'ASSISTANCE'),
  ('Closed', 'Resolue', 'ASSISTANCE')
ON CONFLICT (jira_status_name, ticket_type) DO NOTHING;

-- Vérification : Afficher le nombre de mappings par type
SELECT 
  ticket_type,
  COUNT(*) as total_mappings,
  COUNT(CASE WHEN supabase_status = 'Nouveau' THEN 1 END) as nouveau_count,
  COUNT(CASE WHEN supabase_status = 'En_cours' THEN 1 END) as en_cours_count,
  COUNT(CASE WHEN supabase_status = 'Transfere' THEN 1 END) as transfere_count,
  COUNT(CASE WHEN supabase_status = 'Resolue' THEN 1 END) as resolue_count
FROM jira_status_mapping
GROUP BY ticket_type
ORDER BY ticket_type;

