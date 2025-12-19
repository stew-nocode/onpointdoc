-- OnpointDoc - Synchronisation des tickets depuis CSV
-- Date: 2025-12-08
-- Généré automatiquement depuis scripts/generate-sync-tickets-from-csv.mjs
-- Total: 137 tickets

-- ============================================
-- ÉTAPE 1: Créer la table temporaire
-- ============================================

CREATE TEMP TABLE IF NOT EXISTS temp_tickets_csv (
  jira_issue_key TEXT NOT NULL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  ticket_type ticket_type_t,
  priority priority_t,
  canal canal_t,
  status TEXT NOT NULL,
  module_name TEXT,
  submodule_name TEXT,
  feature_name TEXT,
  bug_type bug_type_enum,
  reporter_name TEXT,
  contact_user_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

-- ============================================
-- ÉTAPE 2: Insérer les données dans la table temporaire
-- ============================================

INSERT INTO temp_tickets_csv (
  jira_issue_key,
  title,
  description,
  ticket_type,
  priority,
  canal,
  status,
  module_name,
  submodule_name,
  feature_name,
  bug_type,
  reporter_name,
  contact_user_name,
  created_at,
  updated_at,
  resolved_at
) VALUES
  ('OD-2953', 'Projet/Feuille de temps/ Journalier - Dysfonctionnement case à cocher multi-selection', 'La case à cocher en tête de tableau censée permettre la *sélection de toutes les lignes* ne fonctionne pas correctement.
Quand je clique dessus, *aucune ligne n’est réellement sélectionnée* et je dois cocher *chaque ligne manuellement* pour pouvoir effectuer une suppression groupée.

h3. *Étapes pour reproduire*

# Cliquer sur la *case à cocher principale* (celle située dans l’en-tête du tableau).
# Constater que *les cases des lignes* ne se cochent pas automatiquement.
# Tenter une action groupée (ex. : suppression).
Seules les lignes cochées manuellement sont prises en compte.

h3. *Résultat actuel*

* La case "Tout sélectionner" *n’a aucun effet* sur les cases des lignes.
* L’utilisateur doit cocher *chaque ligne une à une* pour effectuer une suppression multiple.

h3. *Résultat attendu*

* En cliquant sur la case "Tout sélectionner", *toutes les lignes visibles* devraient être automatiquement cochées.
* L’action groupée (ex. suppression) devrait s’appliquer *à l’ensemble des lignes sélectionnées*.

!20251024-0815-16.7422942.mp4|width=755,alt="20251024-0815-16.7422942.mp4"!', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'Projets', 'Feuille de temps', NULL, 'Autres'::bug_type_enum, 'Edwige KOUASSI', NULL, '2025-10-24 09:34:00+00'::timestamptz, '2025-11-03 11:30:00+00'::timestamptz, NULL),
  ('OD-2877', 'Opération/Agro/Achat - Donner la possibilité d''importer en format Excel, des bordereaux de réceptions enregistrés dans OBC', 'Donner la possibilité d''importer en format Excel, des bordereaux de réceptions enregistrés dans OBC.', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'À faire', 'Opérations', 'AGRO', NULL, NULL, 'GNAHORE AMOS', NULL, '2025-10-06 11:48:00+00'::timestamptz, '2025-10-06 11:48:00+00'::timestamptz, NULL),
  ('OD-2876', 'Finance/Compatibilité générale/Journal général/Importation : Après l’importation des journaux, plusieurs lignes n’ont pas été prises en compte et aucun détail n’est affiché.', 'Après l’importation des journaux, plusieurs lignes n’ont pas été prises en compte et aucun détail n’est affiché. 

Nous aimerons avoir plus de détail pour faciliter le traitement et la correction du fichier d’importation de données (motifs de rejet, lignes concernées.).', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Finance', 'Comptabilité Générale', NULL, 'Import de fichiers impossible'::bug_type_enum, 'GNAHORE AMOS', NULL, '2025-10-02 17:36:00+00'::timestamptz, '2025-10-16 12:18:00+00'::timestamptz, '2025-10-16 12:18:00+00'::timestamptz),
  ('OD-2875', 'Finance/Comptabilité analytique/Compte analytique : Donner la possibilité d''enregistrer des centres analytiques qui ont le même codes mais appartiennent à des axes différents.', 'Autoriser l’enregistrement de centres analytiques liés à des axes différents, même si ces centres ont le même code. Aujourd’hui, le système bloque car il considère que le code du centre doit être unique.', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Finance', 'Comptabilité analytique', NULL, NULL, 'GNAHORE AMOS', NULL, '2025-10-01 14:29:00+00'::timestamptz, '2025-11-05 08:41:00+00'::timestamptz, '2025-11-05 08:41:00+00'::timestamptz),
  ('OD-2823', 'Donner la possibilité de saisir directement le numéro de poste comptable, tout en offrant l’option de consulter la liste des comptes.', 'Donner la possibilité de saisir directement le numéro de poste comptable, tout en offrant l’option de consulter la liste des comptes.', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Opérations', 'Immobilisations', NULL, NULL, 'EVA BASSE', NULL, '2025-09-01 14:21:00+00'::timestamptz, '2025-11-05 08:58:00+00'::timestamptz, '2025-11-05 08:58:00+00'::timestamptz),
  ('OD-2794', 'Dans l''historique d''attestation de travail, donner la possibilité d''avoir plus de 15 lignes sur la page, puis placer l''entité avant la liste des employés.', 'Dans l''historique d''attestation de travail, donner la possibilité d''avoir plus de 15 lignes sur la page, puis placer l''entité avant la liste des employés.', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'À faire', 'RH', 'Documents', NULL, NULL, 'EVA BASSE', NULL, '2025-08-13 08:45:00+00'::timestamptz, '2025-08-13 08:45:00+00'::timestamptz, NULL),
  ('OD-2791', 'Ajoutez une colonne compte général dans le fichier d''exportation du plan comptable tiers.', 'Ajoutez une colonne *compte général* dans le fichier d''exportation du plan comptable tiers.', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'À faire', 'Finance', 'Comptabilité Générale', NULL, NULL, 'EVA BASSE', NULL, '2025-08-12 10:13:00+00'::timestamptz, '2025-08-12 10:13:00+00'::timestamptz, NULL),
  ('OD-2711', 'Dashboard Utilisateur V2 - Donner la possibilité de modifier le statut d''une tâche', 'Dashboard Utilisateur V2 : Ajouter la possibilité de modifier le statut d''une ou plusieurs tâches depuis le tableau "Mes Tâches en cours"', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'CRM', 'Offres', NULL, NULL, 'Edwige KOUASSI', NULL, '2025-07-18 16:28:00+00'::timestamptz, '2025-07-28 18:30:00+00'::timestamptz, NULL),
  ('OD-2699', 'ENVIPUR/RH/Paramétrage/Catégorie - Impossible d''éditer et de visualiser les details de la catégorie.', 'Impossible d''éditer et de visualiser les details de la catégorie.', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'RH', 'Paramétrage', NULL, 'Edition impossible'::bug_type_enum, 'EVA BASSE', NULL, '2025-07-15 19:19:00+00'::timestamptz, '2025-07-25 09:52:00+00'::timestamptz, '2025-07-25 09:52:00+00'::timestamptz),
  ('OD-2656', 'Impôts et taxes : Quand on supprime une taxe, la page devient blanche', 'Impôts et taxes : Quand on supprime une taxe, la page devient blanche', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Finance', 'Impôts et taxes', NULL, 'Page d''erreur'::bug_type_enum, 'EVA BASSE', NULL, '2025-06-16 20:02:00+00'::timestamptz, '2025-06-20 16:05:00+00'::timestamptz, '2025-06-20 16:05:00+00'::timestamptz),
  ('OD-2648', 'Finance/Comptabilité générale/Solde de démarrage des comptes : En historique, le filtre de recherche (voir capture) ne fonctionne pas', '!image-20250613-111725.png|width=2283,height=892,alt="image-20250613-111725.png"!', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Finance', 'Comptabilité Générale', NULL, 'Dysfonctionnement des filtres'::bug_type_enum, 'EVA BASSE', NULL, '2025-06-13 11:17:00+00'::timestamptz, '2025-06-20 07:29:00+00'::timestamptz, '2025-06-20 07:29:00+00'::timestamptz),
  ('OD-2591', 'Lier un compte analytique à un plan analytique', 'Lier un compte analytique à un plan analytique', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Finance', 'Comptabilité analytique', NULL, NULL, 'EVA BASSE', 'Martial GNALI', '2025-05-12 19:33:00+00'::timestamptz, '2025-05-23 12:34:00+00'::timestamptz, '2025-05-23 12:34:00+00'::timestamptz),
  ('OD-2590', 'Avoir un plan analytique multiple', 'Avoir un plan analytique multiple', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Finance', 'Comptabilité analytique', NULL, NULL, 'EVA BASSE', 'Martial GNALI', '2025-05-12 19:32:00+00'::timestamptz, '2025-06-02 06:53:00+00'::timestamptz, '2025-06-02 06:53:00+00'::timestamptz),
  ('OD-2549', 'Factures Achat & Vente : Informer l''utilisateur quand les natures de prestations associées aux opérations ne sont pas imputées', 'Factures Achat & Vente : Informer l''utilisateur quand les natures de prestations associées aux opérations ne sont pas imputées', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Opérations', 'Achat', NULL, NULL, 'EVA BASSE', NULL, '2025-04-24 15:08:00+00'::timestamptz, '2025-04-25 08:52:00+00'::timestamptz, '2025-04-25 08:52:00+00'::timestamptz),
  ('OD-2548', 'Avoir un récapitulatif des natures de prestations non comptabilisées', 'Avoir un récapitulatif des natures de prestations non comptabilisées', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Finance', 'Paramétrage', NULL, NULL, 'EVA BASSE', NULL, '2025-04-24 15:07:00+00'::timestamptz, '2025-04-25 08:51:00+00'::timestamptz, '2025-04-25 08:51:00+00'::timestamptz),
  ('OD-2352', 'Admin Sys/Paramétrage/Gestion des profil - Affichage de la liste par défaut des profils utilisateurs', 'Affichage de la liste par défaut des profils utilisateurs', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'Support', 'Administration Système', NULL, 'Non affichage de pages/données'::bug_type_enum, 'Edwige KOUASSI', NULL, '2025-01-17 09:15:00+00'::timestamptz, '2025-01-20 09:30:00+00'::timestamptz, NULL),
  ('OD-2334', 'Paramétrage/Création utilisateur - Envoyer un mail Automatique après création des accès utilisateurs', 'Envoyer un mail Automatique après création des accès utilisateurs.

Mail dans lequel l’utilisateur aura son identifiant et son mot de passe générer par défaut.', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'À faire', 'Support', 'Administration Système', NULL, NULL, 'Edwige KOUASSI', NULL, '2025-01-13 11:12:00+00'::timestamptz, '2025-01-13 11:12:00+00'::timestamptz, NULL),
  ('OD-2327', 'Filtrer la liste des articles dans le formulaire de demande de sortie de stock en fonction de la base de travail sélectionnée', 'Filtrer la liste des articles dans le formulaire de demande de sortie de stock en fonction de la base de travail sélectionnée', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Opérations', 'Gestion de stock', NULL, 'Mauvais déversement des données'::bug_type_enum, 'JOEL SIE', 'Joël SIE', '2025-01-09 10:45:00+00'::timestamptz, '2025-01-10 10:15:00+00'::timestamptz, '2025-01-10 10:15:00+00'::timestamptz),
  ('OD-2307', 'RH/Gestion Employé/Contrat - Prise en compte des espaces entre les nombres lors du renseignement des formulaires.', 'Prise en compte des espaces -insécable- ou séparateur lors des renseignement des formulaires.

Débuter par les contrats et étendre à tous les autres champs du type Numbers.

!image-20250113-173220.png|width=1100,height=525,alt="image-20250113-173220.png"!', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Global', 'Global', 'Global', NULL, 'Edwige KOUASSI', NULL, '2024-12-27 10:51:00+00'::timestamptz, '2025-02-05 15:34:00+00'::timestamptz, '2025-02-05 15:34:00+00'::timestamptz),
  ('OD-2216', 'RH/Gestion Employé/Contrat Stage - Les contrats échu et en cours sont dans la même coloration et le filtre ramène à tous les contrats', 'Peut importe la date de fin le contrat est surligner en rouge.

Utiliser cette coloration pour les contrats à terme, En fonction de la date de fin 

!image-20241121-120252.png|width=1563,height=612,alt="image-20241121-120252.png"!', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'RH', 'Gestion employé', NULL, 'Autres'::bug_type_enum, 'Edwige KOUASSI', NULL, '2024-11-21 12:03:00+00'::timestamptz, '2024-11-28 09:46:00+00'::timestamptz, '2024-11-28 09:46:00+00'::timestamptz),
  ('OD-2203', 'RH/Gestion Employé/Demande d''absence - Surligner dans l''historique les lignes d''absences annulées', 'Surligner dans l’historique des absences et congés, les lignes annuler qui on été annulé par le N+1', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'RH', 'Gestion employé', NULL, NULL, 'Edwige KOUASSI', NULL, '2024-11-20 11:26:00+00'::timestamptz, '2025-01-31 09:32:00+00'::timestamptz, NULL),
  ('OD-2187', 'Doublon constaté dans l’historique des contrats employés - Ecorigine', 'Doublon constaté dans l’historique des contrats employés

!image-20241114-111332.png|width=1357,height=634,alt="image-20241114-111332.png"!', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'En présentiel'::canal_t, 'En cours', 'RH', 'Gestion employé', NULL, 'Duplication anormale'::bug_type_enum, 'Edwige KOUASSI', 'MICHEL TETE', '2024-11-14 11:15:00+00'::timestamptz, '2024-11-19 10:35:00+00'::timestamptz, NULL),
  ('OD-2153', 'RH- Paramétrage Société / Impossible de modifier élément d''un organigramme', 'RH- Paramétrage Société / Impossible de modifier élément d''un organigramme

!20241104-1201-33.9974263.mp4|width=1920,height=1080,alt="20241104-1201-33.9974263.mp4"!', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'RH', 'Paramétrage', NULL, 'Edition impossible'::bug_type_enum, 'Edwige KOUASSI', NULL, '2024-11-04 12:03:00+00'::timestamptz, '2024-11-07 19:57:00+00'::timestamptz, NULL),
  ('OD-2090', 'Finance - Budget / Donner la possibilité de revalider et supprimer un budget modifié.', 'Finance - Budget / Donner la possibilité de valider un budget tant que les modifications sont effectuées.

Activer le bouton “valider” et supprimer,  si le budget subit une modification.

L’utilisateur doit pouvoir avoir la main pour effectuer ses opérations quitte à mettre des notifications ou un workflow.', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'À faire', 'Global', 'Budget', NULL, NULL, 'Edwige KOUASSI', NULL, '2024-10-09 12:22:00+00'::timestamptz, '2024-10-09 12:22:00+00'::timestamptz, NULL),
  ('OD-2085', 'Finance - Opérations de Caisse & Catégorie de prestation / Les natures de prestations liées aux catégories de type Investissement ne se déversent pas lors d''une opération de caisse', 'Lorsque le type ''Investissement'' est sélectionné à la création d''une catégorie de prestation, les natures de prestation ne qui y sont liées ne se déversent pas

!20241007-1837-24.9156633.mp4|width=1920,height=1028,alt="20241007-1837-24.9156633.mp4"!', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'Finance', 'Budget', NULL, 'Récupération de données impossible'::bug_type_enum, 'Edwige KOUASSI', NULL, '2024-10-07 18:45:00+00'::timestamptz, '2024-10-08 11:16:00+00'::timestamptz, NULL),
  ('OD-2083', 'Finance - Budget : Rajouter le rôle de Validation', 'Finance - Budget : Rajouter le rôle de Validation pour le budget d’investissement

Rôle sans quoi la visualisation du type de budget ne s’affiche dans le budget global

!image-20241007-182952.png|width=830,height=242,alt="image-20241007-182952.png"!', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'À faire', 'Finance', 'Budget', NULL, NULL, 'Edwige KOUASSI', NULL, '2024-10-07 18:31:00+00'::timestamptz, '2024-10-07 18:31:00+00'::timestamptz, NULL),
  ('OD-2080', 'Module Finance / Budget d''investissement - Aucune rubrique ne se déverse lorsqu''on sélectionne Budget d''investissement', 'Module Finance / Budget d''investissement - Aucune rubrique ne se déverse lorsqu''on sélectionne Budget d''investissement bien qu’il y ai des rubriques rattaché au type Budget Investissement.

!image-20241007-124137.png|width=1572,height=802,alt="image-20241007-124137.png"!', 'BUG'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'Finance', 'Budget', NULL, 'Récupération de données impossible'::bug_type_enum, 'Edwige KOUASSI', NULL, '2024-10-07 12:42:00+00'::timestamptz, '2024-10-07 15:01:00+00'::timestamptz, NULL),
  ('OD-2041', 'Intégration bulletin Ecorigine', 'Intégration bulletin Ecorigine', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Appel Téléphonique'::canal_t, 'Terminé(e)', 'RH', 'Documents', NULL, NULL, 'Edwige KOUASSI', 'Ismaël KONE', '2024-09-25 16:06:00+00'::timestamptz, '2024-11-19 20:01:00+00'::timestamptz, '2024-11-19 20:01:00+00'::timestamptz),
  ('OD-2020', 'Demande de sortie - Non affichage article', 'La liste des affiches ne s’affichent pas au moment de faire la demande de sortie de stock', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Opérations', 'Gestion de stock', NULL, 'Non affichage de pages/données'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2024-09-18 18:32:00+00'::timestamptz, '2024-09-19 19:10:00+00'::timestamptz, '2024-09-19 19:10:00+00'::timestamptz),
  ('OD-1990', 'RH/Gestion Employé/FichierPersonnel - Impossible d’enregistrer les données dans l’onglet du formulaire réservé à l’espace familiale', 'Impossible d’enregistrer les données dans l’onglet du formulaire réservé à l’espace familiale 

* *Client concerné :*  {color:#bf2600}*2AàZ*{color}

!20240905-2324-12.1049382.mp4|width=1916,height=966,alt="20240905-2324-12.1049382.mp4"!', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'RH', 'Gestion employé', NULL, 'Autres'::bug_type_enum, 'Edwige KOUASSI', NULL, '2024-09-05 23:37:00+00'::timestamptz, '2024-09-06 15:06:00+00'::timestamptz, NULL),
  ('OD-1982', 'A la Création d''un nouveau compte un utilisateur le lien de confirmation renvoi directement à la préproduction', 'Message d’erreur à la création d’un compte utilisateur.

Le lien de confirmation ramène directement à la base de préproduction.

!image-20240904-110256.png|width=1917,height=993,alt="image-20240904-110256.png"!', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'Global', 'Global', 'Global', 'Page d''erreur'::bug_type_enum, 'Edwige KOUASSI', NULL, '2024-09-04 11:05:00+00'::timestamptz, '2024-09-04 13:24:00+00'::timestamptz, NULL),
  ('OD-1981', 'Création Compte Entreprise Impossible', 'Impossible de créer un nouveau compte entreprise le message ci-dessous apparait : 

{noformat}Une erreur est survenue lors de l''enregistrement. 
Exception : 42601: syntax error at or near "sch_2aaz_sas" 
// at Npgsql.NpgsqlConnector.DoReadMessage(DataRowLoadingMode dataRowLoadingMode, Boolean isPrependedMessage) at Npgsql.NpgsqlConnector.ReadMessageWithPrepended(DataRowLoadingMode dataRowLoadingMode) at 
Npgsql.NpgsqlConnector.ReadExpecting[T]() at 
Npgsql.NpgsqlDataReader.NextResultInternal() at Npgsql.NpgsqlDataReader.NextResult() at Npgsql.NpgsqlCommand.Execute(CommandBehavior behavior) at 
Npgsql.NpgsqlCommand.ExecuteNonQueryInternal() at System.Data.Entity.Infrastructure.Interception.InternalDispatcher`1
.Dispatch[TTarget,TInterceptionContext,TResult](TTarget target, Func`3 operation, 
TInterceptionContext interceptionContext, Action`3 executing, Action`3 executed) at System.Data.Entity.Infrastructure.Interception.DbCommandDispatcher
.NonQuery(DbCommand command, DbCommandInterceptionContext interceptionContext) at 
System.Data.Entity.Core.Objects.ObjectContext.ExecuteInTransaction[T](Func`1 func, 
IDbExecutionStrategy executionStrategy, Boolean startLocalTransaction, Boolean releaseConnectionOnSuccess) at 
System.Data.Entity.Core.Objects.ObjectContext.<>c__DisplayClass59.<ExecuteStoreCommand>b__57() 
at ONPOINTBUSINESSCENTER.Controllers.AccountController.NewTenant(tenants tenants){noformat}



!image-20240904-105619.png|width=965,height=911,alt="image-20240904-105619.png"!', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'Global', 'Global', 'Global', 'Page d''erreur'::bug_type_enum, 'Edwige KOUASSI', NULL, '2024-09-04 10:56:00+00'::timestamptz, '2024-09-04 13:24:00+00'::timestamptz, NULL),
  ('OD-2004', 'RH/Processus paie/ - Création de lien (raccourci) entre les  différents processus', 'Donner la possibilité de se déplacer facilement d’une page a une autre en créant des liens raccourci par processus.

Dans le cas le gestion de salaire : les liens partent du fichier du personnel au règlement ou paiement des salaire avec des retours d’une page a une autre

*Exemple :*  Un user X étant dans le fichier du personnel doit pouvoir se rendre dans le contrat via un raccourci au bas de la page “Fichier du personnel“, une fois dans le contrat il clique sur suivant pour atteindre les autres pages, avec la possibilité d’effectuer des retour (précèdent d’une fonctionnalité à une autre)



!image-20240911-093405.png|width=1201,height=652,alt="image-20240911-093405.png"!', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'RH', 'Salaire', NULL, NULL, 'Edwige KOUASSI', NULL, '2024-09-11 09:33:00+00'::timestamptz, '2024-09-11 19:20:00+00'::timestamptz, NULL),
  ('OD-1936', 'Mettre à jour le simulateur de paie selon la nouvelle réforme ITS', 'Mettre à jour le simulateur de paie selon la nouvelle réforme ITS', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'RH', 'Salaire', NULL, NULL, 'EVA BASSE', NULL, '2024-08-23 12:53:00+00'::timestamptz, '2025-01-31 19:31:00+00'::timestamptz, '2025-01-31 19:31:00+00'::timestamptz),
  ('OD-1926', 'Rajouter des liens derrière chaque catégorie Section afin de rediriger l''utilisateur dans le contrat de l''employé', 'Rajouter des liens derrière chaque catégorie Section afin de rediriger l''utilisateur dans le contrat de l''employé.

Pour les Fichiers du personnel qui affiche le département ou la direction, nous avons un contrat lié.

L’objectif est de rajouter des liens afin de permettre à l’utilisateur de se rendre directement dans le contrat de  l’employé pour effectuer des modifications.

!image-20240820-122622.png|width=377,height=463,alt="image-20240820-122622.png"!', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'RH', 'Gestion employé', NULL, NULL, 'Edwige KOUASSI', NULL, '2024-08-20 12:29:00+00'::timestamptz, '2024-08-28 18:09:00+00'::timestamptz, '2024-08-28 18:09:00+00'::timestamptz),
  ('OD-1929', 'Ajout d''un loader pour toutes les actions dans OBC', 'Ajout d''un loader pour toutes les actions dans OBC, de sorte a ce que l’utilisateur sache que le chargement de la page est en cours ….', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'Global', 'Global', 'Global', NULL, 'Edwige KOUASSI', NULL, '2024-08-21 16:55:00+00'::timestamptz, '2024-08-21 18:34:00+00'::timestamptz, NULL),
  ('OD-1738', 'Envoie des documents dans la boîte email d''un utilisateur', 'Donner la possibilité d’envoyer des documents dans la boîte email d''un utilisateur à partir de l’outil OBC', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'À faire', 'RH', 'Documents', NULL, NULL, 'Edwige KOUASSI', NULL, '2024-06-07 16:31:00+00'::timestamptz, '2024-06-27 15:43:00+00'::timestamptz, NULL),
  ('OD-1627', 'Bien que les accès ne soient attribué aux utilisateurs ils apparaissent dans les fonctions disponible', 'Bien que les accès ne soient attribué aux utilisateurs les liens apparaissent dans le menu principale

Tableau récap des fonctionnalités 👇 

{adf:display=block}
{"type":"table","attrs":{"isNumberColumnEnabled":false,"layout":"default","localId":"4bdba61e-cf3e-41b8-aa2d-8a879a4047d2"},"content":[{"type":"tableRow","content":[{"type":"tableCell","attrs":{},"content":[{"type":"paragraph","content":[{"type":"text","text":"Module "}]}]},{"type":"tableCell","attrs":{},"content":[{"type":"paragraph","content":[{"type":"text","text":"Sous Module "}]}]},{"type":"tableCell","attrs":{},"content":[{"type":"paragraph","content":[{"type":"text","text":"Fonctionnalités"}]}]}]},{"type":"tableRow","content":[{"type":"tableCell","attrs":{"rowspan":2},"content":[{"type":"paragraph","content":[{"type":"text","text":"Opération"}]}]},{"type":"tableCell","attrs":{},"content":[{"type":"paragraph","content":[{"type":"text","text":"Rapports Stocks"}]}]},{"type":"tableCell","attrs":{},"content":[{"type":"paragraph","content":[{"type":"text","text":"Etat des mouvement du stock par article"}]}]}]},{"type":"tableRow","content":[{"type":"tableCell","attrs":{},"content":[{"type":"paragraph","content":[{"type":"text","text":"Rapports Articles"}]}]},{"type":"tableCell","attrs":{},"content":[{"type":"paragraph","content":[{"type":"text","text":"Rapport des prix d''achat d''un article"}]}]}]}]}
{adf}', 'BUG'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Opérations', 'Gestion de stock', NULL, 'Dysfonctionnement des liens d''accès'::bug_type_enum, 'Edwige KOUASSI', NULL, '2024-05-07 11:44:00+00'::timestamptz, '2024-10-15 18:55:00+00'::timestamptz, '2024-10-15 18:55:00+00'::timestamptz),
  ('OD-1626', 'Bien que les accès ne soient attribué aux utilisateurs ils apparaissent dans les fonctions disponible', 'Bien que les accès ne soient attribué aux utilisateurs les liens apparaissent dans le menu principale.

h3. Ci-après le tableau de ces fonctionnalités  {color:#bf2600}*:* {color}👇{color:#bf2600} {color}



{adf:display=block}
{"type":"table","attrs":{"isNumberColumnEnabled":false,"layout":"default","localId":"16d80443-3f8a-488b-ac31-1aeb1d373d25"},"content":[{"type":"tableRow","content":[{"type":"tableCell","attrs":{"colwidth":[219]},"content":[{"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Module ","marks":[{"type":"strong"}]}]}]},{"type":"tableCell","attrs":{"colwidth":[273]},"content":[{"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Sous Module ","marks":[{"type":"strong"}]}]}]},{"type":"tableCell","attrs":{"colwidth":[267]},"content":[{"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Fonctionnalités","marks":[{"type":"strong"}]}]}]}]},{"type":"tableRow","content":[{"type":"tableCell","attrs":{"rowspan":3,"colwidth":[219]},"content":[{"type":"paragraph","content":[{"type":"text","text":"Opération"}]}]},{"type":"tableCell","attrs":{"rowspan":3,"colwidth":[273]},"content":[{"type":"paragraph","content":[{"type":"text","text":"Production"}]}]},{"type":"tableCell","attrs":{"colwidth":[267]},"content":[{"type":"paragraph","content":[{"type":"text","text":"Prix client"}]}]}]},{"type":"tableRow","content":[{"type":"tableCell","attrs":{"colwidth":[267]},"content":[{"type":"paragraph","content":[{"type":"text","text":"Commandes"}]}]}]},{"type":"tableRow","content":[{"type":"tableCell","attrs":{"colwidth":[267]},"content":[{"type":"paragraph","content":[{"type":"text","text":"Facture client"}]}]}]}]}
{adf}', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Opérations', 'Production', NULL, 'Dysfonctionnement des liens d''accès'::bug_type_enum, 'Edwige KOUASSI', NULL, '2024-05-07 11:38:00+00'::timestamptz, '2024-07-08 12:15:00+00'::timestamptz, '2024-05-10 11:47:00+00'::timestamptz),
  ('OD-1521', 'Demande d''absence - Justificatif Absence', 'Pouvoir joindre un fichier justificatif pour les demandes d''absences', 'REQ'::ticket_type_t, 'High'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'RH', 'Gestion employé', NULL, NULL, 'Vivien DAKPOGAN', 'M. SANANKOUA', '2024-04-09 11:31:00+00'::timestamptz, '2024-04-12 09:54:00+00'::timestamptz, '2024-04-12 09:54:00+00'::timestamptz),
  ('OD-664', 'Créer un lien à partir des imputations comptables qui permettent de corriger les opérations (Réimputation)', 'Créer un lien à partir des imputations comptables qui permettent de corriger les opérations (Réimputation). Modifier les écritures à partir de l''intérrogation des comptes. Créer un espace réimputation permettant de corriger les écritures éronnées. Faire une correspondance des postes comptable à d''autres postes comptable.', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Global', 'Global', 'Global', NULL, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:49:00+00'::timestamptz, '2024-07-04 08:32:00+00'::timestamptz, '2024-07-04 08:32:00+00'::timestamptz),
  ('OD-658', 'V1 - Automatiser le solde de tout compte avec les rubriques pour la démission ou le licenciement d''un employé', 'Le solde de tout compte doit apparaitre sur le bulletin de salaire', 'REQ'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'RH', 'Salaire', NULL, NULL, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:49:00+00'::timestamptz, '2024-11-21 10:51:00+00'::timestamptz, NULL),
  ('OD-643', 'Revoir le calcul des produits constatés d''avance dans le dashboard', 'Non renseigné', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'À faire', 'Finance', 'Analytique', NULL, NULL, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:49:00+00'::timestamptz, '2023-12-06 12:39:00+00'::timestamptz, NULL),
  ('OD-450', 'Calcul automatique de la date anniversaire des congés', 'Calcul automatique de la date anniversaire des congés', 'REQ'::ticket_type_t, 'Low'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'RH', 'Gestion employé', NULL, NULL, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:41:00+00'::timestamptz, '2024-04-29 17:11:00+00'::timestamptz, '2024-04-29 17:11:00+00'::timestamptz),
  ('OD-448', 'Mise en place des alertes OBC, Mail/SMS (Gestion de stock/Suppression d''une quelconque ligne/Parc auto/Achat/RH/Comptabilité)', 'Martial fait la base et Kader, Daté paramètrent les autres modules', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'À faire', 'Global', 'Global', 'Global', NULL, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:41:00+00'::timestamptz, '2023-12-06 12:39:00+00'::timestamptz, NULL),
  ('OD-445', 'États financiers v2_Déclaration sur E-impôt (Convertir les états au Format XML)', 'États financiers v2_Déclaration sur E-impôt (Convertir les états au Format XML)', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'À faire', 'Finance', 'Comptabilité Générale', NULL, NULL, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:38:00+00'::timestamptz, '2023-12-06 12:39:00+00'::timestamptz, NULL),
  ('OD-444', 'États financiers v2_Notes Annexes', 'États financiers v2_Notes Annexes', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'À faire', 'Finance', 'Comptabilité Générale', NULL, NULL, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:38:00+00'::timestamptz, '2023-12-06 12:39:00+00'::timestamptz, NULL),
  ('OD-443', 'États financiers v2_TAFIRE', 'États financiers v2_TAFIRE', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'À faire', 'Finance', 'Comptabilité Générale', NULL, NULL, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:38:00+00'::timestamptz, '2023-12-06 12:39:00+00'::timestamptz, NULL),
  ('OD-442', 'États financiers v1', 'Bilan et compte de résultat', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'Finance', 'Comptabilité Générale', NULL, NULL, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:38:00+00'::timestamptz, '2023-12-06 12:36:00+00'::timestamptz, NULL),
  ('OD-1989', 'Message erreur création catégorie de prestation -  Interface paramétrage de création nouvelle entreprise.', 'Message d’erreur lors de la création d’une catégorie de Prestation. 

Interface paramétrage de création nouvelle entreprise.

*_Commentaire : Garder uniquement les éléments fonctionnel et nécessaire à la création d’une entreprise si pas pris en compte dans l''étape de création d''une nouvelle entreprise._*

!image-20240905-231324.png|width=598,height=601,alt="image-20240905-231324.png"!', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Support', 'Administration Système', NULL, 'Autres'::bug_type_enum, 'Edwige KOUASSI', NULL, '2024-09-05 23:19:00+00'::timestamptz, '2025-01-15 17:33:00+00'::timestamptz, '2025-01-15 17:33:00+00'::timestamptz),
  ('OD-2496', 'Admin Sys/Gestion Des profils et utilisateurs - Donner la possibilité de sélectionner plusieurs profils pour la suppression', 'Donner la possibilité d’effectuer des suppressions multiple', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Support', 'Administartion système', NULL, NULL, 'Edwige KOUASSI', NULL, '2025-03-24 10:48:00+00'::timestamptz, '2025-04-04 11:20:00+00'::timestamptz, '2025-04-04 11:20:00+00'::timestamptz),
  ('OD-2522', 'Impossible de poursuivre la création d''un compte entreprise / Entité - Message success : true Or False récurent', 'A la création d’un compte entreprise ce message apparait sans cesse empêchant la progression', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'Support', 'Création de compte entreprise', NULL, 'Autres'::bug_type_enum, 'Edwige KOUASSI', NULL, '2025-04-08 18:13:00+00'::timestamptz, '2025-08-01 10:15:00+00'::timestamptz, NULL),
  ('OD-2318', 'Paramétrage/Société/Année Comptable - Ne pas donner la possibilité de saisir une date inférieur à la date de début a la création d''un exercice comptable', 'Ne pas donner la possibilité de saisir une date inférieur à la date de début a la création d''un exercice comptable

!20250107-2132-46.2634215.mp4|width=1860,height=936,alt="20250107-2132-46.2634215.mp4"!', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Support', 'Paramétrage', NULL, 'Autres'::bug_type_enum, 'Edwige KOUASSI', NULL, '2025-01-07 21:37:00+00'::timestamptz, '2025-01-10 10:30:00+00'::timestamptz, '2025-01-10 10:30:00+00'::timestamptz),
  ('OD-2150', 'Paramétrage Banque - Impossible d''importer les données de la BQ via Fichier Import', 'Parametrage Banque - Impossible d''importer les données de la BQ via Fichier Import.

h1. {color:#ff5630}**Entité Introuvable lors de l’importation de données (Besoin Urgent pour suite paramétrage) - Ecorigine*{color}

!20241103-1425-32.3113627.mp4|width=1920,height=926,alt="20241103-1425-32.3113627.mp4"!

Fichier Import : [^Fichier_Import_Parametrage_Banque_2024113_131740.csv]', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'Support', 'Paramétrage', NULL, 'Import de fichiers impossible'::bug_type_enum, 'Edwige KOUASSI', NULL, '2024-11-03 14:27:00+00'::timestamptz, '2024-11-05 08:55:00+00'::timestamptz, NULL),
  ('OD-2848', 'Paramétrage/Société/Garage_ Modifier le libellé "modèle de véhicule" par garage.', 'Modifier le libellé "modèle de véhicule" par garage.', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'Global', 'Global', NULL, 'Autres'::bug_type_enum, 'EVA BASSE', NULL, '2025-09-10 18:18:00+00'::timestamptz, '2025-09-16 09:33:00+00'::timestamptz, NULL),
  ('OD-2847', 'Paramétrage/Trésorerie/Carte électronique-Message ''''success'''' : true après l''enregistrement d''une carte électronique.', 'Message *(''''success'''' : true)* après l''enregistrement d''une carte électronique', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'Global', 'Global', NULL, 'Autres'::bug_type_enum, 'EVA BASSE', NULL, '2025-09-10 18:11:00+00'::timestamptz, '2025-09-26 05:47:00+00'::timestamptz, NULL),
  ('OD-2888', 'GESTION DES PROFILS UTILISATEURS/ PROFIL UTILISATEUR/ Nous constatons que les utilisateurs (mails) de toutes les entités de OBC se déversent dans le paramétrage de profils utilisateurs', 'GESTION DES PROFILS UTILISATEURS/ PROFIL UTILISATEUR/ Nous constatons que les utilisateurs (mails) de toutes les entités de OBC se déversent dans le paramétrage de profils utilisateurs

Exemple : Les utilisateurs de KOFFI ET DIABATE ENVAL LABORATOIRE et autres se déversent dans le paramétrage de l’entité SIE TRAVAUX', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Global', 'Global', NULL, NULL, 'N''GBRA MOYE BERNICE DORIS', NULL, '2025-10-08 10:10:00+00'::timestamptz, '2025-11-11 19:43:00+00'::timestamptz, '2025-11-11 19:43:00+00'::timestamptz),
  ('OD-2830', 'Server Error in ''/'' Application.', 'Message d’erreur Serv sur obc-preprod.onpoiontsunrise.com', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Global', 'Global', NULL, 'Autres'::bug_type_enum, 'Edwige KOUASSI', NULL, '2025-09-02 17:42:00+00'::timestamptz, '2025-09-12 11:31:00+00'::timestamptz, '2025-09-12 11:31:00+00'::timestamptz),
  ('OD-2818', 'Affichage d''écrant bleu.', 'Affichage d''écrant bleu.', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Global', 'Global', NULL, 'Autres'::bug_type_enum, 'EVA BASSE', NULL, '2025-08-28 09:29:00+00'::timestamptz, '2025-08-31 12:03:00+00'::timestamptz, '2025-08-31 12:03:00+00'::timestamptz),
  ('OD-2932', 'RH/Analytique/Dashboard/ Création section Evolution des Coûts Salariaux Points des Salaires', 'Création section Evolution des Coûts Salariaux Points des Salaires', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'RH', 'Analytique', NULL, NULL, 'Edwige KOUASSI', NULL, '2025-10-17 17:43:00+00'::timestamptz, '2025-10-20 11:28:00+00'::timestamptz, NULL),
  ('OD-2931', 'RH/Analytique/Dashboard/ Création section Suivi des Absences par Type', 'Création section Suivi des Absences par Type', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'RH', 'Analytique', NULL, NULL, 'Edwige KOUASSI', NULL, '2025-10-17 17:43:00+00'::timestamptz, '2025-10-20 11:28:00+00'::timestamptz, NULL),
  ('OD-2930', 'RH/Analytique/Dashboard/ Création section Absences par Département', 'Création section Absences par Département', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'RH', 'Analytique', NULL, NULL, 'Edwige KOUASSI', NULL, '2025-10-17 17:42:00+00'::timestamptz, '2025-10-20 11:43:00+00'::timestamptz, NULL),
  ('OD-2929', 'RH/Analytique/Dashboard/ Création section Evolution de l''effectif', 'Création section Evolution de l''effectif', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'RH', 'Analytique', NULL, NULL, 'Edwige KOUASSI', NULL, '2025-10-17 17:42:00+00'::timestamptz, '2025-10-20 11:28:00+00'::timestamptz, NULL),
  ('OD-2928', 'RH/Analytique/Dashboard/ Création section Répartition Des Absences par Causes', 'Création section Répartition Des Absences par Causes', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'RH', 'Analytique', NULL, NULL, 'Edwige KOUASSI', NULL, '2025-10-17 17:41:00+00'::timestamptz, '2025-10-20 11:28:00+00'::timestamptz, NULL),
  ('OD-2927', 'RH/Analytique/Dashboard/ Création section Absences par département', 'Création section Absences par département', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'RH', 'Analytique', NULL, NULL, 'Edwige KOUASSI', NULL, '2025-10-17 17:40:00+00'::timestamptz, '2025-10-20 11:29:00+00'::timestamptz, NULL),
  ('OD-2926', 'RH/Analytique/Dashboard/ Création section Répartition par genre', 'Création section Répartition par genre', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'RH', 'Analytique', NULL, NULL, 'Edwige KOUASSI', NULL, '2025-10-17 17:40:00+00'::timestamptz, '2025-10-20 11:28:00+00'::timestamptz, NULL),
  ('OD-2925', 'RH/Analytique/Dashboard/ Création section Evolution de l''effectif', 'Création section Evolution de l''effectif', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'RH', 'Analytique', NULL, NULL, 'Edwige KOUASSI', NULL, '2025-10-17 17:40:00+00'::timestamptz, '2025-10-20 11:28:00+00'::timestamptz, NULL),
  ('OD-2924', 'RH/Analytique/Dashboard/ Création section Effectif par type de Contrat', 'Création section Effectif par type de Contrat', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'RH', 'Analytique', NULL, NULL, 'Edwige KOUASSI', NULL, '2025-10-17 17:39:00+00'::timestamptz, '2025-10-20 11:28:00+00'::timestamptz, NULL),
  ('OD-2923', 'RH/Analytique/Dashboard/ Création section Effectif par département', 'Création section Effectif par département', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'RH', 'Analytique', NULL, NULL, 'Edwige KOUASSI', NULL, '2025-10-17 17:38:00+00'::timestamptz, '2025-10-20 11:29:00+00'::timestamptz, NULL),
  ('OD-2922', 'RH/Analytique/Dashboard/ Création section Nbre de Missions', 'Création d’une section nombre de mission', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'RH', 'Analytique', NULL, NULL, 'Edwige KOUASSI', NULL, '2025-10-17 17:34:00+00'::timestamptz, '2025-10-20 11:45:00+00'::timestamptz, NULL),
  ('OD-2921', 'RH/Analytique/Dashboard/ Création section Impôt sur salaire', 'Création section Impôt sur salaire.', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'RH', 'Analytique', NULL, NULL, 'Edwige KOUASSI', NULL, '2025-10-17 17:29:00+00'::timestamptz, '2025-10-20 11:29:00+00'::timestamptz, NULL),
  ('OD-2920', 'RH/Analytique/Dashboard/ Création section Masse Salariale Brut', 'Création section masse salariale brut', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'RH', 'Analytique', NULL, NULL, 'Edwige KOUASSI', NULL, '2025-10-17 17:28:00+00'::timestamptz, '2025-10-20 11:43:00+00'::timestamptz, NULL),
  ('OD-2919', 'RH/Analytique/Dashboard/ Création section Cumul Congé Annuel Du (Jrs)', 'Création section cumul congés', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'RH', 'Analytique', NULL, NULL, 'Edwige KOUASSI', NULL, '2025-10-17 17:26:00+00'::timestamptz, '2025-10-20 11:29:00+00'::timestamptz, NULL),
  ('OD-2918', 'RH/Analytique/Dashboard/ Création section Taux d''absentéisme', 'Création section Taux d''absentéisme', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'RH', 'Analytique', NULL, NULL, 'Edwige KOUASSI', NULL, '2025-10-17 17:24:00+00'::timestamptz, '2025-10-20 11:29:00+00'::timestamptz, NULL),
  ('OD-2917', 'RH/Analytique/Dashboard V2/ Section Nombre d''employés', 'Section du tableau de bord - Affiche le nombre total des employés enregistrer dans la base.', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'RH', 'Analytique', NULL, NULL, 'Edwige KOUASSI', NULL, '2025-10-17 17:22:00+00'::timestamptz, '2025-10-20 11:29:00+00'::timestamptz, NULL),
  ('OD-2896', 'RH/Gestion des employés/ Mise en place de la gestion des avenants contractuels dans OBC', 'Fonctionnement A date : 

lorsqu’un *employé permanent* change de poste, est promu ou obtient une augmentation, *un nouveau contrat est systématiquement créé*, ce qui :

* Multiplie inutilement les contrats pour un même salarié,
* Rend difficile la *lecture de l’historique contractuel*,
* Crée de la confusion sur le *contrat réellement en vigueur*,
* Complexifie la *gestion RH et documentaire*.

Mettre en place une *fonctionnalité de création et de gestion des avenants* contractuels pour les *employés permanents*, sans recréer de nouveaux contrats complets à chaque modification.

* *Création d’avenants* :
** À partir d’un contrat existant, possibilité de créer un avenant.
** Champs à renseigner :
*** Motif du changement (ex. : promotion, changement de service, revalorisation salariale…)
*** Date d’effet
*** Éléments modifiés (poste, salaire, temps de travail, etc.)
*** Commentaire libre
* *Génération de document* :
** Génération automatique d’un *document d’avenant* (format PDF ou Word).
** Template à intégrer (à définir si nécessaire).
* *Suivi & Historique* :
** Visualisation de *l’historique complet des contrats et avenants* dans la fiche employé.
** Affichage chronologique, avec distinction entre :
*** Contrat initial
*** Avenants successifs
** Téléchargement des documents liés.

# *Interface utilisateur* :
#* Ajouter un bouton/action "Créer un avenant" dans la section contrat.
#* Nouvelle section ou onglet "Contrats & Avenants" dans la fiche employé.

h4. *Contraintes / Notes complémentaires* :

* Cette fonctionnalité ne doit pas impacter les employés temporaires ou les cas où un nouveau contrat est effectivement justifié.
* Le système doit rester conforme aux exigences légales en matière de traçabilité contractuelle.
* Les documents générés doivent être archivables et consultables ultérieurement.

h3. Recommandations techniques :

* Prévoir des *métadonnées* pour chaque avenant : date de création, auteur, statut, type de modification, etc.
* Intégrer un *journal d’audit* permettant de tracer :
** Qui a créé ou modifié un contrat ou avenant
** Quand
** Quel contenu a été modifié', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'À faire', 'RH', 'Gestion employé', NULL, NULL, 'Edwige KOUASSI', NULL, '2025-10-10 13:00:00+00'::timestamptz, '2025-10-10 13:00:00+00'::timestamptz, NULL),
  ('OD-2863', 'Finance/Tableau de bord trésorerie- Rajouter aux Dashboard trésorerie un Dashboard interco reçu.', 'Finance/Tableau de bord trésorerie- Rajouter aux Dashboard trésorerie un Dashboard interco reçu.', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'En présentiel'::canal_t, 'À faire', 'Finance', 'Analytique', NULL, NULL, 'EVA BASSE', NULL, '2025-09-16 16:36:00+00'::timestamptz, '2025-09-16 16:36:00+00'::timestamptz, NULL),
  ('OD-2705', 'Opérations/Tableau de bord inventaire- Vérification cohérence de données Dashboard inventaire', 'Test détaillé approfondi', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'En présentiel'::canal_t, 'À faire', 'Opérations', 'Gestion de stock', NULL, NULL, 'N''GBRA MOYE BERNICE DORIS', NULL, '2025-07-17 17:57:00+00'::timestamptz, '2025-07-17 17:58:00+00'::timestamptz, NULL),
  ('OD-2704', 'Finance/Tableau de bord trésorerie- Vérification cohérence de données Dashboard trésorerie', 'Finance/Tableau de bord trésorerie- Vérification cohérence de données Dashboard trésorerie', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Finance', 'Trésorerie', NULL, NULL, 'N''GBRA MOYE BERNICE DORIS', NULL, '2025-07-17 17:36:00+00'::timestamptz, '2025-09-16 16:21:00+00'::timestamptz, '2025-09-16 16:21:00+00'::timestamptz),
  ('OD-2703', 'Opération/Tableau de bord Achat- Vérification cohérence de données Dashboard fournisseurs', 'Test approfondie et détaillé', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'En présentiel'::canal_t, 'En cours', 'Opérations', 'Achat', NULL, NULL, 'N''GBRA MOYE BERNICE DORIS', NULL, '2025-07-17 17:26:00+00'::timestamptz, '2025-09-01 11:36:00+00'::timestamptz, NULL),
  ('OD-2537', 'Intégration de deux requêtes sur les immobilisations tel que : lien entre facture achat et immobilisation et automatisation des écritures d’amortissement', 'Intégration de deux requêtes sur les immobilisations tel que : 

# Lien entre facture achat et immobilisation (lors de l’enregistrement de la facture d’acquisition d’une immobilisation déverser directement l’immobilisation dans la fonctionnalité fichiers immobilisation en faisant apparaitre un onglet qui permet de remplir les champs vides comme référence, et autres).
# Automatisation des écritures d’amortissement (automatiser les écritures d’amortissement manuelles passées en fin d’année par les comptables en leur donnant la main pour valider les écritures générées).', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'En présentiel'::canal_t, 'À faire', 'Opérations', 'Immobilisations', NULL, NULL, 'N''GBRA MOYE BERNICE DORIS', NULL, '2025-04-22 09:51:00+00'::timestamptz, '2025-04-22 09:51:00+00'::timestamptz, NULL),
  ('OD-1719', 'Rendre convivial la barre de défilement vertical du menu latéral gauche', 'Rendre convivial la barre de défilement vertical du menu latéral gauche', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', 'Global', 'Global', NULL, 'N''GBRA MOYE BERNICE DORIS', NULL, '2024-06-04 11:27:00+00'::timestamptz, '2024-06-05 09:53:00+00'::timestamptz, '2024-06-05 09:53:00+00'::timestamptz),
  ('OD-2146', 'Message d’erreur, importation nouveau plan comptable', 'Message d’erreur, importation nouveau plan comptable

!image-20241031-171930.png|width=1432,height=767,alt="image-20241031-171930.png"!', 'BUG'::ticket_type_t, 'Low'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Finance', 'Analytique', NULL, 'Autres'::bug_type_enum, 'Edwige KOUASSI', NULL, '2024-10-31 17:24:00+00'::timestamptz, '2024-11-14 08:20:00+00'::timestamptz, '2024-11-14 08:20:00+00'::timestamptz),
  ('OD-1733', 'Dashboard - Evolution des Achats', 'Le Dashboard de la page d’accueil sur l''évolution des achats n’est pas fonctionnel. Il ne montre pas l’evolution mensuelle des achats. 
Il est statique pour tous les clients', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Opérations', 'Analytique', NULL, 'Récupération de données impossible'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2024-06-06 19:29:00+00'::timestamptz, '2024-06-07 12:16:00+00'::timestamptz, '2024-06-07 12:16:00+00'::timestamptz),
  ('OD-2895', 'RH/Gestion du personnel/ Contrat Employé / Renouvellement automatique des contrats pour les permanents', 'Actuellement, les contrats des employés permanents sont saisis manuellement à leur échéance. Cette tâche répétitive est source d’oubli et de perte de temps pour le service RH. Afin d’optimiser la gestion administrative et garantir la continuité des contrats, une fonctionnalité de *renouvellement automatique* est demandée.

Permettre le *renouvellement automatique des contrats des permanents* à l’échéance, avec possibilité de personnalisation des paramètres par contrat.

h4. 1. *Activation du renouvellement*

Ajouter une option dans le formulaire de contrat permanent :

* ✅ *Case à cocher :* {{Renouvellement automatique}}
* 📅 *Champ :* {{Durée du renouvellement}} (ex. : 12 mois)
* 🔁 *Champ :* {{Nombre de renouvellements max}} (optionnel)

h4. 2. *Comportement du système*

* Si le renouvellement automatique est activé :
** Le système génère *automatiquement un nouveau contrat* à la date d’échéance.
** Le nouveau contrat reprend les *mêmes conditions* (poste, salaire, département, etc.) sauf si une révision manuelle est spécifiée.
** Le contrat précédent est marqué comme *"Archivé" ou "Terminé"*, et lié au nouveau contrat.

h4. 3. *Notification & validation (optionnel selon configuration)*

* Possibilité d’envoyer une *notification au RH ou au manager* pour confirmer le renouvellement (paramétrable).
* En option : le renouvellement peut nécessiter *validation manuelle* avant activation.

h4. 4. *Historique des renouvellements*

* Un onglet dans la fiche employé affiche la *liste des contrats successifs* renouvelés automatiquement.
* Chaque contrat mentionne sa *date de création automatique* et le *contrat d’origine*.

h4. 5. *Journalisation*

* Toutes les opérations de renouvellement doivent être *tracées dans le journal système* (qui a activé, date de renouvellement, etc.)

h3. *Sécurité & contrôle :*

* Seuls les utilisateurs RH avec le rôle "Responsable" peuvent activer/désactiver la fonction.
* Un rapport permet d’auditer tous les renouvellements automatiques effectués.', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'À faire', 'RH', 'Gestion employé', NULL, NULL, 'Edwige KOUASSI', NULL, '2025-10-10 08:11:00+00'::timestamptz, '2025-10-10 08:12:00+00'::timestamptz, NULL),
  ('OD-2894', 'RH/Gestion Employé/ Fichier du personnel - Optimiser le fichier du personnel en dissociant clairement les journaliers des permanents, avec des interfaces et des logiques adaptées à leurs modes de gestion distincts.', 'Optimiser le *fichier du personnel* en dissociant clairement les *journaliers* des *permanents*, avec des interfaces et des logiques adaptées à leurs modes de gestion distincts.

Ajouter une distinction explicite entre :

* *Employé permanent (CDI, CDD long terme, …)*
* *Employé journalier (paiement à la journée ou tâche)*

h3. Solution proposée :

Dans le *fichier du personnel*, ajouter un *champ obligatoire : "Type de contrat"* avec les options :

* {{Permanant}}
* {{Journalier}}

Selon le choix, *l''affichage du formulaire s''adapte automatiquement* (champs dynamiques / conditionnels).

h2. *Formulaire simplifié pour les journaliers*

Les journaliers nécessitent *moins d''informations*. Voici un formulaire minimaliste adapté :

h3. 📄 Formulaire Journalier :

* Nom complet : GOLI Gertrude
* Numéro CIN / Identifiant : CI126000 5469
* Poste ou fonction : Superviseur travaux
* Département : Opérations
* Mode de calcul (journée / tâche / heure)
* Tarif journalier / horaire
* Date de début : 01/01/2025
* Durée en moi : 6
* Date fin : Générer automatiquement
* Statut (actif/inactif)
* Nature de prestation
* Site d’affection

h2. *Bénéfices attendus*

* Interface plus intuitive pour les agents RH
* Réduction des erreurs de saisie
* Gain de temps
* Meilleur suivi des journaliers
* Plus grande évolutivité du système RH', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'À faire', 'RH', 'Gestion employé', NULL, NULL, 'Edwige KOUASSI', NULL, '2025-10-10 08:01:00+00'::timestamptz, '2025-10-10 08:01:00+00'::timestamptz, NULL),
  ('OD-536', 'Erreur Serveur', 'Erreur Serveur', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Global', 'Global', 'Global', 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:46:00+00'::timestamptz, '2023-12-07 10:12:00+00'::timestamptz, '2023-12-07 10:12:00+00'::timestamptz),
  ('OD-712', 'Ajouter les fonctionnalités "Client par commercial" et "Ajouter un commercial" dans le sous-module Pilotage commercial', 'Non renseigné', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Pilotage commercial', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:41:00+00'::timestamptz, '2023-12-29 18:22:00+00'::timestamptz, '2023-12-29 18:22:00+00'::timestamptz),
  ('OD-711', 'Mettre un filtre sur le champ commercial pour n’appeler que les employés ayant la catégorie de commercial', 'Tous les employés s’affichent par défaut dans le champ commercial au niveau de la gestion des portefeuilles.', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Pilotage commercial', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:40:00+00'::timestamptz, '2023-12-06 17:33:00+00'::timestamptz, '2023-12-06 14:29:00+00'::timestamptz),
  ('OD-708', 'Traiter les bugs liés aux photos des contacts', '* Les photos sont déformées lors de l''édition du contact
* Message d’erreur lors de l’enregistrement d’un contact lié aux photos sélectionnées', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Client', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:40:00+00'::timestamptz, '2023-12-19 09:31:00+00'::timestamptz, '2023-12-19 09:31:00+00'::timestamptz),
  ('OD-707', 'Supprimer les doublons dans la liste déroulante civilité au niveau du formulaire d''enregistrement d''un prospect', 'Supprimer les doublons dans la liste déroulante civilité au niveau du formulaire d''enregistrement d''un prospect', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Client', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:40:00+00'::timestamptz, '2023-12-28 10:11:00+00'::timestamptz, '2023-12-28 10:11:00+00'::timestamptz),
  ('OD-706', 'Adapter le fichier csv d’import des prospects au formulaire d’enregistrement', 'Fichier csv non conforme au formulaire de création', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'CRM', 'Client', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:40:00+00'::timestamptz, '2023-12-06 14:25:00+00'::timestamptz, NULL),
  ('OD-705', 'Corriger l’erreur empêchant la suppression d’un prospect', 'Message d’erreur lors de la suppression d’un prospect', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Client', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:40:00+00'::timestamptz, '2023-12-06 17:33:00+00'::timestamptz, '2023-12-06 17:33:00+00'::timestamptz),
  ('OD-704', 'Filtrer l’export des prospects par entité', 'Filtrer l’export des prospects par entité', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Client', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:40:00+00'::timestamptz, '2023-12-06 17:33:00+00'::timestamptz, '2023-12-06 17:33:00+00'::timestamptz),
  ('OD-732', 'Le montant par m2 n’est pas multiplié avec la dimension dans le tableau programme offre BTP manuel', 'Le montant par m2 n’est pas multiplié avec la dimension dans le tableau programme offre BTP manuel', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Offres', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:40:00+00'::timestamptz, '2023-12-06 17:33:00+00'::timestamptz, '2023-12-06 17:33:00+00'::timestamptz),
  ('OD-731', 'Les filtres sur les prix de l''offre ne fonctionnent pas', 'Les filtres sur les prix de l''offre ne fonctionnent pas', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Offres', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:40:00+00'::timestamptz, '2023-12-06 17:33:00+00'::timestamptz, '2023-12-06 17:33:00+00'::timestamptz),
  ('OD-730', 'La liste déroulante type de construction est vide au niveau de programme offre BTP', 'La liste déroulante type de construction est vide au niveau de programme offre BTP', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Offres', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:40:00+00'::timestamptz, '2023-12-06 17:33:00+00'::timestamptz, '2023-12-06 17:33:00+00'::timestamptz),
  ('OD-728', 'Le bouton “Nouvelle offre BTP” ne fonctionne pas lorsqu’un filtre est appliqué.', 'Le bouton “Nouvelle offre BTP” ne fonctionne pas lorsqu’un filtre est appliqué.', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Offres', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:40:00+00'::timestamptz, '2023-12-06 17:33:00+00'::timestamptz, '2023-12-06 14:29:00+00'::timestamptz),
  ('OD-727', 'Les nouvelles offres BTP avec les erreurs s’enregistrent quand même : Faire agir le roll back en amont', 'Les nouvelles offres BTP avec les erreurs s’enregistrent quand même : Faire agir le roll back en amont', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Offres', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:40:00+00'::timestamptz, '2023-12-06 17:33:00+00'::timestamptz, '2023-12-06 14:35:00+00'::timestamptz),
  ('OD-726', 'La suppression d’une ligne d’un fichier importé désactive les boutons de suppression des autres lignes lors de l’enregistrement ou de l''édition d’une offre BTP.', 'La suppression d’une ligne d’un fichier importé désactive les boutons de suppression des autres lignes lors de l’enregistrement ou de l''édition d’une offre BTP.', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Offres', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:40:00+00'::timestamptz, '2023-12-08 12:17:00+00'::timestamptz, '2023-12-08 12:17:00+00'::timestamptz),
  ('OD-725', 'L’enregistrement de fichiers dans offres BTP impossible. La fonctionnalité enregistrement génère une erreur lorsque les documents/fichiers sont importés.', 'L’enregistrement de fichiers dans offres BTP impossible. La fonctionnalité enregistrement génère une erreur lorsque les documents/fichiers sont importés.', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Offres', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:40:00+00'::timestamptz, '2023-12-08 12:17:00+00'::timestamptz, '2023-12-08 12:17:00+00'::timestamptz),
  ('OD-723', 'Les boutons “détail”, “modification” et “suppression” n’affichent rien au clic dans l’historique offre BTP à cause d’une erreur dans les données enregistrées (le prix n''était pas mentionné).', 'Les boutons “détail”, “modification” et “suppression” n’affichent rien au clic dans l’historique offre BTP à cause d’une erreur dans les données enregistrées (le prix n''était pas mentionné).', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Offres', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:40:00+00'::timestamptz, '2023-12-08 12:19:00+00'::timestamptz, '2023-12-06 14:31:00+00'::timestamptz),
  ('OD-722', 'Les sélections des lots dans offre BTP ne se déversent pas dans le tableau des choix des biens.', 'Les sélections des lots dans offre BTP ne se déversent pas dans le tableau des choix des biens.', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Offres', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:40:00+00'::timestamptz, '2023-12-06 17:33:00+00'::timestamptz, '2023-12-06 14:29:00+00'::timestamptz),
  ('OD-721', 'Corriger les filtres dans programme offre BTP', 'Les filtres ne fonctionnent pas et libellé incorrecte dans historique et programme offre BTP lié aux filtres. Le libellé listing contact apparait dans historique programme offre BTP. Tous les filtres ne marchent pas à part mode de génération.



Supprimer le filtre des prix', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Offres', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:40:00+00'::timestamptz, '2023-12-06 17:33:00+00'::timestamptz, '2023-12-06 17:33:00+00'::timestamptz),
  ('OD-720', 'Impossible de supprimer un programme offre BTP manuel/automatique', 'Impossible de supprimer un programme offre BTP manuel/automatique', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Offres', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:39:00+00'::timestamptz, '2023-12-06 17:33:00+00'::timestamptz, '2023-12-06 17:33:00+00'::timestamptz),
  ('OD-719', 'Apparition et disparition de champs cachés (Prix par m2 et type construction) dans le panel paramètres de génération lors de l''édition d’un programme offre BTP manuel et automatique', 'Apparition et disparition de champs cachés (Prix par m2 et type construction) dans le panel paramètres de génération lors de l''édition d’un programme offre BTP manuel et automatique', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Offres', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:39:00+00'::timestamptz, '2023-12-08 12:17:00+00'::timestamptz, '2023-12-08 12:17:00+00'::timestamptz),
  ('OD-718', 'Corriger les pertes de données liées à l''édition d’un programme offre BTP automatique', 'Pertes de données à l''édition d’un programme offre BTP automatique (Type de construction, Dimension totale saisie, Dimension Ilot négatif…)', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Offres', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:39:00+00'::timestamptz, '2023-12-06 17:33:00+00'::timestamptz, '2023-12-06 17:33:00+00'::timestamptz),
  ('OD-703', 'Impossible de créer une nouvelle activité dans le paramétrage', 'On arrive pas à enregistrer une activité', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Paramétrage', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:39:00+00'::timestamptz, '2023-12-06 17:33:00+00'::timestamptz, '2023-12-06 17:33:00+00'::timestamptz),
  ('OD-701', 'La liste déroulante de type pipeline n’est pas vide par défaut et il y’a des doublons', 'Bug lié aux nouvelles bases.', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Paramétrage', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:39:00+00'::timestamptz, '2024-02-07 12:23:00+00'::timestamptz, '2024-02-07 12:23:00+00'::timestamptz),
  ('OD-697', 'Fixer les colonnes de tableau dans l’affichage de l’historique des étapes pipeline', 'Le tableau est décalé dans la partie historique (listing des étapes pipeline)', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'CRM', 'Paramétrage', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:39:00+00'::timestamptz, '2023-12-07 20:59:00+00'::timestamptz, NULL),
  ('OD-713', 'Permettre l’assignation d’un produit à plusieurs commerciaux', 'Permettre l’assignation d’un produit à plusieurs commerciaux', 'REQ'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'À faire', 'CRM', 'Pilotage commercial', NULL, NULL, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:41:00+00'::timestamptz, '2023-12-06 12:39:00+00'::timestamptz, NULL),
  ('OD-729', 'Revoir les couleurs du tableau de programme immobilier dans suivi programme offre BTP', 'Revoir les couleurs du tableau de programme immobilier dans suivi programme offre BTP', 'REQ'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Offres', NULL, NULL, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:40:00+00'::timestamptz, '2024-05-03 18:09:00+00'::timestamptz, '2024-05-03 18:09:00+00'::timestamptz),
  ('OD-724', 'Le fichier uploadé se duplique au clic du bouton “plus” dans fichier offre', 'Le fichier uploadé se duplique au clic du bouton “plus” dans fichier offre', 'REQ'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Offres', NULL, NULL, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:40:00+00'::timestamptz, '2024-04-29 18:00:00+00'::timestamptz, '2024-04-29 18:00:00+00'::timestamptz),
  ('OD-717', 'Prévoir une génération automatique de lots hétérogènes (dimension différente : pour n lots, on veut n-1 de dimension égale et le dernier sera la différence)', 'Prévoir une génération automatique de lots hétérogènes (dimension différente : pour n lots, on veut n-1 de dimension égale et le dernier sera la différence)', 'REQ'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Offres', NULL, NULL, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:39:00+00'::timestamptz, '2025-02-07 15:36:00+00'::timestamptz, '2025-02-07 15:36:00+00'::timestamptz),
  ('OD-710', 'Supprimer l’espace vide entre zone offre et bouton enregistrement', 'Espace vide entre zone offre et bouton enregistrement', 'REQ'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Offres', NULL, NULL, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:39:00+00'::timestamptz, '2024-05-03 18:26:00+00'::timestamptz, '2024-05-03 18:26:00+00'::timestamptz),
  ('OD-709', 'Enlever l’option obligatoire sur les champs Position/Concurrence, Caractéristique et Contexte', 'Position/Concurrence, Caractéristique et Contexte sont obligatoires dans le formulaire d’enregistrement d’une offre alors que pas forcément nécessaire.', 'REQ'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Offres', NULL, NULL, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:39:00+00'::timestamptz, '2024-05-03 08:04:00+00'::timestamptz, '2024-05-03 08:04:00+00'::timestamptz),
  ('OD-702', 'Faire un focus sur le pays de l’entité sur la carte', 'La carte ne bouge pas selon la zone géographique de l’entité dans la partie gestion des zones.', 'REQ'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Paramétrage', NULL, NULL, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:39:00+00'::timestamptz, '2024-01-03 08:35:00+00'::timestamptz, '2024-01-03 08:35:00+00'::timestamptz),
  ('OD-694', 'Donner la possibilité d’enregistrer les gestes commerciaux en valeur ou en % et Ajouter ID entité', 'Donner la possibilité d’enregistrer les gestes commerciaux en valeur ou en % et Ajouter ID entité', 'REQ'::ticket_type_t, 'Low'::priority_t, 'Constat Interne'::canal_t, 'À faire', 'CRM', 'Paramétrage', NULL, NULL, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:39:00+00'::timestamptz, '2024-05-29 16:40:00+00'::timestamptz, NULL),
  ('OD-693', 'Prendre le seuil dans la définition des remises', 'Dans le paramétrage des catégories commerciales, c’est le taux de remise qui est défini vs le seuil.', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'À faire', 'CRM', 'Paramétrage', NULL, NULL, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:39:00+00'::timestamptz, '2023-12-06 12:39:00+00'::timestamptz, NULL),
  ('OD-2905', 'Opération/Vente/Blocs débours : Une image noir s''affiche lorsqu''on enregistres ou lorsqu''on supprime un blocs de débours.', 'Une image noir s''affiche lorsqu''on enregistre ou supprime un blocs de débours.

-Lorsqu’on supprime, ce message s’affiche sur l’image noir : {{{"success":false,"mess":"Erreur de suppression de l\\u0027enregistrement."}}}

-Lorsqu’on enregistre, ce message s’affiche sur l’image noir : {{{"success":true}}}', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Opérations', 'Vente', NULL, 'Non affichage de pages/données'::bug_type_enum, 'GNAHORE AMOS', NULL, '2025-10-16 10:42:00+00'::timestamptz, '2025-11-05 08:38:00+00'::timestamptz, '2025-11-05 08:38:00+00'::timestamptz),
  ('OD-2837', 'Mauvais déversement des données renseignées dans le fichier du personnel après importation.', 'Mauvais déversement des données renseignées dans le fichier du personnel après importation : certaines données n’ont pas été prises en compte et d’autres ont été modifiées.', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'RH', 'Gestion employé', NULL, 'Mauvais déversement des données'::bug_type_enum, 'EVA BASSE', NULL, '2025-09-03 20:12:00+00'::timestamptz, '2025-09-15 18:53:00+00'::timestamptz, '2025-09-15 18:53:00+00'::timestamptz),
  ('OD-2815', 'Impossible de calculer la paie.', 'Impossible de calculer la paie.', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'RH', 'Salaire', NULL, 'Dysfonctionnement sur le Calcul des salaires'::bug_type_enum, 'EVA BASSE', NULL, '2025-08-22 11:14:00+00'::timestamptz, '2025-08-26 18:05:00+00'::timestamptz, '2025-08-26 18:05:00+00'::timestamptz),
  ('OD-2814', 'Non affichage des bulletins de salaire', 'Non affichage des bulletins de salaire.', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'RH', 'Documents', NULL, 'Non affichage de pages/données'::bug_type_enum, 'EVA BASSE', NULL, '2025-08-22 11:09:00+00'::timestamptz, '2025-08-26 18:05:00+00'::timestamptz, '2025-08-26 18:05:00+00'::timestamptz),
  ('OD-2076', 'Impression de bordereau de retour impossible', 'La page sort en blanc lorsqu’on lance l’impression du bordereau de retour

Ci-joint 



!image-20241004-152134.png|width=1369,height=671,alt="image-20241004-152134.png"!', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Appel Téléphonique'::canal_t, 'Terminé(e)', 'Opérations', 'Gestion de stock', NULL, 'Non affichage de pages/données'::bug_type_enum, 'N''GBRA MOYE BERNICE DORIS', 'SUPPORT', '2024-10-04 15:21:00+00'::timestamptz, '2024-10-08 10:56:00+00'::timestamptz, '2024-10-08 10:56:00+00'::timestamptz),
  ('OD-2066', 'Ranger la liste des bordereaux de retour dans l''ordre décroissant (la date la plus récente à la date la plus ancienne)', 'Ranger la liste des bordereaux de retour dans l''ordre décroissant (la date la plus récente à la date la plus ancienne)

Faire pareil pour les autres fonctionnalités qui concerne le stock



!image-20241002-093053.png|width=1311,height=686,alt="image-20241002-093053.png"!', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Appel Téléphonique'::canal_t, 'Terminé(e)', 'Opérations', 'Gestion de stock', NULL, NULL, 'N''GBRA MOYE BERNICE DORIS', 'SUPPORT', '2024-10-02 09:30:00+00'::timestamptz, '2024-10-04 09:14:00+00'::timestamptz, '2024-10-04 09:14:00+00'::timestamptz),
  ('OD-2065', 'Enlever les bons de sortie ayant été utilisé pour faire un bordereau de retour dans la liste disponible pour l''enregistrement d''un bordereau de retour', 'Enlever les bons de sortie ayant été utilisé pour faire un bordereau de retour dans la liste disponible pour l''enregistrement d''un bordereau de retour', 'REQ'::ticket_type_t, 'Critical'::priority_t, 'Appel Téléphonique'::canal_t, 'Terminé(e)', 'Opérations', 'Gestion de stock', NULL, NULL, 'N''GBRA MOYE BERNICE DORIS', 'SUPPORT', '2024-10-02 09:21:00+00'::timestamptz, '2024-10-07 15:53:00+00'::timestamptz, '2024-10-07 15:53:00+00'::timestamptz),
  ('OD-2947', 'Mise en place d’un mécanisme de traçabilité des opérations dans OBC (utilisateur + heure & date d’enregistrement)', 'Actuellement, l’ERP ne permet pas d’identifier précisément quel utilisateur effectue l’enregistrement, la modification ou la suppression d’une opération.
Cette absence de traçabilité rend difficile la justification ou l’analyse des anomalies (erreurs de saisie, suppressions non justifiées, etc.).

Mettre en place un système de traçabilité qui enregistre automatiquement :

* L’identifiant de l’utilisateur ayant effectué une opération,
* La date et l’heure exactes de l’enregistrement ou de la modification,
* Les informations principales sur l’opération concernée (type, référence, module, etc.).

Dif actuelle : 

* Aucune donnée ne permet aujourd’hui d’identifier clairement les utilisateurs à l’origine des enregistrements.
* En cas d’erreurs ou de suppressions, la justification devient complexe et chronophage.
* Cela pose un risque en matière d’auditabilité et de fiabilité des données.', 'REQ'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'À faire', 'Global', 'Global', NULL, NULL, 'Edwige KOUASSI', NULL, '2025-10-23 08:58:00+00'::timestamptz, '2025-10-23 08:58:00+00'::timestamptz, NULL),
  ('OD-715', 'Impossible d’enregistrer une opportunité dans une nouvelle base', 'Corriger la fonction de l’historique de toutes les opportunités', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'CRM', 'Activités commerciales', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:41:00+00'::timestamptz, '2023-12-06 17:33:00+00'::timestamptz, NULL),
  ('OD-714', 'Empêcher l''enregistrement des opportunités avec des erreurs : Faire agir le roll back en amont', 'Les opportunités avec les erreurs s’enregistrent quand même', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Activités commerciales', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:41:00+00'::timestamptz, '2023-12-06 17:33:00+00'::timestamptz, '2023-12-06 17:33:00+00'::timestamptz),
  ('OD-2780', 'Server Error in ''/'' Application.', 'Message d’erreur “Server error in application”.

h1. Server Error in ''/'' Application.

h2. _Runtime Error_

*Description:*An exception occurred while processing your request. Additionally, another exception occurred while executing the custom error page for the first exception. The request has been terminated.

!20250806-1117-57.3502082.mp4|width=1920,height=1030,alt="20250806-1117-57.3502082.mp4"!', 'BUG'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Global', 'Global', NULL, 'Autres'::bug_type_enum, 'Edwige KOUASSI', NULL, '2025-08-06 11:21:00+00'::timestamptz, '2025-08-08 20:30:00+00'::timestamptz, '2025-08-08 20:30:00+00'::timestamptz),
  ('OD-2771', 'Impossible de poursuivre le paramétrage d''une entreprise à partir de l''interface principal OBC', 'Impossible de poursuivre le paramétrage d''une entreprise à partir de l''interface principal OBC', 'BUG'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Support', 'Paramétrage', NULL, 'Autres'::bug_type_enum, 'EVA BASSE', NULL, '2025-08-01 14:59:00+00'::timestamptz, '2025-11-05 09:02:00+00'::timestamptz, '2025-11-05 09:02:00+00'::timestamptz),
  ('OD-2765', 'Impossible de créer une entité - Un message d''erreur affiche', 'Message d’erreur lors de la création d’une entité à partir du formulaire principal

!20250730-1843-14.3869672.mp4|width=1912,height=928,alt="20250730-1843-14.3869672.mp4"!

{{{"success":false,"mess":"DbUpdateException : \\nUne erreur s\\u0027est produite lors de la mise à jour des entrées. Pour plus d\\u0027informations, consultez l\\u0027exception interne. //    at System.Data.Entity.Internal.InternalContext.SaveChanges()\\r\\n   at ONPOINTBUSINESSCENTER.Controllers.EntiteEntrepriseController.NewEntite(parametrage_entite parametrage_entite, HttpPostedFileBase uploadedFileLogoEntite) // InnerException :Une erreur s\\u0027est produite lors de la mise à jour des entrées. Pour plus d\\u0027informations, consultez l\\u0027exception interne. //    at System.Data.Entity.Core.Mapping.Update.Internal.UpdateTranslator.Update()\\r\\n   at System.Data.Entity.Core.Objects.ObjectContext.ExecuteInTransaction[T](Func`1 func, IDbExecutionStrategy executionStrategy, Boolean startLocalTransaction, Boolean releaseConnectionOnSuccess)\\r\\n   at System.Data.Entity.Core.Objects.ObjectContext.SaveChangesToStore(SaveOptions options, IDbExecutionStrategy executionStrategy, Boolean startLocalTransaction)\\r\\n   at System.Data.Entity.Core.Objects.ObjectContext.SaveChangesInternal(SaveOptions options, Boolean executeInExistingTransaction)\\r\\n   at System.Data.Entity.Internal.InternalContext.SaveChanges() // InnerException.InnerException : 23502: null value in column \\"type_codification_bon_commande\\" violates not-null constraint //    at Npgsql.NpgsqlConnector.DoReadMessage(DataRowLoadingMode dataRowLoadingMode, Boolean isPrependedMessage)\\r\\n   at Npgsql.NpgsqlConnector.ReadMessageWithPrepended(DataRowLoadingMode dataRowLoadingMode)\\r\\n   at Npgsql.NpgsqlDataReader.NextResultInternal()\\r\\n   at Npgsql.NpgsqlDataReader.NextResult()\\r\\n   at Npgsql.NpgsqlCommand.Execute(CommandBehavior behavior)\\r\\n   at Npgsql.NpgsqlCommand.ExecuteDbDataReaderInternal(CommandBehavior behavior)\\r\\n   at System.Data.Entity.Infrastructure.Interception.InternalDispatcher`1.Dispatch[TTarget,TInterceptionContext,TResult](TTarget target, Func`3 operation, TInterceptionContext interceptionContext, Action`3 executing, Action`3 executed)\\r\\n   at System.Data.Entity.Infrastructure.Interception.DbCommandDispatcher.Reader(DbCommand command, DbCommandInterceptionContext interceptionContext)\\r\\n   at System.Data.Entity.Core.Mapping.Update.Internal.DynamicUpdateCommand.Execute(Dictionary`2 identifierValues, List`1 generatedValues)\\r\\n   at System.Data.Entity.Core.Mapping.Update.Internal.UpdateTranslator.Update()"}}}', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'Support', 'Paramétrage', NULL, NULL, 'Edwige KOUASSI', NULL, '2025-07-30 19:02:00+00'::timestamptz, '2025-08-01 10:15:00+00'::timestamptz, NULL),
  ('OD-1380', 'Apparition code source avec fond bleu suivi d''un message d''erreur', '*Message d’erreur après apparition du code HTML en Bleu*

h2. *Ajax error :* SyntaxError: JSON.parse: unexpected character at line 1 column 1 of the JSON data

<!DOCTYPE html>

<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <link rel="icon" href="/Images/obc-Symbol-5-OBC-bleu_ini.png" />
    <title>OBC</title>
    <!-- Tell the browser to be responsive to screen width -->
    <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
    <!-- Bootstrap 3.3.7 -->
    <link rel="stylesheet" href="/Content/adminLTE24/bower_components/bootstrap/dist/css/bootstrap.min.css">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="/Content/adminLTE24/bower_components/font-awesome/css/font-awesome.min.css">
    <!-- Ionicons -->
    <link rel="stylesheet" href="/Content/adminLTE24/bower_components/Ionicons/css/ionicons.min.css">
    <!-- jvectormap -->
    <link rel="stylesheet" href="/Content/adminLTE24/bower_components/jvectormap/jquery-jvectormap.css">
    <!-- bootstrap datepicker -->
    <link rel="stylesheet" href="/Content/adminLTE24/bower_components/bootstrap-datepicker/dist/css/bootstrap-datepicker.min.css">
    <!-- color picker -->
    <link rel="stylesheet" href="/Content/adminLTE24/bower_components/bootstrap-colorpicker/dist/css/bootstrap-colorpicker.min.css">
    <!-- Select2 -->
    <link rel="stylesheet" href="/Content/adminLTE24/bower_components/select2/dist/css/select2.min.css">
    <!-- bootstrap-select CSS -->
    <link rel="stylesheet" href="/Content/bootstrap-select.css" />
    <!-- DataTables -->

{noformat}<link rel="stylesheet" href="/Content/adminLTE24/bower_components/datatables.net/css/jquery.dataTables.min.css">
<link rel="stylesheet" href="/Content/adminLTE24/bower_components/datatables.net/css/buttons.dataTables.min.css">
<link rel="stylesheet" href="/Content/adminLTE24/bower_components/datatables.net-bs/css/dataTables.bootstrap.min.css">

<!-- Full calendar -->



<!-- Gantt chart css-->
<link rel="stylesheet" type="text/css" href="<https://cdn3.devexpress.com/jslib/22.2.3/css/dx.light.css"> />
<link rel="stylesheet" href="/Content/GanttLibs/dx-gantt.min.css" />

<!-- WebDataRocks -->
<link rel="stylesheet" href="/Content/WebDataRock_1_3_3/css/webdatarocks.min.css" />
<!-- Theme style .min -->
<link rel="stylesheet" href="/Content/adminLTE24/dist/css/AdminLTE.css">
<link rel="stylesheet" href="/Content/AdminLTE32/plugins/daterangepicker/daterangepicker.css">

<!-- AdminLTE Skins. Choose a skin from the css/skins
     folder instead of downloading all of them to reduce the load. -->
<link rel="stylesheet" href="/Content/adminLTE24/dist/css/skins/_all-skins.min.css">
<!-- HTML5 Shim and Respond.js IE8 support of HTML5 elements and media queries -->
<link rel="stylesheet" href="/Content/obc_loading.css">
<!-- WARNING: Respond.js doesn''t work if you view the page via file:// -->
<!--[if lt IE 9]>
<script src="<https://oss.maxcdn.com/html5shiv/3.7.3/html5shiv.min.js"></script>>
<script src="<https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>>
<![endif]-->
<!-- Google Font -->
<link href="<https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/css/flag-icon.min.css"> rel="stylesheet" />
<link rel="stylesheet" href="<https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600,700,300italic,400italic,600italic">>

<!-- Typeahead CSS -->
<link rel="stylesheet" href="/Content/typeahead.css" />
<link rel="stylesheet" href="/Content/myTypeahead.css" />

<!-- NVD3 CSS -->
<link href="/Scripts/Nvd3/nv.d3.css" rel="stylesheet" />

<!-- ChartJS -->
<link rel="stylesheet" href="/Content/adminLTE24/bower_components/chart.js/dist/Chart.css">

<!-- jQuery 3 -->
<script src="/Content/adminLTE24/bower_components/jquery/dist/jquery.min.js"></script>
<script src="<https://cdn.datatables.net/1.13.4/js/jquery.dataTables.min.js"></script>>


<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="<https://www.googletagmanager.com/gtag/js?id=G-H7N2DLGHM3"></script>>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag(''js'', new Date());

    gtag(''config'', ''G-H7N2DLGHM3'');
</script>
<link href="/Content/ObcLayoutCss?v=X4pUvDTA8EXprLLL92RzQzjB1z3dBFwGQYmve1cHtH01" rel="stylesheet"/>{noformat}

</head>
<style>
    input[type=search] {
        width: 300px !important;
    }
</style>
<body class="hold-transition skin-blue fixed sidebar-mini" id="bodyAppMain">
    <div class="wrapper">
        <header class="main-header">
            <!-- Logo -->
            <a href="/Application/applicationmenu" class="logo">
                <!-- mini logo for sidebar mini 50x50 pixels -->
                <span class="logo-mini"><b>O</b>BC</span>
                <!-- logo for regular state and mobile devices -->
                <span class="logo-lg"><img src="/Images/obc-logo-5-OBC-white.png" alt="OBC logo"></span>
            </a>
            <!-- Header Navbar: style can be found in header.less   /// navbar-fixed-top  -->
            <nav class="navbar navbar-static-top">
                <!-- Sidebar toggle button-->
                <a href="#" class="sidebar-toggle" data-toggle="push-menu" role="button">
                    <span class="sr-only">Toggle navigation</span>
                </a>

{noformat}            <div class="navbar-header">
                

                <p class="navbar-text" style="color: #f5f5f5; font-weight: bold;">
                    
                    Client : IVOIRE DEVELOPPEMENT
                    &nbsp; &nbsp;
                    <a href="/ParametrageAccesEntiteEnCours/MaJUtilisateurEntiteEnCours" id="btnMaJUtilisateurEntiteEnCoursLayout" title="Base(s) de travail">
                        <span style="color: #ffca28;">Base(s) de travail : &nbsp; ID</span>
                    </a>
                </p>

            </div>

            <!-- Navbar Right Menu -->
            <div class="navbar-custom-menu">
                <ul class="nav navbar-nav">

                    <!-- href="../ManuelUserDoc/Details/0/?search="  -->
                    <li>
                        <a href="/ManuelUserDoc/Details/0?search=#&isAccueil=1" id="btnObcUserManual" title="Manuel utilisateur OBC">
                            <span><i class="fa fa-newspaper-o fa-fw"></i></span>
                        </a>
                    </li>


                    <!-- Notifications: style can be found in dropdown.less -->
                    <li class="dropdown notifications-menu">
                        <a href="#" class="dropdown-toggle" data-toggle="dropdown">
                            <i class="fa fa-bell-o"></i>
                            <span id="messagesNotifs" class="label label-warning">0</span>
                        </a>
                        <ul class="dropdown-menu">
                            <li id="messagesNotifsLi" class="header"></li>
                            
                        </ul>
                    </li>

                    

                    

                    

                    <!-- User Account: style can be found in dropdown.less -->
                    <li class="dropdown user user-menu">

                        <a href="#" class="dropdown-toggle" data-toggle="dropdown">
                            <img id="rhxPhotoMenu" src="/Images/Photos/Unknown_Image.jpg" class="user-image" alt="User Image">
                            <span id="rhxNameMenu" class="hidden-xs"></span>
                        </a>
                        <ul class="dropdown-menu">
                            <!-- User image -->
                            <li class="user-header">
                                <img id="rhxPhotoMenu2" src="/Images/Photos/Unknown_Image.jpg" class="img-circle" alt="User Image">
                                <p>
                                    <span id="rhxNameMenu2"></span>
                                    <small id="rhxDateMembreMenu2">Member since Nov. 2015</small>
                                </p>
                            </li>
                            <!-- Menu Body
                            <li class="user-body">
                                <div class="row">
                                    <div class="col-xs-4 text-center">
                                        <a href="#">Followers</a>
                                    </div>
                                    <div class="col-xs-4 text-center">
                                        <a href="#">Sales</a>
                                    </div>
                                    <div class="col-xs-4 text-center">
                                        <a href="#">Friends</a>
                                    </div>
                                </div>
                                <!-- /.row -->
                            <!--</li>-->
                            <!-- Menu Footer-->
                            <li class="user-footer">
                                <div class="pull-left">
                                    <a href="/Manage/Index" class="dropdown-toggle" data-toggle="dropdown" id="btnGestionXXXCompteUser">Profil Utilisateur</a>
                                </div>
                                <div class="pull-right">{noformat}

<form action="/Account/LogOff" id="logoutForm" method="post"><input name="__RequestVerificationToken" type="hidden" value="x-6Th1SVx7ZL7Yj4rc_AUp2aU3-yhhBZiW06laN0k3Bsixv4zI29oyNEGUa_CoMk8k-ijuhq5B0a0aB70', 'BUG'::ticket_type_t, 'Low'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Global', 'Global', 'Global', 'Duplication anormale'::bug_type_enum, 'Edwige KOUASSI', NULL, '2024-03-01 16:43:00+00'::timestamptz, '2024-07-08 12:15:00+00'::timestamptz, '2024-04-02 16:08:00+00'::timestamptz),
  ('OD-1378', 'impossible d''importer un fichier immo', 'Bien que les données soient correctement renseigner dans le fichier d’importation il est impossible d’importer les fichier d’immobilisation', 'BUG'::ticket_type_t, 'Low'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Opérations', 'Immobilisations', NULL, 'Import de fichiers impossible'::bug_type_enum, 'Edwige KOUASSI', NULL, '2024-02-29 17:11:00+00'::timestamptz, '2024-07-08 12:15:00+00'::timestamptz, '2024-03-01 22:13:00+00'::timestamptz),
  ('OD-1324', 'Les numéros d''odre disparaissent à l''édition des rubrques', 'Lors de l’enregistrement des rubriques nous avons la possibilité de donner la position de la rubrique par contre à l''édition de cette rubrique le numéro d’ordre disparait.', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Finance', 'Budget', NULL, 'Autres'::bug_type_enum, 'Edwige KOUASSI', NULL, '2024-02-15 17:01:00+00'::timestamptz, '2024-02-16 12:27:00+00'::timestamptz, '2024-02-16 12:27:00+00'::timestamptz),
  ('OD-716', 'La fonctionnalité "fermer" actualise l''interface de création des opportunités', 'La fonctionnalité "fermer" actualise l''interface de création des opportunités', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'CRM', 'Activités commerciales', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:41:00+00'::timestamptz, '2023-12-08 19:06:00+00'::timestamptz, '2023-12-08 19:06:00+00'::timestamptz),
  ('OD-840', 'Lorsqu''on met des filtres en historique des factures ventes, les montants récapitulatifs HT et TTC ne prennent pas en compte le filtre', 'Lorsqu''on met des filtres en historique des factures ventes, les montants récapitulatifs HT et TTC ne prennent pas en compte le filtre', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Opérations', 'Vente', NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04 13:55:00+00'::timestamptz, '2023-12-06 17:32:00+00'::timestamptz, '2023-12-06 12:47:00+00'::timestamptz);

-- ============================================
-- ÉTAPE 3: UPSERT des tickets
-- ============================================

DO $$
DECLARE
  v_ticket RECORD;
  v_module_id UUID;
  v_submodule_id UUID;
  v_feature_id UUID;
  v_created_by UUID;
  v_contact_user_id UUID;
  v_existing_ticket_id UUID;
  v_global_module_id UUID := '98ce1c5f-e53c-4baf-9af1-52255d499378';
  v_created_count INTEGER := 0;
  v_updated_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
BEGIN
  FOR v_ticket IN
    SELECT * FROM temp_tickets_csv
    WHERE jira_issue_key IS NOT NULL
      AND TRIM(jira_issue_key) != ''
      AND title IS NOT NULL
      AND TRIM(title) != ''
  LOOP
    -- Rechercher le module
    IF v_ticket.module_name IS NOT NULL AND TRIM(v_ticket.module_name) != '' THEN
      IF UPPER(TRIM(v_ticket.module_name)) = 'GLOBAL' THEN
        v_module_id := v_global_module_id;
        v_submodule_id := NULL; -- Pas de sous-module pour Global
      ELSE
        SELECT id INTO v_module_id
        FROM modules
        WHERE UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.module_name))
        LIMIT 1;
      END IF;
    ELSE
      v_module_id := NULL;
    END IF;
    
    -- Rechercher le sous-module (seulement si module n'est pas Global)
    IF v_module_id IS NOT NULL AND v_module_id != v_global_module_id AND v_ticket.submodule_name IS NOT NULL AND TRIM(v_ticket.submodule_name) != '' THEN
      IF UPPER(TRIM(v_ticket.submodule_name)) = 'GLOBAL' THEN
        v_submodule_id := NULL;
      ELSE
        SELECT id INTO v_submodule_id
        FROM submodules
        WHERE module_id = v_module_id
          AND UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.submodule_name))
        LIMIT 1;
      END IF;
    ELSE
      v_submodule_id := NULL;
    END IF;
    
    -- Rechercher la fonctionnalité (seulement si sous-module existe)
    IF v_submodule_id IS NOT NULL AND v_ticket.feature_name IS NOT NULL AND TRIM(v_ticket.feature_name) != '' THEN
      IF UPPER(TRIM(v_ticket.feature_name)) = 'GLOBAL' THEN
        v_feature_id := NULL;
      ELSE
        SELECT id INTO v_feature_id
        FROM features
        WHERE submodule_id = v_submodule_id
          AND UPPER(TRIM(name)) = UPPER(TRIM(v_ticket.feature_name))
        LIMIT 1;
      END IF;
    ELSE
      v_feature_id := NULL;
    END IF;
    
    -- Rechercher le rapporteur
    IF v_ticket.reporter_name IS NOT NULL AND TRIM(v_ticket.reporter_name) != '' THEN
      SELECT id INTO v_created_by
      FROM profiles
      WHERE UPPER(TRIM(full_name)) = UPPER(TRIM(v_ticket.reporter_name))
      LIMIT 1;
    ELSE
      v_created_by := NULL;
    END IF;
    
    -- Rechercher l'utilisateur client
    IF v_ticket.contact_user_name IS NOT NULL AND TRIM(v_ticket.contact_user_name) != '' THEN
      SELECT id INTO v_contact_user_id
      FROM profiles
      WHERE UPPER(TRIM(full_name)) = UPPER(TRIM(v_ticket.contact_user_name))
        AND role = 'client'
      LIMIT 1;
    ELSE
      v_contact_user_id := NULL;
    END IF;
    
    -- Vérifier si le ticket existe déjà
    SELECT id INTO v_existing_ticket_id
    FROM tickets
    WHERE jira_issue_key = v_ticket.jira_issue_key
    LIMIT 1;
    
    -- UPSERT du ticket
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
        created_at,
        updated_at,
        resolved_at,
        origin
      )
      VALUES (
        v_ticket.jira_issue_key,
        v_ticket.title,
        NULLIF(TRIM(v_ticket.description), ''),
        v_ticket.ticket_type::ticket_type_t,
        v_ticket.priority::priority_t,
        v_ticket.canal::canal_t,
        v_ticket.status,
        v_module_id,
        v_submodule_id,
        v_feature_id,
        v_ticket.bug_type::bug_type_enum,
        v_created_by,
        v_contact_user_id,
        true, -- affects_all_companies
        NULL, -- company_id (portée globale)
        COALESCE(v_ticket.created_at, NOW()),
        COALESCE(v_ticket.updated_at, NOW()),
        v_ticket.resolved_at,
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
        updated_at = EXCLUDED.updated_at,
        resolved_at = EXCLUDED.resolved_at;
      
    -- Compter création vs mise à jour
    IF v_existing_ticket_id IS NULL THEN
      v_created_count := v_created_count + 1;
    ELSE
      v_updated_count := v_updated_count + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE '=== RÉSUMÉ ===';
  RAISE NOTICE 'Tickets créés: %', v_created_count;
  RAISE NOTICE 'Tickets mis à jour: %', v_updated_count;
  RAISE NOTICE 'Tickets ignorés: %', v_skipped_count;
END $$;

-- ============================================
-- NETTOYAGE
-- ============================================

DROP TABLE IF EXISTS temp_tickets_csv;
