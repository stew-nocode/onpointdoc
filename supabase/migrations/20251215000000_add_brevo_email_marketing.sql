-- Migration: Ajout des tables pour l'intégration Brevo Email Marketing
-- Date: 2025-12-15
-- Description: Tables pour gérer les campagnes email, statistiques et configuration Brevo
-- Permissions: Basées sur department_id (Marketing) + roles (manager, director, admin)

-- ============================================================================
-- TABLE: brevo_email_campaigns
-- Description: Stockage des campagnes email Brevo avec statistiques
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.brevo_email_campaigns (
  -- Identifiants
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brevo_campaign_id bigint UNIQUE NOT NULL,

  -- Métadonnées campagne
  campaign_name text NOT NULL,
  email_subject text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'scheduled', 'suspended', 'queued', 'archive')),
  campaign_type text DEFAULT 'classic' CHECK (campaign_type IN ('classic', 'trigger', 'automated')),

  -- Dates
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  scheduled_at timestamptz,

  -- Sender info
  sender_name text,
  sender_email text,
  sender_id bigint,

  -- Statistiques essentielles (KPIs)
  emails_sent integer DEFAULT 0,
  emails_delivered integer DEFAULT 0,
  unique_opens integer DEFAULT 0,
  open_rate decimal(5,2) DEFAULT 0.00, -- Pourcentage (ex: 42.50)
  unique_clicks integer DEFAULT 0,
  click_rate decimal(5,2) DEFAULT 0.00, -- Pourcentage (ex: 8.30)
  clickers_count integer DEFAULT 0,

  -- Qualité et réputation
  hard_bounces integer DEFAULT 0,
  soft_bounces integer DEFAULT 0,
  spam_complaints integer DEFAULT 0,
  unsubscribes integer DEFAULT 0,

  -- Métadonnées supplémentaires
  total_recipients integer DEFAULT 0,
  recipient_lists jsonb, -- Array de listes de contacts
  ab_test_config jsonb, -- Configuration A/B test si activé

  -- Sync tracking
  last_synced_at timestamptz DEFAULT now(),

  -- Contraintes
  CONSTRAINT valid_rates CHECK (
    open_rate >= 0 AND open_rate <= 100 AND
    click_rate >= 0 AND click_rate <= 100
  ),
  CONSTRAINT valid_counts CHECK (
    emails_sent >= 0 AND
    emails_delivered >= 0 AND
    emails_delivered <= emails_sent AND
    unique_opens >= 0 AND
    unique_clicks >= 0 AND
    hard_bounces >= 0 AND
    soft_bounces >= 0 AND
    spam_complaints >= 0 AND
    unsubscribes >= 0
  )
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_brevo_campaigns_status
  ON public.brevo_email_campaigns(status);

CREATE INDEX IF NOT EXISTS idx_brevo_campaigns_sent_at
  ON public.brevo_email_campaigns(sent_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_brevo_campaigns_campaign_id
  ON public.brevo_email_campaigns(brevo_campaign_id);

CREATE INDEX IF NOT EXISTS idx_brevo_campaigns_type
  ON public.brevo_email_campaigns(campaign_type);

-- Commentaires
COMMENT ON TABLE public.brevo_email_campaigns IS
  'Campagnes email Brevo avec statistiques de performance';

COMMENT ON COLUMN public.brevo_email_campaigns.brevo_campaign_id IS
  'ID unique de la campagne dans Brevo';

COMMENT ON COLUMN public.brevo_email_campaigns.open_rate IS
  'Taux d''ouverture en pourcentage (inclut Apple Mail Privacy depuis 2025)';

COMMENT ON COLUMN public.brevo_email_campaigns.click_rate IS
  'Taux de clic en pourcentage';

-- ============================================================================
-- TABLE: brevo_config
-- Description: Configuration Brevo (singleton - une seule config par workspace)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.brevo_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Configuration API
  api_key text NOT NULL,
  api_key_encrypted boolean DEFAULT false,
  api_url text DEFAULT 'https://api.brevo.com/v3',

  -- Configuration SMTP (optionnel)
  smtp_host text,
  smtp_port integer,

  -- Statut
  is_active boolean DEFAULT true,

  -- Audit
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Index
CREATE INDEX IF NOT EXISTS idx_brevo_config_active
  ON public.brevo_config(is_active);

-- Commentaires
COMMENT ON TABLE public.brevo_config IS
  'Configuration Brevo (une seule ligne - singleton)';

-- ============================================================================
-- RLS (Row Level Security) Policies - Basé sur departments + roles
-- ============================================================================

-- Activer RLS sur brevo_email_campaigns
ALTER TABLE public.brevo_email_campaigns ENABLE ROW LEVEL SECURITY;

-- Policy: Lecture pour département Marketing (agents + managers) + Direction + Admin
DROP POLICY IF EXISTS "Allow read for marketing department" ON public.brevo_email_campaigns;
CREATE POLICY "Allow read for marketing department"
  ON public.brevo_email_campaigns
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      LEFT JOIN public.departments d ON d.id = p.department_id
      WHERE p.id = auth.uid()
        AND (
          -- Département Marketing (tous les roles)
          (d.code = 'MKT' AND p.role IN ('agent', 'manager'))
          -- OU roles de supervision globale
          OR p.role IN ('director', 'admin')
        )
    )
  );

