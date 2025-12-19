-- Migration: Créer la table brevo_email_events pour les webhooks Brevo
-- Date: 2025-12-19
-- Description: Table pour stocker les événements email de Brevo (delivery, opens, clicks, bounces, etc.)

-- Créer la table
CREATE TABLE IF NOT EXISTS brevo_email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Champs de base
  event_type text NOT NULL,
  email text NOT NULL,
  message_id text,

  -- Timestamps
  date timestamptz,
  ts bigint,
  ts_event bigint,
  created_at timestamptz DEFAULT now(),

  -- Métadonnées
  subject text,
  tag text,
  sending_ip text,
  template_id integer,
  reason text,

  -- Contrainte pour valider les types d'événements
  CONSTRAINT brevo_email_events_event_type_check
    CHECK (event_type IN (
      'delivered',
      'hard_bounce',
      'soft_bounce',
      'request',
      'opened',
      'click',
      'unique_opened',
      'unsubscribe',
      'blocked',
      'error',
      'deferred',
      'complaint'
    ))
);

-- Créer les indexes pour les performances
CREATE INDEX IF NOT EXISTS idx_brevo_email_events_email
  ON brevo_email_events(email);

CREATE INDEX IF NOT EXISTS idx_brevo_email_events_event_type
  ON brevo_email_events(event_type);

CREATE INDEX IF NOT EXISTS idx_brevo_email_events_created_at
  ON brevo_email_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_brevo_email_events_template_id
  ON brevo_email_events(template_id)
  WHERE template_id IS NOT NULL;

-- Index composite pour recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_brevo_email_events_email_event_type
  ON brevo_email_events(email, event_type, created_at DESC);

-- Activer Row Level Security
ALTER TABLE brevo_email_events ENABLE ROW LEVEL SECURITY;

-- Policy: Lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to read email events"
  ON brevo_email_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Insertion via service role uniquement (pour les webhooks)
CREATE POLICY "Allow service role to insert email events"
  ON brevo_email_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Pas de modification ni suppression (données d'audit)
-- Les événements email sont immutables une fois créés

-- Commentaires pour la documentation
COMMENT ON TABLE brevo_email_events IS 'Événements email reçus via les webhooks Brevo (delivery, opens, clicks, bounces)';
COMMENT ON COLUMN brevo_email_events.event_type IS 'Type d''événement: delivered, opened, click, bounce, etc.';
COMMENT ON COLUMN brevo_email_events.email IS 'Adresse email destinataire';
COMMENT ON COLUMN brevo_email_events.message_id IS 'ID unique du message Brevo';
COMMENT ON COLUMN brevo_email_events.template_id IS 'ID du template Brevo utilisé';
COMMENT ON COLUMN brevo_email_events.reason IS 'Raison du bounce ou de l''erreur (si applicable)';
