-- OnpointDoc - Synchronisation des tickets d'assistance depuis Google Sheet (PARTIE 2)
-- Date: 2025-12-09
-- Partie 2 sur 11
-- Tickets: 501 à 1000 sur 5308 total

-- ============================================
-- ÉTAPE 1: Créer la table temporaire
-- ============================================

CREATE TEMP TABLE IF NOT EXISTS temp_assistance_tickets (
  jira_issue_key TEXT NOT NULL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  reporter_name TEXT,
  client_name TEXT,
  contact_user_name TEXT,
  job_title TEXT,
  module_name TEXT,
  submodule_name TEXT,
  canal TEXT,
  priority TEXT,
  status TEXT,
  duration_minutes DECIMAL(10,2),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  recorded_date TIMESTAMPTZ
);

-- ============================================
-- ÉTAPE 2: Insérer les données dans la table temporaire
-- ============================================

INSERT INTO temp_assistance_tickets (
  jira_issue_key,
  title,
  description,
  reporter_name,
  client_name,
  contact_user_name,
  job_title,
  module_name,
  submodule_name,
  canal,
  priority,
  status,
  duration_minutes,
  created_at,
  updated_at,
  recorded_date
) VALUES
('OBCS-9392', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', '2AAZ', 'MARCELLE AHOUSSOU', 'Gérant', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.39, '2025-04-06T13:45:00.000Z'::timestamptz, '2025-04-06T13:45:00.000Z'::timestamptz, '2025-04-01T00:00:00.000Z'::timestamptz),
('OBCS-9388', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MADAME GOURI', 'Responsable RH', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.37, '2025-04-03T18:22:00.000Z'::timestamptz, '2025-04-03T18:22:00.000Z'::timestamptz, '2025-04-02T00:00:00.000Z'::timestamptz),
('OBCS-9387', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.48, '2025-04-03T18:14:00.000Z'::timestamptz, '2025-04-03T18:14:00.000Z'::timestamptz, '2025-04-02T00:00:00.000Z'::timestamptz),
('OBCS-9386', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 13.50, '2025-04-03T18:13:00.000Z'::timestamptz, '2025-04-03T18:13:00.000Z'::timestamptz, '2025-04-02T00:00:00.000Z'::timestamptz),
('OBCS-9385', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.31, '2025-04-03T18:12:00.000Z'::timestamptz, '2025-04-03T18:12:00.000Z'::timestamptz, '2025-04-02T00:00:00.000Z'::timestamptz),
('OBCS-9384', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'CHARLES IPO', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.20, '2025-04-03T18:10:00.000Z'::timestamptz, '2025-04-03T18:10:00.000Z'::timestamptz, '2025-04-02T00:00:00.000Z'::timestamptz),
('OBCS-9383', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'CHARLES IPO', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.17, '2025-04-03T18:10:00.000Z'::timestamptz, '2025-04-03T18:10:00.000Z'::timestamptz, '2025-04-02T00:00:00.000Z'::timestamptz),
('OBCS-9382', 'Assistance sur le traitement du grand livre tiers', 'Assistance sur le traitement du grand livre tiers', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'CHARLES IPO', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.52, '2025-04-03T18:09:00.000Z'::timestamptz, '2025-04-03T18:09:00.000Z'::timestamptz, '2025-04-01T00:00:00.000Z'::timestamptz),
('OBCS-9419', 'Call pour planification de séance de travail', 'Call pour planification de séance de travail', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'MADAME KALOGO', 'Chef de Projet', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.20, '2025-04-11T16:28:00.000Z'::timestamptz, '2025-04-11T16:28:00.000Z'::timestamptz, '2025-04-07T00:00:00.000Z'::timestamptz),
('OBCS-9364', 'Demande d''assistance suppression et correction écriture comptable', 'Vérification et correction écriture comptable', 'Edwige KOUASSI', 'SIT BTP', 'KONE Mariam', 'Comptable', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.20, NULL, NULL, NULL),
('OBCS-9363', 'Correction écriture comptable', 'Vérification et correction écriture comptable', 'Edwige KOUASSI', 'SIT BTP', 'KONE Mariam', 'Comptable', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.43, NULL, NULL, NULL),
('OBCS-9361', 'Assistance', 'Assistance', 'Edwige KOUASSI', 'CILAGRI', 'Nadia Jocelyn Bouazo', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.42, NULL, NULL, NULL),
('OBCS-9355', 'Assistance sur non affichage de formulaire activité', 'Assistance sur non affichage de formulaire activité', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'Amary TCHOTCHE', 'Chef de Projet', 'CRM', 'Activités commerciales', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.60, NULL, NULL, NULL),
('OBCS-9351', 'Extraction grand livre', 'Extraction grand livre', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'CHARLES IPO', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 9.19, NULL, NULL, NULL),
('OBCS-9350', 'Extraction grand livre', 'Extraction grand livre', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'CHARLES IPO', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.35, NULL, NULL, NULL),
('OBCS-9349', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'CHARLES IPO', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 26.49, NULL, NULL, NULL),
('OBCS-9348', 'Extraction grand livre général', 'Extraction grand livre général', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'CHARLES IPO', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 10.59, NULL, NULL, NULL),
('OBCS-9347', 'Extraction grand livre général', 'Extraction grand livre général', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'CHARLES IPO', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.21, NULL, NULL, NULL),
('OBCS-9346', 'Assistance sur suppression de compte tiers client', 'Assistance sur suppression de compte tiers client', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'ERIC KOUADIO', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.36, NULL, NULL, NULL),
('OBCS-9345', 'Assistance sur suppression de compte tiers client', 'Assistance sur suppression de compte tiers client', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'ERIC KOUADIO', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.25, NULL, NULL, NULL),
('OBCS-9344', 'Assistance sur suppression de compte tiers client', 'Assistance sur suppression de compte tiers client', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'ERIC KOUADIO', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.43, NULL, NULL, NULL),
('OBCS-9343', 'Assistance sur suppression de compte tiers client', 'Assistance sur suppression de compte tiers client', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'ERIC KOUADIO', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.21, NULL, NULL, NULL),
('OBCS-9342', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'FRANCIS AURELIEN KOUTOU', 'Consultant Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, NULL, NULL, NULL),
('OBCS-9341', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'FRANCIS AURELIEN KOUTOU', 'Consultant Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.50, NULL, NULL, NULL),
('OBCS-9362', 'Correction écriture comptable', 'Vérification et correction écriture comptable', 'Edwige KOUASSI', 'SIT BTP', 'KONE Mariam', 'Comptable', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.27, NULL, NULL, NULL),
('OBCS-9340', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', '2AAZ', 'MADAME AHOUSSOU', 'Consultant', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.48, NULL, NULL, NULL),
('OBCS-9339', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', '2AAZ', 'MADAME AHOUSSOU', 'Consultant', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.50, NULL, NULL, NULL),
('OBCS-9337', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'KOUAME KONAN GUY ROGER', 'Contrôleur de Gestion', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.12, NULL, NULL, NULL),
('OBCS-9336', 'Planification de séance de travail', 'Planification de séance de travail', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'KOUAME KONAN GUY ROGER', 'Contrôleur de Gestion', 'Finance', 'Budget', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.44, NULL, NULL, NULL),
('OBCS-9335', 'Planification de séance de travail', 'Planification de séance de travail', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'KOUAME KONAN GUY ROGER', 'Contrôleur de Gestion', 'Finance', 'Budget', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.59, NULL, NULL, NULL),
('OBCS-9334', 'Calcul de salaire', 'Calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MADAME GOURI', 'Responsable RH', 'RH', 'Documents', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.32, NULL, NULL, NULL),
('OBCS-9333', 'Calcul de salaire', 'Calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MADAME GOURI', 'Responsable RH', 'RH', 'Documents', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.44, NULL, NULL, NULL),
('OBCS-9332', 'Calcul de salaire', 'Calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MADAME GOURI', 'Responsable RH', 'RH', 'Documents', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.70, NULL, NULL, NULL),
('OBCS-9331', 'Calcul de salaire', 'Calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MADAME GOURI', 'Responsable RH', 'RH', 'Documents', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.54, NULL, NULL, NULL),
('OBCS-9330', 'Calcul de salaire', 'Calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MADAME GOURI', 'Responsable RH', 'RH', 'Documents', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.20, NULL, NULL, NULL),
('OBCS-9329', 'Call sur le traitement de la paie de 2024', 'Call sur le traitement de la paie de 2024', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'MONSIEUR COULIBALY', 'Directeur général', 'RH', 'Documents', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.60, NULL, NULL, NULL),
('OBCS-9302', 'Demande d''édition de bulletin', 'Demande d''édition de bulletin', 'Edwige KOUASSI', 'CILAGRI', 'Léa DIABATE', 'Responsable des Ressources Humaines', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.37, NULL, NULL, NULL),
('OBCS-9301', 'Assistance', 'Assistance', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.20, NULL, NULL, NULL),
('OBCS-9300', 'Relance sur bug lié au Matricule / Enregistrement fichier du personnel', 'Relance sur bug lié au Matricule / Enregistrement fichier du personnel', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.10, NULL, NULL, NULL),
('OBCS-9299', 'Vérification renseignement formulaire et retour', 'Vérification renseignement formulaire et retour', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.53, NULL, NULL, NULL),
('OBCS-9298', 'Enregistrement contrat employé', 'Demande d’assistance sur Enregistrement contrat employé', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.53, NULL, NULL, NULL),
('OBCS-9294', 'Demande de vérification - Revue Accès', 'Demande de vérification - Revue Accès', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.15, NULL, NULL, NULL),
('OBCS-9293', 'Demande de vérification - Revue Accès', 'Demande de vérification - Revue Accès', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.38, NULL, NULL, NULL),
('OBCS-9292', 'Demande de vérification - Revue Accès', 'Demande de vérification - Revue Accès', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.33, NULL, NULL, NULL),
('OBCS-9291', 'Retour Demande revue accès OBC', 'Retour Demande revue accès OBC', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.30, NULL, NULL, NULL),
('OBCS-9290', 'Demande revue accès OBC', 'Demande revue accès OBC', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.52, NULL, NULL, NULL),
('OBCS-9338', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', '2AAZ', 'MADAME AHOUSSOU', 'Consultant', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 14.29, NULL, NULL, NULL),
('OBCS-9286', 'Accès des employés', 'Accès des employés', 'EVA BASSE', 'KOFFI & DIABATE', 'JERONIME GBAGUIDI', 'Assistant(e) Administrative', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.52, NULL, NULL, NULL),
('OBCS-9285', 'Assistance  sur le RAN', 'Assistance  sur le RAN', 'EVA BASSE', 'KOFFI & DIABATE', 'Deen', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.15, NULL, NULL, NULL),
('OBCS-9284', 'Assistance sur le RAN', 'Assistance sur le RAN', 'EVA BASSE', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.23, NULL, NULL, NULL),
('OBCS-9283', 'Assistance sur le RAN', 'Assistance sur le RAN', 'EVA BASSE', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.34, NULL, NULL, NULL),
('OBCS-9282', 'Assistance sur le RAN', 'Assistance sur le RAN', 'EVA BASSE', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 15.40, NULL, NULL, NULL),
('OBCS-9281', 'Assistance sur le RAN', 'Assistance sur le RAN', 'EVA BASSE', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.53, NULL, NULL, NULL),
('OBCS-9280', 'Assistance sur le RAN', 'Assistance sur le RAN', 'EVA BASSE', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.53, NULL, NULL, NULL),
('OBCS-9287', 'Programmation de formation des nouvelles recrues', 'Programmation de formation des nouvelles recrues', 'EVA BASSE', 'KOFFI & DIABATE', 'Hanielle KOUDESSI', 'Autres', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, NULL, NULL, NULL),
('OBCS-9278', 'Paie employé BODOI', 'Paie employé BODOI', 'EVA BASSE', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'Finance', 'Caisse', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.00, NULL, NULL, NULL),
('OBCS-9277', 'Assistance sur RAN', 'Assistance sur RAN', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Directeur Administratif et Financier', 'Finance', 'Caisse', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.00, NULL, NULL, NULL),
('OBCS-9276', 'Assistance sur RAN', 'Assistance sur RAN', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Directeur Administratif et Financier', 'Finance', 'Caisse', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, NULL, NULL, NULL),
('OBCS-9275', 'Assistance sur RAN', 'Assistance sur RAN', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Directeur Administratif et Financier', 'Finance', 'Caisse', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, NULL, NULL, NULL),
('OBCS-9274', 'Assistance sur expression de besoin', 'Assistance sur expression de besoin', 'EVA BASSE', 'KOFFI & DIABATE', 'DAOUDA TIMITE', 'Support IT', 'Finance', 'Caisse', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.24, NULL, NULL, NULL),
('OBCS-9273', 'Demande de sortie de caisse', 'Demande de sortie de caisse', 'EVA BASSE', 'KOFFI & DIABATE', 'Carelle Kipré', 'Assistant(e) Administrative', 'Finance', 'Caisse', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 12.00, NULL, NULL, NULL),
('OBCS-9272', 'Impression grand livre générale', 'Impression grand livre générale', 'EVA BASSE', 'FALCON', 'CHARLES IPO', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.80, NULL, NULL, NULL),
('OBCS-9271', 'Retraitement comptable', 'Retraitement comptable', 'EVA BASSE', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, NULL, NULL, NULL),
('OBCS-9270', 'Retraitement comptable', 'Retraitement comptable', 'EVA BASSE', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.00, NULL, NULL, NULL),
('OBCS-9269', 'Retraitement comptable', 'Retraitement comptable', 'EVA BASSE', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.49, NULL, NULL, NULL),
('OBCS-9268', 'Retraitement comptable', 'Retraitement comptable', 'EVA BASSE', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.20, NULL, NULL, NULL),
('OBCS-9267', 'Retraitement comptable', 'Retraitement comptable', 'EVA BASSE', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 10.39, NULL, NULL, NULL),
('OBCS-9266', 'Assistance sur suivi de requête workflow', 'Assistance sur suivi de requête workflow', 'EVA BASSE', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.70, NULL, NULL, NULL),
('OBCS-9265', 'Retraitement comptable', 'Assistance sur suivi de requête workflow', 'EVA BASSE', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.54, NULL, NULL, NULL),
('OBCS-9279', 'Assistance', 'Assistance', 'EVA BASSE', 'KOFFI & DIABATE', 'MEITE ALASSANE', 'Responsable IT', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.20, NULL, NULL, NULL),
('OBCS-9262', 'Assistance sur suivi de requête workflow', 'Assistance sur suivi de requête workflow', 'EVA BASSE', 'KOFFI & DIABATE', 'KADIA KOFFI', 'Autres', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.22, NULL, NULL, NULL),
('OBCS-9260', 'Appel pour revue workflow Achat sur une expression de besoin', 'Appel pour revue workflow Achat sur une expression de besoin', 'Vivien DAKPOGAN', 'KOFFI & DIABATE', 'M. Méité Alhassane', 'Responsable IT', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.42, NULL, NULL, NULL),
('OBCS-9258', 'Appel sur explication sur process Caisse', 'Appel sur explication sur process Caisse', 'Vivien DAKPOGAN', 'ARIC', 'Kramo', 'Chef Comptable', 'Support', 'Workflow', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 7.02, NULL, NULL, NULL),
('OBCS-9256', 'Retour d''appel - Relance requête Finance', 'Relance requête Finance', 'Edwige KOUASSI', 'CILAGRI', 'Nadia Jocelyn Bouazo', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.42, NULL, NULL, NULL),
('OBCS-9251', 'Assistance', 'Suivi compte - Etat d’avancement', 'Edwige KOUASSI', 'CILAGRI', 'Nadia Jocelyn Bouazo', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.10, NULL, NULL, NULL),
('OBCS-9247', 'Assistance sur facturation Achat, vente + comptabilisation', 'Assistance sur facturation Achat, vente + comptabilisation', 'Vivien DAKPOGAN', '2AAZ', 'MARCELLE AHOUSSOU', 'Gérant', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 27.39, NULL, NULL, NULL),
('OBCS-9261', 'Assistance sur suivi de requête workflow', 'Assistance sur suivi de requête workflow', 'EVA BASSE', 'KOFFI & DIABATE', 'KADIA KOFFI', 'Autres', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 11.50, NULL, NULL, NULL),
('OBCS-9246', 'Appel pour demande d''assistance sur facture Achat', 'Appel pour demande d''assistance sur facture Achat', 'Vivien DAKPOGAN', '2AAZ', 'Mme Ahoussou', 'Gérant', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.42, NULL, NULL, NULL),
('OBCS-9243', 'Suivi compte - Relance séance de travail sur les opérations comptable', 'Suivi compte - Relance séance de travail sur les opérations comptable', 'Edwige KOUASSI', 'CILAGRI', 'Nadia Jocelyn Bouazo', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 10.30, NULL, NULL, NULL),
('OBCS-9245', 'Assistance sur process Achat + RH, revue comptabilisation', 'Assistance sur process Achat + RH, revue comptabilisation', 'Vivien DAKPOGAN', '2AAZ', 'Mme Ahoussou', 'Gérant', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 20.48, NULL, NULL, NULL),
('OBCS-9241', 'Assistance - Document comptable', 'Affichage Grand livre tiers', 'Edwige KOUASSI', 'CILAGRI', 'Nadia Jocelyn Bouazo', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.59, NULL, NULL, NULL),
('OBCS-9242', 'Assistance sur process Achat + RH', 'Assistance sur process Achat + RH', 'Vivien DAKPOGAN', '2AAZ', 'Mme Ahoussou', 'Gérant', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 18.34, NULL, NULL, NULL),
('OBCS-9239', 'Assistance sur enregistrement activité', 'Assistance sur enregistrement activité', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'Amary TCHOTCHE', 'Chef de Projet', 'CRM', 'Activités commerciales', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.50, NULL, NULL, NULL),
('OBCS-9238', 'Assistance sur enregistrement activité', 'Assistance sur enregistrement activité', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'Amary TCHOTCHE', 'Chef de Projet', 'CRM', 'Activités commerciales', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, NULL, NULL, NULL),
('OBCS-9237', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MADAME GOURI', 'Responsable RH', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.28, NULL, NULL, NULL),
('OBCS-9236', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MADAME GOURI', 'Responsable RH', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.55, NULL, NULL, NULL),
('OBCS-9235', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MADAME GOURI', 'Responsable RH', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.32, NULL, NULL, NULL),
('OBCS-9234', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MADAME GOURI', 'Responsable RH', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.21, NULL, NULL, NULL),
('OBCS-9233', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MADAME GOURI', 'Responsable RH', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 8.38, NULL, NULL, NULL),
('OBCS-9232', 'Assistance sur la comptabilité', 'Assistance sur la comptabilité0.59', 'N''GBRA MOYE BERNICE DORIS', 'CSCTICAO', 'SERGE ARIKO', 'Directeur Administratif et Financier', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.10, NULL, NULL, NULL),
('OBCS-9231', 'Assistance sur la comptabilité', 'Assistance sur la comptabilité', 'N''GBRA MOYE BERNICE DORIS', 'CSCTICAO', 'SERGE ARIKO', 'Directeur Administratif et Financier', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.10, NULL, NULL, NULL),
('OBCS-9230', 'Assistance sur le RAN', 'Assistance sur le RAN', 'N''GBRA MOYE BERNICE DORIS', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 7.53, NULL, NULL, NULL),
('OBCS-9229', 'Assistance sur le RAN', 'Assistance sur le RAN', 'N''GBRA MOYE BERNICE DORIS', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.28, NULL, NULL, NULL),
('OBCS-9228', 'Assistance sur le RAN', 'Assistance sur le RAN', 'N''GBRA MOYE BERNICE DORIS', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.32, NULL, NULL, NULL),
('OBCS-9227', 'Assistance sur le RAN', 'Assistance sur le RAN', 'N''GBRA MOYE BERNICE DORIS', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.37, NULL, NULL, NULL),
('OBCS-9226', 'Assistance sur le RAN', 'Assistance sur le RAN', 'N''GBRA MOYE BERNICE DORIS', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 8.10, NULL, NULL, NULL),
('OBCS-9225', 'Assistance sur le RAN', 'Assistance sur le RAN', 'N''GBRA MOYE BERNICE DORIS', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 7.56, NULL, NULL, NULL),
('OBCS-9224', 'Assistance sur la comptabilité', 'Assistance sur la comptabilité', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'CHARLES IPO', 'Chef Comptable', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.21, NULL, NULL, NULL),
('OBCS-9223', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'CHARLES IPO', 'Chef Comptable', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.50, NULL, NULL, NULL),
('OBCS-9222', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'CHARLES IPO', 'Chef Comptable', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.58, NULL, NULL, NULL),
('OBCS-9221', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'CHARLES IPO', 'Chef Comptable', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.23, NULL, NULL, NULL),
('OBCS-9240', 'Assistance sur process Achat + RH', 'Assistance sur process Achat + RH', 'Vivien DAKPOGAN', '2AAZ', 'Mme Ahoussou', 'Gérant', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.14, NULL, NULL, NULL),
('OBCS-9220', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'MONSIEUR KOUAME', 'Contrôleur de Gestion', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.31, NULL, NULL, NULL),
('OBCS-9219', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'MONSIEUR KOUAME', 'Contrôleur de Gestion', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.11, NULL, NULL, NULL),
('OBCS-9218', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'MONSIEUR KOUAME', 'Contrôleur de Gestion', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.32, NULL, NULL, NULL),
('OBCS-9146', 'Assistance sur la paie de Mars 2025', 'Assistance sur la paie de Mars 2025', 'EVA BASSE', 'KOFFI & DIABATE', 'Mme DIANE', 'Responsable RH', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.00, NULL, NULL, NULL),
('OBCS-9145', 'Assistance sur la paie de Mars 2025', 'Assistance sur la paie de Mars 2025', 'EVA BASSE', 'KOFFI & DIABATE', 'Mme DIANE', 'Responsable RH', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.20, NULL, NULL, NULL),
('OBCS-9144', 'Assistance sur expression de besoin', 'Assistance sur expression de besoin', 'EVA BASSE', 'KOFFI & DIABATE', 'LYTA KENA-RABE', 'Contrôleur de Gestion', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.14, NULL, NULL, NULL),
('OBCS-9143', 'Assistance pour demande d''absence d''un employé', 'Assistance pour demande d''absence d''un employé', 'EVA BASSE', 'KOFFI & DIABATE', 'Corinne LADJI', 'Consultant DAF', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.48, NULL, NULL, NULL),
('OBCS-9142', 'Demande de création de l''exercice 2025', 'Demande de création de l''exercice 2025', 'EVA BASSE', 'ROCFED', 'Mme KAMELAN', 'Consultant DAF', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.37, NULL, NULL, NULL),
('OBCS-9141', 'Assistance pour correction d''incohérence comptable', 'Assistance pour correction d''incohérence comptable', 'EVA BASSE', 'KOFFI & DIABATE', 'Mr KOUASSI', 'Chef Comptable', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.45, NULL, NULL, NULL),
('OBCS-9140', 'Assistance pour correction d''incohérence comptable', 'Assistance pour correction d''incohérence comptable', 'EVA BASSE', 'KOFFI & DIABATE', 'Mr KOUASSI', 'Chef Comptable', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.46, NULL, NULL, NULL),
('OBCS-9139', 'Assistance pour correction d''incohérence comptable', 'Assistance pour correction d''incohérence comptable', 'EVA BASSE', 'KOFFI & DIABATE', 'Mr KOUASSI', 'Chef Comptable', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 8.15, NULL, NULL, NULL),
('OBCS-9138', 'Assistance sur le RAN', 'Assistance sur le RAN', 'EVA BASSE', 'EDIPRESSE', 'Mme ZAGBAYOU', 'RAF', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.10, NULL, NULL, NULL),
('OBCS-9137', 'Assistance sur le RAN', 'Assistance sur le RAN', 'EVA BASSE', 'EDIPRESSE', 'Mme ZAGBAYOU', 'RAF', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.25, NULL, NULL, NULL),
('OBCS-9136', 'Assistance sur Imputation comptable', 'Assistance sur Imputation comptable', 'EVA BASSE', 'EDIPRESSE', 'Mme ZAGBAYOU', 'RAF', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.80, NULL, NULL, NULL),
('OBCS-9135', 'Assistance sur Imputation comptable', 'Assistance sur Imputation comptable', 'EVA BASSE', 'EDIPRESSE', 'Mme ZAGBAYOU', 'RAF', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.49, NULL, NULL, NULL),
('OBCS-9105', 'Gestion paie 2024', 'Gestion paie 2024', 'Edwige KOUASSI', 'CILAGRI', 'Léa DIABATE', 'Responsable des Ressources Humaines', 'RH', 'Documents', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.21, NULL, NULL, NULL),
('OBCS-9104', 'Correction données paie 2025', 'Correction données paie 2025', 'Edwige KOUASSI', 'CILAGRI', 'Léa DIABATE', 'Responsable des Ressources Humaines', 'RH', 'Documents', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.30, NULL, NULL, NULL),
('OBCS-9103', 'Demande d''impression de bulletin janv / Fev', 'Demande d''impression de bulletin janv / Fev', 'Edwige KOUASSI', 'CILAGRI', 'Léa DIABATE', 'Responsable des Ressources Humaines', 'RH', 'Documents', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.14, NULL, NULL, NULL),
('OBCS-9102', 'Echange sur la possibilité de calculer les salaires de 2024', 'Echange sur la possibilité de calculer les salaires de 2024', 'Edwige KOUASSI', 'CILAGRI', 'Léa DIABATE', 'Responsable des Ressources Humaines', 'RH', 'Documents', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.54, NULL, NULL, NULL),
  ('OBCS-9101', 'Demande de correction valeur ancienneté', 'Demande de correction valeur ancienneté
Solution :  Vérification contrat et modification date d’embauche', 'Edwige KOUASSI', 'CILAGRI', 'Léa DIABATE', 'Responsable des Ressources Humaines', 'RH', 'Documents', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.44, NULL, NULL, NULL),
('OBCS-9134', 'Assistance sur requête à valider', 'Assistance sur requête à valider', 'EVA BASSE', 'KOFFI & DIABATE', 'KADIA KOFFI', 'Autres', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.22, NULL, NULL, NULL),
('OBCS-9095', 'Assistance', 'Assistance', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.38, NULL, NULL, NULL),
('OBCS-9094', 'Retour prise en compte requête', 'Retour prise en compte requête en cours de traitement', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, NULL, NULL, NULL),
('OBCS-9092', 'Demande de renvoie accès de connexion', 'Demande de renvoie accès de connexion', 'Edwige KOUASSI', 'ECORIGINE', 'Siaka KONE', 'Responsable Logistique', 'Support', 'Gestion des utilisateurs', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.53, NULL, NULL, NULL),
('OBCS-9091', 'Assistance Opération Agro', 'Assistance Opération Agro', 'Edwige KOUASSI', 'ECORIGINE', 'SergMOUZOUN', 'Responsable Achat', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.10, NULL, NULL, NULL),
('OBCS-9090', 'Assistance Opération Agro', 'Assistance Opération Agro', 'Edwige KOUASSI', 'ECORIGINE', 'SergMOUZOUN', 'Responsable Achat', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.27, NULL, NULL, NULL),
('OBCS-9089', 'Assistance Opération Agro', 'Assistance Opération Agro', 'Edwige KOUASSI', 'ECORIGINE', 'SergMOUZOUN', 'Responsable Achat', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.50, NULL, NULL, NULL),
('OBCS-9088', 'Demande d''information concernant fichier import achat agro', 'Demande d''information concernant fichier import achat agro', 'Edwige KOUASSI', 'ECORIGINE', 'SergMOUZOUN', 'Responsable Achat', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, NULL, NULL, NULL),
  ('OBCS-9087', 'Demande de retrait de matricule pour facilité les importation et enregistrement', 'Demande de retrait de matricule pour facilité les importation et enregistrement
Solution : Requête non prise en compte car décisif pour la suite de l’application', 'Edwige KOUASSI', 'ECORIGINE', 'SergMOUZOUN', 'Responsable Achat', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.12, NULL, NULL, NULL),
('OBCS-9093', 'Retour Assistance', 'Retour Assistance', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.29, NULL, NULL, NULL),
('OBCS-9085', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', '2AAZ', 'MADAME AHOUSSOU', 'Consultant', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.19, NULL, NULL, NULL),
('OBCS-9084', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', '2AAZ', 'MADAME AHOUSSOU', 'Consultant', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.41, NULL, NULL, NULL),
('OBCS-9083', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', '2AAZ', 'MADAME AHOUSSOU', 'Consultant', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.48, NULL, NULL, NULL),
('OBCS-9082', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', '2AAZ', 'MADAME AHOUSSOU', 'Consultant', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.13, NULL, NULL, NULL),
('OBCS-9080', 'Calcul de salaire', 'Calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'CSCTICAO', 'SERGE ARIKO', 'Directeur Administratif et Financier', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.51, NULL, NULL, NULL),
('OBCS-9079', 'Calcul de salaire', 'Calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'CSCTICAO', 'SERGE ARIKO', 'Directeur Administratif et Financier', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.56, NULL, NULL, NULL),
('OBCS-9078', 'Calcul de salaire antérieurs', 'Calcul de salaire antérieurs', 'N''GBRA MOYE BERNICE DORIS', 'CSCTICAO', 'SERGE ARIKO', 'Directeur Administratif et Financier', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.16, NULL, NULL, NULL),
('OBCS-9077', 'Calcul de salaire antérieurs', 'Calcul de salaire antérieurs', 'N''GBRA MOYE BERNICE DORIS', 'CSCTICAO', 'SERGE ARIKO', 'Directeur Administratif et Financier', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.51, NULL, NULL, NULL),
('OBCS-9076', 'Assistance sur bon de commande', 'Assistance sur bon de commande', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'KOUAME KONAN GUY ROGER', 'Contrôleur de Gestion', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.39, NULL, NULL, NULL),
('OBCS-9075', 'Assistance sur bon de commande', 'Assistance sur bon de commande', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'KOUAME KONAN GUY ROGER', 'Contrôleur de Gestion', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.34, NULL, NULL, NULL),
('OBCS-9074', 'Assistance sur bon de commande', 'Assistance sur bon de commande', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'KOUAME KONAN GUY ROGER', 'Contrôleur de Gestion', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 8.24, NULL, NULL, NULL),
('OBCS-9073', 'Assistance sur bon de commande', 'Assistance sur bon de commande', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'KOUAME KONAN GUY ROGER', 'Contrôleur de Gestion', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.42, NULL, NULL, NULL),
('OBCS-9072', 'Assistance sur calcul de salaire', 'Assistance sur calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'CHARLES IPO', 'Chef Comptable', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 7.35, NULL, NULL, NULL),
('OBCS-9081', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', '2AAZ', 'MADAME AHOUSSOU', 'Consultant', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.49, NULL, NULL, NULL),
('OBCS-9070', 'Demande de rendez-vous', 'Planification de séance de travail', 'Edwige KOUASSI', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 8.13, NULL, NULL, NULL),
('OBCS-9069', 'Assistance paramétrage', 'Assistance Agro, demande d’ajout d’accès', 'Edwige KOUASSI', 'ECORIGINE', 'SergMOUZOUN', 'Responsable Achat', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.55, NULL, NULL, NULL),
('OBCS-9068', 'Assistance paramétrage', 'Assistance', 'Edwige KOUASSI', 'ECORIGINE', 'SergMOUZOUN', 'Responsable Achat', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.28, NULL, NULL, NULL),
('OBCS-9067', 'Assistance paramétrage', 'Assistance Agro', 'Edwige KOUASSI', 'ECORIGINE', 'SergMOUZOUN', 'Responsable Achat', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.36, NULL, NULL, NULL),
('OBCS-9066', 'Assistance', 'Assistance', 'Edwige KOUASSI', 'ECORIGINE', 'SergMOUZOUN', 'Responsable Achat', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.30, NULL, NULL, NULL),
('OBCS-9062', 'Enregistrement impossible d''une demande d''absence par son assistante', 'Enregistrement impossible d''une demande d''absence par son assistante', 'EVA BASSE', 'KOFFI & DIABATE', 'Jacob N''DJAN', 'Autres', 'Opérations', 'Vente', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.23, NULL, NULL, NULL),
('OBCS-9061', 'Le client signalait un bug sur l''impression des factures ventes', 'Le client signalait un bug sur l''impression des factures ventes', 'EVA BASSE', 'FALCON', 'M. KOUADIO', 'Comptable', 'Opérations', 'Vente', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.31, NULL, NULL, NULL),
('OBCS-9060', 'Notification au client que l''impression des factures ventes possible', 'Notification au client que l''impression des factures ventes est possible', 'EVA BASSE', 'FALCON', 'M. KOUADIO', 'Comptable', 'Opérations', 'Vente', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.31, NULL, NULL, NULL),
('OBCS-9059', 'Relance sur les numéros d''imputations', 'Assistance sur le RAN', 'EVA BASSE', 'KORI TRANSPORT', 'Brahima COULIBALY', 'Data Analyst', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.34, NULL, NULL, NULL),
('OBCS-9058', 'Assistance sur le RAN', 'Assistance sur le RAN', 'EVA BASSE', 'KOFFI & DIABATE', 'Mr KOUAO', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.58, NULL, NULL, NULL),
('OBCS-9057', 'Assistance sur demande d''absence', 'Assistance sur demande d''absence', 'EVA BASSE', 'KOFFI & DIABATE', 'Mr KOUAKOU SEVERIN', 'Autres', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.41, NULL, NULL, NULL),
('OBCS-9056', 'Assistance sur demande d''absence', 'Assistance sur demande d''absence', 'EVA BASSE', 'KOFFI & DIABATE', 'Mr KOUAKOU SEVERIN', 'Autres', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.10, NULL, NULL, NULL),
('OBCS-9055', 'Assistance sur la paie', 'Assistance sur la paie', 'EVA BASSE', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.00, NULL, NULL, NULL),
('OBCS-9054', 'Assistance sur paie multiple', 'Assistance sur paie multiple', 'EVA BASSE', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.19, NULL, NULL, NULL),
('OBCS-9053', 'Assistance sur paie multiple', 'Assistance sur paie multiple', 'EVA BASSE', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.10, NULL, NULL, NULL),
('OBCS-9052', 'Assistance sur paie multiple', 'Assistance sur paie multiple', 'EVA BASSE', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.41, NULL, NULL, NULL),
('OBCS-9051', 'Assistance sur paie multiple', 'Assistance sur paie multiple', 'EVA BASSE', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.30, NULL, NULL, NULL),
('OBCS-9050', 'Assistance sur paie multiple', 'Assistance sur paie multiple', 'EVA BASSE', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, NULL, NULL, NULL),
('OBCS-9049', 'Assistance sur paie multiple', 'Assistance sur paie multiple', 'EVA BASSE', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.20, NULL, NULL, NULL),
('OBCS-9048', 'Demande d''info sur plan comptable importé', 'Assistance sur accès à la modification du plan comptable', 'EVA BASSE', 'KOFFI & DIABATE', 'JEROME KEDE', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.58, NULL, NULL, NULL),
('OBCS-9047', 'Assistance sur accès à la modification du plan comptable', 'Assistance sur accès à la modification du plan comptable', 'EVA BASSE', 'KOFFI & DIABATE', 'JEROME KEDE', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.39, NULL, NULL, NULL),
('OBCS-9043', 'Assistance sur enregistrement de facture', 'Assistance sur enregistrement de facture', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Directeur Administratif et Financier', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.33, NULL, NULL, NULL),
('OBCS-9042', 'Assistance sur enregistrement de facture', 'Assistance sur enregistrement de facture', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Directeur Administratif et Financier', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.19, NULL, NULL, NULL),
('OBCS-9034', 'Assistance', 'Assistance', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.31, NULL, NULL, NULL),
('OBCS-9033', 'Retour information employé Contrat et fichier personnel', 'Retour information employé Contrat et fichier personnel', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.40, NULL, NULL, NULL),
('OBCS-9032', 'Suivi enregistrement données RH', 'Suivi enregistrement données RH', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.70, NULL, NULL, NULL),
('OBCS-9031', 'Demande d''information Intégration employé pour paie 2024', 'Demande d''information Intégration employé pour paie 2024', 'Edwige KOUASSI', 'CILAGRI', 'Léa DIABATE', 'Responsable des Ressources Humaines', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 8.46, NULL, NULL, NULL),
('OBCS-9030', 'Demande d''explication calcul salaire employé', 'Demande d''explication calcul salaire employé', 'Edwige KOUASSI', 'CILAGRI', 'Léa DIABATE', 'Responsable des Ressources Humaines', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.90, NULL, NULL, NULL),
('OBCS-9020', 'Assistance', 'Assistance', 'Edwige KOUASSI', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.40, NULL, NULL, NULL),
('OBCS-9001', 'Assistance sur opération de caise', 'Assistance caisse', 'Edwige KOUASSI', 'ECORIGINE', 'Marie-Yvonne GNAGNE', 'Responsable Achat', 'Finance', 'Caisse', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.10, NULL, NULL, NULL),
  ('OBCS-9000', 'Signal Bog', 'Vérification des opérations enregistré
Analyse et traitement requête.
Constat : Mauvais libellé enregistré dans nature de prestation', 'Edwige KOUASSI', 'ECORIGINE', 'Marie-Yvonne GNAGNE', 'Responsable Achat', 'Finance', 'Caisse', 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 4.32, NULL, NULL, NULL),
('OBCS-8999', 'Assistance et suivi', 'Assistance intégration de données paramétrage', 'Edwige KOUASSI', 'ECORIGINE', 'Serge AMOUZOUN', 'Responsable Achat', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.10, NULL, NULL, NULL),
('OBCS-8998', 'Assistance et suivi', 'Assistance', 'Edwige KOUASSI', 'ECORIGINE', 'Serge AMOUZOUN', 'Responsable Achat', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.17, NULL, NULL, NULL),
('OBCS-8997', 'Assistance et suivi', 'Assistance et suivi', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.38, NULL, NULL, NULL),
('OBCS-8996', 'Assistance et suivi', 'Assistance et suivi', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.26, NULL, NULL, NULL),
  ('OBCS-8995', 'Assistance et suivi', 'Ecriture comptable
Traitement et Importation fournisseur', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 23.52, NULL, NULL, NULL),
('OBCS-8994', 'Assistance et suivi', 'Assistance et suivi', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.10, NULL, NULL, NULL),
('OBCS-8993', 'Assistance et suivi', 'Assistance et suivi', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Activation Specialist', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.32, NULL, NULL, NULL),
('OBCS-8992', 'demande d''explication sur la Gestion des Opérations de caisse', 'demande d''explication sur la Gestion des Opérations de caisse', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Activation Specialist', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.36, NULL, NULL, NULL),
('OBCS-8991', 'Assistance Traitement Paie', 'Assistance Traitement Paie', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Activation Specialist', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.40, NULL, NULL, NULL),
('OBCS-8990', 'Demande d''assistance google Meet', 'Traitement sujet lié à la paie', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Activation Specialist', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.12, NULL, NULL, NULL),
  ('OBCS-8989', 'Assistance utilisateur', 'Revu de processus d’enregistrement de facture
Correction écriture et N° poste comptable', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Activation Specialist', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.00, NULL, NULL, NULL),
('OBCS-8988', 'Revu Agro', 'Revu Agro', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Activation Specialist', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.10, NULL, NULL, NULL),
('OBCS-8987', 'Assistance paramétrage', 'Assistance écriture caisse et processus d’enregistrement', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Activation Specialist', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.19, NULL, NULL, NULL),
('OBCS-8986', 'Assistance et paramétrage', 'Assistance Finance correction d''écriture et Revu processus AGro', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Activation Specialist', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.19, NULL, NULL, NULL),
('OBCS-8985', 'Assistance online', 'Assistance -', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.41, NULL, NULL, NULL),
('OBCS-9071', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'EDIPRESSE', 'MADAME NATHALIE', 'Directeur Administratif et Financier', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.34, NULL, NULL, NULL),
('OBCS-8983', 'Assistance et suivi', 'Assistance et suivi', 'Edwige KOUASSI', 'CILAGRI', 'SERI', 'Responsable Achat', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, NULL, NULL, NULL),
('OBCS-8982', 'Demande revue accès étape de validation workflow', 'Demande revue accès étape de validation workflow', 'Edwige KOUASSI', 'CILAGRI', 'SERI', 'Responsable Achat', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.20, NULL, NULL, NULL),
('OBCS-8981', 'Relance sur point de séance de travail - workflow', 'Relance sur point de séance de travail - workflow', 'Edwige KOUASSI', 'CILAGRI', 'Gerard ATTOUNGBRE', 'Consultant', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.17, NULL, NULL, NULL),
('OBCS-8980', 'Relance sur point de séance de travail - workflow', 'Relance sur point de séance de travail - workflow', 'Edwige KOUASSI', 'CILAGRI', 'Gerard ATTOUNGBRE', 'Consultant', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, NULL, NULL, NULL),
('OBCS-8979', 'Relance sur point de séance de travail - workflow', 'Relance sur point de séance de travail - workflow', 'Edwige KOUASSI', 'CILAGRI', 'Gerard ATTOUNGBRE', 'Consultant', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, NULL, NULL, NULL),
('OBCS-8978', 'demande d''assistance', 'Demande d''assistance', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 7.30, NULL, NULL, NULL),
('OBCS-8969', 'Call pour séance de travail sur enregistrement de stock', 'Call pour séance de travail sur enregistrement de stock', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MONSIEUR ZIRIHI', 'Contrôleur de Gestion', 'Opérations', 'Gestion de stock', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.13, NULL, NULL, NULL),
('OBCS-8968', 'Assistance sur la comptabilisation de la vente', 'Assistance sur la comptabilisation de la vente', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'ERIC KOUADIO', 'Comptable', 'Opérations', 'Vente', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.11, NULL, NULL, NULL),
('OBCS-8967', 'Assistance sur la comptabilisation de la vente', 'Assistance sur la comptabilisation de la vente', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'ERIC KOUADIO', 'Comptable', 'Opérations', 'Vente', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 7.41, NULL, NULL, NULL),
('OBCS-8966', 'Assistance sur la comptabilisation de la vente', 'Assistance sur la comptabilisation de la vente', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'ERIC KOUADIO', 'Comptable', 'Opérations', 'Vente', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.33, NULL, NULL, NULL),
('OBCS-8965', 'Assistance sur la comptabilisation de la vente', 'Assistance sur la comptabilisation de la vente', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'ERIC KOUADIO', 'Comptable', 'Opérations', 'Vente', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.59, NULL, NULL, NULL),
('OBCS-8963', 'Assistance sur le compte utilisateur', 'Assistance sur le compte utilisateur', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'Amary TCHOTCHE', 'Chef de Projet', 'Support', 'Gestion des utilisateurs', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.39, NULL, NULL, NULL),
('OBCS-8962', 'Assistance sur le compte utilisateur', 'Assistance sur le compte utilisateur', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'Amary TCHOTCHE', 'Chef de Projet', 'Support', 'Gestion des utilisateurs', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.18, NULL, NULL, NULL),
('OBCS-8961', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', '2AAZ', 'N''GBECHE CHRISTELLE', 'Comptable', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.51, NULL, NULL, NULL),
('OBCS-8960', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', '2AAZ', 'N''GBECHE CHRISTELLE', 'Comptable', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 9.43, NULL, NULL, NULL),
('OBCS-8970', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'MONSIEUR KOUAME', 'Contrôleur de Gestion', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.12, NULL, NULL, NULL),
('OBCS-8959', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'MONSIEUR KOUAME', 'Contrôleur de Gestion', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.54, NULL, NULL, NULL),
('OBCS-8958', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'MONSIEUR KOUAME', 'Contrôleur de Gestion', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.50, NULL, NULL, NULL),
('OBCS-8957', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'MONSIEUR KOUAME', 'Contrôleur de Gestion', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.29, NULL, NULL, NULL),
('OBCS-8936', 'Assistance sur suivi des workflows', 'Assistance sur suivi des workflows', 'EVA BASSE', 'KOFFI & DIABATE', 'KADIA KOFFI', 'Autres', 'Support', 'Workflow', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 14.26, NULL, NULL, NULL),
('OBCS-8935', 'Assistance sur accès aux users', 'Assistance sur accès aux users', 'EVA BASSE', 'SIS', 'KONE KADER', 'Comptable', 'Support', 'Autres admin. système', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.59, NULL, NULL, NULL),
('OBCS-8934', 'Assistance sur expression de besoin', 'Assistance sur expression de besoin', 'EVA BASSE', 'KOFFI & DIABATE', 'CHRISTELLE KOUA', 'Assistant(e) Administrative', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.41, NULL, NULL, NULL),
('OBCS-8933', 'Assistance sur expression de besoin', 'Explication sur le fonctionnement de la caisse et des natures Assistance sur expression de besoinde prestation', 'EVA BASSE', 'KOFFI & DIABATE', 'CHRISTELLE KOUA', 'Assistant(e) Administrative', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.30, NULL, NULL, NULL),
('OBCS-8932', 'Calcul de salaire', 'Calcul de salaire', 'EVA BASSE', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, NULL, NULL, NULL),
('OBCS-8931', 'Assistance sur processus d''achat', 'Assistance sur processus d''achat', 'EVA BASSE', 'KOFFI & DIABATE', 'DAOUDA TIMITE', 'Support IT', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, NULL, NULL, NULL),
('OBCS-8930', 'Assistance sur synthèse de cotation et explication du processus d''achat', 'Assistance sur synthèse de cotation et explication du processus d''achat', 'EVA BASSE', 'KOFFI & DIABATE', 'DAOUDA TIMITE', 'Support IT', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 9.25, NULL, NULL, NULL),
('OBCS-8929', 'Assistance sur synthèse de cotation', 'Assistance sur synthèse de cotation', 'EVA BASSE', 'KOFFI & DIABATE', 'DAOUDA TIMITE', 'Support IT', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.15, NULL, NULL, NULL),
('OBCS-8928', 'Assistance sur écritures de la caisse en doublon', 'Assistance sur écritures de la caisse en doublon', 'EVA BASSE', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.10, NULL, NULL, NULL),
('OBCS-8927', 'Assistance sur écritures de la caisse en doublon', 'Assistance sur écritures de la caisse en doublon', 'EVA BASSE', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.40, NULL, NULL, NULL),
('OBCS-8926', 'Assistance sur écritures de la caisse en doublon', 'Assistance sur écritures de la caisse en doublon', 'EVA BASSE', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 9.57, NULL, NULL, NULL),
('OBCS-8925', 'Confirmation d''erreurs sur certaines écritures comptables', 'Confirmation d''erreurs sur certaines écritures comptables', 'EVA BASSE', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.30, NULL, NULL, NULL),
('OBCS-8924', 'Assistance sur demande d''absence', 'Assistance sur demande d''absence', 'EVA BASSE', 'KOFFI & DIABATE', 'Mr EUGENE N''ZI', 'Autres', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 12.21, NULL, NULL, NULL),
('OBCS-8923', 'Assistance sur extraction plan comptable général', 'Assistance sur extraction plan comptable général', 'EVA BASSE', 'KOFFI & DIABATE', 'Mr KOUASSI', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.25, NULL, NULL, NULL),
('OBCS-8918', 'Assistance sur natures de prestations', 'Assistance sur natures de prestations', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Directeur Administratif et Financier', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 8.12, NULL, NULL, NULL),
('OBCS-8916', 'Assistance sur contrat des journaliers ; relance RAN 2022  et stock', 'Assistance sur contrat des journaliers ; relance RAN 2022  et stock', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Directeur Administratif et Financier', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.35, NULL, NULL, NULL),
('OBCS-8915', 'Assistance sur contrat des journaliers', 'Assistance sur contrat des journaliers', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Directeur Administratif et Financier', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.40, NULL, NULL, NULL),
('OBCS-8914', 'Assistance sur contrat des journaliers', 'Assistance sur contrat des journaliers', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Directeur Administratif et Financier', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.33, NULL, NULL, NULL),
('OBCS-8913', 'Assistance sur poste comptable à rattacher par employé et contrat des journaliers', 'Assistance sur poste comptable à rattacher par employé et contrat des journaliers', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Directeur Administratif et Financier', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 7.90, NULL, NULL, NULL),
('OBCS-8910', 'L''utilisateur à du mal a se connecter avec son Mot de passe', 'L''utilisateur à du mal a se connecter avec son Mot de passe', 'Edwige KOUASSI', 'CILAGRI', 'Pacome Aikpa', 'Assistant(e) RH', 'Support', 'Gestion des utilisateurs', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.00, NULL, NULL, NULL),
('OBCS-8937', 'Confirmation de séance de travail', 'Confirmation de séance de travail', 'EVA BASSE', 'FIRST CAPITAL', 'Mme COFFIE', 'Directeur Administratif et Financier', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.48, NULL, NULL, NULL),
('OBCS-8909', 'Suivi Client - Etat d''avancement utilisation', 'Suivi client', 'Edwige KOUASSI', 'IVOIRE DEVELOPPEMENT', 'Evelyne COULIBALY', 'Directeur Administratif et Financier', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.45, NULL, NULL, NULL),
('OBCS-8907', 'Demande d''assistance pour un collaborateur', 'Demande d''assistance pour un collaborateur', 'Edwige KOUASSI', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'RAF', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.45, NULL, NULL, NULL),
('OBCS-8894', 'Etat d''avancement Paie 2024', 'Etat d''avancement Paie 2024', 'Edwige KOUASSI', 'CILAGRI', 'Léa DIABATE', 'Responsable des Ressources Humaines', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 8.53, NULL, NULL, NULL),
('OBCS-8893', 'Echange processus d''integration de la  paie 2024', 'Echange sur reconstitution paie 2024', 'Edwige KOUASSI', 'CILAGRI', 'Léa DIABATE', 'Responsable des Ressources Humaines', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 9.44, NULL, NULL, NULL),
('OBCS-8892', 'Exportation livre de paie', 'Exportation livre de paie', 'Edwige KOUASSI', 'CILAGRI', 'Léa DIABATE', 'Responsable des Ressources Humaines', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.40, NULL, NULL, NULL),
('OBCS-8879', 'Appel pour signaler non réception du bulletin de M. Kessin', 'Appel pour signaler non réception du bulletin de M. Kessin', 'Vivien DAKPOGAN', '2AAZ', 'MARCELLE AHOUSSOU', 'Directeur général', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.08, NULL, NULL, NULL),
('OBCS-8877', 'Appel pour discuter des rubriques à prendre en compte dans le brut', 'Appel pour discuter des rubriques à prendre en compte dans le brut', 'Vivien DAKPOGAN', 'ARIC', 'Sanankoua Mickaelle', 'Responsable RH', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 8.21, NULL, NULL, NULL),
('OBCS-8876', 'Appeler Mme Sanankoua afin d''avoir clairement les élements pris en compte du brut', 'Appeler Mme Sanankoua afin d''avoir clairement les élements pris en compte du brut', 'Vivien DAKPOGAN', 'ARIC', 'Sanankoua Mickaelle', 'Responsable RH', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 7.11, NULL, NULL, NULL),
('OBCS-8875', 'Appel pour avoir état des calculs de salaire et écarts constatés', 'Appel pour avoir état des calculs de salaire et écarts constatés', 'Vivien DAKPOGAN', 'ARIC', 'Sanankoua Mickaelle', 'Responsable RH', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.08, NULL, NULL, NULL),
('OBCS-8872', 'Suivi coût projet : Appel pour signaler les montants récupérer en TTC, l''idée est de pouvoir les avoir en HT', 'Suivi coût projet : Appel pour signaler les montants récupérer en TTC, l''idée est de pouvoir les avoir en HT', 'Vivien DAKPOGAN', 'S-TEL', 'Jean-Claude SAMPENNIE', 'Directeur Administratif et Financier', 'Projets', 'Gérer mes projets', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.27, NULL, NULL, NULL),
('OBCS-8866', 'Relance connexion Mr AIPKA Pacome', 'Demande de revue accès AIPKA Pacôme', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Chef du Département des Affaires Juridiques, du Contentieux et des Ressources Humaines', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.00, NULL, NULL, NULL),
('OBCS-8865', 'Demande d''info sur date de contrat de certains employés', 'Demande d''info sur date de contrat de certains employés', 'Edwige KOUASSI', 'CILAGRI', 'Léa DIABATE', 'Responsable des Ressources Humaines', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 7.45, NULL, NULL, NULL),
('OBCS-8864', 'Retour sur info calcul paie - Paramétrage prime de responsabilité', 'Retour sur info calcul paie - Paramétrage prime de responsabilité', 'Edwige KOUASSI', 'CILAGRI', 'Léa DIABATE', 'Responsable des Ressources Humaines', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.19, NULL, NULL, NULL),
('OBCS-8863', 'Demande d''info calcul paie -Paramétrage prime de responsabilité', 'Demande d''info calcul paie -Paramétrage prime de responsabilité', 'Edwige KOUASSI', 'CILAGRI', 'Léa DIABATE', 'Responsable des Ressources Humaines', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.56, NULL, NULL, NULL),
('OBCS-8858', 'Retour après octroiement des accès fonctionnalités + Année Comptable', 'Demande d''actualisation et confirmation après après octroiement des accès fonctionnalités + Année Comptable', 'Edwige KOUASSI', 'CILAGRI', 'Sanata COULIBALY', 'Chef de Projet', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.41, NULL, NULL, NULL),
('OBCS-8854', 'Relance rendez-vous online', 'Relance séance de travail planifier google meet', 'Edwige KOUASSI', 'CILAGRI', 'Aristide Kouadio', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.11, NULL, NULL, NULL),
('OBCS-8853', 'Demande d''assistance', 'Assistance utilisation OBC ! Visualisation des données par sites.', 'Edwige KOUASSI', 'CILAGRI', 'Aristide Kouadio', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.20, NULL, NULL, NULL),
('OBCS-8852', 'Assistance Ecriture manuelle', 'Assistance Ecriture manuelle', 'Edwige KOUASSI', 'CILAGRI', 'Aristide Kouadio', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.30, NULL, NULL, NULL),
('OBCS-8851', 'Assistance utilisation OBC', 'Gestion accès et présentation OBC', 'Edwige KOUASSI', 'CILAGRI', 'Aristide Kouadio', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.29, NULL, NULL, NULL),
('OBCS-8908', 'Suivi Client - Etat d''avancement utilisation', 'Suivi Client - Etat d''avancement utilisation', 'Edwige KOUASSI', 'IVOIRE DEVELOPPEMENT', 'Evelyne COULIBALY', 'Directeur Administratif et Financier', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.21, NULL, NULL, NULL),
('OBCS-8847', 'Assistance sur calcul de paie', 'Assistance sur calcul de paie', 'N''GBRA MOYE BERNICE DORIS', '2AAZ', 'MARCELLE AHOUSSOU', 'Chef de Projet', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.70, NULL, NULL, NULL),
('OBCS-8846', 'Assistance sur calcul de paie', 'Assistance sur calcul de paie', 'N''GBRA MOYE BERNICE DORIS', '2AAZ', 'MARCELLE AHOUSSOU', 'Chef de Projet', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.49, NULL, NULL, NULL),
('OBCS-8845', 'Assistance sur calcul de paie', 'Assistance sur calcul de paie', 'N''GBRA MOYE BERNICE DORIS', '2AAZ', 'MARCELLE AHOUSSOU', 'Chef de Projet', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.17, NULL, NULL, NULL),
('OBCS-8844', 'Assistance sur calcul de paie', 'Assistance sur calcul de paie', 'N''GBRA MOYE BERNICE DORIS', '2AAZ', 'MARCELLE AHOUSSOU', 'Chef de Projet', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.24, NULL, NULL, NULL),
('OBCS-8843', 'Assistance sur calcul de paie', 'Assistance sur calcul de paie', 'N''GBRA MOYE BERNICE DORIS', '2AAZ', 'MARCELLE AHOUSSOU', 'Chef de Projet', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 15.33, NULL, NULL, NULL),
('OBCS-8842', 'Assistance sur calcul de paie', 'Assistance sur calcul de paie', 'N''GBRA MOYE BERNICE DORIS', '2AAZ', 'MARCELLE AHOUSSOU', 'Chef de Projet', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.28, NULL, NULL, NULL),
('OBCS-8841', 'Call pour séance de formation', 'Call pour séance de formation', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'Amary TCHOTCHE', 'Chef de Projet', 'Finance', 'Impôts et taxes', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.48, NULL, NULL, NULL),
('OBCS-8840', 'Call pour séance de formation', 'Call pour séance de formation', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'Amary TCHOTCHE', 'Chef de Projet', 'Finance', 'Impôts et taxes', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.43, NULL, NULL, NULL),
('OBCS-8839', 'assistance sur impôts et taxes', 'assistance sur impôts et taxes', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'CHARLES IPO', 'Chef Comptable', 'Finance', 'Impôts et taxes', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.23, NULL, NULL, NULL),
('OBCS-8838', 'assistance sur impôts et taxes', 'assistance sur impôts et taxes', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'CHARLES IPO', 'Chef Comptable', 'Finance', 'Impôts et taxes', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.48, NULL, NULL, NULL),
('OBCS-8837', 'Ajout dans workflow de programmation', 'Ajout dans workflow de programmation', 'N''GBRA MOYE BERNICE DORIS', 'MATRELEC', 'STEPHANE MOGOU', 'Contrôleur de Gestion', 'Support', 'Workflow', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.50, NULL, NULL, NULL),
('OBCS-8835', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'CSCTICAO', 'SERGE ARIKO', 'Directeur Administratif et Financier', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 7.31, NULL, NULL, NULL),
('OBCS-8834', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'CSCTICAO', 'SERGE ARIKO', 'Directeur Administratif et Financier', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.15, NULL, NULL, NULL),
('OBCS-8833', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'CSCTICAO', 'SERGE ARIKO', 'Directeur Administratif et Financier', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.30, NULL, NULL, NULL),
('OBCS-8832', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'KOUAME KONAN GUY ROGER', 'Contrôleur de Gestion', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.25, NULL, NULL, NULL),
('OBCS-8831', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'KOUAME KONAN GUY ROGER', 'Contrôleur de Gestion', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 7.50, NULL, NULL, NULL),
('OBCS-8830', 'Assistance sur les catégories salariales', 'Assistance sur les catégories salariales', 'N''GBRA MOYE BERNICE DORIS', 'EDIPRESSE', 'MADAME NATHALIE', 'RAF', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.28, NULL, NULL, NULL),
('OBCS-8816', 'Assistance sur demande d''absence', 'Assistance sur demande d''absence', 'EVA BASSE', 'KOFFI & DIABATE', 'Eugènene N''ZI', 'Autres', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.46, NULL, NULL, NULL),
('OBCS-8815', 'Assistance sur demande d''absence', 'Assistance sur demande d''absence', 'EVA BASSE', 'KOFFI & DIABATE', 'Eugènene N''ZI', 'Autres', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.14, NULL, NULL, NULL),
('OBCS-8814', 'Assistance sur demande d''absence', 'Assistance sur demande d''absence', 'EVA BASSE', 'KOFFI & DIABATE', 'Eugènene N''ZI', 'Autres', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.36, NULL, NULL, NULL),
('OBCS-8813', 'Assistance sur demande d''absence', 'Assistance sur demande d''absence', 'EVA BASSE', 'KOFFI & DIABATE', 'Eugènene N''ZI', 'Autres', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.58, NULL, NULL, NULL),
('OBCS-8812', 'Assistance sur fiche client', 'Assistance sur fiche client', 'EVA BASSE', 'EJARA', 'Ousseyni Oumarou', 'Chef Comptable', 'Opérations', 'Vente', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.34, NULL, NULL, NULL),
('OBCS-8811', 'Relance sur requête en cours', 'Relance sur requête en cours', 'EVA BASSE', 'KORI TRANSPORT', 'Brahima COULIBALY', 'Data Analyst', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.34, NULL, NULL, NULL),
('OBCS-8810', 'Relance sur requête en cours', 'Relance sur requête en cours', 'EVA BASSE', 'KORI TRANSPORT', 'Brahima COULIBALY', 'Data Analyst', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.22, NULL, NULL, NULL),
('OBCS-8809', 'Relance sur requête en cours', 'Relance sur requête en cours', 'EVA BASSE', 'KORI TRANSPORT', 'Brahima COULIBALY', 'Data Analyst', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.58, NULL, NULL, NULL),
('OBCS-8808', 'Assistance sur expression de besoin', 'Assistance sur expression de besoin', 'EVA BASSE', 'KOFFI & DIABATE', 'MARILYNE', 'Responsable Commercial & Marketing', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.11, NULL, NULL, NULL),
('OBCS-8807', 'Assistance sur Arbitrage', 'Assistance sur Arbitrage', 'EVA BASSE', 'KOFFI & DIABATE', 'Mr MOHAMED N''DIAYE', 'Autres', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.40, NULL, NULL, NULL),
('OBCS-8806', 'Assistance sur synthèse de cotation', 'Assistance sur synthèse de cotation', 'EVA BASSE', 'KOFFI & DIABATE', 'Jean-Jacques KOUASSI', 'Comptable', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.50, NULL, NULL, NULL),
('OBCS-8805', 'Assistance sur synthèse de cotation', 'Assistance sur synthèse de cotation', 'EVA BASSE', 'KOFFI & DIABATE', 'Jean-Jacques KOUASSI', 'Comptable', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.50, NULL, NULL, NULL),
('OBCS-8848', 'Call pour séance de formation', 'Call pour séance de formation', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MADAME SADJRO', 'Directeur Administratif et Financier', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.58, NULL, NULL, NULL),
('OBCS-8804', 'Informations sur l''indisponibilité du client', 'Informations sur l''indisponibilité du client', 'EVA BASSE', 'KOFFI & DIABATE', 'KADIA KOFFI', 'Autres', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.12, NULL, NULL, NULL),
('OBCS-8803', 'Demande d''infos sur données saisie à la "synthèse de cotation"', 'Demande d''infos sur données saisie à la "synthèse de cotation"', 'EVA BASSE', 'KOFFI & DIABATE', 'JEROME KEDE', 'Comptable', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.15, NULL, NULL, NULL),
('OBCS-8802', 'Assistance sur synthèse de cotation', 'Assistance sur synthèse de cotation', 'EVA BASSE', 'KOFFI & DIABATE', 'LYTA KENA-RABE', 'Contrôleur de Gestion', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.20, NULL, NULL, NULL),
('OBCS-8801', 'Assistance sur synthèse de cotation', 'Assistance sur synthèse de cotation', 'EVA BASSE', 'KOFFI & DIABATE', 'LYTA KENA-RABE', 'Contrôleur de Gestion', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.25, NULL, NULL, NULL),
('OBCS-8797', 'Assistance sur création de compte utilisateur', 'Assistance sur création de compte utilisateur', 'EVA BASSE', 'FIRST CAPITAL', 'Mme KOFFI', 'Assistant(e) Administrative', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.11, NULL, NULL, NULL),
('OBCS-8796', 'Confirmation de rdv', 'Confirmation de rdv', 'EVA BASSE', 'FIRST CAPITAL', 'Mme KOFFI', 'Assistant(e) Administrative', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.55, NULL, NULL, NULL),
('OBCS-8795', 'Indication du lieu de formation', 'Indication du lieu de formation', 'EVA BASSE', 'FIRST CAPITAL', 'Mme KOFFI', 'Assistant(e) Administrative', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.49, NULL, NULL, NULL),
('OBCS-8793', 'Assistance et point des journaux traités', 'Assistance et point des journaux traités', 'EVA BASSE', 'SIS', 'KONE KADER', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.31, NULL, NULL, NULL),
('OBCS-8792', 'Relance sur réquêtes liées aux écritures comptables', 'Relance sur requêtes liées aux écritures comptables', 'EVA BASSE', 'SIS', 'KONE KADER', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.28, NULL, NULL, NULL),
('OBCS-8790', 'Relance sur séance de présentation', 'Relance sur séance de présentation', 'EVA BASSE', 'FIRST CAPITAL', 'HERVE GERARD YOH', 'Directeur général', 'CRM', 'Activités commerciales', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.16, NULL, NULL, NULL),
('OBCS-8789', 'Assistance sur paie', 'Assistance sur paie', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Chef Comptable', 'RH', 'Documents', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 8.20, NULL, NULL, NULL),
('OBCS-8788', 'Relance sur requêtes du bulletin de paie', 'Relance sur requêtes du bulletin de paie', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.52, NULL, NULL, NULL),
('OBCS-8787', 'Assistance sur fiche d''identification fournisseur', 'Assistance sur fiche d''identification fournisseur', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.53, NULL, NULL, NULL),
('OBCS-8786', 'Assistance sur fiche d''identification forunisseur', 'Assistance sur fiche d''identification forunisseur', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.47, NULL, NULL, NULL),
('OBCS-8794', 'Indication du lieu de formation', 'Indication du lieu de formation', 'EVA BASSE', 'FIRST CAPITAL', 'Mme KOFFI', 'Assistant(e) Administrative', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.28, NULL, NULL, NULL),
('OBCS-8738', 'Assistance sur Etats Financiers', 'Assistance sur Etats Financiers', 'EVA BASSE', 'KOFFI & DIABATE', 'Mme OUAYOU', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 10.54, '2025-01-31T00:00:00.000Z'::timestamptz, NULL, '2025-01-31T00:00:00.000Z'::timestamptz),
('OBCS-8737', 'Assistance sur expression de besoin', 'Assistance sur expression de besoin', 'EVA BASSE', 'KOFFI & DIABATE', 'MEITE ALASSANE', 'Responsable IT', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.18, '2025-01-28T00:00:00.000Z'::timestamptz, NULL, '2025-01-28T00:00:00.000Z'::timestamptz),
('OBCS-8736', 'Assistance sur modification de fournisseur', 'Assistance sur modification de fournisseur', 'EVA BASSE', 'KOFFI & DIABATE', 'KEDE JEROME', 'Comptable', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.19, '2025-01-30T00:00:00.000Z'::timestamptz, NULL, '2025-01-30T00:00:00.000Z'::timestamptz),
('OBCS-8739', 'Rendez-vous avec l''expert 03/02/25', 'Rendez-vous avec l''expert 03/02/25', 'Edwige KOUASSI', 'CILAGRI', 'GOSSE Franck', 'Directeur Administratif et Financier', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.00, NULL, NULL, NULL),
('OBCS-8735', 'Programmation de séance de travail', 'Programmation de séance de travail', 'EVA BASSE', 'KOFFI & DIABATE', 'Mme DIANE', 'Responsable RH', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.37, '2025-01-30T00:00:00.000Z'::timestamptz, NULL, '2025-01-30T00:00:00.000Z'::timestamptz),
('OBCS-8733', 'Assistance sur création de projet et relance pour création du compte OBC d''une collaboratrice', 'Assistance sur création de projet et relance pour création du compte OBC d''une collaboratrice', 'EVA BASSE', 'KOFFI & DIABATE', 'Jacob N''DJAN', 'Autres', 'Projets', 'Gérer mes projets', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.00, '2025-01-30T00:00:00.000Z'::timestamptz, NULL, '2025-01-30T00:00:00.000Z'::timestamptz),
('OBCS-8732', 'Paramétrage nature de prestation', 'Paramétrage nature de prestation', 'EVA BASSE', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 19.25, '2025-01-27T00:00:00.000Z'::timestamptz, NULL, '2025-01-27T00:00:00.000Z'::timestamptz),
('OBCS-8731', 'Paramétrage nature de prestation', 'Paramétrage nature de prestation', 'EVA BASSE', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 8.21, '2025-01-27T00:00:00.000Z'::timestamptz, NULL, '2025-01-27T00:00:00.000Z'::timestamptz),
('OBCS-8730', 'Assistance sur paramétrage organigramme', 'Assistance sur paramétrage organigramme', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.00, '2025-01-29T00:00:00.000Z'::timestamptz, NULL, '2025-01-29T00:00:00.000Z'::timestamptz),
('OBCS-8729', 'Assistance sur paramétrage organigramme', 'Assistance sur paramétrage organigramme', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.50, '2025-01-29T00:00:00.000Z'::timestamptz, NULL, '2025-01-29T00:00:00.000Z'::timestamptz),
('OBCS-8728', 'Assistance sur paramétrage organigramme', 'Assistance sur paramétrage organigramme', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.47, '2025-01-29T00:00:00.000Z'::timestamptz, NULL, '2025-01-29T00:00:00.000Z'::timestamptz),
('OBCS-8727', 'Assistance sur la paie , paramétrage rubrique', 'Assistance sur la paie , paramétrage rubrique', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 9.41, '2025-01-30T00:00:00.000Z'::timestamptz, NULL, '2025-01-30T00:00:00.000Z'::timestamptz),
('OBCS-8726', 'Assistance sur la paie , paramétrage rubrique', 'Assistance sur la paie , paramétrage rubrique', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.37, '2025-01-30T00:00:00.000Z'::timestamptz, NULL, '2025-01-30T00:00:00.000Z'::timestamptz),
('OBCS-8725', 'Assistance sur la paie', 'Assistance sur la paie', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.35, '2025-01-30T00:00:00.000Z'::timestamptz, NULL, '2025-01-30T00:00:00.000Z'::timestamptz),
('OBCS-8724', 'Soucis sur workflow et paiement', 'Soucis sur workflow et paiement', 'EVA BASSE', 'SIS', 'KADER KONE', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.23, '2025-01-27T00:00:00.000Z'::timestamptz, NULL, '2025-01-27T00:00:00.000Z'::timestamptz),
('OBCS-8723', 'Soucis sur workflow et paiement', 'Soucis sur workflow et paiement', 'EVA BASSE', 'SIS', 'KADER KONE', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.46, '2025-01-29T00:00:00.000Z'::timestamptz, NULL, '2025-01-29T00:00:00.000Z'::timestamptz),
('OBCS-8722', 'Soucis sur workflow et paiement', 'Soucis sur workflow et paiement', 'EVA BASSE', 'SIS', 'KADER KONE', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.36, '2025-01-29T00:00:00.000Z'::timestamptz, NULL, '2025-01-29T00:00:00.000Z'::timestamptz),
('OBCS-8721', 'Relance sur requête en cours', 'Relance sur requête en cours', 'EVA BASSE', 'SIS', 'KADER KONE', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 7.46, '2025-01-29T00:00:00.000Z'::timestamptz, NULL, '2025-01-29T00:00:00.000Z'::timestamptz),
('OBCS-8720', 'Relance sur requête en cours', 'Relance sur requête en cours', 'EVA BASSE', 'SIS', 'KADER KONE', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.14, '2025-01-29T00:00:00.000Z'::timestamptz, NULL, '2025-01-29T00:00:00.000Z'::timestamptz),
('OBCS-8719', 'Besoin d''assistance sur l''enregistrement d''expression de besoin', 'Besoin d''assistance sur l''enregistrement d''expression de besoin', 'EVA BASSE', 'KOFFI & DIABATE', 'DAOUDA TIMITE', 'Support IT', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.21, '2025-01-28T00:00:00.000Z'::timestamptz, NULL, '2025-01-28T00:00:00.000Z'::timestamptz),
('OBCS-8718', 'Besoin d''assistance sur l''enregistrement d''expression de besoin', 'Besoin d''assistance sur l''enregistrement d''expression de besoin', 'EVA BASSE', 'KOFFI & DIABATE', 'DAOUDA TIMITE', 'Support IT', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.43, '2025-01-28T00:00:00.000Z'::timestamptz, NULL, '2025-01-28T00:00:00.000Z'::timestamptz),
('OBCS-8717', 'Besoin d''assistance sur l''enregistrement d''expression de besoin', 'Besoin d''assistance sur l''enregistrement d''expression de besoin', 'EVA BASSE', 'KOFFI & DIABATE', 'DAOUDA TIMITE', 'Support IT', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.33, '2025-01-28T00:00:00.000Z'::timestamptz, NULL, '2025-01-28T00:00:00.000Z'::timestamptz),
('OBCS-8716', 'Appel pour demande assistance gestionnaire de stock', 'Appel pour demande assistance gestionnaire de stock', 'Vivien DAKPOGAN', 'KORI TRANSPORT', 'M. Coulibaly', 'Chef de Projet', 'Opérations', 'Gestion de stock', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.00, '2025-01-28T00:00:00.000Z'::timestamptz, NULL, '2025-01-28T00:00:00.000Z'::timestamptz),
('OBCS-8714', 'Appel pour révision des comptes tiers salarié pour la caisse', 'Appel pour révision des comptes tiers salarié pour la caisse', 'Vivien DAKPOGAN', 'ARIC', 'Kramo', 'Chef Comptable', 'Finance', 'Trésorerie', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.59, '2025-01-30T00:00:00.000Z'::timestamptz, NULL, '2025-01-30T00:00:00.000Z'::timestamptz),
('OBCS-8713', 'Appel pour signaler non réception du belletin de M. Kessin', 'Appel pour signaler non réception du belletin de M. Kessin', 'Vivien DAKPOGAN', '2AAZ', 'MARCELLE AHOUSSOU', 'Directeur général', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.23, '2025-01-31T00:00:00.000Z'::timestamptz, NULL, '2025-01-31T00:00:00.000Z'::timestamptz),
('OBCS-8712', 'Appel pour signifier traitement de la paie avec une rubrique qui n''affiche pas', 'Appel pour signifier traitement de la paie avec une rubrique qui n''affiche pas', 'Vivien DAKPOGAN', '2AAZ', 'MARCELLE AHOUSSOU', 'Directeur général', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.15, '2025-01-28T00:00:00.000Z'::timestamptz, NULL, '2025-01-28T00:00:00.000Z'::timestamptz),
('OBCS-8703', 'Demande d''information élément constitutif Contrat employé', 'Demande d''information élément constitutif Contrat employé', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 10.00, '2025-01-27T00:00:00.000Z'::timestamptz, NULL, '2025-01-27T00:00:00.000Z'::timestamptz),
('OBCS-8702', 'Demande d''information élément constitutif Contrat employé', 'Demande d''information élément constitutif Contrat employé', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.00, '2025-01-29T00:00:00.000Z'::timestamptz, NULL, '2025-01-29T00:00:00.000Z'::timestamptz),
('OBCS-8701', 'Demande d''information élément constitutif Contrat employé', 'Demande d''information élément constitutif Contrat employé', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.00, '2025-01-30T00:00:00.000Z'::timestamptz, NULL, '2025-01-30T00:00:00.000Z'::timestamptz),
('OBCS-8692', 'Assistance sur les tests en interne', 'Assistance sur les tests en interne', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'KOUAME KONAN GUY ROGER', 'Contrôleur de Gestion', 'RH', 'Salaire', 'Chat WhatsApp'::canal_t, 'Low'::priority_t, 'Resolue', 25.00, '2025-01-31T18:32:00.000Z'::timestamptz, '2025-01-31T18:32:00.000Z'::timestamptz, '2025-01-31T00:00:00.000Z'::timestamptz),
('OBCS-8691', 'Assistance sur les tests en interne', 'Assistance sur les tests en interne', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'KOUAME KONAN GUY ROGER', 'Contrôleur de Gestion', 'RH', 'Salaire', 'Chat WhatsApp'::canal_t, 'Low'::priority_t, 'Resolue', 25.00, '2025-01-31T18:32:00.000Z'::timestamptz, '2025-01-31T18:32:00.000Z'::timestamptz, '2025-01-31T00:00:00.000Z'::timestamptz),
('OBCS-8690', 'Assistance sur paramétrage des catégories salariales', 'Assistance sur paramétrage des catégories salariales', 'N''GBRA MOYE BERNICE DORIS', 'EDIPRESSE', 'MADAME NATHALIE', 'Directeur Administratif et Financier', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.37, '2025-01-31T18:31:00.000Z'::timestamptz, '2025-01-31T18:31:00.000Z'::timestamptz, '2025-01-31T00:00:00.000Z'::timestamptz),
('OBCS-8689', 'Assistance sur paramétrage des catégories salariales', 'Assistance sur paramétrage des catégories salariales', 'N''GBRA MOYE BERNICE DORIS', 'EDIPRESSE', 'MADAME NATHALIE', 'Directeur Administratif et Financier', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.46, '2025-01-31T18:31:00.000Z'::timestamptz, '2025-01-31T18:31:00.000Z'::timestamptz, '2025-01-31T00:00:00.000Z'::timestamptz),
('OBCS-8688', 'Assistance sur le calcul de paie', 'Assistance sur le calcul de paie', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'Jean-Claude SAMPENNIE', 'Directeur Administratif et Financier', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.32, '2025-01-31T18:29:00.000Z'::timestamptz, '2025-01-31T18:29:00.000Z'::timestamptz, '2025-01-30T00:00:00.000Z'::timestamptz),
('OBCS-8687', 'Assistance sur le budget', 'Assistance sur le budget', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'CHARLES IPO', 'Chef Comptable', 'Finance', 'Budget', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.30, '2025-01-31T18:28:00.000Z'::timestamptz, '2025-01-31T18:28:00.000Z'::timestamptz, '2025-01-30T00:00:00.000Z'::timestamptz),
('OBCS-8686', 'Assistance sur le budget', 'Assistance sur le budget', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'CHARLES IPO', 'Chef Comptable', 'Finance', 'Budget', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.41, '2025-01-31T18:28:00.000Z'::timestamptz, '2025-01-31T18:28:00.000Z'::timestamptz, '2025-01-30T00:00:00.000Z'::timestamptz),
('OBCS-8685', 'Assistance sur le budget', 'Assistance sur le budget', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'ERIC KOUADIO', 'Comptable', 'Finance', 'Budget', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.40, '2025-01-31T18:27:00.000Z'::timestamptz, '2025-01-31T18:27:00.000Z'::timestamptz, '2025-01-30T00:00:00.000Z'::timestamptz),
('OBCS-8684', 'Assistance sur bon de commande', 'Assistance sur bon de commande', 'N''GBRA MOYE BERNICE DORIS', 'MATRELEC', 'STEPHANE MOGOU', 'Contrôleur de Gestion', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.44, '2025-01-31T18:27:00.000Z'::timestamptz, '2025-01-31T18:27:00.000Z'::timestamptz, '2025-01-30T00:00:00.000Z'::timestamptz),
('OBCS-8683', 'Assistance sur le calcul de paie', 'Assistance sur le calcul de paie', 'N''GBRA MOYE BERNICE DORIS', 'VENUS DISTRIBUTION', 'KONATE TAYOU', 'Directeur Administratif et Financier', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.50, '2025-01-31T18:25:00.000Z'::timestamptz, '2025-01-31T18:25:00.000Z'::timestamptz, '2025-01-30T00:00:00.000Z'::timestamptz),
('OBCS-8682', 'Assistance sur le calcul de paie', 'Assistance sur le calcul de paie', 'N''GBRA MOYE BERNICE DORIS', 'VENUS DISTRIBUTION', 'KONATE TAYOU', 'Directeur Administratif et Financier', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.14, '2025-01-31T18:25:00.000Z'::timestamptz, '2025-01-31T18:25:00.000Z'::timestamptz, '2025-01-29T00:00:00.000Z'::timestamptz),
('OBCS-8681', 'Call pour l''état des requetes CRM', 'Call pour l''état des requetes CRM', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'KALOGO Nabarakissa', 'Chef de Projet', 'CRM', 'Activités commerciales', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.57, '2025-01-31T18:23:00.000Z'::timestamptz, '2025-01-31T18:23:00.000Z'::timestamptz, '2025-01-30T00:00:00.000Z'::timestamptz),
('OBCS-8734', 'Relance sur requêtes en cours', 'Relance sur requêtes en cours', 'EVA BASSE', 'KORI TRANSPORT', 'M. COULIBALY', 'Data Analyst', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.37, '2025-01-30T00:00:00.000Z'::timestamptz, NULL, '2025-01-30T00:00:00.000Z'::timestamptz),
('OBCS-8680', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'MONSIEUR KOUAME', 'Contrôleur de Gestion', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.25, '2025-01-31T18:20:00.000Z'::timestamptz, '2025-01-31T18:20:00.000Z'::timestamptz, '2025-01-30T00:00:00.000Z'::timestamptz),
('OBCS-8679', 'Assistance sur les formations', 'Assistance sur les formations', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'MONSIEUR KOUAME', 'Contrôleur de Gestion', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.47, '2025-01-31T18:19:00.000Z'::timestamptz, '2025-01-31T18:19:00.000Z'::timestamptz, '2025-01-28T00:00:00.000Z'::timestamptz),
('OBCS-8678', 'Assistance sur les formations', 'Assistance sur les formations', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'MONSIEUR KOUAME', 'Contrôleur de Gestion', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.41, '2025-01-31T18:18:00.000Z'::timestamptz, '2025-01-31T18:18:00.000Z'::timestamptz, '2025-01-27T00:00:00.000Z'::timestamptz),
('OBCS-8676', 'Assistance sur le paramétrage des accès', 'Assistance sur le paramétrage des accès', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'Amary TCHOTCHE', 'Chef de Projet', 'Support', 'Gestion des administrateurs', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.15, '2025-01-31T18:15:00.000Z'::timestamptz, '2025-01-31T18:33:00.000Z'::timestamptz, '2025-01-27T00:00:00.000Z'::timestamptz),
('OBCS-8675', 'Assistance sur le paramétrage des accès', 'Assistance sur le paramétrage des accès', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'Amary TCHOTCHE', 'Chef de Projet', 'Support', 'Gestion des administrateurs', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.40, '2025-01-31T18:15:00.000Z'::timestamptz, '2025-01-31T18:32:00.000Z'::timestamptz, '2025-01-27T00:00:00.000Z'::timestamptz),
  ('OBCS-8663', 'Assistance et Paramétrage', 'Assistance paramétrage comptabilisation nature de prestation,
Enregistrement facture achat;
Programmation et Rgt dette antérieur', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Online (Google Meet, Teams...)'::canal_t, 'Low'::priority_t, 'Resolue', 120.00, '2025-01-31T11:41:00.000Z'::timestamptz, '2025-01-31T11:41:00.000Z'::timestamptz, '2025-01-31T00:00:00.000Z'::timestamptz),
('OBCS-8629', 'Assistance sur effet de commerce', 'Assistance sur effet de commerce', 'EVA BASSE', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.43, '2025-01-26T13:25:00.000Z'::timestamptz, '2025-01-26T13:25:00.000Z'::timestamptz, '2025-01-20T00:00:00.000Z'::timestamptz),
('OBCS-8628', 'Assistance sur effet de commerce', 'Assistance sur effet de commerce', 'EVA BASSE', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.42, '2025-01-26T13:25:00.000Z'::timestamptz, '2025-01-26T13:25:00.000Z'::timestamptz, '2025-01-20T00:00:00.000Z'::timestamptz),
('OBCS-8624', 'Assistance', 'Assistance', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 10.56, '2025-01-26T13:21:00.000Z'::timestamptz, '2025-01-26T13:21:00.000Z'::timestamptz, '2025-01-21T00:00:00.000Z'::timestamptz),
('OBCS-8623', 'Confirmation des formations', 'Confirmation des formations', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.25, '2025-01-26T13:21:00.000Z'::timestamptz, '2025-01-26T13:21:00.000Z'::timestamptz, '2025-01-21T00:00:00.000Z'::timestamptz),
('OBCS-8622', 'Présentation et tests pratiques sur Etats financiers', 'Présentation et tests pratiques sur Etats financiers', 'EVA BASSE', 'FIRST CAPITAL', 'FLORENCE OUAYOU', 'Comptable', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 45.00, '2025-01-26T13:20:00.000Z'::timestamptz, '2025-01-26T13:20:00.000Z'::timestamptz, '2025-01-24T00:00:00.000Z'::timestamptz),
('OBCS-8621', 'Sur les bulletins de gratifications', 'Sur les bulletins de gratifications', 'EVA BASSE', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.51, '2025-01-26T13:19:00.000Z'::timestamptz, '2025-01-26T13:19:00.000Z'::timestamptz, '2025-01-21T00:00:00.000Z'::timestamptz),
('OBCS-8620', 'Sur les bulletins de gratifications', 'Sur les bulletins de gratifications', 'EVA BASSE', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.20, '2025-01-26T13:18:00.000Z'::timestamptz, '2025-01-26T13:18:00.000Z'::timestamptz, '2025-01-21T00:00:00.000Z'::timestamptz),
('OBCS-8619', 'Sur les bulletins de gratifications', 'Sur les bulletins de gratifications', 'EVA BASSE', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.00, '2025-01-26T13:18:00.000Z'::timestamptz, '2025-01-26T13:18:00.000Z'::timestamptz, '2025-01-21T00:00:00.000Z'::timestamptz),
('OBCS-8618', 'Sur les bulletins de gratifications', 'Sur les bulletins de gratifications', 'EVA BASSE', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, '2025-01-26T13:18:00.000Z'::timestamptz, '2025-01-26T13:18:00.000Z'::timestamptz, '2025-01-21T00:00:00.000Z'::timestamptz),
('OBCS-8617', 'Relance sur la programmation de salaire à faire', 'Relance sur la programmation de salaire à faire', 'EVA BASSE', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.15, '2025-01-26T13:18:00.000Z'::timestamptz, '2025-01-26T13:18:00.000Z'::timestamptz, '2025-01-24T00:00:00.000Z'::timestamptz),
('OBCS-8616', 'Assistance sur balance comptable', 'Assistance sur balance comptable', 'EVA BASSE', 'SIS', 'KONE KADER', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 8.50, '2025-01-26T13:16:00.000Z'::timestamptz, '2025-01-26T13:16:00.000Z'::timestamptz, '2025-01-20T00:00:00.000Z'::timestamptz),
('OBCS-8615', 'Relance sur les réquêtes envoyé par mail', 'Relance sur les réquêtes envoyé par mail', 'EVA BASSE', 'SIS', 'KONE KADER', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.45, '2025-01-26T13:16:00.000Z'::timestamptz, '2025-01-26T13:16:00.000Z'::timestamptz, '2025-01-24T00:00:00.000Z'::timestamptz),
('OBCS-8614', 'Relance sur les réquêtes envoyé par mail', 'Relance sur les réquêtes envoyé par mail', 'EVA BASSE', 'SIS', 'KONE KADER', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.43, '2025-01-26T13:16:00.000Z'::timestamptz, '2025-01-26T13:16:00.000Z'::timestamptz, '2025-01-24T00:00:00.000Z'::timestamptz),
('OBCS-8613', 'Tests à faire sur les filtres du grand livre', 'Tests à faire sur les filtres du grand livre', 'EVA BASSE', 'SIS', 'KONE KADER', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.37, '2025-01-26T13:14:00.000Z'::timestamptz, '2025-01-26T13:14:00.000Z'::timestamptz, '2025-01-24T00:00:00.000Z'::timestamptz),
('OBCS-8612', 'Confirmation des disponibilités pour séance de travail en ligne', 'Confirmation des disponibilités pour séance de travail en ligne', 'EVA BASSE', 'FIRST CAPITAL', 'MARIE AUDE COFFIE', 'Assistant(e) de direction', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.28, '2025-01-26T13:10:00.000Z'::timestamptz, '2025-01-26T13:11:00.000Z'::timestamptz, '2025-01-22T00:00:00.000Z'::timestamptz),
('OBCS-8611', 'Programmation de séance de travail en ligne', 'Programmation de séance de travail en ligne', 'EVA BASSE', 'FIRST CAPITAL', 'MARIE AUDE COFFIE', 'Assistant(e) de direction', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.42, '2025-01-26T13:10:00.000Z'::timestamptz, '2025-01-26T13:10:00.000Z'::timestamptz, '2025-01-22T00:00:00.000Z'::timestamptz),
('OBCS-8610', 'Assistance sur enregistrement d''expression de besoin', 'Assistance sur enregistrement d''expression de besoin', 'EVA BASSE', 'KOFFI & DIABATE', 'MARYLINE', 'Autres', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 7.44, '2025-01-26T13:09:00.000Z'::timestamptz, '2025-01-26T13:09:00.000Z'::timestamptz, '2025-01-24T00:00:00.000Z'::timestamptz),
('OBCS-8609', 'Assistance sur affichage grand livre', 'Assistance sur affichage grand livre', 'EVA BASSE', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.17, '2025-01-26T13:07:00.000Z'::timestamptz, '2025-01-26T13:07:00.000Z'::timestamptz, '2025-01-22T00:00:00.000Z'::timestamptz),
('OBCS-8608', 'Demande d''assistance', 'Demande d’assistance calcul salaire', 'Edwige KOUASSI', 'JOEL K PROPERTIES', 'Estelle BOA', 'Assistant(e) RH', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.00, '2025-01-25T15:09:00.000Z'::timestamptz, '2025-01-25T15:09:00.000Z'::timestamptz, '2025-01-24T00:00:00.000Z'::timestamptz),
('OBCS-8607', 'Assistance et paramétrage calcul salaire', 'Assistance et paramétrage calcul salaire', 'Edwige KOUASSI', 'JOEL K PROPERTIES', 'Estelle BOA', 'Assistant(e) RH', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 51.00, '2025-01-25T15:07:00.000Z'::timestamptz, '2025-01-25T15:07:00.000Z'::timestamptz, '2025-01-24T00:00:00.000Z'::timestamptz),
('OBCS-8606', 'Demande d''assistance', 'Demande d’assistance', 'Edwige KOUASSI', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 8.00, '2025-01-25T14:59:00.000Z'::timestamptz, '2025-01-25T15:00:00.000Z'::timestamptz, '2025-01-23T00:00:00.000Z'::timestamptz),
('OBCS-8605', 'Revue processus workflow', 'Revue processus workflow', 'Edwige KOUASSI', 'CILAGRI', 'Nadia Jocelyn Bouazo', 'Chef Comptable', 'Support', 'Workflow', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.00, '2025-01-25T14:57:00.000Z'::timestamptz, '2025-01-25T14:57:00.000Z'::timestamptz, '2025-01-23T00:00:00.000Z'::timestamptz),
('OBCS-8604', 'Demande d''info contrat employé', 'Demande d''info contrat employé', 'Edwige KOUASSI', 'CILAGRI', 'Léa DIABATE', 'Responsable des Ressources Humaines', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.00, '2025-01-25T14:55:00.000Z'::timestamptz, '2025-01-25T14:55:00.000Z'::timestamptz, '2025-01-23T00:00:00.000Z'::timestamptz),
('OBCS-8603', 'Correction donnée contrat employé', 'Correction donnée contrat employé', 'Edwige KOUASSI', 'CILAGRI', 'Léa DIABATE', 'Responsable des Ressources Humaines', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.00, '2025-01-25T14:54:00.000Z'::timestamptz, '2025-01-25T14:54:00.000Z'::timestamptz, '2025-01-23T00:00:00.000Z'::timestamptz),
('OBCS-8602', 'Edition OD & demande d''absence', 'Edition OD & demande d''absence', 'Edwige KOUASSI', 'CILAGRI', 'Léa DIABATE', 'Responsable des Ressources Humaines', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.00, '2025-01-25T14:53:00.000Z'::timestamptz, '2025-01-25T14:53:00.000Z'::timestamptz, '2025-01-21T00:00:00.000Z'::timestamptz),
('OBCS-8601', 'MAJ Grade', 'MAJ Grade', 'Edwige KOUASSI', 'CILAGRI', 'Léa DIABATE', 'Responsable des Ressources Humaines', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.00, '2025-01-25T14:52:00.000Z'::timestamptz, '2025-01-25T14:52:00.000Z'::timestamptz, '2025-01-20T00:00:00.000Z'::timestamptz),
('OBCS-8600', 'MAJ Grade', 'MAJ Grade', 'Edwige KOUASSI', 'CILAGRI', 'Léa DIABATE', 'Responsable des Ressources Humaines', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.00, '2025-01-25T14:52:00.000Z'::timestamptz, '2025-01-25T14:52:00.000Z'::timestamptz, '2025-01-20T00:00:00.000Z'::timestamptz),
('OBCS-8599', 'MAJ Grade', 'MAJ Grade', 'Edwige KOUASSI', 'CILAGRI', 'Léa DIABATE', 'Responsable des Ressources Humaines', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.00, '2025-01-25T14:51:00.000Z'::timestamptz, '2025-01-25T14:51:00.000Z'::timestamptz, '2025-01-20T00:00:00.000Z'::timestamptz),
('OBCS-8596', 'Appel pour signaler 2 points traités : l''automatisation des primes/indemnités + Filtre sur fichier du personnel', 'Appel pour signaler 2 points traités : l''automatisation des primes/indemnités + Filtre sur fichier du personnel', 'Vivien DAKPOGAN', 'KORI TRANSPORT', 'Mme Traoré', 'Consultant', 'RH', 'Paramétrage', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.59, '2025-01-25T14:10:00.000Z'::timestamptz, '2025-01-25T14:10:00.000Z'::timestamptz, '2025-01-23T00:00:00.000Z'::timestamptz),
('OBCS-8677', 'Assistance sur les formations', 'Assistance sur les formations', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'MONSIEUR KOUAME', 'Contrôleur de Gestion', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.12, '2025-01-31T18:18:00.000Z'::timestamptz, '2025-01-31T18:18:00.000Z'::timestamptz, '2025-01-27T00:00:00.000Z'::timestamptz),
('OBCS-8594', 'Retour sur correction contrat', 'Retour sur correction contrat', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Responsable Achat', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.00, '2025-01-25T13:49:00.000Z'::timestamptz, '2025-01-25T13:49:00.000Z'::timestamptz, '2025-01-23T00:00:00.000Z'::timestamptz),
('OBCS-8595', 'Appel pour planifier séance de travail avec M. Yoh', 'Appel pour planifier séance de travail avec M. Yoh', 'Vivien DAKPOGAN', 'FIRST CAPITAL', 'Mlle Koffi', 'Assistant(e) Administrative', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.34, '2025-01-25T14:06:00.000Z'::timestamptz, '2025-01-25T14:06:00.000Z'::timestamptz, '2025-01-23T00:00:00.000Z'::timestamptz),
('OBCS-8592', 'Correction contrat', 'Correction contrat et ajout', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Responsable Achat', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.00, '2025-01-25T13:36:00.000Z'::timestamptz, '2025-01-25T13:36:00.000Z'::timestamptz, '2025-01-23T00:00:00.000Z'::timestamptz),
('OBCS-8591', 'Assistance Enregistrement demande d''absence', 'Assistance Enregistrement demande d''absence', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Responsable Achat', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 8.00, '2025-01-25T13:35:00.000Z'::timestamptz, '2025-01-25T13:35:00.000Z'::timestamptz, '2025-01-23T00:00:00.000Z'::timestamptz),
('OBCS-8590', 'Mise à jour Contrat employé', 'Mise à jour Contrat employé', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Responsable Achat', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 11.00, '2025-01-25T13:34:00.000Z'::timestamptz, '2025-01-25T13:34:00.000Z'::timestamptz, '2025-01-23T00:00:00.000Z'::timestamptz),
('OBCS-8589', 'retour sur Requête sur document RH', 'Requête sur document RH', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Responsable Achat', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.00, '2025-01-25T13:33:00.000Z'::timestamptz, '2025-01-25T13:33:00.000Z'::timestamptz, '2025-01-22T00:00:00.000Z'::timestamptz),
('OBCS-8593', 'Appel pour signaler réception de document', 'Appel pour signaler réception de document', 'Vivien DAKPOGAN', '2AAZ', 'Mme Ahoussou', 'Directeur général', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.18, '2025-01-25T13:44:00.000Z'::timestamptz, '2025-01-25T13:44:00.000Z'::timestamptz, '2025-01-23T00:00:00.000Z'::timestamptz),
('OBCS-8588', 'Appel pour signifier envoie fichier de recueil de données', 'Appel pour signifier envoie fichier de recueil de données', 'Vivien DAKPOGAN', '2AAZ', 'Mme Ahoussou', 'Directeur général', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.18, '2025-01-25T13:13:00.000Z'::timestamptz, '2025-01-25T13:13:00.000Z'::timestamptz, '2025-01-23T00:00:00.000Z'::timestamptz),
('OBCS-8586', 'Appel pour signaler traitement bug sur article', 'Appel pour signaler traitement bug sur article', 'Vivien DAKPOGAN', 'KORI TRANSPORT', 'M. Benoit', 'Responsable Logistique', 'Opérations', 'Gestion de stock', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.39, '2025-01-25T12:48:00.000Z'::timestamptz, '2025-01-25T12:48:00.000Z'::timestamptz, '2025-01-24T00:00:00.000Z'::timestamptz),
('OBCS-8585', 'Appel pour signaler lenteur de la fonctionnalité', 'Appel pour signaler lenteur de la fonctionnalité', 'Vivien DAKPOGAN', 'KORI TRANSPORT', 'M. Benoit', 'Responsable Logistique', 'Opérations', 'Gestion de stock', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.07, '2025-01-25T12:41:00.000Z'::timestamptz, '2025-01-25T12:41:00.000Z'::timestamptz, '2025-01-23T00:00:00.000Z'::timestamptz),
('OBCS-8584', 'Appel pour planifier séance de travail afin d''aborder les sujets de caisse + facturation', 'Appel pour planifier séance de travail afin d''aborder les sujets de caisse + facturation', 'Vivien DAKPOGAN', 'ARIC', 'Kramo', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.44, '2025-01-25T12:21:00.000Z'::timestamptz, '2025-01-25T12:21:00.000Z'::timestamptz, '2025-01-23T00:00:00.000Z'::timestamptz),
('OBCS-8583', 'Appel pour notifier l''envoi du plan comptable pour intégration sur cameroun', 'Appel pour notifier l''envoi du plan comptable pour intégration sur cameroun', 'Vivien DAKPOGAN', 'ARIC', 'Kramo', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.56, '2025-01-25T12:13:00.000Z'::timestamptz, '2025-01-25T12:13:00.000Z'::timestamptz, '2025-01-21T00:00:00.000Z'::timestamptz),
('OBCS-8579', 'Demande d''assistance', 'Demande d''assistance', 'Edwige KOUASSI', 'LABOGEM', 'zirihi simon', 'Gestionnaire de Stock', 'Opérations', 'Gestion de stock', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.00, '2025-01-25T09:52:00.000Z'::timestamptz, '2025-01-25T09:52:00.000Z'::timestamptz, '2025-01-22T00:00:00.000Z'::timestamptz),
('OBCS-8578', 'Assistance paramétrage stock', 'Assistance paramétrage stock', 'Edwige KOUASSI', 'EGBV', 'zirihi simon', 'Gestionnaire de Stock', 'Opérations', 'Gestion de stock', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.00, '2025-01-25T09:32:00.000Z'::timestamptz, '2025-01-25T09:32:00.000Z'::timestamptz, '2025-01-15T00:00:00.000Z'::timestamptz),
('OBCS-8577', 'Retour après traitement frequête', 'Retour après traitement requête', 'Edwige KOUASSI', 'EJARA', 'Ousseyni Oumarou', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, '2025-01-25T09:30:00.000Z'::timestamptz, '2025-01-25T09:30:00.000Z'::timestamptz, '2025-01-24T00:00:00.000Z'::timestamptz),
('OBCS-8576', 'Retour après Vérification', 'Retour après observation / Vérification', 'Edwige KOUASSI', 'EJARA', 'Ousseyni Oumarou', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.00, '2025-01-25T09:30:00.000Z'::timestamptz, '2025-01-25T09:30:00.000Z'::timestamptz, '2025-01-24T00:00:00.000Z'::timestamptz),
('OBCS-8575', 'Assistance paramétrage catégorie salariale', 'Assistance paramétrage catégorie salariale', 'Edwige KOUASSI', 'EJARA', 'Ousseyni Oumarou', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, '2025-01-25T09:28:00.000Z'::timestamptz, '2025-01-25T09:29:00.000Z'::timestamptz, '2025-01-24T00:00:00.000Z'::timestamptz),
('OBCS-8565', 'Assistance paramétrage', 'Assistance paramétrage', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Finance', 'Paramétrage', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 10.00, '2025-01-25T09:18:00.000Z'::timestamptz, '2025-01-25T09:18:00.000Z'::timestamptz, '2025-01-20T00:00:00.000Z'::timestamptz),
('OBCS-8587', 'Appel pour faire un point sur le retour du boss +envoi fichier de recueil', 'Appel pour faire un point sur le retour du boss +envoi fichier de recueil', 'Vivien DAKPOGAN', '2AAZ', 'Mme Ahoussou', 'Directeur général', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.29, '2025-01-25T13:02:00.000Z'::timestamptz, '2025-01-25T13:02:00.000Z'::timestamptz, '2025-01-23T00:00:00.000Z'::timestamptz),
('OBCS-8554', 'Formation sur OBC', 'Formation sur OBC', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'MONSIEUR KOUAME', 'Contrôleur de Gestion', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.28, '2025-01-24T22:34:00.000Z'::timestamptz, '2025-01-24T22:34:00.000Z'::timestamptz, '2025-01-24T00:00:00.000Z'::timestamptz),
('OBCS-8553', 'Formation sur OBC', 'Formation sur OBC', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'MONSIEUR KOUAME', 'Contrôleur de Gestion', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.22, '2025-01-24T22:33:00.000Z'::timestamptz, '2025-01-24T22:33:00.000Z'::timestamptz, '2025-01-24T00:00:00.000Z'::timestamptz),
('OBCS-8552', 'Formation sur OBC', 'Formation sur OBC', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'MONSIEUR KOUAME', 'Contrôleur de Gestion', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.49, '2025-01-24T22:33:00.000Z'::timestamptz, '2025-01-24T22:33:00.000Z'::timestamptz, '2025-01-23T00:00:00.000Z'::timestamptz),
('OBCS-8550', 'Calcul de salaire', 'Calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'Jean-Claude SAMPENNIE', 'Directeur Administratif et Financier', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.38, '2025-01-24T22:28:00.000Z'::timestamptz, '2025-01-24T22:28:00.000Z'::timestamptz, '2025-01-24T00:00:00.000Z'::timestamptz),
('OBCS-8549', 'Calcul de salaire', 'Calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'Jean-Claude SAMPENNIE', 'Directeur Administratif et Financier', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.30, '2025-01-24T22:28:00.000Z'::timestamptz, '2025-01-24T22:28:00.000Z'::timestamptz, '2025-01-24T00:00:00.000Z'::timestamptz),
('OBCS-8548', 'Calcul de salaire', 'Calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'Jean-Claude SAMPENNIE', 'Directeur Administratif et Financier', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.16, '2025-01-24T22:27:00.000Z'::timestamptz, '2025-01-24T22:27:00.000Z'::timestamptz, '2025-01-24T00:00:00.000Z'::timestamptz),
('OBCS-8547', 'Calcul de salaire', 'Calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'Jean-Claude SAMPENNIE', 'Directeur Administratif et Financier', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.55, '2025-01-24T22:27:00.000Z'::timestamptz, '2025-01-24T22:27:00.000Z'::timestamptz, '2025-01-24T00:00:00.000Z'::timestamptz),
('OBCS-8546', 'Calcul de salaire', 'Calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'Jean-Claude SAMPENNIE', 'Directeur Administratif et Financier', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.50, '2025-01-24T22:26:00.000Z'::timestamptz, '2025-01-24T22:26:00.000Z'::timestamptz, '2025-01-23T00:00:00.000Z'::timestamptz),
('OBCS-8545', 'Calcul de salaire', 'Calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'Jean-Claude SAMPENNIE', 'Directeur Administratif et Financier', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.50, '2025-01-24T22:26:00.000Z'::timestamptz, '2025-01-24T22:26:00.000Z'::timestamptz, '2025-01-24T00:00:00.000Z'::timestamptz),
('OBCS-8551', 'Formation sur OBC', 'Formation sur OBC', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MADAME SADJRO', 'Directeur Administratif et Financier', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.48, '2025-01-24T22:30:00.000Z'::timestamptz, '2025-01-24T22:30:00.000Z'::timestamptz, '2025-01-23T00:00:00.000Z'::timestamptz),
('OBCS-8544', 'formation sur OBC', 'formation sur OBC', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MONSIEUR ZIHIRI', 'Contrôleur de Gestion', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.20, '2025-01-24T22:22:00.000Z'::timestamptz, '2025-01-24T22:22:00.000Z'::timestamptz, '2025-01-24T00:00:00.000Z'::timestamptz),
('OBCS-8543', 'formation sur OBC', 'formation sur OBC', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MONSIEUR ZIHIRI', 'Contrôleur de Gestion', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.50, '2025-01-24T22:22:00.000Z'::timestamptz, '2025-01-24T22:22:00.000Z'::timestamptz, '2025-01-22T00:00:00.000Z'::timestamptz),
('OBCS-8542', 'formation sur OBC', 'formation sur OBC', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MONSIEUR ZIHIRI', 'Contrôleur de Gestion', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.34, '2025-01-24T22:21:00.000Z'::timestamptz, '2025-01-24T22:36:00.000Z'::timestamptz, '2025-01-22T00:00:00.000Z'::timestamptz),
('OBCS-8541', 'Paramétrage de comptes clients', 'Paramétrage de comptes clients', 'N''GBRA MOYE BERNICE DORIS', '2AAZ', 'MADAME AHOUSSOU', 'Consultant', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.54, '2025-01-24T22:17:00.000Z'::timestamptz, '2025-01-24T22:17:00.000Z'::timestamptz, '2025-01-22T00:00:00.000Z'::timestamptz),
('OBCS-8538', 'Assistance  - Rajout du type de prestation dans le fichier d''importation', 'Création Fournisseur - Rajout du type de prestation dans le fichier d''importation', 'Edwige KOUASSI', 'ECORIGINE', 'Serge AMOUZOUN', 'Contrôleur de Gestion', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 30.00, '2025-01-24T10:39:00.000Z'::timestamptz, '2025-01-24T10:39:00.000Z'::timestamptz, '2025-01-23T00:00:00.000Z'::timestamptz),
('OBCS-8537', 'Assistance Création fiche Client / Fournisseur', 'Assistance Création fiche Client / Fournisseur', 'Edwige KOUASSI', 'ECORIGINE', 'Serge AMOUZOUN', 'Assistant(e) Logisticien', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.00, '2025-01-24T08:38:00.000Z'::timestamptz, '2025-01-24T08:38:00.000Z'::timestamptz, '2025-01-23T00:00:00.000Z'::timestamptz),
  ('OBCS-8536', 'RH/Gestion des Employés/Contrat Employé : Bien que les grade soient créer il n''apparaissent pas dans le contrat', 'Bien que les grade soient créer il n''apparaissent pas dans le contrat
Proposition Séance Google Meet pour visualisation', 'Edwige KOUASSI', 'EJARA', 'Ousseyni Oumarou', 'Comptable', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.00, '2025-01-24T08:33:00.000Z'::timestamptz, '2025-01-24T08:33:00.000Z'::timestamptz, '2025-01-24T00:00:00.000Z'::timestamptz),
('OBCS-8528', 'Séance de travail online', 'Séance de travail online', 'Edwige KOUASSI', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.00, '2025-01-20T08:30:00.000Z'::timestamptz, '2025-01-20T08:30:00.000Z'::timestamptz, '2025-01-20T00:00:00.000Z'::timestamptz),
('OBCS-8527', 'Séance de travail online', 'Séance de travail online', 'Edwige KOUASSI', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 66.00, '2025-01-20T08:29:00.000Z'::timestamptz, '2025-01-20T08:29:00.000Z'::timestamptz, '2025-01-20T00:00:00.000Z'::timestamptz),
('OBCS-8525', 'Assistance sur les livres comptables', 'Assistance sur les livres comptables', 'EVA BASSE', 'FIRST CAPITAL', 'FLORENCE OUAYOU', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.44, '2025-01-19T16:29:00.000Z'::timestamptz, '2025-01-19T16:29:00.000Z'::timestamptz, '2025-01-17T00:00:00.000Z'::timestamptz),
('OBCS-8524', 'Assistance sur les livres comptables', 'Assistance sur les livres comptables', 'EVA BASSE', 'FIRST CAPITAL', 'FLORENCE OUAYOU', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.43, '2025-01-19T16:29:00.000Z'::timestamptz, '2025-01-19T16:29:00.000Z'::timestamptz, '2025-01-17T00:00:00.000Z'::timestamptz),
('OBCS-8540', 'Paramétrage de comptes clients', 'Paramétrage de comptes clients', 'N''GBRA MOYE BERNICE DORIS', '2AAZ', 'MADAME AHOUSSOU', 'Consultant', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.40, '2025-01-24T22:17:00.000Z'::timestamptz, '2025-01-24T22:17:00.000Z'::timestamptz, '2025-01-22T00:00:00.000Z'::timestamptz),
('OBCS-8515', 'Assistance sur arbitrage', 'Assistance sur arbitrage', 'EVA BASSE', 'KOFFI & DIABATE', 'M. N''DIAYE', 'Comptable', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.50, '2025-01-19T15:49:00.000Z'::timestamptz, '2025-01-19T15:49:00.000Z'::timestamptz, '2025-01-17T00:00:00.000Z'::timestamptz),
('OBCS-8514', 'Assistance sur écritures comptables', 'Assistance sur écritures comptables', 'EVA BASSE', 'SIS', 'M. Koné', 'Comptable', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.20, '2025-01-19T15:49:00.000Z'::timestamptz, '2025-01-19T15:49:00.000Z'::timestamptz, '2025-01-17T00:00:00.000Z'::timestamptz),
('OBCS-8513', 'Assistance sur workflow', 'Assistance sur workflow', 'EVA BASSE', 'KOFFI & DIABATE', 'M. Koné', 'Comptable', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.14, '2025-01-19T15:48:00.000Z'::timestamptz, '2025-01-19T15:48:00.000Z'::timestamptz, '2025-01-17T00:00:00.000Z'::timestamptz),
('OBCS-8512', 'Assistance sur workflow', 'Assistance sur workflow', 'EVA BASSE', 'KOFFI & DIABATE', 'M. Kouassi', 'Comptable', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.20, '2025-01-19T15:48:00.000Z'::timestamptz, '2025-01-19T15:48:00.000Z'::timestamptz, '2025-01-17T00:00:00.000Z'::timestamptz),
('OBCS-8511', 'Assistance OBC', 'Assistance OBC', 'EVA BASSE', 'KOFFI & DIABATE', 'Miss DAN', 'Comptable', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.00, '2025-01-19T15:47:00.000Z'::timestamptz, '2025-01-19T15:47:00.000Z'::timestamptz, '2025-01-17T00:00:00.000Z'::timestamptz),
('OBCS-8510', 'Assistance OBC', 'Assistance OBC', 'EVA BASSE', 'KOFFI & DIABATE', 'Miss DAN', 'Comptable', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.31, '2025-01-19T15:46:00.000Z'::timestamptz, '2025-01-19T15:46:00.000Z'::timestamptz, '2025-01-17T00:00:00.000Z'::timestamptz),
('OBCS-8508', 'Assistance sur exécution de paiement.', 'Assistance sur exécution de paiement.', 'Joël SIE', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'RH', 'Documents', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.00, '2025-01-19T13:49:00.000Z'::timestamptz, '2025-01-19T13:49:00.000Z'::timestamptz, '2025-01-15T00:00:00.000Z'::timestamptz),
('OBCS-8507', 'Signaler un bug sur l''affichage des bulletins.', 'Signaler un bug sur l''affichage des bulletins.', 'Joël SIE', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'RH', 'Documents', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.00, '2025-01-19T13:47:00.000Z'::timestamptz, '2025-01-19T13:47:00.000Z'::timestamptz, '2025-01-13T00:00:00.000Z'::timestamptz),
('OBCS-8506', 'Assistance sur la balance.', 'Assistance sur la balance.', 'Joël SIE', 'SIS', 'KONE KADER', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 7.00, '2025-01-19T13:43:00.000Z'::timestamptz, '2025-01-19T13:43:00.000Z'::timestamptz, '2025-01-13T00:00:00.000Z'::timestamptz),
('OBCS-8505', 'Appel pour si202gnaler toujours le non alignement de la paie de Cissé Yasmine du mois de Septembre 2024', 'Appel pour si202gnaler toujours le non alignement de la paie de Cissé Yasmine du mois de Septembre 2024', 'Vivien DAKPOGAN', 'S-TEL', 'Jean-Claude SAMPENNIE', 'Directeur Administratif et Financier', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.10, '2025-01-18T07:22:00.000Z'::timestamptz, '2025-01-18T07:22:00.000Z'::timestamptz, '2025-01-15T00:00:00.000Z'::timestamptz),
('OBCS-8503', 'Appel pour signaler l''inaccessibilité de la GED', 'Appel pour signaler l''inaccessibilité de la GED', 'Vivien DAKPOGAN', 'KORI TRANSPORT', 'Brahima COULIBALY', 'Data Analyst', 'Support', 'Autres admin. système', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.45, '2025-01-18T07:17:00.000Z'::timestamptz, '2025-01-18T07:17:00.000Z'::timestamptz, '2025-01-17T00:00:00.000Z'::timestamptz),
('OBCS-8502', 'Retour after vérification message d''erreur - Traitement fichier import et exportation', 'Traitement fichier import et exportation', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.00, '2025-01-18T02:14:00.000Z'::timestamptz, '2025-01-18T02:14:00.000Z'::timestamptz, '2025-01-17T00:00:00.000Z'::timestamptz),
('OBCS-8501', 'Traitement fichier import et exportation', 'Traitement fichier import et exportation', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.00, '2025-01-18T02:12:00.000Z'::timestamptz, '2025-01-18T02:12:00.000Z'::timestamptz, '2025-01-17T00:00:00.000Z'::timestamptz),
('OBCS-8498', 'Enregistrement stock initial et revu processus de stock', 'Enregistrement stock initial et revu processus de stock', 'Edwige KOUASSI', 'CILAGRI', 'Kevin Akpatou', 'Assistant(e) Gestionnaire Stock', 'Opérations', 'Gestion de stock', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.00, '2025-01-18T02:00:00.000Z'::timestamptz, '2025-01-18T02:00:00.000Z'::timestamptz, '2025-01-18T00:00:00.000Z'::timestamptz),
('OBCS-8497', 'Retour après résolution requête liée aux accès', 'Retour après résolution requête liée aux accès', 'Edwige KOUASSI', 'CILAGRI', 'Natacha Seri', 'Responsable Achat', 'Support', 'Gestion des utilisateurs', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.00, '2025-01-17T15:16:00.000Z'::timestamptz, '2025-01-17T15:16:00.000Z'::timestamptz, '2025-01-16T00:00:00.000Z'::timestamptz),
('OBCS-8496', 'Demande d''accès', 'Demande d''accès', 'Edwige KOUASSI', 'CILAGRI', 'Natacha Seri', 'Responsable Achat', 'Support', 'Gestion des utilisateurs', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.00, '2025-01-17T15:15:00.000Z'::timestamptz, '2025-01-17T15:15:00.000Z'::timestamptz, '2025-01-16T00:00:00.000Z'::timestamptz),
('OBCS-8491', 'Retour après essaye Rapprochement bancaire', 'Retour après essaye Rapprochement bancaire', 'Edwige KOUASSI', 'JOEL K PROPERTIES', 'Raïssa CAMARA', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.00, '2025-01-17T14:10:00.000Z'::timestamptz, '2025-01-17T14:10:00.000Z'::timestamptz, '2025-01-17T00:00:00.000Z'::timestamptz),
('OBCS-8490', 'Assistance sur synthèse de cotations', 'Assistance sur synthèse de cotations', 'EVA BASSE', 'KOFFI & DIABATE', 'DAOUDA TIMITE', 'Support IT', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 9.00, '2025-01-17T12:48:00.000Z'::timestamptz, '2025-01-17T12:48:00.000Z'::timestamptz, '2025-01-16T00:00:00.000Z'::timestamptz),
('OBCS-8489', 'Assistance sur la paie de Janvier 2025', 'Assistance sur la paie de Janvier 2025', 'EVA BASSE', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.46, '2025-01-17T12:47:00.000Z'::timestamptz, '2025-01-17T12:47:00.000Z'::timestamptz, '2025-01-16T00:00:00.000Z'::timestamptz),
('OBCS-8488', 'Assistance sur la paie de Janvier 2025', 'Assistance sur la paie de Janvier 2025', 'EVA BASSE', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.90, '2025-01-17T12:46:00.000Z'::timestamptz, '2025-01-17T12:46:00.000Z'::timestamptz, '2025-01-16T00:00:00.000Z'::timestamptz),
('OBCS-8487', 'Assistance sur la paie de Janvier 2025', 'Assistance sur la paie de Janvier 2025', 'EVA BASSE', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.10, '2025-01-17T12:46:00.000Z'::timestamptz, '2025-01-17T12:46:00.000Z'::timestamptz, '2025-01-16T00:00:00.000Z'::timestamptz),
('OBCS-8486', 'Assistance sur la paie de Janvier 2025', 'Assistance sur la paie de Janvier 2025', 'EVA BASSE', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.31, '2025-01-17T12:46:00.000Z'::timestamptz, '2025-01-17T12:46:00.000Z'::timestamptz, '2025-01-16T00:00:00.000Z'::timestamptz),
('OBCS-8485', 'Assistance sur la paie de Janvier 2025', 'Assistance sur la paie de Janvier 2025', 'EVA BASSE', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.30, '2025-01-17T12:46:00.000Z'::timestamptz, '2025-01-17T12:46:00.000Z'::timestamptz, '2025-01-16T00:00:00.000Z'::timestamptz),
('OBCS-8484', 'Assistance sur la paie de Janvier 2025', 'Assistance sur la paie de Janvier 2025', 'EVA BASSE', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.33, '2025-01-17T12:45:00.000Z'::timestamptz, '2025-01-17T12:45:00.000Z'::timestamptz, '2025-01-16T00:00:00.000Z'::timestamptz),
('OBCS-8483', 'Assistance sur la paie de Janvier 2025', 'Assistance sur la paie de Janvier 2025', 'EVA BASSE', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.39, '2025-01-17T12:45:00.000Z'::timestamptz, '2025-01-17T12:45:00.000Z'::timestamptz, '2025-01-16T00:00:00.000Z'::timestamptz),
('OBCS-8482', 'Assistance sur la paie de Janvier 2025', 'Assistance sur la paie de Janvier 2025', 'EVA BASSE', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.15, '2025-01-17T12:45:00.000Z'::timestamptz, '2025-01-17T12:45:00.000Z'::timestamptz, '2025-01-16T00:00:00.000Z'::timestamptz),
('OBCS-8481', 'Assistance sur la paie de Janvier 2025', 'Assistance sur la paie de Janvier 2025', 'EVA BASSE', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.00, '2025-01-17T12:44:00.000Z'::timestamptz, '2025-01-17T12:45:00.000Z'::timestamptz, '2025-01-16T00:00:00.000Z'::timestamptz),
('OBCS-8480', 'Assistance sur les traites', 'Assistance sur les traites', 'EVA BASSE', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.31, '2025-01-17T12:40:00.000Z'::timestamptz, '2025-01-17T12:40:00.000Z'::timestamptz, '2025-01-16T00:00:00.000Z'::timestamptz),
('OBCS-8479', 'Assistance sur les traites', 'Assistance sur les traites', 'EVA BASSE', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 8.35, '2025-01-17T12:39:00.000Z'::timestamptz, '2025-01-17T12:39:00.000Z'::timestamptz, '2025-01-16T00:00:00.000Z'::timestamptz),
('OBCS-8478', 'Assistance sur les traites', 'Assistance sur les traites', 'EVA BASSE', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.36, '2025-01-17T12:39:00.000Z'::timestamptz, '2025-01-17T12:39:00.000Z'::timestamptz, '2025-01-16T00:00:00.000Z'::timestamptz),
('OBCS-8477', 'Assistance sur la paie', 'Assistance sur la paie', 'EVA BASSE', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.36, '2025-01-17T12:36:00.000Z'::timestamptz, '2025-01-17T12:36:00.000Z'::timestamptz, '2025-01-15T00:00:00.000Z'::timestamptz),
('OBCS-8476', 'Assistance sur la paie', 'Assistance sur la paie', 'EVA BASSE', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, '2025-01-17T12:35:00.000Z'::timestamptz, '2025-01-17T12:35:00.000Z'::timestamptz, '2025-01-15T00:00:00.000Z'::timestamptz),
('OBCS-8475', 'Assistance sur la paie', 'Assistance sur la paie', 'EVA BASSE', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, '2025-01-17T12:34:00.000Z'::timestamptz, '2025-01-17T12:34:00.000Z'::timestamptz, '2025-01-13T00:00:00.000Z'::timestamptz),
('OBCS-8474', 'Assistance sur la paie', 'Assistance sur la paie', 'EVA BASSE', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.18, '2025-01-17T12:34:00.000Z'::timestamptz, '2025-01-17T12:34:00.000Z'::timestamptz, '2025-01-13T00:00:00.000Z'::timestamptz),
('OBCS-8473', 'Assistance sur la paie', 'Assistance sur la paie', 'EVA BASSE', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.51, '2025-01-17T12:34:00.000Z'::timestamptz, '2025-01-17T12:34:00.000Z'::timestamptz, '2025-01-13T00:00:00.000Z'::timestamptz),
('OBCS-8472', 'Assistance sur la paie', 'Assistance sur la paie', 'EVA BASSE', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.11, '2025-01-17T12:34:00.000Z'::timestamptz, '2025-01-17T12:34:00.000Z'::timestamptz, '2025-01-13T00:00:00.000Z'::timestamptz),
('OBCS-8471', 'Assistance sur les états financiers', 'Assistance sur les états financiers', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Responsable Admin & FI', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 11.11, '2025-01-17T12:27:00.000Z'::timestamptz, '2025-01-17T12:27:00.000Z'::timestamptz, '2025-01-15T00:00:00.000Z'::timestamptz),
('OBCS-8470', 'Assistance sur les états financiers', 'Assistance sur les états financiers', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Responsable Admin & FI', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 11.58, '2025-01-17T12:27:00.000Z'::timestamptz, '2025-01-17T12:27:00.000Z'::timestamptz, '2025-01-15T00:00:00.000Z'::timestamptz),
('OBCS-8469', 'Assistance sur les états financiers', 'Assistance sur les états financiers', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Responsable Admin & FI', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, '2025-01-17T12:27:00.000Z'::timestamptz, '2025-01-17T12:27:00.000Z'::timestamptz, '2025-01-15T00:00:00.000Z'::timestamptz),
('OBCS-8468', 'Assistance sur les états financiers', 'Assistance sur les états financiers', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Responsable Admin & FI', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 10.24, '2025-01-17T12:27:00.000Z'::timestamptz, '2025-01-17T12:27:00.000Z'::timestamptz, '2025-01-15T00:00:00.000Z'::timestamptz),
('OBCS-8467', 'Assistance sur les états financiers', 'Assistance sur les états financiers', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Responsable Admin & FI', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.58, '2025-01-17T12:26:00.000Z'::timestamptz, '2025-01-17T12:26:00.000Z'::timestamptz, '2025-01-16T00:00:00.000Z'::timestamptz),
('OBCS-8466', 'Assistance sur les états financiers', 'Assistance sur les états financiers', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Responsable Admin & FI', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.58, '2025-01-17T12:26:00.000Z'::timestamptz, '2025-01-17T12:26:00.000Z'::timestamptz, '2025-01-17T00:00:00.000Z'::timestamptz),
('OBCS-8465', 'Assistance sur les états financiers', 'Assistance sur les états financiers', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Responsable Admin & FI', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.17, '2025-01-17T12:25:00.000Z'::timestamptz, '2025-01-17T12:25:00.000Z'::timestamptz, '2025-01-17T00:00:00.000Z'::timestamptz),
('OBCS-8464', 'Assistance sur les états financiers', 'Assistance sur les états financiers', 'EVA BASSE', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Responsable Admin & FI', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.17, '2025-01-17T12:25:00.000Z'::timestamptz, '2025-01-17T12:25:00.000Z'::timestamptz, '2025-01-17T00:00:00.000Z'::timestamptz),
('OBCS-8463', 'Assistance sur la comptabilité', 'Assistance sur la comptabilité', 'EVA BASSE', 'SIS', 'KONE KADER', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.32, '2025-01-17T12:24:00.000Z'::timestamptz, '2025-01-17T12:24:00.000Z'::timestamptz, '2025-01-16T00:00:00.000Z'::timestamptz),
('OBCS-8462', 'Assistance sur la comptabilité', 'Assistance sur la comptabilité', 'EVA BASSE', 'SIS', 'KONE KADER', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, '2025-01-17T12:23:00.000Z'::timestamptz, '2025-01-17T12:23:00.000Z'::timestamptz, '2025-01-16T00:00:00.000Z'::timestamptz),
('OBCS-8461', 'Assistance sur la comptabilité', 'Assistance sur la comptabilité', 'EVA BASSE', 'SIS', 'KONE KADER', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.50, '2025-01-17T12:23:00.000Z'::timestamptz, '2025-01-17T12:23:00.000Z'::timestamptz, '2025-01-16T00:00:00.000Z'::timestamptz),
('OBCS-8509', 'Assistance OBC', 'Assistance OBC', 'EVA BASSE', 'KOFFI & DIABATE', 'Miss DAN', 'Comptable', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.59, '2025-01-19T15:46:00.000Z'::timestamptz, '2025-01-19T15:46:00.000Z'::timestamptz, '2025-01-17T00:00:00.000Z'::timestamptz),
('OBCS-8457', 'Relance sur création de compte OBC de Monsieur Capet', 'Relance sur création de compte OBC de Monsieur Capet', 'EVA BASSE', 'KOFFI & DIABATE', 'Miss DAN', 'Comptable', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.35, '2025-01-17T12:12:00.000Z'::timestamptz, '2025-01-17T12:12:00.000Z'::timestamptz, '2025-01-17T00:00:00.000Z'::timestamptz),
  ('OBCS-8455', 'Mode d''Affichage Grand livre / Balance', 'Mode d''Affichage Grand livre / Balance
Possibilité d’afficher les doc en portrait ou paysage selon le voulu de l’utilisateur', 'Edwige KOUASSI', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 8.00, '2025-01-17T12:12:00.000Z'::timestamptz, '2025-01-17T12:12:00.000Z'::timestamptz, '2025-01-17T00:00:00.000Z'::timestamptz),
('OBCS-8456', 'Relance sur création de compte OBC de Monsieur Capet', 'Relance sur création de compte OBC de Monsieur Capet', 'EVA BASSE', 'KOFFI & DIABATE', 'Miss DAN', 'Comptable', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.22, '2025-01-17T12:12:00.000Z'::timestamptz, '2025-01-17T12:12:00.000Z'::timestamptz, '2025-01-17T00:00:00.000Z'::timestamptz),
('OBCS-8453', 'Revue Accès RH', 'Revue Accès RH', 'Edwige KOUASSI', 'JOEL K PROPERTIES', 'Rachel AKA', 'Directeur général', 'Finance', 'Comptabilité Générale', 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 4.00, '2025-01-17T12:08:00.000Z'::timestamptz, '2025-01-17T12:08:00.000Z'::timestamptz, '2025-01-17T00:00:00.000Z'::timestamptz),
('OBCS-8452', 'Entretien sur processus vente - Ecritures Comptable', 'Entretien sur processus vente - Ecritures Comptable', 'Edwige KOUASSI', 'JOEL K PROPERTIES', 'Rachel AKA', 'Directeur général', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 7.00, '2025-01-17T12:07:00.000Z'::timestamptz, '2025-01-17T12:07:00.000Z'::timestamptz, '2025-01-17T00:00:00.000Z'::timestamptz),
('OBCS-8437', 'Sys Validation expression de besoin', 'Sys Validation expression de besoin', 'Edwige KOUASSI', 'KOFFI & DIABATE', 'Lita KENA', 'Contrôleur de Gestion', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.00, '2025-01-15T11:27:00.000Z'::timestamptz, '2025-01-15T11:27:00.000Z'::timestamptz, '2025-01-13T00:00:00.000Z'::timestamptz),
('OBCS-8436', 'Assistance enregistrement expression de besoin', 'Assistance enregistrement expression de besoin', 'Edwige KOUASSI', 'KOFFI & DIABATE', 'Lita KENA', 'Contrôleur de Gestion', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.00, '2025-01-15T11:26:00.000Z'::timestamptz, '2025-01-15T11:26:00.000Z'::timestamptz, '2025-01-13T00:00:00.000Z'::timestamptz),
('OBCS-8435', 'Demande d''assistance Online - Google Meet', 'Demande d''assistance Online - Google Meet', 'Edwige KOUASSI', '2AAZ', 'MARCELLE AHOUSSOU', 'Directeur général', 'Support', 'Gestion des utilisateurs', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, '2025-01-15T11:23:00.000Z'::timestamptz, '2025-01-15T11:23:00.000Z'::timestamptz, '2025-01-14T00:00:00.000Z'::timestamptz),
('OBCS-8434', 'Demande d''assistance Online - Google Meet', 'Demande d''assistance Online - Google Meet', 'Edwige KOUASSI', '2AAZ', 'MARCELLE AHOUSSOU', 'Directeur général', 'Support', 'Gestion des utilisateurs', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.00, '2025-01-15T11:23:00.000Z'::timestamptz, '2025-01-15T11:23:00.000Z'::timestamptz, '2025-01-14T00:00:00.000Z'::timestamptz),
('OBCS-8433', 'Demande d''assistance activation compte OBC', 'Demande d''assistance activation compte OBC', 'Edwige KOUASSI', 'CILAGRI', 'Aristide Kouadio', 'Comptable', 'Support', 'Gestion des utilisateurs', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.00, '2025-01-15T11:21:00.000Z'::timestamptz, '2025-01-15T11:21:00.000Z'::timestamptz, '2025-01-14T00:00:00.000Z'::timestamptz),
('OBCS-8432', 'Retour après vérification et résolution', 'Retour après vérification et résolution', 'Edwige KOUASSI', 'CILAGRI', 'Aristide Kouadio', 'Comptable', 'Support', 'Gestion des utilisateurs', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, '2025-01-15T11:21:00.000Z'::timestamptz, '2025-01-15T11:21:00.000Z'::timestamptz, '2025-01-15T00:00:00.000Z'::timestamptz),
('OBCS-8431', 'Redéfinition password user', 'Assistance activation compte utilisateur', 'Edwige KOUASSI', 'CILAGRI', 'Aristide Kouadio', 'Comptable', 'Support', 'Gestion des utilisateurs', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.00, '2025-01-15T11:20:00.000Z'::timestamptz, '2025-01-15T11:20:00.000Z'::timestamptz, '2025-01-15T00:00:00.000Z'::timestamptz),
('OBCS-8430', 'Création Compte utilisateurs', 'Création Compte utilisateurs & assistance activation', 'Edwige KOUASSI', 'CILAGRI', 'Aristide Kouadio', 'Comptable', 'Support', 'Gestion des utilisateurs', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.00, '2025-01-15T11:16:00.000Z'::timestamptz, '2025-01-15T11:16:00.000Z'::timestamptz, '2025-01-15T00:00:00.000Z'::timestamptz),
('OBCS-8454', 'Planification séance de travail  en pésentiel', 'Planification séance de travail  en présentiel', 'Edwige KOUASSI', 'JOEL K PROPERTIES', 'Joel A', 'Comptable', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.00, '2025-01-17T12:09:00.000Z'::timestamptz, '2025-01-17T12:09:00.000Z'::timestamptz, '2025-01-17T00:00:00.000Z'::timestamptz),
('OBCS-8411', 'Assistance sur expression de besoin + comptabilité', 'Assistance sur expression de besoin + comptabilité', 'Vivien DAKPOGAN', 'KOFFI & DIABATE', 'LYTA KENA-RABE', 'Contrôleur de Gestion', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.08, '2025-01-12T18:56:00.000Z'::timestamptz, '2025-01-12T18:56:00.000Z'::timestamptz, '2025-01-10T00:00:00.000Z'::timestamptz),
('OBCS-8410', 'Assistance sur exercice comptable', 'Assistance sur exercice comptable', 'Vivien DAKPOGAN', 'KORI TRANSPORT', 'Brahima COULIBALY', 'Data Analyst', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.15, '2025-01-12T18:55:00.000Z'::timestamptz, '2025-01-12T18:55:00.000Z'::timestamptz, '2025-01-09T00:00:00.000Z'::timestamptz),
('OBCS-8409', 'Correction nombre d''enfant pour correction IGR', 'Correction nombre d''enfant pour correction IGR', 'Edwige KOUASSI', 'IVOIRE DEVELOPPEMENT', 'Evelyne COULIBALY', 'Responsable RH', 'RH', 'Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.00, '2025-01-11T19:15:00.000Z'::timestamptz, '2025-01-11T19:15:00.000Z'::timestamptz, '2025-01-08T00:00:00.000Z'::timestamptz),
('OBCS-8406', 'Assistance Projet & Création de site', 'Assistance Projet & Création de site', 'Edwige KOUASSI', 'KOFFI & DIABATE', 'Emmanuel KOUKPOLOU', 'Autres', 'Support', 'Paramétrage sur fonctionnalités', 'Chat WhatsApp'::canal_t, 'Low'::priority_t, 'Resolue', 5.00, '2025-01-11T19:11:00.000Z'::timestamptz, '2025-01-11T19:11:00.000Z'::timestamptz, '2025-01-08T00:00:00.000Z'::timestamptz),
('OBCS-8405', 'Accès Workflow entité Archi', 'Accès Workflow entité Archi', 'Edwige KOUASSI', 'KOFFI & DIABATE', 'LYTA KENA-RABE', 'Autres', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.00, '2025-01-11T19:09:00.000Z'::timestamptz, '2025-01-11T19:09:00.000Z'::timestamptz, '2025-01-10T00:00:00.000Z'::timestamptz),
('OBCS-8404', 'Relance requête Finance', 'Relance requête Finance et revue workl', 'Edwige KOUASSI', 'CILAGRI', 'Nadia Jocelyn Bouazo', 'Chef Comptable', 'Finance', 'Caisse', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 7.00, '2025-01-11T18:58:00.000Z'::timestamptz, '2025-01-11T18:58:00.000Z'::timestamptz, '2025-01-08T00:00:00.000Z'::timestamptz),
('OBCS-8403', 'Signal bug sur compta', 'Signal bug sur compta', 'Edwige KOUASSI', 'CILAGRI', 'Nadia Jocelyn Bouazo', 'Chef Comptable', 'Finance', 'Caisse', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.00, '2025-01-11T18:55:00.000Z'::timestamptz, '2025-01-11T18:55:00.000Z'::timestamptz, '2025-01-08T00:00:00.000Z'::timestamptz),
('OBCS-8402', 'Relance sur requête', 'Relance sur requête', 'Edwige KOUASSI', 'CILAGRI', 'Nadia Jocelyn Bouazo', 'Chef Comptable', 'Finance', 'Caisse', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.00, '2025-01-11T18:55:00.000Z'::timestamptz, '2025-01-11T18:55:00.000Z'::timestamptz, '2025-01-06T00:00:00.000Z'::timestamptz),
('OBCS-8399', 'Assistance Via Google Meet', 'Assistance Création et suppression famille ou catégorie d’article', 'Edwige KOUASSI', 'CILAGRI', 'Natacha Seri', 'Responsable Achat', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 8.00, '2025-01-11T18:50:00.000Z'::timestamptz, '2025-01-11T18:50:00.000Z'::timestamptz, '2025-01-06T00:00:00.000Z'::timestamptz),
('OBCS-8397', 'Assistance validation', 'Assistance validation', 'Edwige KOUASSI', 'CILAGRI', 'Natacha Seri', 'Responsable Achat', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.00, '2025-01-11T18:45:00.000Z'::timestamptz, '2025-01-11T18:45:00.000Z'::timestamptz, '2025-01-06T00:00:00.000Z'::timestamptz),
('OBCS-8396', 'Assistance Gest Stock', 'Assistance Gest Stock', 'Edwige KOUASSI', 'CILAGRI', 'Natacha Seri', 'Responsable Achat', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.00, '2025-01-11T18:45:00.000Z'::timestamptz, '2025-01-11T18:45:00.000Z'::timestamptz, '2025-01-06T00:00:00.000Z'::timestamptz),
('OBCS-8395', 'Assistance Gest Stock', 'Assistance Gest Stock', 'Edwige KOUASSI', 'CILAGRI', 'Natacha Seri', 'Responsable Achat', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 18.00, '2025-01-11T18:44:00.000Z'::timestamptz, '2025-01-11T18:44:00.000Z'::timestamptz, '2025-01-06T00:00:00.000Z'::timestamptz),
('OBCS-8394', 'Assistance et Planification séance de travail', 'Assistance et Planification séance de travail', 'Edwige KOUASSI', 'CILAGRI', 'Natacha Seri', 'Responsable Achat', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 18.00, '2025-01-11T18:44:00.000Z'::timestamptz, '2025-01-11T18:44:00.000Z'::timestamptz, '2025-01-06T00:00:00.000Z'::timestamptz),
('OBCS-8393', 'Planification séance de travail', 'Planification séance de travail', 'Edwige KOUASSI', 'CILAGRI', 'Natacha Seri', 'Responsable Achat', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.00, '2025-01-11T18:43:00.000Z'::timestamptz, '2025-01-11T18:43:00.000Z'::timestamptz, '2025-01-06T00:00:00.000Z'::timestamptz),
('OBCS-8392', 'Vérification et correction bug que les ordre de mission enregistré et validé', 'Vérification et correction bug que les ordre de mission enregistré et validé', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.00, '2025-01-11T18:40:00.000Z'::timestamptz, '2025-01-11T18:40:00.000Z'::timestamptz, '2025-01-07T00:00:00.000Z'::timestamptz),
('OBCS-8391', 'Assistance enregistrement ordre de mission', 'Assistance enregistrement ordre de mission', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.00, '2025-01-11T18:39:00.000Z'::timestamptz, '2025-01-11T18:39:00.000Z'::timestamptz, '2025-01-07T00:00:00.000Z'::timestamptz),
('OBCS-8387', 'Regarder la balance générale afin de corriger les incohérences.', 'Regarder la balance générale afin de corriger les incohérences.', 'Joël SIE', 'SIS', 'KONE KADER', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, '2025-01-11T15:52:00.000Z'::timestamptz, '2025-01-11T15:52:00.000Z'::timestamptz, '2025-01-10T00:00:00.000Z'::timestamptz),
('OBCS-8386', 'Assistance sur la balance tiers et la balance générale.', 'Assistance sur la balance tiers et la balance générale.', 'Joël SIE', 'SIS', 'KONE KADER', 'Comptable', 'Finance', 'Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.00, '2025-01-11T15:50:00.000Z'::timestamptz, '2025-01-11T15:50:00.000Z'::timestamptz, '2025-01-10T00:00:00.000Z'::timestamptz),
('OBCS-8385', 'Création du calendrier des mois.', 'Création du calendrier des mois.', 'Joël SIE', 'EJARA', 'Ousseyni Oumarou', 'Directeur Administratif et Financier', 'Support', 'Paramétrage sur fonctionnalités', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.00, '2025-01-11T15:47:00.000Z'::timestamptz, '2025-01-11T15:47:00.000Z'::timestamptz, '2025-01-08T00:00:00.000Z'::timestamptz),
('OBCS-8384', 'Création de l''exercice 2025 et le calendrier des mois.', 'Création de l''exercice 2025 et le calendrier des mois.', 'Joël SIE', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Support', 'Autres admin. système', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.00, '2025-01-11T15:44:00.000Z'::timestamptz, '2025-01-11T15:44:00.000Z'::timestamptz, '2025-01-08T00:00:00.000Z'::timestamptz),
('OBCS-8383', 'Programmation d''une des factures dont le motant du chèque est supérieur.', 'Programmation d''une des factures dont le motant du chèque est supérieur.', 'Joël SIE', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Opérations', 'Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 26.00, '2025-01-11T15:41:00.000Z'::timestamptz, '2025-01-11T15:41:00.000Z'::timestamptz, '2025-01-08T00:00:00.000Z'::timestamptz);

-- ============================================
-- ÉTAPE 3: UPSERT des tickets avec création automatique
-- ============================================

DO $$
DECLARE
  v_ticket RECORD;
  v_module_id UUID;
  v_submodule_id UUID;
  v_created_by UUID;
  v_contact_user_id UUID;
  v_company_id UUID;
  v_existing_ticket_id UUID;
  v_obc_product_id UUID := '91304e02-2ce6-4811-b19d-1cae091a6fde';
  v_global_module_id UUID := '98ce1c5f-e53c-4baf-9af1-52255d499378';
  v_created_count INTEGER := 0;
  v_updated_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
BEGIN
  FOR v_ticket IN
    SELECT * FROM temp_assistance_tickets
    WHERE jira_issue_key IS NOT NULL
      AND TRIM(jira_issue_key) != ''
      AND title IS NOT NULL
      AND TRIM(title) != ''
  LOOP
    -- ============================================
    -- GESTION DE L'ENTREPRISE (Client)
    -- ============================================
    IF v_ticket.client_name IS NOT NULL AND TRIM(v_ticket.client_name) != '' THEN
      v_company_id := (
        SELECT id
        FROM companies
        WHERE UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.client_name))
        LIMIT 1
      );
      
      -- Créer l'entreprise si elle n'existe pas
      IF v_company_id IS NULL THEN
        INSERT INTO companies (name, country_id, focal_user_id, jira_company_id)
        VALUES (TRIM(v_ticket.client_name), NULL, NULL, NULL);
        
        v_company_id := (
          SELECT id
          FROM companies
          WHERE UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.client_name))
          LIMIT 1
        );
        RAISE NOTICE 'Entreprise créée: % (ID: %)', v_ticket.client_name, v_company_id;
      END IF;
    ELSE
      v_company_id := NULL;
    END IF;
    
    -- ============================================
    -- GESTION DU MODULE
    -- ============================================
    IF v_ticket.module_name IS NOT NULL AND TRIM(v_ticket.module_name) != '' THEN
      IF UPPER(TRIM(v_ticket.module_name)) = 'GLOBAL' THEN
        v_module_id := v_global_module_id;
      ELSE
        v_module_id := (
          SELECT id
          FROM modules
          WHERE UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.module_name))
          LIMIT 1
        );
        
        -- Créer le module si il n'existe pas
        IF v_module_id IS NULL THEN
          INSERT INTO modules (name, product_id)
          VALUES (TRIM(v_ticket.module_name), v_obc_product_id);
          
          v_module_id := (
            SELECT id
            FROM modules
            WHERE UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.module_name))
            LIMIT 1
          );
          RAISE NOTICE 'Module créé: % (ID: %)', v_ticket.module_name, v_module_id;
        END IF;
      END IF;
    ELSE
      v_module_id := NULL;
    END IF;
    
    -- ============================================
    -- GESTION DU SOUS-MODULE
    -- ============================================
    IF v_module_id IS NOT NULL AND v_module_id != v_global_module_id AND v_ticket.submodule_name IS NOT NULL AND TRIM(v_ticket.submodule_name) != '' THEN
      v_submodule_id := (
        SELECT id
        FROM submodules
        WHERE module_id = v_module_id
          AND UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.submodule_name))
        LIMIT 1
      );
      
      -- Créer le sous-module si il n'existe pas
      IF v_submodule_id IS NULL THEN
        INSERT INTO submodules (name, module_id)
        VALUES (TRIM(v_ticket.submodule_name), v_module_id);
        
        v_submodule_id := (
          SELECT id
          FROM submodules
          WHERE module_id = v_module_id
            AND UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.submodule_name))
          LIMIT 1
        );
        RAISE NOTICE 'Sous-module créé: % (ID: %)', v_ticket.submodule_name, v_submodule_id;
      END IF;
    ELSE
      v_submodule_id := NULL;
    END IF;
    
    -- ============================================
    -- GESTION DU RAPPORTEUR (created_by)
    -- ============================================
    IF v_ticket.reporter_name IS NOT NULL AND TRIM(v_ticket.reporter_name) != '' THEN
      v_created_by := (
        SELECT id
        FROM profiles
        WHERE UPPER(TRIM(full_name)) = UPPER(TRIM(v_ticket.reporter_name))
        LIMIT 1
      );
      
      -- Créer l'utilisateur si il n'existe pas (agent interne)
      IF v_created_by IS NULL THEN
        INSERT INTO profiles (
          full_name,
          email,
          role,
          company_id,
          is_active
        )
        VALUES (
          TRIM(v_ticket.reporter_name),
          LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(v_ticket.reporter_name), '[^a-zA-Z0-9s]', '', 'g'), '\s+', '.', 'g')) || '@assistance.onpoint.local',
          'agent',
          NULL,
          true
        )
        ON CONFLICT (email) DO UPDATE
        SET full_name = EXCLUDED.full_name;
        
        -- Récupérer l'ID après l'INSERT
        v_created_by := (
          SELECT id
          FROM profiles
          WHERE email = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(v_ticket.reporter_name), '[^a-zA-Z0-9s]', '', 'g'), '\s+', '.', 'g')) || '@assistance.onpoint.local'
          LIMIT 1
        );
        RAISE NOTICE 'Rapporteur créé/trouvé: % (ID: %)', v_ticket.reporter_name, v_created_by;
      END IF;
    ELSE
      v_created_by := NULL;
    END IF;
    
    -- ============================================
    -- GESTION DU CONTACT UTILISATEUR (contact_user_id)
    -- ============================================
    IF v_ticket.contact_user_name IS NOT NULL AND TRIM(v_ticket.contact_user_name) != '' THEN
      v_contact_user_id := (
        SELECT id
        FROM profiles
        WHERE UPPER(TRIM(full_name)) = UPPER(TRIM(v_ticket.contact_user_name))
          AND (v_company_id IS NULL OR company_id = v_company_id)
        LIMIT 1
      );
      
      -- Créer l'utilisateur si il n'existe pas (client)
      IF v_contact_user_id IS NULL THEN
        INSERT INTO profiles (
          full_name,
          email,
          role,
          company_id,
          job_title,
          is_active
        )
        VALUES (
          TRIM(v_ticket.contact_user_name),
          LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(v_ticket.contact_user_name), '[^a-zA-Z0-9s]', '', 'g'), '\s+', '.', 'g')) || '@assistance.onpoint.local',
          'client',
          v_company_id,
          NULLIF(TRIM(v_ticket.job_title), ''),
          true
        )
        ON CONFLICT (email) DO UPDATE
        SET 
          full_name = EXCLUDED.full_name,
          company_id = COALESCE(EXCLUDED.company_id, profiles.company_id),
          job_title = COALESCE(EXCLUDED.job_title, profiles.job_title);
        
        -- Récupérer l'ID après l'INSERT
        v_contact_user_id := (
          SELECT id
          FROM profiles
          WHERE email = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(v_ticket.contact_user_name), '[^a-zA-Z0-9s]', '', 'g'), '\s+', '.', 'g')) || '@assistance.onpoint.local'
          LIMIT 1
        );
        RAISE NOTICE 'Contact utilisateur créé/trouvé: % (ID: %)', v_ticket.contact_user_name, v_contact_user_id;
      END IF;
    ELSE
      v_contact_user_id := NULL;
    END IF;
    
    -- ============================================
    -- VÉRIFIER SI LE TICKET EXISTE DÉJÀ
    -- ============================================
    v_existing_ticket_id := (
      SELECT id
      FROM tickets
      WHERE jira_issue_key = v_ticket.jira_issue_key
      LIMIT 1
    );
    
    -- ============================================
    -- UPSERT DU TICKET
    -- ============================================
    INSERT INTO tickets (
      jira_issue_key,
      title,
      description,
      ticket_type,
      priority,
      canal,
      status,
      module_id,
      submodule_id,
      feature_id,
      bug_type,
      created_by,
      contact_user_id,
      affects_all_companies,
      company_id,
      duration_minutes,
      created_at,
      updated_at,
      resolved_at,
      origin
    )
    VALUES (
      v_ticket.jira_issue_key,
      v_ticket.title,
      NULLIF(TRIM(v_ticket.description), ''),
      'ASSISTANCE'::ticket_type_t,
      'Low'::priority_t,
      v_ticket.canal::canal_t,
      v_ticket.status,
      v_module_id,
      v_submodule_id,
      NULL,
      NULL,
      v_created_by,
      v_contact_user_id,
      false,
      v_company_id,
      v_ticket.duration_minutes,
      COALESCE(v_ticket.created_at, v_ticket.recorded_date, NOW()),
      COALESCE(v_ticket.updated_at, v_ticket.created_at, NOW()),
      CASE WHEN v_ticket.status = 'Resolue' THEN COALESCE(v_ticket.updated_at, v_ticket.created_at, NOW()) ELSE NULL END,
      'jira'::origin_t
    )
    ON CONFLICT (jira_issue_key) DO UPDATE
    SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      ticket_type = EXCLUDED.ticket_type,
      priority = EXCLUDED.priority,
      canal = EXCLUDED.canal,
      status = EXCLUDED.status,
      module_id = EXCLUDED.module_id,
      submodule_id = EXCLUDED.submodule_id,
      feature_id = EXCLUDED.feature_id,
      bug_type = EXCLUDED.bug_type,
      created_by = COALESCE(EXCLUDED.created_by, tickets.created_by),
      contact_user_id = COALESCE(EXCLUDED.contact_user_id, tickets.contact_user_id),
      affects_all_companies = EXCLUDED.affects_all_companies,
      company_id = EXCLUDED.company_id,
      duration_minutes = EXCLUDED.duration_minutes,
      updated_at = EXCLUDED.updated_at,
      resolved_at = EXCLUDED.resolved_at;
    
    -- Compter création vs mise à jour
    IF v_existing_ticket_id IS NULL THEN
      v_created_count := v_created_count + 1;
    ELSE
      v_updated_count := v_updated_count + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE '=== RÉSUMÉ PARTIE 2 ===';
  RAISE NOTICE 'Tickets créés: %', v_created_count;
  RAISE NOTICE 'Tickets mis à jour: %', v_updated_count;
  RAISE NOTICE 'Tickets ignorés: %', v_skipped_count;
END $$;

-- ============================================
-- NETTOYAGE
-- ============================================

DROP TABLE IF EXISTS temp_assistance_tickets;
