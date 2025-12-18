-- Migration: Correction des contraintes de la table brevo_email_campaigns
-- Date: 2025-12-16
-- Description: Élargir les statuts acceptés pour correspondre à l'API Brevo

-- Supprimer l'ancienne contrainte de status
ALTER TABLE public.brevo_email_campaigns 
DROP CONSTRAINT IF EXISTS brevo_email_campaigns_status_check;

-- Ajouter une nouvelle contrainte plus permissive avec tous les statuts Brevo possibles
ALTER TABLE public.brevo_email_campaigns
ADD CONSTRAINT brevo_email_campaigns_status_check 
CHECK (status IS NULL OR status = ANY (ARRAY[
  'draft',           -- Brouillon
  'sent',            -- Envoyée
  'scheduled',       -- Programmée
  'suspended',       -- Suspendue
  'queued',          -- En file d'attente
  'archive',         -- Archivée
  'in_process',      -- En cours d'envoi
  'inProgress',      -- En cours d'envoi (format API alternatif)
  'in_campaign',     -- En campagne
  'sending',         -- En cours d'envoi
  'running'          -- En cours d'exécution
]));

-- Supprimer l'ancienne contrainte sur campaign_type pour plus de flexibilité
ALTER TABLE public.brevo_email_campaigns 
DROP CONSTRAINT IF EXISTS brevo_email_campaigns_campaign_type_check;

-- Ajouter une nouvelle contrainte plus permissive
ALTER TABLE public.brevo_email_campaigns
ADD CONSTRAINT brevo_email_campaigns_campaign_type_check 
CHECK (campaign_type IS NULL OR campaign_type = ANY (ARRAY[
  'classic',         -- Classique
  'trigger',         -- Déclenchée
  'automated',       -- Automatisée
  'sms',             -- SMS (au cas où)
  'transactional'    -- Transactionnelle
]));

-- Supprimer la contrainte valid_counts qui peut poser problème
-- (emails_delivered <= emails_sent peut être faux temporairement pendant l'envoi)
ALTER TABLE public.brevo_email_campaigns 
DROP CONSTRAINT IF EXISTS valid_counts;

-- Recréer une contrainte plus souple
ALTER TABLE public.brevo_email_campaigns
ADD CONSTRAINT valid_counts 
CHECK (
  emails_sent >= 0 AND
  emails_delivered >= 0 AND
  unique_opens >= 0 AND
  unique_clicks >= 0 AND
  hard_bounces >= 0 AND
  soft_bounces >= 0 AND
  spam_complaints >= 0 AND
  unsubscribes >= 0
);








