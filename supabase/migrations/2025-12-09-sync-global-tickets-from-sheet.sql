-- OnpointDoc - Synchronisation des tickets à impact global depuis Google Sheet
-- Date: 2025-12-09
-- Généré automatiquement depuis scripts/sync-global-tickets-from-google-sheet.mjs
-- Total: 41 tickets
-- Note: Ces tickets ont un impact global (affects_all_companies = true, company_id = NULL)

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
  ('OD-715', 'Impossible d’enregistrer une opportunité dans une nouvelle base', 'Corriger la fonction de l’historique de toutes les opportunités', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'Global', NULL, NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04T13:41:00.000Z'::timestamptz, '2023-12-06T17:33:00.000Z'::timestamptz, NULL),
  ('OD-714', 'Empêcher l''enregistrement des opportunités avec des erreurs : Faire agir le roll back en amont', 'Les opportunités avec les erreurs s’enregistrent quand même', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04T13:41:00.000Z'::timestamptz, '2023-12-06T17:33:00.000Z'::timestamptz, '2023-12-06T17:33:00.000Z'::timestamptz),
  ('OD-2780', 'Server Error in ''/'' Application.', 'Message d’erreur “Server error in application”.
h1. Server Error in ''/'' Application.
h2. _Runtime Error_
*Description:*An exception occurred while processing your request. Additionally, another exception occurred while executing the custom error page for the first exception. The request has been terminated.
!20250806-1117-57.3502082.mp4|width=1920,height=1030,alt="20250806-1117-57.3502082.mp4"!', 'BUG'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Autres'::bug_type_enum, 'Edwige KOUASSI', NULL, '2025-08-06T11:21:00.000Z'::timestamptz, '2025-08-08T20:30:00.000Z'::timestamptz, '2025-08-08T20:30:00.000Z'::timestamptz),
  ('OD-2771', 'Impossible de poursuivre le paramétrage d''une entreprise à partir de l''interface principal OBC', 'Impossible de poursuivre le paramétrage d''une entreprise à partir de l''interface principal OBC', 'BUG'::ticket_type_t, 'Medium'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Autres'::bug_type_enum, 'EVA BASSE', NULL, '2025-08-01T14:59:00.000Z'::timestamptz, '2025-11-05T09:02:00.000Z'::timestamptz, '2025-11-05T09:02:00.000Z'::timestamptz),
  ('OD-2765', 'Impossible de créer une entité - Un message d''erreur affiche', 'Message d’erreur lors de la création d’une entité à partir du formulaire principal
!20250730-1843-14.3869672.mp4|width=1912,height=928,alt="20250730-1843-14.3869672.mp4"!
{{{"success":false,"mess":"DbUpdateException : \\nUne erreur s\\u0027est produite lors de la mise à jour des entrées. Pour plus d\\u0027informations, consultez l\\u0027exception interne. //    at System.Data.Entity.Internal.InternalContext.SaveChanges()\\r\\n   at ONPOINTBUSINESSCENTER.Controllers.EntiteEntrepriseController.NewEntite(parametrage_entite parametrage_entite, HttpPostedFileBase uploadedFileLogoEntite) // InnerException :Une erreur s\\u0027est produite lors de la mise à jour des entrées. Pour plus d\\u0027informations, consultez l\\u0027exception interne. //    at System.Data.Entity.Core.Mapping.Update.Internal.UpdateTranslator.Update()\\r\\n   at System.Data.Entity.Core.Objects.ObjectContext.ExecuteInTransaction[T](Func`1 func, IDbExecutionStrategy executionStrategy, Boolean startLocalTransaction, Boolean releaseConnectionOnSuccess)\\r\\n   at System.Data.Entity.Core.Objects.ObjectContext.SaveChangesToStore(SaveOptions options, IDbExecutionStrategy executionStrategy, Boolean startLocalTransaction)\\r\\n   at System.Data.Entity.Core.Objects.ObjectContext.SaveChangesInternal(SaveOptions options, Boolean executeInExistingTransaction)\\r\\n   at System.Data.Entity.Internal.InternalContext.SaveChanges() // InnerException.InnerException : 23502: null value in column \\"type_codification_bon_commande\\" violates not-null constraint //    at Npgsql.NpgsqlConnector.DoReadMessage(DataRowLoadingMode dataRowLoadingMode, Boolean isPrependedMessage)\\r\\n   at Npgsql.NpgsqlConnector.ReadMessageWithPrepended(DataRowLoadingMode dataRowLoadingMode)\\r\\n   at Npgsql.NpgsqlDataReader.NextResultInternal()\\r\\n   at Npgsql.NpgsqlDataReader.NextResult()\\r\\n   at Npgsql.NpgsqlCommand.Execute(CommandBehavior behavior)\\r\\n   at Npgsql.NpgsqlCommand.ExecuteDbDataReaderInternal(CommandBehavior behavior)\\r\\n   at System.Data.Entity.Infrastructure.Interception.InternalDispatcher`1.Dispatch[TTarget,TInterceptionContext,TResult](TTarget target, Func`3 operation, TInterceptionContext interceptionContext, Action`3 executing, Action`3 executed)\\r\\n   at System.Data.Entity.Infrastructure.Interception.DbCommandDispatcher.Reader(DbCommand command, DbCommandInterceptionContext interceptionContext)\\r\\n   at System.Data.Entity.Core.Mapping.Update.Internal.DynamicUpdateCommand.Execute(Dictionary`2 identifierValues, List`1 generatedValues)\\r\\n   at System.Data.Entity.Core.Mapping.Update.Internal.UpdateTranslator.Update()"}}}', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'En cours', 'Global', NULL, NULL, 'Page d'erreur'::bug_type_enum, 'Edwige KOUASSI', NULL, '2025-07-30T19:02:00.000Z'::timestamptz, '2025-08-01T10:15:00.000Z'::timestamptz, NULL),
  ('OD-2180', 'Quand on es sur une base qui a plusieurs entité et qu''on sélectionne une entité comme base de travail, nous constatons que les départements de toute les entités se déversent en historique de département', 'Quand on es sur une base qui a plusieurs entité et qu''on sélectionne  une entité comme base de travail, nous constatons que les départements de toute les entités se déversent en historique de département
!image-20241111-094902.png|width=1727,height=880,alt="image-20241111-094902.png"!', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Mauvais déversement des données'::bug_type_enum, 'EVA BASSE', NULL, '2024-11-11T09:49:00.000Z'::timestamptz, '2024-11-13T11:42:00.000Z'::timestamptz, '2024-11-13T11:42:00.000Z'::timestamptz),
  ('OD-2149', 'Impossible d''enregistrer de lier 2 enfants à un fichier de personnel', 'Impossible d''enregistrer de lier 2 enfants à un fichier de personnel', 'BUG'::ticket_type_t, 'High'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Enregistrement impossible'::bug_type_enum, 'EVA BASSE', NULL, '2024-11-01T12:49:00.000Z'::timestamptz, '2024-11-11T09:30:00.000Z'::timestamptz, '2024-11-11T09:30:00.000Z'::timestamptz),
  ('OD-2148', 'Impossible de supprimer un département auquel n''est associé aucune personne', 'Impossible de supprimer un département auquel n''est associé aucune personne', 'BUG'::ticket_type_t, 'High'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Autres'::bug_type_enum, 'EVA BASSE', NULL, '2024-11-01T12:26:00.000Z'::timestamptz, '2024-11-11T09:46:00.000Z'::timestamptz, '2024-11-11T09:46:00.000Z'::timestamptz),
  ('OD-1416', 'Apparition d''écran bleu (Voir capture)', 'Apparition d''écran bleu (Voir capture)', 'BUG'::ticket_type_t, 'Low'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Page d'erreur'::bug_type_enum, 'EVA BASSE', NULL, '2024-03-07T17:59:00.000Z'::timestamptz, '2024-04-02T16:16:00.000Z'::timestamptz, '2024-04-02T16:16:00.000Z'::timestamptz),
  ('OD-1415', 'Le Dashboard de la page d''accueil présente un message d''erreur (Voir capture jointe)', 'Le Dashboard de la page d''accueil présente un message d''erreur (Voir capture jointe)', 'BUG'::ticket_type_t, 'Low'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Page d'erreur'::bug_type_enum, 'EVA BASSE', NULL, '2024-03-07T17:57:00.000Z'::timestamptz, '2024-03-22T16:56:00.000Z'::timestamptz, '2024-03-22T16:56:00.000Z'::timestamptz),
  ('OD-1411', 'Page bleu apparaissant sur l''écran OBC', 'Page bleu apparaissant sur l''écran OBC', 'BUG'::ticket_type_t, 'Low'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Page d'erreur'::bug_type_enum, 'EVA BASSE', NULL, '2024-03-06T15:15:00.000Z'::timestamptz, '2024-04-02T16:16:00.000Z'::timestamptz, '2024-04-02T16:16:00.000Z'::timestamptz),
  ('OD-1407', 'La présentation du bulletin de salaire est à revoir.  En effet , d''une page à une autre, on a une colonne coupé en 2.', 'La présentation du bulletin de salaire est à revoir.  En effet , d''une page à une autre, on a une colonne coupé en 2.', 'BUG'::ticket_type_t, 'Low'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Autres'::bug_type_enum, 'EVA BASSE', NULL, '2024-03-06T10:39:00.000Z'::timestamptz, '2024-03-08T10:09:00.000Z'::timestamptz, '2024-03-08T10:09:00.000Z'::timestamptz),
  ('OD-1391', 'Il est impossible de se connecter sur OBC', 'Lorsqu’on enregistre nos accès, nous sommes ramené sur la page d’accueil', 'BUG'::ticket_type_t, 'Low'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Autres'::bug_type_enum, 'EVA BASSE', NULL, '2024-03-05T14:42:00.000Z'::timestamptz, '2024-03-06T08:06:00.000Z'::timestamptz, '2024-03-06T08:06:00.000Z'::timestamptz),
  ('OD-1390', 'SERVICE UNAVAILABLE', 'SERVICE UNAVAILABLE', 'BUG'::ticket_type_t, 'Low'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Page d'erreur'::bug_type_enum, 'EVA BASSE', NULL, '2024-03-05T14:41:00.000Z'::timestamptz, '2024-03-06T08:06:00.000Z'::timestamptz, '2024-03-06T08:06:00.000Z'::timestamptz),
  ('OD-1379', 'L''écran OBC affiche momentanément un message d''erreur comme sur la capture ci-joint', 'L''écran OBC affiche momentanément un message d''erreur comme sur la capture ci-joint', 'BUG'::ticket_type_t, 'Low'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Page d'erreur'::bug_type_enum, 'EVA BASSE', NULL, '2024-03-01T16:24:00.000Z'::timestamptz, '2024-04-02T16:16:00.000Z'::timestamptz, '2024-04-02T16:16:00.000Z'::timestamptz),
  ('OD-1346', 'Lorsqu''on clique sur la fonctionnalité "Fichier du personnel" sur la base test, on a un message d''erreur', 'Lorsqu''on clique sur la fonctionnalité "Fichier du personnel" sur la base test, on a un message d''erreur', 'BUG'::ticket_type_t, 'Low'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Page d'erreur'::bug_type_enum, 'EVA BASSE', NULL, '2024-02-20T15:29:00.000Z'::timestamptz, '2024-03-11T15:33:00.000Z'::timestamptz, '2024-03-11T15:33:00.000Z'::timestamptz),
  ('OD-1345', 'Lorsqu''on clique sur la fonctionnalité "Code" sur le menu latéral à gauche, il y a un message d''erreur qui apparaît', 'Lorsqu''on clique sur la fonctionnalité "Code" sur le menu latéral à gauche, il y a un message d''erreur qui apparaît', 'BUG'::ticket_type_t, 'Low'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Page d'erreur'::bug_type_enum, 'EVA BASSE', NULL, '2024-02-20T15:27:00.000Z'::timestamptz, '2024-02-21T14:51:00.000Z'::timestamptz, '2024-02-21T14:51:00.000Z'::timestamptz),
  ('OD-1312', 'Sur le Dashboard Accueil, le graphe "Top 10 des achats par fournisseur " présente les libellés suivants: "NULL"', 'Sur le Dashboard Accueil, le graphe "Top 10 des achats par fournisseur " présente les libellés suivants: "NULL"', 'BUG'::ticket_type_t, 'Low'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Autres'::bug_type_enum, 'EVA BASSE', NULL, '2024-02-07T17:06:00.000Z'::timestamptz, '2024-02-14T09:11:00.000Z'::timestamptz, '2024-02-14T09:11:00.000Z'::timestamptz),
  ('OD-1309', 'SERVICE UNAVAILABLE', 'SERVICE UNAVAILABLE', 'BUG'::ticket_type_t, 'Low'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Page d'erreur'::bug_type_enum, 'EVA BASSE', NULL, '2024-02-06T17:16:00.000Z'::timestamptz, '2024-02-07T09:25:00.000Z'::timestamptz, '2024-02-07T09:25:00.000Z'::timestamptz),
  ('OD-1303', 'SERVICE UNAVAILABLE', 'SERVICE UNAVAILABLE', 'BUG'::ticket_type_t, 'Low'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Page d'erreur'::bug_type_enum, 'EVA BASSE', NULL, '2024-02-02T10:29:00.000Z'::timestamptz, '2024-02-05T07:18:00.000Z'::timestamptz, '2024-02-05T07:18:00.000Z'::timestamptz),
  ('OD-1295', 'Il est impossible de supprimer les fichiers (pdf,image..) rattachés à l''identification d''un véhicule', 'Il est impossible de supprimer les fichiers (pdf,image..) rattachés à l''identification d''un véhicule', 'BUG'::ticket_type_t, 'Medium'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Autres'::bug_type_enum, 'EVA BASSE', NULL, '2024-02-01T10:13:00.000Z'::timestamptz, '2024-02-06T19:31:00.000Z'::timestamptz, '2024-02-06T19:31:00.000Z'::timestamptz),
  ('OD-1294', 'A chaque fois qu''on édite la fiche d''identification des véhicules, le modèle de véhicule se désélectionne', 'A chaque fois qu''on édite la fiche d''identification des véhicules, le modèle de véhicule se désélectionne', 'BUG'::ticket_type_t, 'Medium'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Mauvais déversement des données'::bug_type_enum, 'EVA BASSE', NULL, '2024-02-01T10:11:00.000Z'::timestamptz, '2024-02-02T10:56:00.000Z'::timestamptz, '2024-02-02T10:56:00.000Z'::timestamptz),
  ('OD-1252', 'Apparition d''écran bleu par moment (image joint)', 'Apparition d''écran bleu par moment (image joint)', 'BUG'::ticket_type_t, 'Low'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Page d'erreur'::bug_type_enum, 'EVA BASSE', NULL, '2024-01-17T15:17:00.000Z'::timestamptz, '2024-04-02T16:16:00.000Z'::timestamptz, '2024-04-02T16:16:00.000Z'::timestamptz),
  ('OD-1250', 'Servoce Unavailable', 'Servoce Unavailable', 'BUG'::ticket_type_t, 'Low'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Page d'erreur'::bug_type_enum, 'EVA BASSE', NULL, '2024-01-16T19:25:00.000Z'::timestamptz, '2024-01-22T11:19:00.000Z'::timestamptz, '2024-01-22T11:19:00.000Z'::timestamptz),
  ('OD-1265', 'Lorsqu''il y a revalorisation catégorielle, OBC prend en compte l''ancien salaire minimum pour le calcul de l''ancienneté lors de la paie', 'Lorsqu''il y a revalorisation catégorielle, OBC prend en compte l''ancien salaire minimum pour le calcul de l''ancienneté lors de la paie', 'BUG'::ticket_type_t, 'Low'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Mauvais déversement des données'::bug_type_enum, 'EVA BASSE', NULL, '2024-01-19T19:07:00.000Z'::timestamptz, '2024-01-29T10:12:00.000Z'::timestamptz, '2024-01-29T10:12:00.000Z'::timestamptz),
  ('OD-1224', 'Lorsqu''on supprime un programme BTP comprenant des îlots, ces mêmes îlots se déversent dans "choix des biens" qui est présent sur le formulaire "Fiche offre BTP"', 'Lorsqu''on supprime un programme BTP comprenant des îlots, ces mêmes îlots se déversent dans "choix des biens" qui est présent sur le formulaire "Fiche offre BTP"', 'BUG'::ticket_type_t, 'Low'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Duplication anormale'::bug_type_enum, 'EVA BASSE', NULL, '2024-01-10T17:31:00.000Z'::timestamptz, '2024-01-25T08:12:00.000Z'::timestamptz, '2024-01-25T08:12:00.000Z'::timestamptz),
  ('OD-1168', 'Lorsqu''on clique sur le pilotage commercial, on a le message: "erreur ajax"', 'Lorsqu''on clique sur le pilotage commercial, on a le message: "erreur ajax"', 'BUG'::ticket_type_t, 'Medium'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Page d'erreur'::bug_type_enum, 'EVA BASSE', NULL, '2023-12-22T11:01:00.000Z'::timestamptz, '2024-01-12T08:37:00.000Z'::timestamptz, '2024-01-12T08:37:00.000Z'::timestamptz),
  ('OD-1165', 'Etat des deals: La période en cours du tableau “Etat des deals” ne s’affiche pas par défaut.', 'Etat des deals: La période en cours du tableau “Etat des deals” ne s’affiche pas par défaut.', 'BUG'::ticket_type_t, 'Medium'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Autres'::bug_type_enum, 'EVA BASSE', NULL, '2023-12-21T17:30:00.000Z'::timestamptz, '2024-01-02T17:10:00.000Z'::timestamptz, '2024-01-02T17:10:00.000Z'::timestamptz),
  ('OD-1163', 'A l''édition d''une opportunité, une date de création est précisé. Mais quand on se rend en historique des opportunités, la date de création correspond à celle de la saisie..', 'A l''édition d’une opportunité, la date de création de l’opportunité n’est pas la vraie date.
C’est juste la date de saisie.', 'BUG'::ticket_type_t, 'Medium'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Mauvais déversement des données'::bug_type_enum, 'EVA BASSE', NULL, '2023-12-21T17:13:00.000Z'::timestamptz, '2023-12-29T18:24:00.000Z'::timestamptz, '2023-12-29T18:24:00.000Z'::timestamptz),
  ('OD-1478', 'Impossible d''enregistrer et de supprimer des frais de Mission', 'Au clique sur le bouton ‘Nouveau frais de mission'' nous constatons cette petite notification sur laquelle est mentionné :
{noformat}Entité Id = 16.{noformat}
Puis Lors de l’enregistrement des frais de mission, l’ordre de mission enregistré & validé ne se déverse pas dans le formulaire.
Enfin dans l’historique des frais de mission, rajouter dans la colonne action le {color:#bf2600}bouton supprimer{color}, afin de donner la possibilité a l’utilisateur de pouvoir supprimer ses enregistrements en fonction de son rôle.', 'BUG'::ticket_type_t, 'High'::priority_t, 'En présentiel'::canal_t, 'En cours', 'Global', NULL, NULL, 'Autres'::bug_type_enum, 'Edwige KOUASSI', NULL, '2024-03-22T12:10:00.000Z'::timestamptz, '2024-06-27T15:43:00.000Z'::timestamptz, NULL),
  ('OD-1389', 'Impossible de se connecter à OBC', 'A chaque fois que je renseigne mon Id et mot de passe, la page se réactualise un peu comme un refus de connexion', 'BUG'::ticket_type_t, 'Low'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Autres'::bug_type_enum, 'Edwige KOUASSI', NULL, '2024-03-05T14:36:00.000Z'::timestamptz, '2024-07-08T12:15:00.000Z'::timestamptz, '2024-03-06T08:06:00.000Z'::timestamptz),
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
<form action="/Account/LogOff" id="logoutForm" method="post"><input name="__RequestVerificationToken" type="hidden" value="x-6Th1SVx7ZL7Yj4rc_AUp2aU3-yhhBZiW06laN0k3Bsixv4zI29oyNEGUa_CoMk8k-ijuhq5B0a0aB70', 'BUG'::ticket_type_t, 'Low'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Duplication anormale'::bug_type_enum, 'Edwige KOUASSI', NULL, '2024-03-01T16:43:00.000Z'::timestamptz, '2024-07-08T12:15:00.000Z'::timestamptz, '2024-04-02T16:08:00.000Z'::timestamptz),
  ('OD-1377', 'Trace des opérations supprimer sur la page d''accueil - Opérations à Valider', 'Bien que les opérations de versement par la caisse soient complètement supprimer,
nous avons des opérations à valider.', 'BUG'::ticket_type_t, 'Low'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Autres'::bug_type_enum, 'Edwige KOUASSI', NULL, '2024-02-29T13:13:00.000Z'::timestamptz, '2024-07-08T12:15:00.000Z'::timestamptz, '2024-03-05T07:44:00.000Z'::timestamptz),
  ('OD-1378', 'impossible d''importer un fichier immo', 'Bien que les données soient correctement renseigner dans le fichier d’importation il est impossible d’importer les fichier d’immobilisation', 'BUG'::ticket_type_t, 'Low'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Autres'::bug_type_enum, 'Edwige KOUASSI', NULL, '2024-02-29T17:11:00.000Z'::timestamptz, '2024-07-08T12:15:00.000Z'::timestamptz, '2024-03-01T22:13:00.000Z'::timestamptz),
  ('OD-1353', 'Sélection du site Impossible', 'Lors de l’enregistrement d’une production les sites bien que créé ne se déversent pas.
Il est donc impossible de les sélectionner', 'BUG'::ticket_type_t, 'Low'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Autres'::bug_type_enum, 'Edwige KOUASSI', NULL, '2024-02-21T19:09:00.000Z'::timestamptz, '2024-07-08T12:15:00.000Z'::timestamptz, '2024-03-05T17:13:00.000Z'::timestamptz),
  ('OD-1324', 'Les numéros d''odre disparaissent à l''édition des rubrques', 'Lors de l’enregistrement des rubriques nous avons la possibilité de donner la position de la rubrique par contre à l''édition de cette rubrique le numéro d’ordre disparait.', 'BUG'::ticket_type_t, 'Critical'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Autres'::bug_type_enum, 'Edwige KOUASSI', NULL, '2024-02-15T17:01:00.000Z'::timestamptz, '2024-02-16T12:27:00.000Z'::timestamptz, '2024-02-16T12:27:00.000Z'::timestamptz),
  ('OD-1272', 'Lenteur système', 'Lenteur système', 'BUG'::ticket_type_t, 'Low'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Autres'::bug_type_enum, 'Edwige KOUASSI', NULL, '2024-01-24T11:02:00.000Z'::timestamptz, '2024-07-08T12:15:00.000Z'::timestamptz, '2024-01-25T08:05:00.000Z'::timestamptz),
  ('OD-716', 'La fonctionnalité "fermer" actualise l''interface de création des opportunités', 'La fonctionnalité "fermer" actualise l''interface de création des opportunités', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04T13:41:00.000Z'::timestamptz, '2023-12-08T19:06:00.000Z'::timestamptz, '2023-12-08T19:06:00.000Z'::timestamptz),
  ('OD-840', 'Lorsqu''on met des filtres en historique des factures ventes, les montants récapitulatifs HT et TTC ne prennent pas en compte le filtre', 'Lorsqu''on met des filtres en historique des factures ventes, les montants récapitulatifs HT et TTC ne prennent pas en compte le filtre', 'BUG'::ticket_type_t, 'High'::priority_t, 'Constat Interne'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Autres'::bug_type_enum, 'Vivien DAKPOGAN', NULL, '2023-12-04T13:55:00.000Z'::timestamptz, '2023-12-06T17:32:00.000Z'::timestamptz, '2023-12-06T12:47:00.000Z'::timestamptz),
  ('OD-1278', 'Dysfonctionnement - Duplication salaire catégoriel', 'Lors du processus de duplication des contrats nous constatons que les données ne se déversent pas correctement.
La mise à jour étant faite, on devrait dans la base avoir les salaires de base précédent et revalorisé!', 'BUG'::ticket_type_t, 'Low'::priority_t, 'En présentiel'::canal_t, 'À faire', 'Global', NULL, NULL, 'Autres'::bug_type_enum, 'Edwige KOUASSI', NULL, '2024-01-24T22:04:00.000Z'::timestamptz, '2024-12-06T09:43:00.000Z'::timestamptz, NULL),
  ('OD-1368', 'Erreur Ajax lors de l''enregistrement d''un contrat', 'A l’enregistrement d’un contrat un message d’erreur Ajax s’affiche bien que le contrat soit enregistré', 'BUG'::ticket_type_t, 'Low'::priority_t, 'En présentiel'::canal_t, 'Terminé(e)', 'Global', NULL, NULL, 'Page d'erreur'::bug_type_enum, 'Edwige KOUASSI', NULL, '2024-02-27T13:24:00.000Z'::timestamptz, '2024-07-08T12:15:00.000Z'::timestamptz, '2024-02-29T09:07:00.000Z'::timestamptz)
;

-- ============================================
-- ÉTAPE 3: UPSERT des tickets
-- ============================================

DO $$
DECLARE
  v_ticket RECORD;
  v_module_id UUID;
  v_created_by UUID;
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
    -- Utiliser le module Global
    v_module_id := v_global_module_id;
    
    -- Rechercher le rapporteur
    IF v_ticket.reporter_name IS NOT NULL AND TRIM(v_ticket.reporter_name) != '' THEN
      SELECT id INTO v_created_by
      FROM profiles
      WHERE UPPER(TRIM(full_name)) = UPPER(TRIM(v_ticket.reporter_name))
      LIMIT 1;
    ELSE
      v_created_by := NULL;
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
      NULL, -- submodule_id toujours NULL pour Global
      NULL, -- feature_id toujours NULL pour Global
      v_ticket.bug_type::bug_type_enum,
      v_created_by,
      NULL, -- contact_user_id toujours NULL (constats agents)
      true, -- affects_all_companies = true (impact global)
      NULL, -- company_id toujours NULL (impact global)
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
      contact_user_id = EXCLUDED.contact_user_id,
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
