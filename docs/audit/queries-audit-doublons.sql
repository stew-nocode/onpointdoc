-- ============================================
-- REQUÊTES D'AUDIT DES DOUBLONS D'UTILISATEURS
-- Projet: OnpointDoc - ONPOINT CENTRAL
-- ============================================

-- 1. Détecter les doublons de noms dans la MÊME entreprise
WITH duplicates_same_company AS (
    SELECT 
        p.full_name,
        p.company_id,
        c.name AS company_name,
        COUNT(*) AS nombre_occurrences,
        ARRAY_AGG(p.id ORDER BY p.created_at) AS profile_ids,
        ARRAY_AGG(p.email ORDER BY p.created_at) AS emails,
        ARRAY_AGG(p.created_at::text ORDER BY p.created_at) AS dates_creation
    FROM profiles p
    LEFT JOIN companies c ON p.company_id = c.id
    WHERE p.full_name IS NOT NULL 
      AND p.full_name != ''
      AND p.company_id IS NOT NULL
    GROUP BY p.full_name, p.company_id, c.name
    HAVING COUNT(*) > 1
)
SELECT 
    'DOUBLONS DANS LA MÊME ENTREPRISE' AS type_audit,
    full_name AS nom_utilisateur,
    company_name AS entreprise,
    nombre_occurrences,
    profile_ids,
    emails,
    dates_creation
FROM duplicates_same_company
ORDER BY nombre_occurrences DESC, full_name, company_name;

-- 2. Détecter les doublons de noms dans des ENTREPRISES DIFFÉRENTES
WITH duplicates_different_companies AS (
    SELECT 
        p.full_name,
        COUNT(DISTINCT p.company_id) AS nombre_entreprises,
        COUNT(*) AS nombre_total_occurrences,
        ARRAY_AGG(DISTINCT c.name ORDER BY c.name) FILTER (WHERE c.name IS NOT NULL) AS entreprises,
        ARRAY_AGG(p.id ORDER BY p.created_at) AS profile_ids,
        ARRAY_AGG(p.email ORDER BY p.created_at) AS emails,
        ARRAY_AGG(
            CASE 
                WHEN c.name IS NOT NULL THEN c.name || ' (' || p.company_id::text || ')'
                ELSE 'Sans entreprise (' || p.company_id::text || ')'
            END
            ORDER BY p.created_at
        ) AS entreprises_avec_ids,
        ARRAY_AGG(p.created_at::text ORDER BY p.created_at) AS dates_creation
    FROM profiles p
    LEFT JOIN companies c ON p.company_id = c.id
    WHERE p.full_name IS NOT NULL 
      AND p.full_name != ''
    GROUP BY p.full_name
    HAVING COUNT(DISTINCT p.company_id) > 1 OR (COUNT(DISTINCT p.company_id) = 1 AND COUNT(*) > 1 AND COUNT(*) FILTER (WHERE p.company_id IS NULL) > 0)
)
SELECT 
    'DOUBLONS DANS DES ENTREPRISES DIFFÉRENTES' AS type_audit,
    full_name AS nom_utilisateur,
    nombre_entreprises,
    nombre_total_occurrences,
    entreprises,
    entreprises_avec_ids,
    profile_ids,
    emails,
    dates_creation
FROM duplicates_different_companies
ORDER BY nombre_total_occurrences DESC, full_name;

-- 3. Vue d'ensemble : Statistiques générales sur les doublons
WITH stats AS (
    SELECT 
        COUNT(DISTINCT p.full_name) AS noms_uniques,
        COUNT(*) AS total_profiles,
        COUNT(*) FILTER (WHERE p.full_name IS NOT NULL AND p.full_name != '') AS profiles_avec_nom,
        COUNT(*) FILTER (WHERE p.company_id IS NOT NULL) AS profiles_avec_entreprise,
        COUNT(*) FILTER (WHERE p.company_id IS NULL) AS profiles_sans_entreprise
    FROM profiles p
),
doublons_meme_entreprise AS (
    SELECT COUNT(*) AS count_duplicates
    FROM (
        SELECT p.full_name, p.company_id
        FROM profiles p
        WHERE p.full_name IS NOT NULL 
          AND p.full_name != ''
          AND p.company_id IS NOT NULL
        GROUP BY p.full_name, p.company_id
        HAVING COUNT(*) > 1
    ) sub
),
doublons_entreprises_differentes AS (
    SELECT COUNT(*) AS count_duplicates
    FROM (
        SELECT p.full_name
        FROM profiles p
        WHERE p.full_name IS NOT NULL 
          AND p.full_name != ''
        GROUP BY p.full_name
        HAVING COUNT(DISTINCT p.company_id) > 1 OR (COUNT(DISTINCT p.company_id) = 1 AND COUNT(*) > 1 AND COUNT(*) FILTER (WHERE p.company_id IS NULL) > 0)
    ) sub
)
SELECT 
    s.*,
    COALESCE(d1.count_duplicates, 0) AS groupes_doublons_meme_entreprise,
    COALESCE(d2.count_duplicates, 0) AS groupes_doublons_entreprises_differentes
FROM stats s
CROSS JOIN doublons_meme_entreprise d1
CROSS JOIN doublons_entreprises_differentes d2;

-- 4. Détail complet d'un utilisateur spécifique (à adapter avec le nom)
-- SELECT 
--     p.id,
--     p.full_name,
--     p.email,
--     c.name AS company_name,
--     p.company_id,
--     p.role,
--     p.department,
--     p.created_at,
--     p.updated_at
-- FROM profiles p
-- LEFT JOIN companies c ON p.company_id = c.id
-- WHERE p.full_name = 'NOM_UTILISATEUR'
-- ORDER BY p.created_at;

-- 5. Compter les profils par entreprise avec doublons
SELECT 
    c.name AS entreprise,
    COUNT(DISTINCT p.full_name) AS noms_uniques,
    COUNT(*) AS total_profiles,
    COUNT(*) - COUNT(DISTINCT p.full_name) AS nombre_doublons
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.full_name IS NOT NULL 
  AND p.full_name != ''
  AND p.company_id IS NOT NULL
GROUP BY c.name
HAVING COUNT(*) > COUNT(DISTINCT p.full_name)
ORDER BY nombre_doublons DESC, c.name;