-- Policy: Insertion pour Marketing managers + Direction + Admin
DROP POLICY IF EXISTS "Allow insert for marketing managers" ON public.brevo_email_campaigns;
CREATE POLICY "Allow insert for marketing managers"
  ON public.brevo_email_campaigns
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      LEFT JOIN public.departments d ON d.id = p.department_id
      WHERE p.id = auth.uid()
        AND (
          -- Marketing managers uniquement
          (d.code = 'MKT' AND p.role = 'manager')
          -- OU direction/admin
          OR p.role IN ('director', 'admin')
        )
    )
  );

-- Policy: Mise à jour pour Marketing managers + Direction + Admin
DROP POLICY IF EXISTS "Allow update for marketing managers" ON public.brevo_email_campaigns;
CREATE POLICY "Allow update for marketing managers"
  ON public.brevo_email_campaigns
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      LEFT JOIN public.departments d ON d.id = p.department_id
      WHERE p.id = auth.uid()
        AND (
          -- Marketing managers uniquement
          (d.code = 'MKT' AND p.role = 'manager')
          -- OU direction/admin
          OR p.role IN ('director', 'admin')
        )
    )
  );

-- Policy: Suppression pour Direction + Admin uniquement
DROP POLICY IF EXISTS "Allow delete for directors" ON public.brevo_email_campaigns;
CREATE POLICY "Allow delete for directors"
  ON public.brevo_email_campaigns
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('director', 'admin')
    )
  );

-- Activer RLS sur brevo_config
ALTER TABLE public.brevo_config ENABLE ROW LEVEL SECURITY;

-- Policy: Lecture config pour managers + direction + admin
DROP POLICY IF EXISTS "Allow read config for managers" ON public.brevo_config;
CREATE POLICY "Allow read config for managers"
  ON public.brevo_config
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('manager', 'director', 'admin')
    )
  );

-- Policy: Modification config uniquement director + admin
DROP POLICY IF EXISTS "Allow update config for directors" ON public.brevo_config;
CREATE POLICY "Allow update config for directors"
  ON public.brevo_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('director', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('director', 'admin')
    )
  );

-- ============================================================================
-- Fonction de mise à jour automatique du timestamp
-- ============================================================================

-- Trigger pour updated_at sur brevo_email_campaigns
CREATE OR REPLACE FUNCTION public.update_brevo_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_brevo_campaigns_updated_at ON public.brevo_email_campaigns;
CREATE TRIGGER set_brevo_campaigns_updated_at
  BEFORE UPDATE ON public.brevo_email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_brevo_campaigns_updated_at();

-- Trigger pour updated_at sur brevo_config
CREATE OR REPLACE FUNCTION public.update_brevo_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_brevo_config_updated_at ON public.brevo_config;
CREATE TRIGGER set_brevo_config_updated_at
  BEFORE UPDATE ON public.brevo_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_brevo_config_updated_at();

-- ============================================================================
-- Fin de la migration
-- ============================================================================
