-- OnpointDoc - Synchronisation des tickets d'assistance depuis Google Sheet (PARTIE 11)
-- Date: 2025-12-09
-- Partie 11 sur 11
-- Tickets: 5001 à 5308 sur 5308 total

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
('OBCS-11142', 'Rappel après manqué pour planif séance sur workflows', 'Rappel après manqué pour planif séance sur workflows', 'Vivien DAKPOGAN', 'KOFFI & DIABATE', 'KADIA KOFFI', 'Chef de Projet', 'Global', NULL, 'Appel WhatsApp'::canal_t, 'Low'::priority_t, 'Resolue', 1.20, '2025-09-28T19:24:00.000Z'::timestamptz, '2025-09-28T19:24:00.000Z'::timestamptz, '2025-09-24T00:00:00.000Z'::timestamptz),
('OBCS-11141', 'Assistance pour la paie, suppression de collaborateur + relance paie', 'Assistance pour la paie, suppression de collaborateur + relance paie', 'Vivien DAKPOGAN', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.13, '2025-09-28T19:21:00.000Z'::timestamptz, '2025-09-28T19:21:00.000Z'::timestamptz, '2025-09-24T00:00:00.000Z'::timestamptz),
('OBCS-11140', 'Assistance pour la paie, suppression de collaborateur + relance paie', 'Assistance pour la paie, suppression de collaborateur + relance paie', 'Vivien DAKPOGAN', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.19, '2025-09-28T19:19:00.000Z'::timestamptz, '2025-09-28T19:19:00.000Z'::timestamptz, '2025-09-23T00:00:00.000Z'::timestamptz),
('OBCS-11138', 'Rappel après appel après manqué pour relancer sur démarrage des RH', 'Rappel après appel après manqué pour relancer sur démarrage des RH', 'Vivien DAKPOGAN', 'SIS', 'KONE HASSANE', 'Comptable', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.11, '2025-09-28T19:11:00.000Z'::timestamptz, '2025-09-28T19:11:00.000Z'::timestamptz, '2025-09-25T00:00:00.000Z'::timestamptz),
('OBCS-11134', 'Appel pour relancer sujet de programmation multiples + exécution de règlement fournisseurs en devise Euro au lien de FCFA', 'Appel pour relancer sujet de programmation multiples + exécution de règlement fournisseurs en devise Euro au lien de FCFA', 'Vivien DAKPOGAN', 'ARIC', 'Mme Bini', 'Comptable', 'Paiement', 'Paiement - Centre de paiement', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.44, '2025-09-28T18:54:00.000Z'::timestamptz, '2025-09-28T18:54:00.000Z'::timestamptz, '2025-09-26T00:00:00.000Z'::timestamptz),
('OBCS-11110', 'Explication sur les erreurs faites sur leur balance', 'Explication sur les erreurs faites sur leur balance', 'GNAHORE AMOS', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Finance', 'Finance - Comptabilité Générale', 'Appel WhatsApp'::canal_t, 'Low'::priority_t, 'Resolue', 11.58, '2025-09-27T14:04:00.000Z'::timestamptz, '2025-09-27T14:04:00.000Z'::timestamptz, '2025-09-24T00:00:00.000Z'::timestamptz),
('OBCS-11098', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Directeur Administratif et Financier', 'Global', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 3.28, '2025-09-26T11:19:00.000Z'::timestamptz, '2025-09-26T11:19:00.000Z'::timestamptz, '2025-09-24T00:00:00.000Z'::timestamptz),
('OBCS-11097', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'CSCTICAO', 'SERGE ARIKO', 'Contrôleur de Gestion', 'Global', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 0.54, '2025-09-26T11:14:00.000Z'::timestamptz, '2025-09-26T11:14:00.000Z'::timestamptz, '2025-09-26T00:00:00.000Z'::timestamptz),
('OBCS-11096', 'Assistance pour création de compte utilisateur', 'Assistance pour création de compte utilisateur', 'N''GBRA MOYE BERNICE DORIS', 'CSCTICAO', 'SERGE ARIKO', 'Contrôleur de Gestion', 'Global', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 0.31, '2025-09-26T11:13:00.000Z'::timestamptz, '2025-09-26T11:13:00.000Z'::timestamptz, '2025-09-25T00:00:00.000Z'::timestamptz),
('OBCS-11095', 'Assistance pour création de compte utilisateur', 'Assistance pour création de compte utilisateur', 'N''GBRA MOYE BERNICE DORIS', 'CSCTICAO', 'SERGE ARIKO', 'Contrôleur de Gestion', 'Global', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 0.30, '2025-09-26T11:12:00.000Z'::timestamptz, '2025-09-26T11:12:00.000Z'::timestamptz, '2025-09-25T00:00:00.000Z'::timestamptz),
('OBCS-11094', 'Assistance pour création de compte utilisateur', 'Assistance pour création de compte utilisateur', 'N''GBRA MOYE BERNICE DORIS', 'CSCTICAO', 'SERGE ARIKO', 'Contrôleur de Gestion', 'Global', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 1.42, '2025-09-26T11:11:00.000Z'::timestamptz, '2025-09-26T11:11:00.000Z'::timestamptz, '2025-09-24T00:00:00.000Z'::timestamptz),
('OBCS-11093', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'Opérations', 'Opérations - Achat', 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 9.14, '2025-09-26T11:00:00.000Z'::timestamptz, '2025-09-26T11:00:00.000Z'::timestamptz, '2025-09-26T00:00:00.000Z'::timestamptz),
('OBCS-11092', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'Opérations', 'Opérations - Achat', 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 4.54, '2025-09-26T10:59:00.000Z'::timestamptz, '2025-09-26T10:59:00.000Z'::timestamptz, '2025-09-24T00:00:00.000Z'::timestamptz),
('OBCS-11091', 'Assistance sur le compte', 'Assistance sur le compte', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'Finance', 'Opérations - Gestion de stock', 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 1.58, '2025-09-26T10:58:00.000Z'::timestamptz, '2025-09-26T10:58:00.000Z'::timestamptz, '2025-09-22T00:00:00.000Z'::timestamptz),
('OBCS-11072', 'Confirmation Traitement requête accès user', 'Confirmation Traitement requête accès user', 'Edwige KOUASSI', 'JOEL K PROPERTIES', 'Raïssa CAMARA', 'Comptable', 'Global', 'Paramétrage', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.27, '2025-09-21T20:40:00.000Z'::timestamptz, '2025-09-21T20:40:00.000Z'::timestamptz, '2025-09-15T00:00:00.000Z'::timestamptz),
('OBCS-11071', 'Revue des accès user', 'Revue des accès user', 'Edwige KOUASSI', 'JOEL K PROPERTIES', 'Raïssa CAMARA', 'Comptable', 'Global', 'Paramétrage', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.50, '2025-09-21T20:39:00.000Z'::timestamptz, '2025-09-21T20:39:00.000Z'::timestamptz, '2025-09-15T00:00:00.000Z'::timestamptz),
('OBCS-11070', 'Assistance Modification Password OBC - Activation de compte', 'Assistance Modification Password OBC', 'Edwige KOUASSI', 'JOEL K PROPERTIES', 'Raïssa CAMARA', 'Comptable', 'Global', 'Paramétrage', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.56, '2025-09-21T20:38:00.000Z'::timestamptz, '2025-09-21T20:38:00.000Z'::timestamptz, '2025-09-16T00:00:00.000Z'::timestamptz),
('OBCS-11068', 'Demande d''assistance Google Meet Sur Traitement de données RAN', 'Demande d''assistance traitement de données RAN', 'Edwige KOUASSI', 'FIRST CAPITAL', 'Guy KOUADIO', 'Directeur Administratif et Financier', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.29, '2025-09-21T20:32:00.000Z'::timestamptz, '2025-09-21T20:32:00.000Z'::timestamptz, NULL),
('OBCS-11067', 'Rappel Appel Manqué - Assistance traitement de données RAN', 'Rappel Appel Manqué - Assistance traitement de données RAN', 'Edwige KOUASSI', 'FIRST CAPITAL', 'Guy KOUADIO', 'Directeur Administratif et Financier', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.30, '2025-09-21T20:30:00.000Z'::timestamptz, '2025-09-21T20:30:00.000Z'::timestamptz, '2025-09-15T00:00:00.000Z'::timestamptz),
('OBCS-11066', 'Assistance Comptabilité Générale - Correction écriture manuelle', 'Assistance Comptabilité Générale - Correction écriture manuelle', 'Edwige KOUASSI', 'FIRST CAPITAL', 'Denise SAOURE', 'Directeur Administratif et Financier', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.14, '2025-09-21T20:28:00.000Z'::timestamptz, '2025-09-21T20:28:00.000Z'::timestamptz, '2025-09-15T00:00:00.000Z'::timestamptz),
('OBCS-11065', 'Assistance Comptabilité Générale - Correction écriture manuelle', 'Assistance Comptabilité Générale - Correction écriture manuelle', 'Edwige KOUASSI', 'FIRST CAPITAL', 'Denise SAOURE', 'Directeur Administratif et Financier', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.18, '2025-09-21T20:28:00.000Z'::timestamptz, '2025-09-21T20:28:00.000Z'::timestamptz, '2025-09-18T00:00:00.000Z'::timestamptz),
('OBCS-11064', 'Assistance Comptabilité Générale - Correction écriture manuelle', 'Assistance Comptabilité Générale - Correction écriture manuelle', 'Edwige KOUASSI', 'FIRST CAPITAL', 'Denise SAOURE', 'Directeur Administratif et Financier', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.39, '2025-09-21T20:27:00.000Z'::timestamptz, '2025-09-21T20:27:00.000Z'::timestamptz, '2025-09-18T00:00:00.000Z'::timestamptz),
('OBCS-11063', 'Demande d''assistance Comptabilité Générale', 'Demande d''assistance Comptabilité Générale', 'Edwige KOUASSI', 'FIRST CAPITAL', 'Denise SAOURE', 'Directeur Administratif et Financier', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.28, '2025-09-21T20:24:00.000Z'::timestamptz, '2025-09-21T20:24:00.000Z'::timestamptz, '2025-09-18T00:00:00.000Z'::timestamptz),
('OBCS-11062', 'Demande d''assistance Comptabilité Générale', 'Demande d''assistance Comptabilité Générale', 'Edwige KOUASSI', 'FIRST CAPITAL', 'Denise SAOURE', 'Directeur Administratif et Financier', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.29, '2025-09-21T20:24:00.000Z'::timestamptz, '2025-09-21T20:24:00.000Z'::timestamptz, '2025-09-18T00:00:00.000Z'::timestamptz),
('OBCS-11061', 'Demande d''assistance Comptabilité Générale', 'Demande d''assistance Comptabilité Générale', 'Edwige KOUASSI', 'FIRST CAPITAL', 'Denise SAOURE', 'Directeur Administratif et Financier', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.70, '2025-09-21T20:23:00.000Z'::timestamptz, '2025-09-21T20:23:00.000Z'::timestamptz, '2025-09-17T00:00:00.000Z'::timestamptz),
('OBCS-11060', 'Assistance Comptabilité Générale', 'Assistance Comptabilité Générale', 'Edwige KOUASSI', 'FIRST CAPITAL', 'Denise SAOURE', 'Directeur Administratif et Financier', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.24, '2025-09-21T20:22:00.000Z'::timestamptz, '2025-09-21T20:22:00.000Z'::timestamptz, '2025-09-15T00:00:00.000Z'::timestamptz),
('OBCS-11059', 'Demande d''assistance Comptabilité Générale', 'Assistance Comptabilité Générale', 'Edwige KOUASSI', 'FIRST CAPITAL', 'Denise SAOURE', 'Directeur Administratif et Financier', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.10, '2025-09-21T20:21:00.000Z'::timestamptz, '2025-09-21T20:21:00.000Z'::timestamptz, '2025-09-15T00:00:00.000Z'::timestamptz),
('OBCS-11058', 'Rappel Appel Manqué - Relance sur traitement de données RH', 'Demande d''assistance sur module RH', 'Edwige KOUASSI', 'FIRST CAPITAL', 'FERDINAND KOUADIO', 'Comptable', 'RH', 'RH - Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.60, '2025-09-21T20:17:00.000Z'::timestamptz, '2025-09-21T20:17:00.000Z'::timestamptz, '2025-09-18T00:00:00.000Z'::timestamptz),
('OBCS-11057', 'Demande d''assistance sur module RH', 'Demande d''assistance sur module RH', 'Edwige KOUASSI', 'FIRST CAPITAL', 'FERDINAND KOUADIO', 'Comptable', 'RH', 'RH - Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.29, '2025-09-21T20:16:00.000Z'::timestamptz, '2025-09-21T20:16:00.000Z'::timestamptz, '2025-09-18T00:00:00.000Z'::timestamptz),
('OBCS-11056', 'Revue accès 2025 module RH et processus demande d''ABS', 'Revue accès 2025 module RH et processus demande d''ABS', 'Edwige KOUASSI', 'FIRST CAPITAL', 'FERDINAND KOUADIO', 'Comptable', 'RH', 'RH - Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.29, '2025-09-21T20:05:00.000Z'::timestamptz, '2025-09-21T20:05:00.000Z'::timestamptz, '2025-09-08T00:00:00.000Z'::timestamptz),
('OBCS-11055', 'Assistance Calcul salaire', 'Assistance Calcul salaire', 'Edwige KOUASSI', '2AAZ', 'Marcelle AHOUSSOU', 'Directeur général', 'Finance', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.18, '2025-09-21T20:00:00.000Z'::timestamptz, '2025-09-21T20:00:00.000Z'::timestamptz, NULL),
('OBCS-11054', 'Assistance Calcul salaire', 'Assistance Calcul salaire', 'Edwige KOUASSI', '2AAZ', 'Marcelle AHOUSSOU', 'Directeur général', 'Finance', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.38, '2025-09-21T19:59:00.000Z'::timestamptz, '2025-09-21T19:59:00.000Z'::timestamptz, NULL),
('OBCS-11053', 'Assistance Calcul salaire', 'Assistance Calcul salaire', 'Edwige KOUASSI', '2AAZ', 'Marcelle AHOUSSOU', 'Directeur général', 'Finance', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.50, '2025-09-21T19:58:00.000Z'::timestamptz, '2025-09-21T19:58:00.000Z'::timestamptz, NULL),
('OBCS-11052', 'Assistance Calcul salaire', 'Assistance Calcul salaire', 'Edwige KOUASSI', '2AAZ', 'Marcelle AHOUSSOU', 'Directeur général', 'Finance', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, '2025-09-21T19:57:00.000Z'::timestamptz, '2025-09-21T19:59:00.000Z'::timestamptz, NULL),
('OBCS-11051', 'Assistance RH', 'Assistance RH', 'Edwige KOUASSI', '2AAZ', 'Marcelle AHOUSSOU', 'Directeur général', 'Finance', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.30, '2025-09-21T19:57:00.000Z'::timestamptz, '2025-09-21T19:57:00.000Z'::timestamptz, NULL),
('OBCS-11050', 'Assistance Calcul salaire', 'Assistance Calcul salaire', 'Edwige KOUASSI', '2AAZ', 'Marcelle AHOUSSOU', 'Directeur général', 'Finance', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.47, '2025-09-21T19:56:00.000Z'::timestamptz, '2025-09-21T19:56:00.000Z'::timestamptz, NULL),
('OBCS-11049', 'Assistance Comptabilité Générale', 'Assistance Comptabilité Générale', 'Edwige KOUASSI', '2AAZ', 'Marcelle AHOUSSOU', 'Directeur général', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.58, '2025-09-21T19:54:00.000Z'::timestamptz, '2025-09-21T19:54:00.000Z'::timestamptz, '2025-09-03T00:00:00.000Z'::timestamptz),
('OBCS-11048', 'Assistance écriture à corriger', 'h1. Assistance écriture à corriger', 'Edwige KOUASSI', '2AAZ', 'Marcelle AHOUSSOU', 'Directeur général', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.41, '2025-09-21T19:53:00.000Z'::timestamptz, '2025-09-21T19:53:00.000Z'::timestamptz, '2025-09-03T00:00:00.000Z'::timestamptz),
('OBCS-11047', 'Assistance écriture à corriger', 'h1. Assistance écriture à corriger', 'Edwige KOUASSI', '2AAZ', 'Marcelle AHOUSSOU', 'Directeur général', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 16.55, '2025-09-21T19:52:00.000Z'::timestamptz, '2025-09-21T19:52:00.000Z'::timestamptz, '2025-09-08T00:00:00.000Z'::timestamptz),
('OBCS-11046', 'Assistance Comptabilité Générale', 'Assistance Comptabilité Générale', 'Edwige KOUASSI', '2AAZ', 'Marcelle AHOUSSOU', 'Directeur général', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.24, '2025-09-21T19:52:00.000Z'::timestamptz, '2025-09-21T19:52:00.000Z'::timestamptz, '2025-09-08T00:00:00.000Z'::timestamptz),
('OBCS-11045', 'Assistance écriture à corriger', 'Assistance écriture à corriger', 'Edwige KOUASSI', '2AAZ', 'Marcelle AHOUSSOU', 'Directeur général', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.13, '2025-09-21T19:49:00.000Z'::timestamptz, '2025-09-21T19:49:00.000Z'::timestamptz, '2025-09-18T00:00:00.000Z'::timestamptz),
('OBCS-11044', 'Assistance Comptabilité Générale', 'Assistance Comptabilité Générale', 'Edwige KOUASSI', 'IVOIRE DEVELOPPEMENT', 'GAHI Lezou Jean', 'Comptable', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 22.16, '2025-09-21T19:48:00.000Z'::timestamptz, '2025-09-21T19:48:00.000Z'::timestamptz, '2025-09-18T00:00:00.000Z'::timestamptz),
('OBCS-11043', 'Retour appel pour - Assistance Calcul salaire', 'Retour appel pour - Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.50, '2025-09-21T19:45:00.000Z'::timestamptz, '2025-09-21T19:45:00.000Z'::timestamptz, '2025-09-19T00:00:00.000Z'::timestamptz),
('OBCS-11042', 'Assistance RH', 'Assistance RH', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.20, '2025-09-21T19:44:00.000Z'::timestamptz, '2025-09-21T19:44:00.000Z'::timestamptz, NULL),
('OBCS-11041', 'Assistance RH', 'Assistance RH', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 12.53, '2025-09-21T19:43:00.000Z'::timestamptz, '2025-09-21T19:43:00.000Z'::timestamptz, NULL),
('OBCS-11040', 'Assistance RH', 'Calcul salaire assistance', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.11, '2025-09-21T19:42:00.000Z'::timestamptz, '2025-09-21T19:42:00.000Z'::timestamptz, NULL),
('OBCS-11039', 'Assistance Calcul salaire', 'Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.25, '2025-09-21T19:41:00.000Z'::timestamptz, '2025-09-21T19:41:00.000Z'::timestamptz, NULL),
('OBCS-11038', 'Retour appel pour - Assistance Calcul salaire', 'Retour appel pour - Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 7.11, '2025-09-21T19:40:00.000Z'::timestamptz, '2025-09-21T19:40:00.000Z'::timestamptz, NULL),
('OBCS-11037', 'Retour appel pour - Assistance Calcul salaire', 'Retour appel pour - Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 9.54, '2025-09-21T19:40:00.000Z'::timestamptz, '2025-09-21T19:40:00.000Z'::timestamptz, NULL),
('OBCS-11036', 'Traitement salaire', 'Traitement salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 10.36, '2025-09-21T19:39:00.000Z'::timestamptz, '2025-09-21T19:39:00.000Z'::timestamptz, NULL),
('OBCS-11035', 'Retour appel pour - Assistance Calcul salaire', 'Retour appel pour - Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 16.45, '2025-09-21T19:38:00.000Z'::timestamptz, '2025-09-21T19:38:00.000Z'::timestamptz, NULL),
('OBCS-11034', 'Relance traitement bog lié aux Matricule - Fichier du personnel', 'Relance traitement bog lié aux Matricule - Fichier du personnel et calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 20.28, '2025-09-21T19:37:00.000Z'::timestamptz, '2025-09-21T19:37:00.000Z'::timestamptz, NULL),
('OBCS-11033', 'Retour appel pour - Assistance Calcul salaire', 'Retour appel pour - Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.51, '2025-09-21T19:36:00.000Z'::timestamptz, '2025-09-21T19:36:00.000Z'::timestamptz, NULL),
('OBCS-11032', 'Relance traitement bog lié aux Matricule - Fichier du personnel', 'Relance traitement bog lié aux Matricule - Fichier du personnel', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.90, '2025-09-21T19:35:00.000Z'::timestamptz, '2025-09-21T19:35:00.000Z'::timestamptz, NULL),
('OBCS-11031', 'Retour appel pour - Assistance Calcul salaire', 'Retour appel pour - Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.13, '2025-09-21T19:34:00.000Z'::timestamptz, '2025-09-21T19:34:00.000Z'::timestamptz, NULL),
('OBCS-11030', 'Retour appel pour - Assistance Calcul salaire', 'Retour appel pour - Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 39.40, '2025-09-21T19:34:00.000Z'::timestamptz, '2025-09-21T19:34:00.000Z'::timestamptz, NULL),
('OBCS-11029', 'Assistance Calcul salaire', 'Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.60, '2025-09-21T19:32:00.000Z'::timestamptz, '2025-09-21T19:32:00.000Z'::timestamptz, NULL),
('OBCS-11028', 'Assistance Calcul salaire', 'Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.34, '2025-09-21T19:32:00.000Z'::timestamptz, '2025-09-21T19:32:00.000Z'::timestamptz, NULL),
('OBCS-11027', 'Assistance Calcul salaire', 'Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.37, '2025-09-21T19:31:00.000Z'::timestamptz, '2025-09-21T19:31:00.000Z'::timestamptz, NULL),
('OBCS-11026', 'Assistance Calcul salaire', 'Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.37, '2025-09-21T19:31:00.000Z'::timestamptz, '2025-09-21T19:31:00.000Z'::timestamptz, NULL),
('OBCS-11025', 'Assistance Calcul salaire', 'Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.16, '2025-09-21T19:31:00.000Z'::timestamptz, '2025-09-21T19:31:00.000Z'::timestamptz, NULL),
('OBCS-11024', 'Assistance Calcul salaire', 'Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 38.23, '2025-09-21T19:30:00.000Z'::timestamptz, '2025-09-21T19:30:00.000Z'::timestamptz, NULL),
('OBCS-11023', 'Assistance Calcul salaire', 'Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.16, '2025-09-21T19:30:00.000Z'::timestamptz, '2025-09-21T19:30:00.000Z'::timestamptz, NULL),
('OBCS-11022', 'Assistance Calcul salaire', 'Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.17, '2025-09-21T19:30:00.000Z'::timestamptz, '2025-09-21T19:30:00.000Z'::timestamptz, NULL),
('OBCS-11021', 'Assistance Calcul salaire', 'Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 31.70, '2025-09-21T19:29:00.000Z'::timestamptz, '2025-09-21T19:29:00.000Z'::timestamptz, NULL),
('OBCS-11020', 'Assistance Calcul salaire', 'Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.25, '2025-09-21T19:29:00.000Z'::timestamptz, '2025-09-21T19:29:00.000Z'::timestamptz, NULL),
('OBCS-11019', 'Assistance Calcul salaire', 'Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.19, '2025-09-21T19:29:00.000Z'::timestamptz, '2025-09-21T19:29:00.000Z'::timestamptz, NULL),
('OBCS-11018', 'Assistance Calcul salaire', 'Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.24, '2025-09-21T19:29:00.000Z'::timestamptz, '2025-09-21T19:29:00.000Z'::timestamptz, NULL),
('OBCS-11017', 'Assistance Calcul salaire', 'Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.70, '2025-09-21T19:28:00.000Z'::timestamptz, '2025-09-21T19:28:00.000Z'::timestamptz, NULL),
('OBCS-11016', 'Assistance Calcul salaire', 'Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.38, '2025-09-21T19:28:00.000Z'::timestamptz, '2025-09-21T19:28:00.000Z'::timestamptz, NULL),
('OBCS-11015', 'Assistance Calcul salaire', 'Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.30, '2025-09-21T19:28:00.000Z'::timestamptz, '2025-09-21T19:28:00.000Z'::timestamptz, NULL),
('OBCS-11014', 'Assistance Calcul salaire', 'Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 27.50, '2025-09-21T19:27:00.000Z'::timestamptz, '2025-09-21T19:27:00.000Z'::timestamptz, NULL),
('OBCS-11013', 'Assistance Calcul salaire', 'Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.10, '2025-09-21T19:27:00.000Z'::timestamptz, '2025-09-21T19:27:00.000Z'::timestamptz, NULL),
('OBCS-11012', 'Assistance Calcul salaire - Plan séance de travail online', 'Assistance Calcul salaire', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.50, '2025-09-21T19:26:00.000Z'::timestamptz, '2025-09-21T19:26:00.000Z'::timestamptz, '2025-09-19T00:00:00.000Z'::timestamptz),
('OBCS-11009', 'Assistance pour connexion à OBC.', 'Assistance pour connexion à OBC.', 'GNAHORE AMOS', 'ETS MAB', 'KONE Adama', 'Autres', 'Global', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 8.00, '2025-09-20T21:12:00.000Z'::timestamptz, '2025-09-20T21:12:00.000Z'::timestamptz, '2025-09-17T00:00:00.000Z'::timestamptz),
('OBCS-11008', 'Création du compte administrateur.', 'Création du compte administrateur.', 'GNAHORE AMOS', 'ALL', 'Mme OUAYOU', 'Gérant', 'Global', 'Global', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.20, '2025-09-20T21:01:00.000Z'::timestamptz, '2025-09-20T21:01:00.000Z'::timestamptz, '2025-09-15T00:00:00.000Z'::timestamptz),
('OBCS-10990', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'RH', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 1.90, '2025-09-19T18:27:00.000Z'::timestamptz, '2025-09-19T18:28:00.000Z'::timestamptz, '2025-09-19T00:00:00.000Z'::timestamptz),
('OBCS-10989', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'RH', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 0.38, '2025-09-19T18:26:00.000Z'::timestamptz, '2025-09-19T18:26:00.000Z'::timestamptz, '2025-09-18T00:00:00.000Z'::timestamptz),
('OBCS-10988', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'RH', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 3.16, '2025-09-19T18:23:00.000Z'::timestamptz, '2025-09-19T18:23:00.000Z'::timestamptz, '2025-09-16T00:00:00.000Z'::timestamptz),
('OBCS-10987', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'Opérations', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 3.16, '2025-09-19T18:16:00.000Z'::timestamptz, '2025-09-19T18:16:00.000Z'::timestamptz, '2025-09-16T00:00:00.000Z'::timestamptz),
('OBCS-10986', 'Assistance sur les achats', 'Assistance sur les achats', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'ERIC KOUADIO', 'Chef Comptable', 'Opérations', 'Opérations - Achat', 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 0.24, '2025-09-19T18:09:00.000Z'::timestamptz, '2025-09-19T18:09:00.000Z'::timestamptz, '2025-09-16T00:00:00.000Z'::timestamptz),
('OBCS-10985', 'Assistance sur les achats', 'Assistance sur les achats', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'ERIC KOUADIO', 'Chef Comptable', 'Opérations', 'Opérations - Achat', 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 1.30, '2025-09-19T18:01:00.000Z'::timestamptz, '2025-09-19T18:01:00.000Z'::timestamptz, '2025-09-16T00:00:00.000Z'::timestamptz),
('OBCS-1970', 'Assistance - Explication en ligne - Comptable', 'Demande d''informations - Document à fournir pour paramétrage ( appel reçu dont 1 pour les demandes d''informations & 1 pour la confirmation de réception)', 'Edwige KOUASSI', 'CILAGRI', 'Mr TAHI', 'Comptable', 'Support', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 7.28, NULL, '2024-07-08T10:32:00.000Z'::timestamptz, NULL),
('OBCS-10984', 'Assistance sur les programmes offres BTP', 'Assistance sur les programmes offres BTP', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'Roselin Tiecoura', 'Informaticien', 'Support', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 1.21, '2025-09-19T17:52:00.000Z'::timestamptz, '2025-09-19T17:52:00.000Z'::timestamptz, '2025-09-16T00:00:00.000Z'::timestamptz),
('OBCS-10982', 'Assistance sur le stock', 'Assistance sur le stock', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'ERIC KOUADIO', 'Gestionnaire de Stock', 'Opérations', 'Opérations - Achat', 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 0.33, '2025-09-19T17:44:00.000Z'::timestamptz, '2025-09-19T17:44:00.000Z'::timestamptz, '2025-09-16T00:00:00.000Z'::timestamptz),
('OBCS-10981', 'Assistance sur le stock', 'Assistance sur le stock', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'ERIC KOUADIO', 'Gestionnaire de Stock', 'Opérations', 'Opérations - Gestion de stock', 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 0.51, '2025-09-19T17:43:00.000Z'::timestamptz, '2025-09-19T17:43:00.000Z'::timestamptz, '2025-09-16T00:00:00.000Z'::timestamptz),
('OBCS-10980', 'Assistance sur CRM', 'Assistance sur CRM', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'Amary TCHOTCHE', 'Chef de Projet', 'CRM', 'Opérations - Gestion de stock', 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 1.33, '2025-09-19T17:42:00.000Z'::timestamptz, '2025-09-19T17:42:00.000Z'::timestamptz, '2025-09-16T00:00:00.000Z'::timestamptz),
('OBCS-10979', 'Assistance sur CRM', 'Assistance sur CRM', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'Amary TCHOTCHE', 'Chef de Projet', 'CRM', 'Offres', 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 0.47, '2025-09-19T17:41:00.000Z'::timestamptz, '2025-09-19T17:41:00.000Z'::timestamptz, '2025-09-16T00:00:00.000Z'::timestamptz),
('OBCS-10983', 'Assistance sur le paramétrage d''un utilisateur', 'Assistance sur le paramétrage d''un utilisateur', 'N''GBRA MOYE BERNICE DORIS', 'CSCTICAO', 'SERGE ARIKO', 'Directeur Administratif et Financier', 'Support', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 0.58, '2025-09-19T17:49:00.000Z'::timestamptz, '2025-09-19T17:49:00.000Z'::timestamptz, '2025-09-16T00:00:00.000Z'::timestamptz),
('OBCS-10977', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Directeur Administratif et Financier', 'RH', 'Offres', 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 15.49, '2025-09-19T17:28:00.000Z'::timestamptz, '2025-09-19T17:28:00.000Z'::timestamptz, '2025-09-16T00:00:00.000Z'::timestamptz),
('OBCS-10976', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Directeur Administratif et Financier', 'RH', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 3.53, '2025-09-19T17:25:00.000Z'::timestamptz, '2025-09-19T17:25:00.000Z'::timestamptz, '2025-09-15T00:00:00.000Z'::timestamptz),
('OBCS-10975', 'Assistance sur le stock', 'Assistance sur le stock', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'Opérations', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 3.23, '2025-09-19T17:18:00.000Z'::timestamptz, '2025-09-19T17:18:00.000Z'::timestamptz, '2025-09-16T00:00:00.000Z'::timestamptz),
('OBCS-10974', 'Assistance sur le stock', 'Assistance sur le stock', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'Opérations', 'Opérations - Gestion de stock', 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 12.20, '2025-09-19T16:56:00.000Z'::timestamptz, '2025-09-19T16:56:00.000Z'::timestamptz, '2025-09-16T00:00:00.000Z'::timestamptz),
('OBCS-10973', 'Assistance sur le stock', 'Assistance sur le stock', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'Opérations', 'Opérations - Gestion de stock', 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 7.30, '2025-09-19T16:56:00.000Z'::timestamptz, '2025-09-19T16:56:00.000Z'::timestamptz, '2025-09-16T00:00:00.000Z'::timestamptz),
('OBCS-10972', 'Assistance sur le stock', 'Assistance sur le stock', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'Opérations', 'Opérations - Gestion de stock', 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 7.30, '2025-09-19T16:55:00.000Z'::timestamptz, '2025-09-19T16:55:00.000Z'::timestamptz, '2025-09-15T00:00:00.000Z'::timestamptz),
('OBCS-10971', 'Assistance sur la comptabilité', 'Assistance sur la comptabilité', 'N''GBRA MOYE BERNICE DORIS', 'KOFFI & DIABATE', 'Jean-Jacques KOUASSI', 'Chef Comptable', 'Finance', 'Opérations - Gestion de stock', 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 0.27, '2025-09-19T16:51:00.000Z'::timestamptz, '2025-09-19T16:51:00.000Z'::timestamptz, '2025-09-15T00:00:00.000Z'::timestamptz),
('OBCS-10970', 'Assistance sur la comptabilité', 'Assistance sur la comptabilité', 'N''GBRA MOYE BERNICE DORIS', 'KOFFI & DIABATE', 'Jean-Jacques KOUASSI', 'Chef Comptable', 'Finance', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 3.21, '2025-09-19T16:51:00.000Z'::timestamptz, '2025-09-19T16:51:00.000Z'::timestamptz, '2025-09-15T00:00:00.000Z'::timestamptz),
('OBCS-10969', 'Assistance sur la comptabilité', 'Assistance sur la comptabilité', 'N''GBRA MOYE BERNICE DORIS', 'KOFFI & DIABATE', 'Jean-Jacques KOUASSI', 'Chef Comptable', 'Finance', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 0.57, '2025-09-19T16:50:00.000Z'::timestamptz, '2025-09-19T16:50:00.000Z'::timestamptz, '2025-09-15T00:00:00.000Z'::timestamptz),
('OBCS-10968', 'Assistance sur la comptabilité', 'Assistance sur la comptabilité', 'N''GBRA MOYE BERNICE DORIS', 'KOFFI & DIABATE', 'Jean-Jacques KOUASSI', 'Chef Comptable', 'RH', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 0.39, '2025-09-19T16:50:00.000Z'::timestamptz, '2025-09-19T16:50:00.000Z'::timestamptz, '2025-09-15T00:00:00.000Z'::timestamptz),
('OBCS-10946', 'Assistance génération et traitement RAN', 'Assistance sur génération et Intégration du RAN', 'Edwige KOUASSI', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Finance', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 11.13, '2025-09-14T13:36:00.000Z'::timestamptz, '2025-09-14T13:36:00.000Z'::timestamptz, '2025-09-08T00:00:00.000Z'::timestamptz),
('OBCS-10945', 'Relance traitement de requête - Mise a jour salaire de base', 'Relance traitement de requête - Mise a jour salaire de base', 'Edwige KOUASSI', 'FIRST CAPITAL', 'FERDINAND KOUADIO', 'Comptable', 'RH', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.00, '2025-09-14T13:32:00.000Z'::timestamptz, '2025-09-14T13:32:00.000Z'::timestamptz, '2025-09-11T00:00:00.000Z'::timestamptz),
('OBCS-10944', 'Retour après de traitement de requête - Mise a jour salaire de base', 'Retour après de traitement de requête - Mise a jour salaire de base', 'Edwige KOUASSI', 'FIRST CAPITAL', 'FERDINAND KOUADIO', 'Comptable', 'RH', 'RH - Paramétrage', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.34, '2025-09-14T13:31:00.000Z'::timestamptz, '2025-09-14T13:31:00.000Z'::timestamptz, '2025-09-11T00:00:00.000Z'::timestamptz),
('OBCS-10943', 'Retour après Correction données de caisse', 'Retour après Correction données de caisse', 'Edwige KOUASSI', 'FIRST CAPITAL', 'FERDINAND KOUADIO', 'Comptable', 'Finance', 'RH - Paramétrage', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.90, '2025-09-14T13:28:00.000Z'::timestamptz, '2025-09-14T13:28:00.000Z'::timestamptz, '2025-09-11T00:00:00.000Z'::timestamptz),
('OBCS-10942', 'Rappel Appel Manqué - Relance sur traitement de données de la caisse', 'Relance sur traitement de données de la caisse', 'Edwige KOUASSI', 'FIRST CAPITAL', 'FERDINAND KOUADIO', 'Comptable', 'Finance', 'Finance - Trésorerie', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.11, '2025-09-14T13:27:00.000Z'::timestamptz, '2025-09-14T13:27:00.000Z'::timestamptz, '2025-09-11T00:00:00.000Z'::timestamptz),
('OBCS-10941', 'Relance sur paramétrage / Intégration Grade et données caisse', 'Relance sur paramétrage / Intégration Grade et données caisse', 'Edwige KOUASSI', 'FIRST CAPITAL', 'FERDINAND KOUADIO', 'Comptable', 'Finance', 'Finance - Trésorerie', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.43, '2025-09-14T13:18:00.000Z'::timestamptz, '2025-09-14T13:18:00.000Z'::timestamptz, NULL),
('OBCS-10936', 'Appel pour demande d''accès à CRM comme commercial interne pour Souare', 'Appel pour demande d''accès à CRM comme commercial interne pour Souare', 'Vivien DAKPOGAN', 'ARIC', 'M. Diome Serigne', 'Directeur général', 'CRM', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.14, '2025-09-14T12:31:00.000Z'::timestamptz, '2025-09-14T12:31:00.000Z'::timestamptz, '2025-09-08T00:00:00.000Z'::timestamptz),
('OBCS-10935', 'Retour après création de compte utilisateur', 'Demande de création de compte utilisateur', 'Edwige KOUASSI', 'FIRST CAPITAL', 'Denise SAOURE', 'Consultant DAF', 'Global', 'Clients', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.33, '2025-09-14T12:28:00.000Z'::timestamptz, '2025-09-14T12:28:00.000Z'::timestamptz, '2025-09-11T00:00:00.000Z'::timestamptz),
('OBCS-10928', 'Appel pour signaler traitement du point (salarié apparaissant dans le livre de paie général + salaire)', 'Appel pour signaler traitement du point (salarié apparaissant dans le livre de paie général + salaire)', 'Vivien DAKPOGAN', 'ARIC', 'Sanankoua Mickaelle', 'Directeur des Ressources Humaines', 'RH', 'Paramétrage', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.31, '2025-09-14T12:12:00.000Z'::timestamptz, '2025-09-14T12:12:00.000Z'::timestamptz, '2025-09-11T00:00:00.000Z'::timestamptz),
('OBCS-10927', 'Appel pour demander prise en charge rapide avant fin de journée pour les déclarations sociales', 'Appel pour demander prise en charge rapide avant fin de journée pour les déclarations sociales', 'Vivien DAKPOGAN', 'ARIC', 'Sanankoua Mickaelle', 'Directeur des Ressources Humaines', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.08, '2025-09-14T12:10:00.000Z'::timestamptz, '2025-09-14T12:10:00.000Z'::timestamptz, '2025-09-11T00:00:00.000Z'::timestamptz),
('OBCS-10926', 'Appel pour signaler réception de mail et prise en compte en traitement', 'Appel pour signaler réception de mail et prise en compte en traitement', 'Vivien DAKPOGAN', 'ARIC', 'Sanankoua Mickaelle', 'Directeur des Ressources Humaines', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.25, '2025-09-14T12:07:00.000Z'::timestamptz, '2025-09-14T12:07:00.000Z'::timestamptz, '2025-09-10T00:00:00.000Z'::timestamptz),
('OBCS-10925', 'Appel pour demander l''intégration de Numéro de pièce dans le grand-livre', 'Appel pour demander l''intégration de Numéro de pièce dans le grand-livre', 'Vivien DAKPOGAN', 'KOFFI & DIABATE', 'LYTA KENA-RABE', 'Contrôleur de Gestion', 'Finance', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.36, '2025-09-14T12:04:00.000Z'::timestamptz, '2025-09-14T12:04:00.000Z'::timestamptz, '2025-09-11T00:00:00.000Z'::timestamptz),
('OBCS-10923', 'Appel pour revue mise à jour des encaissements (Avance liée à facture)', 'Appel pour revue mise à jour des encaissements (Avance liée à facture)', 'Vivien DAKPOGAN', 'ARIC', 'Kramo', 'Chef Comptable', 'Opérations', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 7.45, '2025-09-14T11:58:00.000Z'::timestamptz, '2025-09-14T11:58:00.000Z'::timestamptz, '2025-09-12T00:00:00.000Z'::timestamptz),
('OBCS-10922', 'Appel pour signaler non déversement des opérations de caisse au moment de faire un retour de monnaie (Mois d''Août et Septembre)', 'Appel pour signaler non déversement des opérations de caisse au moment de faire un retour de monnaie (Mois d''Août et Septembre)', 'Vivien DAKPOGAN', 'ARIC', 'Kramo', 'Chef Comptable', 'Finance', 'Opérations - Vente', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.46, '2025-09-14T11:55:00.000Z'::timestamptz, '2025-09-14T11:55:00.000Z'::timestamptz, '2025-09-11T00:00:00.000Z'::timestamptz),
('OBCS-10921', 'Appel pour demande d''assistance sur caisse et création de compte pour un salarié', 'Appel pour demande d''assistance sur caisse et création de compte pour un salarié', 'Vivien DAKPOGAN', 'ARIC', 'Kramo', 'Chef Comptable', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.03, '2025-09-14T11:52:00.000Z'::timestamptz, '2025-09-14T11:52:00.000Z'::timestamptz, '2025-09-10T00:00:00.000Z'::timestamptz),
('OBCS-10920', 'Appel pour échanges sur accès Projets + Compta ana de Thibault', 'Appel pour échanges sur accès Projets + Compta ana de Thibault', 'Vivien DAKPOGAN', 'ARIC', 'Kramo', 'Chef Comptable', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.20, '2025-09-14T11:48:00.000Z'::timestamptz, '2025-09-14T11:48:00.000Z'::timestamptz, '2025-09-09T00:00:00.000Z'::timestamptz),
('OBCS-10919', 'Appel pour débrief sur CRM, sur filtre Date de création et Commercial', 'Appel pour débrief sur CRM, sur filtre Date de création et Commercial', 'Vivien DAKPOGAN', 'ARIC', 'M. Bénao', 'Directeur Logistique', 'CRM', 'Finance - Comptabilité analytique', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 11.02, '2025-09-14T11:43:00.000Z'::timestamptz, '2025-09-14T11:43:00.000Z'::timestamptz, '2025-09-12T00:00:00.000Z'::timestamptz),
('OBCS-10907', 'Assistance sur programmation de facture fournisseur', 'Assistance sur programmation de facture fournisseur', 'N''GBRA MOYE BERNICE DORIS', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Opérations', 'Activités commerciales', 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 4.13, '2025-09-12T20:32:00.000Z'::timestamptz, '2025-09-12T20:32:00.000Z'::timestamptz, '2025-09-10T00:00:00.000Z'::timestamptz),
('OBCS-10906', 'Assistance sur l''enregistrement de programme offre BTP', 'Assistance sur l''enregistrement de programme offre BTP', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'Amary TCHOTCHE', 'Chef de Projet', 'CRM', 'Opérations - Achat', 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, '2025-09-12T20:30:00.000Z'::timestamptz, '2025-09-12T20:30:00.000Z'::timestamptz, '2025-09-09T00:00:00.000Z'::timestamptz),
('OBCS-10905', 'Call pour séance de travail à planifier', 'Call pour séance de travail à planifier', 'N''GBRA MOYE BERNICE DORIS', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'RH', 'Offres', 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 1.30, '2025-09-12T20:28:00.000Z'::timestamptz, '2025-09-12T20:28:00.000Z'::timestamptz, '2025-09-09T00:00:00.000Z'::timestamptz),
('OBCS-10904', 'Call pour séance de travail', 'Call pour séance de travail', 'N''GBRA MOYE BERNICE DORIS', 'KOFFI & DIABATE', 'Jean-Jacques KOUASSI', 'Chef Comptable', 'Finance', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 0.35, '2025-09-12T20:24:00.000Z'::timestamptz, '2025-09-12T20:24:00.000Z'::timestamptz, '2025-09-09T00:00:00.000Z'::timestamptz),
('OBCS-10903', 'Relance sur balance comptable non soldée', 'Relance sur balance comptable non soldée', 'N''GBRA MOYE BERNICE DORIS', 'KOFFI & DIABATE', 'Jean-Jacques KOUASSI', 'Chef Comptable', 'Finance', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 0.31, '2025-09-12T20:24:00.000Z'::timestamptz, '2025-09-12T20:24:00.000Z'::timestamptz, '2025-09-09T00:00:00.000Z'::timestamptz),
('OBCS-10902', 'Relance sur balance comptable non soldée', 'Relance sur balance comptable non soldée', 'N''GBRA MOYE BERNICE DORIS', 'KOFFI & DIABATE', 'Jean-Jacques KOUASSI', 'Chef Comptable', 'Finance', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 1.56, '2025-09-12T20:22:00.000Z'::timestamptz, '2025-09-12T20:22:00.000Z'::timestamptz, '2025-09-09T00:00:00.000Z'::timestamptz),
('OBCS-10901', 'Assistance sur le stock', 'Assistance sur le stock', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'MONSIEUR COULIBALY', 'Responsable Achat', 'Opérations', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 5.46, '2025-09-12T20:13:00.000Z'::timestamptz, '2025-09-12T20:18:00.000Z'::timestamptz, '2025-09-09T00:00:00.000Z'::timestamptz),
('OBCS-10900', 'Assistance sur le stock', 'Assistance sur le stock', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'Opérations', 'Opérations - Gestion de stock', 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 0.19, '2025-09-12T20:12:00.000Z'::timestamptz, '2025-09-12T20:16:00.000Z'::timestamptz, '2025-09-11T00:00:00.000Z'::timestamptz),
('OBCS-10899', 'Assistance sur le stock', 'Assistance sur le stock', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'Opérations', 'Opérations - Gestion de stock', 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 0.29, '2025-09-12T20:11:00.000Z'::timestamptz, '2025-09-12T20:17:00.000Z'::timestamptz, '2025-09-11T00:00:00.000Z'::timestamptz),
('OBCS-10898', 'Assistance sur le stock', 'Assistance sur le stock', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'Opérations', 'Opérations - Gestion de stock', 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 1.12, '2025-09-12T20:11:00.000Z'::timestamptz, '2025-09-12T20:19:00.000Z'::timestamptz, '2025-09-09T00:00:00.000Z'::timestamptz),
('OBCS-10896', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Chef Comptable', 'RH', 'Opérations - Gestion de stock', 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 0.22, '2025-09-12T20:06:00.000Z'::timestamptz, '2025-09-12T20:18:00.000Z'::timestamptz, '2025-09-09T00:00:00.000Z'::timestamptz),
('OBCS-10895', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Chef Comptable', 'RH', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 1.10, '2025-09-12T20:05:00.000Z'::timestamptz, '2025-09-12T20:18:00.000Z'::timestamptz, '2025-09-09T00:00:00.000Z'::timestamptz),
('OBCS-10883', 'Relance pour la correction des comptes tiers apparaissant dans la balance transmise, mais enregistrés dans OBC avec un compte général différent de celui du fichier transmis.', 'Relance pour la correction des comptes tiers apparaissant dans la balance transmise, mais enregistrés dans OBC avec un compte général différent de celui du fichier transmis.', 'GNAHORE AMOS', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Finance', NULL, 'Appel WhatsApp'::canal_t, 'Low'::priority_t, 'Resolue', 8.00, '2025-09-12T18:00:00.000Z'::timestamptz, '2025-09-12T18:00:00.000Z'::timestamptz, '2025-09-12T00:00:00.000Z'::timestamptz),
('OBCS-10882', 'Comment programmer un règlement fournisseur, avec un même chèque, plusieurs factures ainsi qu’une avance d’un même fournisseur ?', 'Comment programmer un règlement fournisseur, avec un même chèque, plusieurs factures ainsi qu’une avance d’un même fournisseur ?', 'GNAHORE AMOS', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Opérations', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.20, '2025-09-12T17:49:00.000Z'::timestamptz, '2025-09-12T17:49:00.000Z'::timestamptz, '2025-09-12T00:00:00.000Z'::timestamptz),
('OBCS-10869', 'Séance de travail avec Kramo pour échange sur problème doublon compta ana + livres analytiques', 'Séance de travail avec Kramo pour échange sur problème doublon compta ana + livres analytiques', 'Vivien DAKPOGAN', 'ARIC', 'Kramo', 'Chef Comptable', 'Finance', 'Opérations - Achat', 'Online (Google Meet, Teams...)'::canal_t, 'Low'::priority_t, 'Resolue', 30.00, '2025-09-08T16:56:00.000Z'::timestamptz, '2025-09-08T16:56:00.000Z'::timestamptz, '2025-09-08T00:00:00.000Z'::timestamptz),
('OBCS-10865', 'Assistance paramétrage Finance', 'Assistance paramétrage Finance', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Finance', 'Finance - Comptabilité analytique', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.17, '2025-09-07T22:18:00.000Z'::timestamptz, '2025-09-07T22:18:00.000Z'::timestamptz, NULL),
('OBCS-10864', 'Assistance paramétrage Finance', 'Assistance paramétrage Finance', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.17, '2025-09-07T22:18:00.000Z'::timestamptz, '2025-09-07T22:18:00.000Z'::timestamptz, NULL),
('OBCS-10863', 'Assistance paramétrage Finance', 'Assistance paramétrage Finance', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.46, '2025-09-07T22:17:00.000Z'::timestamptz, '2025-09-07T22:17:00.000Z'::timestamptz, NULL),
('OBCS-10862', 'Assistance paramétrage Finance', 'Assistance paramétrage Finance', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.46, '2025-09-07T22:16:00.000Z'::timestamptz, '2025-09-07T22:16:00.000Z'::timestamptz, NULL),
('OBCS-10861', 'Assistance paramétrage Finance', 'Assistance paramétrage Finance', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.48, '2025-09-07T22:16:00.000Z'::timestamptz, '2025-09-07T22:16:00.000Z'::timestamptz, NULL),
('OBCS-10847', 'Assistance sur les requêtes liées à la comptabilité', 'Assistance sur les requêtes liées à la comptabilité', 'N''GBRA MOYE BERNICE DORIS', 'KOFFI & DIABATE', 'Jean-Jacques KOUASSI', 'Chef Comptable', 'Finance', 'Finance - Comptabilité Générale', 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 0.26, '2025-09-07T17:11:00.000Z'::timestamptz, '2025-09-07T17:11:00.000Z'::timestamptz, '2025-09-05T00:00:00.000Z'::timestamptz),
('OBCS-10846', 'Assistance sur les requêtes liées à la comptabilité', 'Assistance sur les requêtes liées à la comptabilité', 'N''GBRA MOYE BERNICE DORIS', 'KOFFI & DIABATE', 'Jean-Jacques KOUASSI', 'Chef Comptable', 'Finance', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 6.00, '2025-09-07T17:10:00.000Z'::timestamptz, '2025-09-07T17:10:00.000Z'::timestamptz, '2025-09-05T00:00:00.000Z'::timestamptz),
('OBCS-10845', 'Call pour planification des tests à faire sur la partie RH', 'Call pour planification des tests à faire sur la partie RH', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'RH', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 2.54, '2025-09-07T17:06:00.000Z'::timestamptz, '2025-09-07T17:06:00.000Z'::timestamptz, '2025-09-05T00:00:00.000Z'::timestamptz),
('OBCS-10844', 'Call pour planification des tests à faire sur la partie RH', 'Call pour planification des tests à faire sur la partie RH', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'RH', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 0.34, '2025-09-07T17:05:00.000Z'::timestamptz, '2025-09-07T17:05:00.000Z'::timestamptz, '2025-09-03T00:00:00.000Z'::timestamptz),
('OBCS-10843', 'Assistance sur la partie RH', 'Assistance sur la partie RH', 'N''GBRA MOYE BERNICE DORIS', 'FIRST CAPITAL', 'MONSIEUR EHUI', 'Chef de Projet', 'RH', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 1.17, '2025-09-07T17:03:00.000Z'::timestamptz, '2025-09-07T17:03:00.000Z'::timestamptz, '2025-09-03T00:00:00.000Z'::timestamptz),
('OBCS-10842', 'Assistance sur la partie RH', 'Assistance sur la partie RH', 'N''GBRA MOYE BERNICE DORIS', 'FIRST CAPITAL', 'MONSIEUR EHUI', 'Chef de Projet', 'RH', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 1.70, '2025-09-07T17:03:00.000Z'::timestamptz, '2025-09-07T17:03:00.000Z'::timestamptz, '2025-09-03T00:00:00.000Z'::timestamptz),
('OBCS-10841', 'Assistance sur la partie RH', 'Assistance sur la partie RH', 'N''GBRA MOYE BERNICE DORIS', 'FIRST CAPITAL', 'MONSIEUR EHUI', 'Chef de Projet', 'RH', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 4.24, '2025-09-07T17:02:00.000Z'::timestamptz, '2025-09-07T17:02:00.000Z'::timestamptz, '2025-09-03T00:00:00.000Z'::timestamptz),
('OBCS-10840', 'Assistance sur la partie RH', 'Assistance sur la partie RH', 'N''GBRA MOYE BERNICE DORIS', 'FIRST CAPITAL', 'MONSIEUR EHUI', 'Chef de Projet', 'RH', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 7.80, '2025-09-07T17:02:00.000Z'::timestamptz, '2025-09-07T17:02:00.000Z'::timestamptz, '2025-09-03T00:00:00.000Z'::timestamptz),
('OBCS-10839', 'Assistance sur le simulateur de salaire', 'Assistance sur le simulateur de salaire', 'N''GBRA MOYE BERNICE DORIS', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Directeur Administratif et Financier', 'RH', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 4.60, '2025-09-07T16:55:00.000Z'::timestamptz, '2025-09-07T16:55:00.000Z'::timestamptz, '2025-09-02T00:00:00.000Z'::timestamptz),
('OBCS-10836', 'Assistance sur facture vente', 'Assistance sur facture vente', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'ERIC KOUADIO', 'Comptable', 'Opérations', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 1.45, '2025-09-07T16:48:00.000Z'::timestamptz, '2025-09-07T16:48:00.000Z'::timestamptz, '2025-09-01T00:00:00.000Z'::timestamptz),
('OBCS-10835', 'Assistance sur le PNL d''un projet', 'Assistance sur le PNL d’un projet', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'FRANCIS AURELIEN KOUTOU', 'Consultant Comptable', 'Projets', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 3.80, '2025-09-07T16:46:00.000Z'::timestamptz, '2025-09-07T16:46:00.000Z'::timestamptz, '2025-09-01T00:00:00.000Z'::timestamptz),
('OBCS-10791', 'Assistance sur le paramétrage de la comptabilité analytique', 'Assistance sur le paramétrage de la comptabilité analytique', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'CHARLES IPO', 'Chef Comptable', 'Finance', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.12, NULL, NULL, NULL),
('OBCS-10790', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'CHARLES IPO', 'Chef Comptable', 'RH', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.54, NULL, NULL, NULL),
('OBCS-10788', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'CSCTICAO', 'SERGE ARIKO', 'Directeur Administratif et Financier', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.00, NULL, NULL, NULL),
('OBCS-10787', 'Assistance sur le budget', 'Assistance sur le budget', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'FRANCIS AURELIEN KOUTOU', 'Consultant Comptable', 'Finance', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 7.21, NULL, NULL, NULL),
('OBCS-10786', 'Assistance sur le budget', 'Assistance sur le budget', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'FRANCIS AURELIEN KOUTOU', 'Consultant Comptable', 'Finance', 'Finance - Budget', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 12.45, NULL, NULL, NULL),
('OBCS-10785', 'Assistance sur la comptabilité', 'Assistance sur la comptabilité', 'N''GBRA MOYE BERNICE DORIS', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Directeur Administratif et Financier', 'Finance', 'Finance - Budget', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.20, NULL, NULL, NULL),
('OBCS-10784', 'Assistance sur le RAN', 'Assistance sur le RAN', 'N''GBRA MOYE BERNICE DORIS', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Directeur Administratif et Financier', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.00, NULL, NULL, NULL),
('OBCS-10783', 'Assistance sur le RAN', 'Assistance sur le RAN', 'N''GBRA MOYE BERNICE DORIS', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Comptable', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.47, NULL, NULL, NULL),
('OBCS-10782', 'Assistance sur l''enregistrement d''une facture vente', 'Assistance sur l''enregistrement d''une facture vente', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'ERIC KOUADIO', 'Comptable', 'Opérations', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.15, NULL, NULL, NULL),
('OBCS-10780', 'Assistance sur les accès', 'Assistance sur les accès', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'Global', 'Opérations - Vente', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.24, NULL, NULL, NULL),
('OBCS-10779', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MADAME GOURI', 'Responsable RH', 'RH', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.38, NULL, NULL, NULL),
('OBCS-10778', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MADAME GOURI', 'Responsable RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.32, NULL, NULL, NULL),
('OBCS-10775', 'Assistance sur les requetes de  CRM', 'Assistance sur les requetes de  CRM', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'Roselin Tiecoura', 'Informaticien', 'CRM', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.18, NULL, NULL, NULL),
('OBCS-10774', 'RH/Salaire/ Calcul salaire', 'Redirection vers support pour traitement de données urg  pour raison de déplacement chez un client', 'Edwige KOUASSI', 'IVOIRE DEVELOPPEMENT', 'Evelyne COULIBALY', 'Responsable RH', 'RH', 'Offres', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.53, NULL, NULL, NULL),
('OBCS-10772', 'Planification séance de travail - Traitement données comptable', 'Traitement données comptable', 'Edwige KOUASSI', 'JOEL K PROPERTIES', 'Raïssa CAMARA', 'Comptable', 'Finance', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 10.35, NULL, NULL, NULL),
('OBCS-10769', 'Retour après correction et envoie de données comptable - Intégration RAN', 'Retour après correction et envoie de données comptable - Intégration RAN', 'Edwige KOUASSI', 'ECORIGINE', 'Souleymane CISSE', 'RAF', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.51, NULL, NULL, NULL),
('OBCS-10766', 'Assistance', 'Assistance Revu des N° matricule en double', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.38, NULL, NULL, NULL),
  ('OBCS-10765', 'Retour solution traitement d''incohérence matricule employé', 'Assistance Revu des N° matricule en double -
Calcul de salaire incohérent du au mauvais matricule.
Difficulté : 1 employé peut être enregistré deux fois sur OBC avec un N° de matricule différent alors que dans les paramétrages de base l’option matricule automatique est activé.', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.11, NULL, NULL, NULL),
('OBCS-10761', 'Assistance Revu des N° matricule en double', 'Assistance Revu des N° matricule en double - Doublon dû a une erreur d’incrémentation OBC', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.10, NULL, NULL, NULL),
('OBCS-10760', 'Assistance Revu des N° matricule en double', 'Assistance Revu des N° matricule en double', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.31, NULL, NULL, NULL),
('OBCS-10745', 'Appel pour avoir des informations sur la gestion de l''historique des congés pour mise à jour', 'Appel pour avoir des informations sur la gestion de l''historique des congés pour mise à jour', 'Vivien DAKPOGAN', 'FIRST CAPITAL', 'M.Ehui', 'Directeur des Ressources Humaines', 'RH', 'RH - Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.38, NULL, NULL, NULL),
('OBCS-10743', 'Rappel après appel manqué pour explication sur état traitement client (grand-livre tier + interrogation de compte)', 'Rappel après appel manqué pour explication sur état traitement client (grand-livre tier + interrogation de compte)', 'Vivien DAKPOGAN', 'ARIC', 'Mme Cissé', 'Directeur Administratif et Financier', 'Finance', 'RH - Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.28, NULL, NULL, NULL),
('OBCS-10741', 'Appel pour signifier possibilité de saisir des stocks initiaux sur des stocks existant + création de comptes utilisateurs', 'Appel pour signifier possibilité de saisir des stocks initiaux sur des stocks existant + création de comptes utilisateurs', 'Vivien DAKPOGAN', 'ARIC', 'M. Ndadji', 'Assistant(e) Gestionnaire Stock', 'Opérations', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 8.23, NULL, NULL, NULL),
('OBCS-10739', 'Rappel après message WhatsApp afin de comprendre le point évoqué sur le gap entre la paie de Juillet et Août', 'Rappel après message WhatsApp afin de comprendre le point évoqué sur le gap entre la paie de Juillet et Août', 'Vivien DAKPOGAN', 'ARIC', 'Sanankoua Mickaelle', 'Directeur des Ressources Humaines', 'RH', 'Opérations - Gestion de stock', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.41, NULL, NULL, NULL),
('OBCS-10734', 'Relance présentation Agro - Export', 'Relance sur séance de présentation Agro export', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Global', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.10, NULL, NULL, NULL),
('OBCS-10733', 'Assistance Compta', 'Assistance', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Finance', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.11, NULL, NULL, NULL),
('OBCS-10731', 'Demande d''assistance Module Fi & Agro', 'Demande d''assistance Module Fi & Agro', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur de Gestion', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.21, NULL, NULL, NULL),
('OBCS-10730', 'Demande d''assistance Module Fi & Agro', 'Assistance Correction écritures comptable / Agro', 'Edwige KOUASSI', 'ECORIGINE', 'Michel TETE', 'Contrôleur Qualité', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.27, NULL, NULL, NULL),
('OBCS-10724', 'Assistance sur le calcul de salaire et congés', 'Assistance sur le calcul de salaire et congés', 'N''GBRA MOYE BERNICE DORIS', 'CSCTICAO', 'SERGE ARIKO', 'Directeur Administratif et Financier', 'RH', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.60, NULL, NULL, NULL),
('OBCS-10723', 'Assistance sur la suppression de factures achat 2024', 'Assistance sur la suppression de factures achat 2024', 'N''GBRA MOYE BERNICE DORIS', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Opérations', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.49, NULL, NULL, NULL),
('OBCS-10722', 'Assistance sur la suppression de factures achat 2024', 'Assistance sur la suppression de factures achat 2024', 'N''GBRA MOYE BERNICE DORIS', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Opérations', 'Opérations - Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.18, NULL, NULL, NULL),
('OBCS-10721', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MADAME GOURI', 'Responsable RH', 'RH', 'Opérations - Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.00, NULL, NULL, NULL),
('OBCS-10720', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MADAME GOURI', 'Responsable RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.00, NULL, NULL, NULL),
('OBCS-10719', 'Assistance sur paramétrage d''accès', 'Assistance sur paramétrage d''accès', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'Global', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.25, NULL, NULL, NULL),
('OBCS-10718', 'Assistance sur paramétrage d''accès', 'Assistance sur paramétrage d''accès', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'Global', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.29, NULL, NULL, NULL),
('OBCS-10717', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', '2AAZ', 'MADAME LIDIANE', 'Comptable', 'RH', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.56, NULL, NULL, NULL),
('OBCS-10716', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', '2AAZ', 'MADAME LIDIANE', 'Comptable', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 8.58, NULL, NULL, NULL),
('OBCS-10715', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', '2AAZ', 'MADAME LIDIANE', 'Comptable', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.46, NULL, NULL, NULL),
('OBCS-10714', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', '2AAZ', 'MADAME LIDIANE', 'Comptable', 'RH', 'RH - Rapports', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.36, NULL, NULL, NULL),
('OBCS-10713', 'Assistance sur les factures ventes', 'Assistance sur les factures ventes', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'ERIC KOUADIO', 'Comptable', 'Opérations', 'RH - Rapports', 'Online (Google Meet, Teams...)'::canal_t, 'Low'::priority_t, 'Resolue', 45.00, NULL, NULL, NULL),
('OBCS-10712', 'Assistance sur les factures ventes', 'Assistance sur les factures ventes', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'ERIC KOUADIO', 'Comptable', 'Opérations', 'Opérations - Vente', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 12.25, NULL, NULL, NULL),
('OBCS-10711', 'Assistance sur les factures ventes', 'Assistance sur les factures ventes', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'ERIC KOUADIO', 'Comptable', 'Opérations', 'Opérations - Vente', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 10.45, NULL, NULL, NULL),
('OBCS-10710', 'Assistance sur les FNE', 'Assistance sur les FNE', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'ERIC KOUADIO', 'Comptable', 'Opérations', 'Opérations - Vente', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.31, NULL, NULL, NULL),
('OBCS-10709', 'Assistance sur les factures ventes', 'Assistance sur les factures ventes', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'ERIC KOUADIO', 'Comptable', 'Opérations', 'Opérations - Vente', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.24, NULL, NULL, NULL),
('OBCS-10698', 'La cliente voulait savoir pourquoi la ventilation analytique se déverse lors de l’enregistrement d’une facture.', 'La cliente voulait savoir pourquoi la ventilation analytique se déverse lors de l’enregistrement d’une facture. Cela est dû au fait qu’elle avait cliqué sur *_OK_* lorsque le système lui a demandé si elle souhaitait effectuer une ventilation analytique.', 'EVA BASSE', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Opérations', 'Opérations - Vente', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.00, NULL, NULL, NULL),
('OBCS-10669', 'Relance sur envoie de données Traitement RAN', 'Relance sur envoie de données Traitement RAN', 'Edwige KOUASSI', 'ECORIGINE', 'Souleymane CISSE', 'RAF', 'Finance', 'Opérations - Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.53, NULL, NULL, NULL),
('OBCS-10668', 'Assistance sur le parametrage CRM', 'Assistance sur le parametrage CRM', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'Roselin Tiecoura', 'Informaticien', 'CRM', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.44, NULL, NULL, NULL),
('OBCS-10667', 'Assistance sur acces compte', 'Assistance sur acces compte', 'N''GBRA MOYE BERNICE DORIS', '2AAZ', 'MADAME LIDIANE', 'Comptable', 'Global', 'Offres', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.17, NULL, NULL, NULL),
('OBCS-10666', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'Jean-Claude SAMPENNIE', 'Directeur Administratif et Financier', 'RH', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.35, NULL, NULL, NULL),
  ('OBCS-10665', 'Assistance', 'Assistance et point sur mobilisation des acteurs ou utilisateur.
Souhaite mettre une stratégie en place pour pousser les employés à utiliser l’outil OBC', 'Edwige KOUASSI', 'IVOIRE DEVELOPPEMENT', 'GAHI Lezou Jean', 'Comptable', 'Finance', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 10.30, NULL, NULL, NULL),
('OBCS-10664', 'Assistance sur le traitement de requetes', 'Assistance sur le traitement de requetes', 'N''GBRA MOYE BERNICE DORIS', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Directeur Administratif et Financier', 'Opérations', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.45, NULL, NULL, NULL),
('OBCS-10663', 'Demande d''assistance', 'Redirection support OBC pour assistance sur la gestion de la paie', 'Edwige KOUASSI', 'IVOIRE DEVELOPPEMENT', 'Evelyne COULIBALY', 'Responsable RH', 'RH', 'Opérations - Gestion de stock', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.00, NULL, NULL, NULL),
('OBCS-10661', 'Assistance sur le traitement de requetes', 'Assistance sur le traitement de requêtes', 'N''GBRA MOYE BERNICE DORIS', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Directeur Administratif et Financier', 'Opérations', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.30, NULL, NULL, NULL),
('OBCS-10660', 'Assistance fichier du personnel', 'Assistance fichier du personnel', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'Opérations - Vente', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.21, NULL, NULL, NULL),
('OBCS-10659', 'Demande d''assistance enregistrement', 'Assistance sur enregistrement fiche employé', 'Edwige KOUASSI', 'CILAGRI', 'EHUI Inesse', 'Assistant(e) RH', 'RH', 'RH - Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.39, NULL, NULL, NULL),
('OBCS-10658', 'Assistance sur FNE à intégrer', 'Assistance sur FNE à intégrer', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'ERIC KOUADIO', 'Comptable', 'Opérations', 'RH - Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.50, NULL, NULL, NULL),
('OBCS-10657', 'Mauvais déversement d''un paiement par chèque d''une avance fournisseur dans le grand livre.', 'Mauvais déversement d''un paiement par chèque d''une avance fournisseur dans le grand livre.', 'EVA BASSE', 'SIT BTP', 'KONE Mariam', 'Contrôleur de Gestion', 'Finance', 'Opérations - Achat', 'Chat WhatsApp'::canal_t, 'Low'::priority_t, 'Resolue', 26.00, NULL, NULL, NULL),
('OBCS-10656', 'Demande d''assistance sur la comptabilité', 'Demande d’assistance sur la caisse', 'Edwige KOUASSI', 'FIRST CAPITAL', 'FERDINAND KOUADIO', 'Comptable', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.10, NULL, NULL, NULL),
('OBCS-10655', 'Assistance sur contrats de travail ohada', 'Assistance sur contrats de travail ohada', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'OUSSOU Martine', 'Responsable RH', 'RH', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.27, NULL, NULL, NULL),
('OBCS-10654', 'Assistance sur paramétrage accès compte utilisateur', 'Assistance sur paramétrage accès compte utilisateur', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'Global', 'RH - Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.56, NULL, NULL, NULL),
('OBCS-10653', 'Assistance Compta', 'Assistance comptabilité', 'Edwige KOUASSI', 'FIRST CAPITAL', 'FERDINAND KOUADIO', 'Comptable', 'Finance', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.41, NULL, NULL, NULL),
('OBCS-10652', 'Rappel Appel Manqué pour cause de formation', 'Assistance pour accès utilisateur - POint résolu par le client sans intervention', 'Edwige KOUASSI', 'KORI TRANSPORT', 'Ibrahim COULIBALY', 'Chef de Projet', 'Global', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.20, NULL, NULL, NULL),
('OBCS-10651', 'Assistance sur paramétrage Comptabilité analytique', 'Assistance sur paramétrage Comptabilité analytique', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'FRANCIS AURELIEN KOUTOU', 'Consultant Comptable', 'Finance', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.90, NULL, NULL, NULL),
('OBCS-10650', 'Rappel appel manqué - Assistance calcul salaire autre paie', 'Rappel appel manqué - Assistance calcul salaire autre paie', 'Edwige KOUASSI', 'JOEL K PROPERTIES', 'Estelle BOA', 'Assistant(e) RH', 'RH', 'Finance - Comptabilité analytique', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.25, NULL, NULL, NULL),
('OBCS-10649', 'Assistance sur paramétrage Comptabilité analytique', 'Assistance sur paramétrage Comptabilité analytique', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'FRANCIS AURELIEN KOUTOU', 'Consultant Comptable', 'Finance', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.23, NULL, NULL, NULL),
('OBCS-10648', 'Assistance sur congés RH', 'Assistance sur congés RH', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'CHARLES IPO', 'Chef Comptable', 'RH', 'Finance - Comptabilité analytique', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.39, NULL, NULL, NULL),
('OBCS-10647', 'Assistance sur le calcul de salaire', 'Assistance sur calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MADAME GOURI', 'Responsable RH', 'RH', 'RH - Documents', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.25, NULL, NULL, NULL),
('OBCS-10646', 'Assistance sur calcul de salaire', 'Assistance sur calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MADAME GOURI', 'Responsable RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.31, NULL, NULL, NULL),
('OBCS-10644', 'Assistance sur calcul de salaire', 'Assistance sur calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MADAME GOURI', 'Responsable RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.13, NULL, NULL, NULL),
('OBCS-10643', 'Assistance sur calcul de salaire', 'Assistance sur calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MADAME GOURI', 'Responsable RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.35, NULL, NULL, NULL),
('OBCS-10642', 'RH/Salair/ Calcul salaire autre paie', 'Assistance Paramétrage calcul salaire autre paie', 'Edwige KOUASSI', 'JOEL K PROPERTIES', 'Estelle BOA', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 12.12, NULL, NULL, NULL),
('OBCS-10641', 'RH/Salair/ Calcul salaire autre paie', 'Assistance Paramétrage calcul salaire autre paie', 'Edwige KOUASSI', 'JOEL K PROPERTIES', 'Estelle BOA', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.16, NULL, NULL, NULL),
('OBCS-10640', 'RH/Salair/ Calcul salaire autre paie', 'Assistance Paramétrage calcul salaire autre paie', 'Edwige KOUASSI', 'JOEL K PROPERTIES', 'Estelle BOA', 'Assistant(e) RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.55, NULL, NULL, NULL),
('OBCS-10620', 'Appel pour assistance comptable sur sujet d''importations du RAN, traitement des écarts constatés', 'Appel pour assistance comptable sur sujet d''importations du RAN, traitement des écarts constatés', 'Vivien DAKPOGAN', 'ARIC', 'Kramo', 'Chef Comptable', 'Finance', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 10.00, NULL, NULL, NULL),
('OBCS-10619', 'Appel pour demande d''intégration de 2 comptes tiers et 2 centres de coûts', 'Appel pour demande d''intégration de 2 comptes tiers et 2 centres de coûts', 'Vivien DAKPOGAN', 'ARIC', 'Kramo', 'Chef Comptable', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.38, NULL, NULL, NULL),
('OBCS-10618', 'Appel pour informer de l''envoi des fichiers de grade par salarié', 'Appel pour informer de l''envoi des fichiers de grade par salarié', 'Vivien DAKPOGAN', 'FIRST CAPITAL', 'FERDINAND KOUADIO', 'Comptable', 'RH', 'Finance - Comptabilité analytique', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.58, NULL, NULL, NULL),
('OBCS-10611', 'Assistance Compta', 'Assistance sur correction écritures manuelle', 'Edwige KOUASSI', 'CILAGRI', 'TAHI Serge', 'Comptable', 'Finance', 'RH - Paramétrage', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 8.90, '2025-07-15T00:00:00.000Z'::timestamptz, NULL, '2025-07-15T00:00:00.000Z'::timestamptz),
('OBCS-10610', 'Rappel appel manqué - Assistance sur correction écritures manuelle', 'Rappel appel manqué - Assistance sur correction écritures manuelle', 'Edwige KOUASSI', 'CILAGRI', 'TAHI Serge', 'Comptable', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 7.20, '2025-07-22T00:00:00.000Z'::timestamptz, NULL, '2025-07-22T00:00:00.000Z'::timestamptz),
('OBCS-10609', 'Assistance sur les saisies comptables', 'Assistance sur les saisies comptables', 'Edwige KOUASSI', 'FIRST CAPITAL', 'M KOUASSI', 'Comptable', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.59, '2025-07-31T00:00:00.000Z'::timestamptz, NULL, '2025-07-31T00:00:00.000Z'::timestamptz),
('OBCS-10608', 'Demande d''information sur le processus de suppression d''une écriture comptable', 'Demande d''information sur le processus de suppression d''une écriture comptable', 'Edwige KOUASSI', 'FIRST CAPITAL', 'AKMEL', 'Assistant(e) Comptable', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.30, NULL, NULL, NULL),
('OBCS-10607', 'Assistance', 'Rapprochement bancaire', 'Edwige KOUASSI', 'FIRST CAPITAL', 'FLORENCE OUAYOU', 'Chef Comptable', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.50, '2025-07-28T00:00:00.000Z'::timestamptz, NULL, '2025-07-28T00:00:00.000Z'::timestamptz),
('OBCS-10606', 'Assistance', 'Rapprochement bancaire', 'Edwige KOUASSI', 'FIRST CAPITAL', 'FLORENCE OUAYOU', 'Chef Comptable', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.30, '2025-07-28T00:00:00.000Z'::timestamptz, NULL, '2025-07-28T00:00:00.000Z'::timestamptz),
('OBCS-10605', 'Assistance Compta', 'Assistance Sur Opération de caisse', 'Edwige KOUASSI', 'FIRST CAPITAL', 'FLORENCE OUAYOU', 'Chef Comptable', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.52, '2025-07-30T00:00:00.000Z'::timestamptz, NULL, '2025-07-30T00:00:00.000Z'::timestamptz),
('OBCS-10604', 'Assistance', 'Assistance Sur Opération de caisse', 'Edwige KOUASSI', 'FIRST CAPITAL', 'FLORENCE OUAYOU', 'Chef Comptable', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.16, '2025-07-30T00:00:00.000Z'::timestamptz, NULL, '2025-07-30T00:00:00.000Z'::timestamptz),
('OBCS-10603', 'Assistance RH - Correction Ancienneté', 'Assistance RH - Correction Ancienneté', 'Edwige KOUASSI', '2AAZ', 'Marcelle AHOUSSOU', 'Directeur général', 'RH', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.56, NULL, NULL, NULL),
('OBCS-10602', 'Assistance RH - Correction Ancienneté', 'Assistance RH - Correction Ancienneté', 'Edwige KOUASSI', '2AAZ', 'Marcelle AHOUSSOU', 'Directeur Administratif et Financier', 'RH', 'RH - Documents', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.53, NULL, NULL, NULL),
('OBCS-10593', 'Demande d''assistance comptab', 'Assistance', 'Edwige KOUASSI', 'JOEL K PROPERTIES', 'Raïssa CAMARA', 'Comptable', 'Finance', 'RH - Documents', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.30, '2025-07-30T00:00:00.000Z'::timestamptz, NULL, '2025-07-30T00:00:00.000Z'::timestamptz),
('OBCS-10592', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'Jean-Claude SAMPENNIE', 'Directeur Administratif et Financier', 'RH', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.10, NULL, NULL, NULL),
('OBCS-10591', 'Assistance Compta', 'Assistance', 'Edwige KOUASSI', 'JOEL K PROPERTIES', 'Raïssa CAMARA', 'Comptable', 'Finance', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.53, '2025-07-30T00:00:00.000Z'::timestamptz, NULL, '2025-07-30T00:00:00.000Z'::timestamptz),
('OBCS-10590', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'Jean-Claude SAMPENNIE', 'Consultant Comptable', 'RH', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.17, NULL, NULL, NULL),
('OBCS-10589', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'Jean-Claude SAMPENNIE', 'Directeur Administratif et Financier', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.30, NULL, NULL, NULL),
('OBCS-10588', 'Assistance Compta', 'Assistance', 'Edwige KOUASSI', 'JOEL K PROPERTIES', 'Raïssa CAMARA', 'Comptable', 'Finance', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.14, '2025-07-31T00:00:00.000Z'::timestamptz, NULL, '2025-07-31T00:00:00.000Z'::timestamptz),
('OBCS-10587', 'Planification de séance de travail - Budget', 'Planification de séance de travail - Budget', 'Edwige KOUASSI', 'JOEL K PROPERTIES', 'Raïssa CAMARA', 'Comptable', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.57, NULL, NULL, NULL),
('OBCS-10586', 'Relance Bug en cours', 'Impossible d''editer un OD - Liste des employés incomplète', 'Edwige KOUASSI', 'IVOIRE DEVELOPPEMENT', 'Evelyne COULIBALY', 'Responsable RH', 'RH', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.23, '2025-07-31T00:00:00.000Z'::timestamptz, NULL, '2025-07-31T00:00:00.000Z'::timestamptz),
('OBCS-10584', 'Retour call - Assistance RH', 'Bug sur certificat de travail', 'Edwige KOUASSI', 'IVOIRE DEVELOPPEMENT', 'Evelyne COULIBALY', 'Responsable RH', 'RH', 'RH - Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.39, NULL, NULL, NULL),
('OBCS-10583', 'Assistance sur Offre BTP', 'Assistance sur Offre BTP', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'Roselin Tiecoura', 'Informaticien', 'CRM', 'RH - Documents', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.40, NULL, NULL, NULL),
('OBCS-10582', 'Assistance sur Offre BTP', 'Assistance sur Offre BTP', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'Roselin Tiecoura', 'Informaticien', 'CRM', 'Offres', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.36, NULL, NULL, NULL),
('OBCS-10581', 'Relance Intégration modèle de Tableau d''amortissement & déséquilibre balance', 'Relance Intégration modèle de Tableau d''amortissement & déséquilibre balance', 'Edwige KOUASSI', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Finance', 'Offres', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 14.30, '2025-07-29T00:00:00.000Z'::timestamptz, NULL, '2025-07-29T00:00:00.000Z'::timestamptz),
('OBCS-10580', 'Assistance Compta', 'Assistance traitement comptable', 'Edwige KOUASSI', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 6.30, '2025-07-29T00:00:00.000Z'::timestamptz, NULL, '2025-07-29T00:00:00.000Z'::timestamptz),
('OBCS-10579', 'Assistance  sur le RAN', 'Assistance  sur le RAN', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'FRANCIS AURELIEN KOUTOU', 'Consultant Comptable', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.26, NULL, NULL, NULL),
('OBCS-10578', 'Assistance  sur le RAN', 'Assistance  sur le RAN', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'FRANCIS AURELIEN KOUTOU', 'Consultant Comptable', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.60, NULL, NULL, NULL),
('OBCS-10577', 'Assistance  sur le RAN', 'Assistance  sur le RAN', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'FRANCIS AURELIEN KOUTOU', 'Consultant Comptable', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.10, NULL, NULL, NULL),
('OBCS-10576', 'Assistance  sur le RAN', 'Assistance  sur le RAN', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'FRANCIS AURELIEN KOUTOU', 'Consultant Comptable', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.59, NULL, NULL, NULL),
('OBCS-10575', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Directeur Administratif et Financier', 'RH', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.50, NULL, NULL, NULL),
('OBCS-10574', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'Jean-Claude SAMPENNIE', 'Directeur Administratif et Financier', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.21, NULL, NULL, NULL),
('OBCS-10573', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'Jean-Claude SAMPENNIE', 'Directeur Administratif et Financier', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.14, NULL, NULL, NULL),
('OBCS-10572', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'Jean-Claude SAMPENNIE', 'Directeur Administratif et Financier', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.11, NULL, NULL, NULL),
('OBCS-10571', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'Jean-Claude SAMPENNIE', 'Directeur Administratif et Financier', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.16, NULL, NULL, NULL),
('OBCS-10570', 'Assistance sur le calcul de salaire', 'Assistance sur le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'S-TEL', 'Jean-Claude SAMPENNIE', 'Directeur Administratif et Financier', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.45, NULL, NULL, NULL),
('OBCS-10568', 'Assistance sur les achats', 'Assistance sur les achats', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'Opérations', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.53, NULL, NULL, NULL),
('OBCS-10567', 'Assistance sur les achats', 'Assistance sur les achats', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'Opérations', 'Opérations - Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.48, NULL, NULL, NULL),
('OBCS-10566', 'Assistance sur les achats', 'Assistance sur les achats', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'Opérations', 'Opérations - Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 4.10, NULL, NULL, NULL),
('OBCS-10564', 'Relance Intégration modèle de Tableau d''amortissement', 'Relance Intégration modèle de Tableau d''amortissement', 'Edwige KOUASSI', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Opérations', 'Opérations - Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.21, '2025-07-31T00:00:00.000Z'::timestamptz, NULL, '2025-07-31T00:00:00.000Z'::timestamptz),
('OBCS-10561', 'Relance Intégration modèle de Tableau d''amortissement', 'Relance Intégration modèle de Tableau d''amortissement', 'Edwige KOUASSI', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Opérations', 'Opérations - Immobilisations', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.17, NULL, NULL, NULL),
('OBCS-10560', 'Confirmation Intégration modèle de Tableau d''amortissement', 'Confirmation Intégration modèle de Tableau d''amortissement', 'Edwige KOUASSI', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Opérations', 'Opérations - Immobilisations', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.38, NULL, NULL, NULL),
('OBCS-10559', 'Demande d''assistance RH', 'Demande d’assistance', 'Edwige KOUASSI', 'JOEL K PROPERTIES', 'Estelle BOA', 'Assistant(e) de direction', 'RH', 'Opérations - Immobilisations', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.29, NULL, NULL, NULL),
('OBCS-10536', 'Assistance sur le CRM', 'Assistance sur le CRM', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'Amary TCHOTCHE', 'Chef de Projet', 'CRM', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.23, '2025-07-30T00:00:00.000Z'::timestamptz, NULL, '2025-07-30T00:00:00.000Z'::timestamptz),
('OBCS-10535', 'Assistance sur le CRM', 'Assistance sur le CRM', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'Amary TCHOTCHE', 'Chef de Projet', 'CRM', 'Activités commerciales', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.26, '2025-07-30T00:00:00.000Z'::timestamptz, NULL, '2025-07-30T00:00:00.000Z'::timestamptz),
('OBCS-10534', 'Assistance sur le CRM', 'Assistance sur le CRM', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MADAME ADJA', 'Directeur Commercial et Marketing', 'CRM', 'Activités commerciales', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.47, '2025-07-30T00:00:00.000Z'::timestamptz, NULL, '2025-07-30T00:00:00.000Z'::timestamptz),
('OBCS-10533', 'Assistance sur le CRM', 'Assistance sur le CRM', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MADAME ADJA', 'Directeur Commercial et Marketing', 'CRM', 'Activités commerciales', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.12, '2025-07-30T00:00:00.000Z'::timestamptz, NULL, '2025-07-30T00:00:00.000Z'::timestamptz),
('OBCS-10532', 'Assistance sur les congés', 'Assistance sur les congés', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'CHARLES IPO', 'Chef Comptable', 'RH', 'Activités commerciales', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 15.28, '2025-07-29T00:00:00.000Z'::timestamptz, NULL, '2025-07-29T00:00:00.000Z'::timestamptz),
('OBCS-10531', 'Assistance sur le stock', 'Assistance sur le stock', 'N''GBRA MOYE BERNICE DORIS', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Directeur Administratif et Financier', 'Opérations', 'RH - Documents', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.46, '2025-07-30T00:00:00.000Z'::timestamptz, NULL, '2025-07-30T00:00:00.000Z'::timestamptz),
('OBCS-10530', 'Assistance sur le stock', 'Assistance sur le stock', 'N''GBRA MOYE BERNICE DORIS', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Directeur Administratif et Financier', 'Opérations', 'Opérations - Gestion de stock', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.10, '2025-07-30T00:00:00.000Z'::timestamptz, NULL, '2025-07-30T00:00:00.000Z'::timestamptz),
('OBCS-10529', 'Assistance sur le stock', 'Assistance sur le stock', 'N''GBRA MOYE BERNICE DORIS', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Directeur Administratif et Financier', 'Opérations', 'Opérations - Gestion de stock', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.50, '2025-07-28T00:00:00.000Z'::timestamptz, NULL, '2025-07-28T00:00:00.000Z'::timestamptz),
('OBCS-10528', 'Assistance sur le stock', 'Assistance sur le stock', 'N''GBRA MOYE BERNICE DORIS', 'MATRELEC', 'MADAME ZAGBAYOU', 'Directeur Administratif et Financier', 'Opérations', 'Opérations - Gestion de stock', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 15.30, '2025-07-28T00:00:00.000Z'::timestamptz, NULL, '2025-07-28T00:00:00.000Z'::timestamptz),
('OBCS-10527', 'Assistance sur le budget', 'Assistance sur le budget', 'N''GBRA MOYE BERNICE DORIS', 'MATRELEC', 'STEPHANE MOGOU', 'Contrôleur de Gestion', 'Finance', 'Opérations - Gestion de stock', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.44, '2025-07-28T00:00:00.000Z'::timestamptz, NULL, '2025-07-28T00:00:00.000Z'::timestamptz),
('OBCS-10526', 'Assistance sur le budget', 'Assistance sur le budget', 'N''GBRA MOYE BERNICE DORIS', 'MATRELEC', 'STEPHANE MOGOU', 'Contrôleur de Gestion', 'Finance', 'Finance - Budget', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.19, '2025-07-28T00:00:00.000Z'::timestamptz, NULL, '2025-07-28T00:00:00.000Z'::timestamptz),
('OBCS-10525', 'Assistance sur le budget', 'Assistance sur le budget', 'N''GBRA MOYE BERNICE DORIS', 'MATRELEC', 'STEPHANE MOGOU', 'Contrôleur de Gestion', 'Finance', 'Finance - Budget', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.13, '2025-07-28T00:00:00.000Z'::timestamptz, NULL, '2025-07-28T00:00:00.000Z'::timestamptz),
('OBCS-10524', 'Assistance sur la comptabilité', 'Traitement de requêtes', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'Finance', 'Finance - Budget', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.30, '2025-07-28T00:00:00.000Z'::timestamptz, NULL, '2025-07-28T00:00:00.000Z'::timestamptz),
('OBCS-10464', 'Assistance pour le calcul de salaire', 'Assistance pour le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'KOFFI & DIABATE', 'Jean-Jacques KOUASSI', 'Chef Comptable', 'RH', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.33, '2025-07-25T20:54:00.000Z'::timestamptz, '2025-07-25T20:54:00.000Z'::timestamptz, NULL),
('OBCS-10463', 'Assistance pour le calcul de salaire', 'Assistance pour le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'KOFFI & DIABATE', 'Jean-Jacques KOUASSI', 'Chef Comptable', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.10, '2025-07-25T20:42:00.000Z'::timestamptz, '2025-07-25T20:42:00.000Z'::timestamptz, NULL),
('OBCS-10462', 'Assistance sur equilibre de la balance', 'Assistance sur equilibre de la balance', 'N''GBRA MOYE BERNICE DORIS', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Finance', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.44, '2025-07-25T20:40:00.000Z'::timestamptz, '2025-07-25T20:40:00.000Z'::timestamptz, NULL),
('OBCS-10461', 'Assistance sur equilibre de la balance', 'Assistance sur equilibre de la balance', 'N''GBRA MOYE BERNICE DORIS', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 10.48, '2025-07-25T20:39:00.000Z'::timestamptz, '2025-07-25T20:39:00.000Z'::timestamptz, NULL),
('OBCS-10460', 'Assistance sur equilibre de la balance', 'Assistance sur equilibre de la balance', 'N''GBRA MOYE BERNICE DORIS', 'LABOGEM', 'Jean-Jacques LIKANE', 'Chef Comptable', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.54, '2025-07-25T20:38:00.000Z'::timestamptz, '2025-07-25T20:38:00.000Z'::timestamptz, NULL),
('OBCS-10459', 'Assistance pour le calcul de salaire', 'Assistance pour le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'CHARLES IPO', 'Responsable RH', 'RH', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.30, '2025-07-25T20:36:00.000Z'::timestamptz, '2025-07-25T20:36:00.000Z'::timestamptz, NULL),
('OBCS-10458', 'Assistance pour le calcul de salaire', 'Assistance pour le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'FALCON', 'CHARLES IPO', 'Responsable RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.16, '2025-07-25T20:31:00.000Z'::timestamptz, '2025-07-25T20:31:00.000Z'::timestamptz, NULL),
('OBCS-10457', 'Call pour présentation de requetes rh', 'Call pour présentation de requetes rh', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.48, '2025-07-25T20:28:00.000Z'::timestamptz, '2025-07-25T20:28:00.000Z'::timestamptz, NULL),
('OBCS-10456', 'Assistance pour enregistrement de facture', 'Assistance pour enregistrement de facture', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'Opérations', 'RH - Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.31, '2025-07-25T20:25:00.000Z'::timestamptz, '2025-07-25T20:25:00.000Z'::timestamptz, NULL),
('OBCS-10455', 'Assistance pour enregistrement de facture', 'Assistance pour enregistrement de facture', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'Opérations', 'Opérations - Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.50, '2025-07-25T20:24:00.000Z'::timestamptz, '2025-07-25T20:24:00.000Z'::timestamptz, NULL),
('OBCS-10454', 'Assistance pour présentation de bon de commande', 'Assistance pour présentation de bon de commande', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'Opérations', 'Opérations - Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.10, '2025-07-25T20:21:00.000Z'::timestamptz, '2025-07-25T20:21:00.000Z'::timestamptz, NULL),
('OBCS-10453', 'Assistance pour présentation de bon de commande', 'Assistance pour présentation de bon de commande', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'Opérations', 'Opérations - Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.37, '2025-07-25T20:19:00.000Z'::timestamptz, '2025-07-25T20:19:00.000Z'::timestamptz, NULL),
('OBCS-10452', 'Assistance sur enregistrement de facture', 'Assistance sur enregistrement de facture', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'Opérations', 'Opérations - Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.52, '2025-07-25T20:13:00.000Z'::timestamptz, '2025-07-25T20:13:00.000Z'::timestamptz, NULL),
('OBCS-10451', 'Assistance sur enregistrement de facture', 'Assistance sur enregistrement de facture', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'Opérations', 'Opérations - Vente', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.10, '2025-07-25T20:12:00.000Z'::timestamptz, '2025-07-25T20:12:00.000Z'::timestamptz, NULL),
('OBCS-10450', 'Assistance sur enregistrement de facture', 'Assistance sur enregistrement de facture', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'Kouamé Stéphane', 'Contrôleur de Gestion', 'Opérations', 'Opérations - Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.54, '2025-07-25T20:11:00.000Z'::timestamptz, '2025-07-25T20:11:00.000Z'::timestamptz, NULL),
('OBCS-10449', 'Assistance pour l''enregistrement d''une fiche client', 'Assistance pour l''enregistrement d''une fiche client', 'N''GBRA MOYE BERNICE DORIS', 'EGBV', 'MADAME ADJA', 'Directeur Commercial et Marketing', 'CRM', 'Opérations - Achat', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.47, '2025-07-25T20:06:00.000Z'::timestamptz, '2025-07-25T20:06:00.000Z'::timestamptz, NULL),
('OBCS-10448', 'Assistance pour le calcul de salaire', 'Assistance pour le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'CSCTICAO', 'SERGE ARIKO', 'Directeur Administratif et Financier', 'RH', 'Clients', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 17.33, '2025-07-25T19:56:00.000Z'::timestamptz, '2025-07-25T19:56:00.000Z'::timestamptz, NULL),
('OBCS-10447', 'Revue Accès utilisateurs', 'Revu des accès utilisateur - Portail employé', 'Edwige KOUASSI', 'CILAGRI', 'Nadia Jocelyn Bouazo', 'Chef Comptable', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.59, '2025-07-25T19:53:00.000Z'::timestamptz, '2025-07-25T19:53:00.000Z'::timestamptz, NULL),
('OBCS-10446', 'Assistance pour le calcul de salaire', 'Assistance pour le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'CSCTICAO', 'SERGE ARIKO', 'Directeur Administratif et Financier', 'RH', 'RH - Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 18.40, '2025-07-25T19:51:00.000Z'::timestamptz, '2025-07-25T19:51:00.000Z'::timestamptz, NULL),
('OBCS-10445', 'Assistance pour le calcul de salaire', 'Assistance pour le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'CSCTICAO', 'SERGE ARIKO', 'Directeur Administratif et Financier', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 23.47, '2025-07-25T19:50:00.000Z'::timestamptz, '2025-07-25T19:50:00.000Z'::timestamptz, NULL),
('OBCS-10444', 'Assistance pour le calcul de salaire', 'Assistance pour le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'CSCTICAO', 'SERGE ARIKO', 'Directeur Administratif et Financier', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.16, '2025-07-25T19:48:00.000Z'::timestamptz, '2025-07-25T19:48:00.000Z'::timestamptz, NULL),
('OBCS-10443', 'Assistance et suivi client', 'Demande de vérification des droits utilisateurs.', 'Edwige KOUASSI', 'CILAGRI', 'Nadia Jocelyn Bouazo', 'Chef Comptable', 'Finance', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.15, '2025-07-25T19:45:00.000Z'::timestamptz, '2025-07-25T19:45:00.000Z'::timestamptz, NULL),
('OBCS-10442', 'Assistance pour le calcul de salaire', 'Assistance pour le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'CSCTICAO', 'SERGE ARIKO', 'Directeur Administratif et Financier', 'RH', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.90, '2025-07-25T19:40:00.000Z'::timestamptz, '2025-07-25T19:40:00.000Z'::timestamptz, NULL),
('OBCS-10440', 'Assistance pour le calcul de salaire', 'Assistance pour le calcul de salaire', 'N''GBRA MOYE BERNICE DORIS', 'CSCTICAO', 'SERGE ARIKO', 'Directeur Administratif et Financier', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.47, '2025-07-25T19:37:00.000Z'::timestamptz, '2025-07-25T19:37:00.000Z'::timestamptz, NULL),
('OBCS-10438', 'Assistance pour la séance de travail sur le récapitulatif des employés', 'Assistance pour la séance de travail sur le récapitulatif des employés', 'N''GBRA MOYE BERNICE DORIS', 'SIE-TRAVAUX', 'OUSSOU Martine', 'Responsable RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 0.58, '2025-07-25T19:32:00.000Z'::timestamptz, '2025-07-25T19:32:00.000Z'::timestamptz, NULL),
('OBCS-10435', 'Historiques de paies', 'Rappel après appel interrompu de 17s - Demande d’information sur la reconstitution des données antérieur de la paie', 'Edwige KOUASSI', 'IVOIRE DEVELOPPEMENT', 'Evelyne COULIBALY', 'Responsable RH', 'RH', 'RH - Gestion employé', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.13, '2025-07-25T19:29:00.000Z'::timestamptz, '2025-07-25T19:29:00.000Z'::timestamptz, NULL),
('OBCS-10433', 'Assistance pour le calcul de salaire d''un salarié', 'Assistance pour le calcul de salaire d''un salarié', 'SUPPORT', 'KOFFI & DIABATE', 'Diane N''GBLA', 'Responsable RH', 'RH', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 2.30, '2025-07-25T19:25:00.000Z'::timestamptz, '2025-07-25T19:25:00.000Z'::timestamptz, NULL),
('OBCS-10432', 'Appel pour planification séance de travail + informations recherchées', 'Appel pour planification séance de travail + informations recherchées', 'Vivien DAKPOGAN', 'EGBV', 'Amary TCHOTCHE', 'Chef de Projet', 'Global', 'RH - Salaire', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 5.41, '2025-07-25T19:24:00.000Z'::timestamptz, '2025-07-25T19:24:00.000Z'::timestamptz, NULL),
('OBCS-10431', 'Demande d''information', 'Processus de paramétrage d’une nouvelle nature de prestation', 'SUPPORT', 'JOEL K PROPERTIES', 'SUPPORT', 'Activation Specialist', 'Finance', NULL, 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.10, '2025-07-25T19:21:00.000Z'::timestamptz, '2025-07-25T19:21:00.000Z'::timestamptz, NULL),
('OBCS-10430', 'Appel pour confirmation de séance de travail + débrief comptabilité analytique', 'Appel pour confirmation de séance de travail + débrief comptabilité analytique', 'Vivien DAKPOGAN', 'SIT BTP', 'Non renseigné', 'Consultant DAF', 'Finance', 'Finance - Comptabilité Générale', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 3.12, '2025-07-25T19:21:00.000Z'::timestamptz, '2025-07-25T19:21:00.000Z'::timestamptz, NULL),
('OBCS-10429', 'Appel de M. Ariko pour demande d''assistance sur le calcul de la paie et des allocations congés', 'Appel de M. Ariko pour demande d''assistance sur le calcul de la paie et des allocations congés', 'Vivien DAKPOGAN', 'CSCTICAO', 'SERGE ARIKO', 'Directeur Administratif et Financier', 'RH', 'Finance - Comptabilité analytique', 'Appel Téléphonique'::canal_t, 'Low'::priority_t, 'Resolue', 1.37, '2025-07-25T19:18:00.000Z'::timestamptz, '2025-07-25T19:18:00.000Z'::timestamptz, NULL),
('OBCS-10978', 'Assistance sur CRM', 'Assistance sur CRM', 'N''GBRA MOYE BERNICE DORIS', 'EDIPRESSE', 'ZAGBAYOU ANNE', 'Directeur Administratif et Financier', 'Support', NULL, 'Autre'::canal_t, 'Low'::priority_t, 'Resolue', 0.47, '2025-09-19T17:39:00.000Z'::timestamptz, '2025-09-19T17:39:00.000Z'::timestamptz, '2025-09-16T00:00:00.000Z'::timestamptz);

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
  
  RAISE NOTICE '=== RÉSUMÉ PARTIE 11 ===';
  RAISE NOTICE 'Tickets créés: %', v_created_count;
  RAISE NOTICE 'Tickets mis à jour: %', v_updated_count;
  RAISE NOTICE 'Tickets ignorés: %', v_skipped_count;
END $$;

-- ============================================
-- NETTOYAGE
-- ============================================

DROP TABLE IF EXISTS temp_assistance_tickets;
