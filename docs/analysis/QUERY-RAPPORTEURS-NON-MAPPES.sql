-- Requête SQL pour identifier les rapporteurs JIRA non mappés dans Supabase
-- 
-- Cette requête trouve tous les rapporteurs JIRA qui :
-- 1. Ont un jira_reporter_account_id dans jira_sync
-- 2. N'ont PAS de profil correspondant dans profiles.jira_user_id
-- 3. Ont donc potentiellement un tickets.created_by = NULL ou invalide

-- ============================================================================
-- VERSION 1: Liste simple des rapporteurs non mappés
-- ============================================================================

SELECT DISTINCT
  js.jira_reporter_account_id,
  COUNT(DISTINCT js.ticket_id) as nombre_tickets,
  STRING_AGG(DISTINCT js.jira_issue_key, ', ' ORDER BY js.jira_issue_key) as jira_keys
FROM public.jira_sync js
WHERE js.jira_reporter_account_id IS NOT NULL
  AND js.jira_reporter_account_id NOT IN (
    SELECT jira_user_id 
    FROM public.profiles 
    WHERE jira_user_id IS NOT NULL
  )
GROUP BY js.jira_reporter_account_id
ORDER BY nombre_tickets DESC;

-- ============================================================================
-- VERSION 2: Détails avec état des tickets
-- ============================================================================

SELECT 
  js.jira_reporter_account_id as rapporteur_jira_id,
  COUNT(DISTINCT js.ticket_id) as nombre_tickets,
  COUNT(DISTINCT CASE WHEN t.created_by IS NULL THEN t.id END) as tickets_sans_created_by,
  COUNT(DISTINCT CASE WHEN t.created_by IS NOT NULL THEN t.id END) as tickets_avec_created_by,
  STRING_AGG(DISTINCT js.jira_issue_key, ', ' ORDER BY js.jira_issue_key) as jira_keys,
  STRING_AGG(DISTINCT t.title, ' | ' ORDER BY t.title) as exemples_titres
FROM public.jira_sync js
LEFT JOIN public.tickets t ON t.id = js.ticket_id
WHERE js.jira_reporter_account_id IS NOT NULL
  AND js.jira_reporter_account_id NOT IN (
    SELECT jira_user_id 
    FROM public.profiles 
    WHERE jira_user_id IS NOT NULL
  )
GROUP BY js.jira_reporter_account_id
ORDER BY nombre_tickets DESC;

-- ============================================================================
-- VERSION 3: Liste des tickets concernés avec détails
-- ============================================================================

SELECT 
  t.id as ticket_id,
  t.title,
  t.jira_issue_key,
  js.jira_reporter_account_id as rapporteur_jira_id,
  t.created_by as created_by_actuel,
  CASE 
    WHEN t.created_by IS NULL THEN '❌ NULL'
    WHEN NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = t.created_by) THEN '❌ Invalide'
    ELSE '✅ Valide mais non mappé depuis JIRA'
  END as statut_created_by,
  t.created_at,
  t.status
FROM public.jira_sync js
INNER JOIN public.tickets t ON t.id = js.ticket_id
WHERE js.jira_reporter_account_id IS NOT NULL
  AND js.jira_reporter_account_id NOT IN (
    SELECT jira_user_id 
    FROM public.profiles 
    WHERE jira_user_id IS NOT NULL
  )
ORDER BY t.created_at DESC;

-- ============================================================================
-- VERSION 4: Statistiques globales
-- ============================================================================

SELECT 
  COUNT(DISTINCT js.jira_reporter_account_id) as total_rapporteurs_non_mappes,
  COUNT(DISTINCT js.ticket_id) as total_tickets_concernes,
  COUNT(DISTINCT CASE WHEN t.created_by IS NULL THEN t.id END) as tickets_sans_created_by,
  COUNT(DISTINCT CASE WHEN t.created_by IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = t.created_by
  ) THEN t.id END) as tickets_avec_created_by_invalide
FROM public.jira_sync js
LEFT JOIN public.tickets t ON t.id = js.ticket_id
WHERE js.jira_reporter_account_id IS NOT NULL
  AND js.jira_reporter_account_id NOT IN (
    SELECT jira_user_id 
    FROM public.profiles 
    WHERE jira_user_id IS NOT NULL
  );

-- ============================================================================
-- VERSION 5: Comparaison avec les assignés (pour voir si c'est cohérent)
-- ============================================================================

SELECT 
  'Rapporteur' as type,
  COUNT(DISTINCT js.jira_reporter_account_id) as non_mappes,
  COUNT(DISTINCT js.ticket_id) as tickets_concernes
FROM public.jira_sync js
WHERE js.jira_reporter_account_id IS NOT NULL
  AND js.jira_reporter_account_id NOT IN (
    SELECT jira_user_id FROM public.profiles WHERE jira_user_id IS NOT NULL
  )

UNION ALL

SELECT 
  'Assigné' as type,
  COUNT(DISTINCT js.jira_assignee_account_id) as non_mappes,
  COUNT(DISTINCT js.ticket_id) as tickets_concernes
FROM public.jira_sync js
WHERE js.jira_assignee_account_id IS NOT NULL
  AND js.jira_assignee_account_id NOT IN (
    SELECT jira_user_id FROM public.profiles WHERE jira_user_id IS NOT NULL
  );

