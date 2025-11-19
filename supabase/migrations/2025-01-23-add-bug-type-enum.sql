-- Ajout d'un ENUM pour représenter les types de bugs déclarés dans JIRA
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'bug_type_enum'
  ) THEN
    CREATE TYPE public.bug_type_enum AS ENUM (
      'Autres',
      'Mauvais déversement des données',
      'Dysfonctionnement sur le Calcul des salaires',
      'Duplication anormale',
      'Enregistrement impossible',
      'Page d''erreur',
      'Historique vide/non exhaustif',
      'Non affichage de pages/données',
      'Lenteur Système',
      'Import de fichiers impossible',
      'Suppression impossible',
      'Récupération de données impossible',
      'Edition impossible',
      'Dysfonctionnement des filtres',
      'Error 503',
      'Impression impossible',
      'Erreur de calcul/Erreur sur Dashboard',
      'Dysfonctionnement Workflow',
      'Erreur serveur',
      'Dysfonctionnement des liens d''accès',
      'Formulaire indisponible',
      'Erreur Ajax',
      'Export de données impossible',
      'Connexion impossible'
    );
  END IF;
END
$$;

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS bug_type public.bug_type_enum;

CREATE INDEX IF NOT EXISTS idx_tickets_bug_type
  ON public.tickets(bug_type)
  WHERE bug_type IS NOT NULL;

