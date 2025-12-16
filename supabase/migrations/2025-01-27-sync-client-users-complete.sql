-- OnpointDoc - Synchronisation des utilisateurs clients depuis CSV
-- Date: 2025-12-08
-- Généré automatiquement depuis scripts/generate-sync-users-sql.mjs
-- Total: 182 utilisateurs uniques

CREATE TEMP TABLE IF NOT EXISTS temp_client_users (
  full_name TEXT NOT NULL,
  job_title TEXT,
  company_name TEXT NOT NULL,
  UNIQUE(full_name, company_name)
);

INSERT INTO temp_client_users (full_name, job_title, company_name) VALUES
  ('KONE Mariam', 'Comptable', 'SIT BTP'),
  ('Sbidje Stephanie', 'Consultant Mission', 'KOFFI & DIABATE'),
  ('Rodrigue KOUAKOU', 'Directeur Administratif et Financier', 'ETS MAB'),
  ('ERIC KOUADIO', 'Comptable', 'FALCON'),
  ('Kouamé Stéphane', 'Contrôleur de Gestion', 'SIE-TRAVAUX'),
  ('Corinne LADJI', 'Assistant(e) Administrative', 'KOFFI & DIABATE'),
  ('Nadia Jocelyn Bouazo', 'Chef Comptable', 'CILAGRI'),
  ('MICHEL TETE', 'Contrôleur de Gestion', 'ECORIGINE'),
  ('KOUAME BRICE', 'Comptable', 'SIE-TRAVAUX'),
  ('KOKONBO PHILOMENE', 'Assistant(e) / Stagiaire', 'AFREX/MEHO CAPITAL'),
  ('Sanankoua Mickaelle', 'Directeur des Ressources Humaines', 'ARIC'),
  ('Joël SIE', 'Comptable', 'ONPOINT'),
  ('COULIBALY SERGES', 'Directeur général', 'S-TEL'),
  ('NADIA CISSE', 'Directeur Administratif et Financier', 'ARIC'),
  ('MARCELLE AHOUSSOU', 'Actionnaire', '2AAZ'),
  ('Fidel Benao', 'Responsable Logistique', 'ARIC'),
  ('Brahima COULIBALY', 'Data Analyst', 'KORI TRANSPORT'),
  ('Diane N''GBLA', 'Comptable & Responsable des Ressources Humaines', 'KOFFI & DIABATE'),
  ('Ismaël KONE', 'Directeur Administratif et Financier', 'ECORIGINE'),
  ('LYTA KENA-RABE', 'Contrôleur de Gestion', 'KOFFI & DIABATE'),
  ('Kramo', 'Chef Comptable', 'ARIC'),
  ('FERDINAND KOUADIO', 'Comptable', 'FIRST CAPITAL'),
  ('MARIE AUDE COFFIE', 'Directeur Administratif et Financier', 'FIRST CAPITAL'),
  ('Jean-Jacques LIKANE', 'Chef Comptable', 'LABOGEM'),
  ('Souleymane CISSE', 'Responsable Administratif & Financier', 'ECORIGINE'),
  ('EHUI Inesse', 'Assistante des Ressources Humaines', 'CILAGRI'),
  ('Raïssa CAMARA', 'Comptable', 'JOEL K PROPERTIES'),
  ('Roselin Tiecoura', 'Informaticien', 'EGBV'),
  ('Amary TCHOTCHE', 'Responsable IT', 'EGBV'),
  ('SYLVIANE KOBRI', 'Consultant DAF', 'FIRST CAPITAL'),
  ('M. SANANKOUA', 'Directeur général', 'ONPOINT'),
  ('FABIEN VATI', 'Business Developper', 'ONPOINT'),
  ('MONSIEUR KOUASSI', 'Gestionnaire de Stock', 'S-TEL'),
  ('Florence OUAYOU', 'Consultant DAF', 'FIRST CAPITAL'),
  ('ZAGBAYOU ANNE', 'Responsable Administratif & Financier', 'EDIPRESSE'),
  ('KOUAME KONAN GUY ROGER', 'Contrôleur de Gestion', 'SIE-TRAVAUX'),
  ('NDADJI Koua Henry Michel', 'Assistant(e) Gestionnaire Stock', 'ARIC'),
  ('Ursula YANGANGOUSSOU', 'Assistant(e) Administrative', 'ONPOINT'),
  ('Tapé Thibault Julien', 'Comptable', 'ARIC'),
  ('Ousseyni Oumarou', 'Directeur Administratif et Financier', 'EJARA'),
  ('KANATE VASSIRIKI', 'Responsable des Marchés', 'LABOGEM'),
  ('Gaelle TOURE', 'Assistant(e) Office Manager', 'ONPOINT'),
  ('Ulrich GBO', 'Informaticien', 'ONPOINT'),
  ('M. SANANKOUA', 'Directeur général', 'ARIC'),
  ('Léa DIABATE', 'Chef Comptable', 'CILAGRI'),
  ('Jean-Jacques KOUASSI', 'Chef Comptable', 'KOFFI & DIABATE'),
  ('Kouadio N''dri Florent Alfred YAO', 'Support IT', 'KOFFI & DIABATE'),
  ('FRANCIS AURELIEN KOUTOU', 'Consultant Comptable', 'S-TEL'),
  ('Martial GNALI', 'Responsable IT', 'ONPOINT'),
  ('OUSSOU Martine', 'Assistante de Direction', 'SIE-TRAVAUX'),
  ('Madame ADJA', 'Directeur Commercial et Marketing', 'EGBV'),
  ('COULIBALY EVE', 'Responsable des Ressources Humaines', 'IVOIRE DEVELOPPEMENT'),
  ('COULIBALY EVE', 'Assistante de Direction', 'SERTEM'),
  ('MINGA Somgbo', 'Directeur Technique Adjoint', 'SIE-TRAVAUX'),
  ('GAHI Lezou Jean', 'Comptable', 'IVOIRE DEVELOPPEMENT'),
  ('ATTOUNGBRE K Gerard (Associete Manager)', 'Consultant', 'CILAGRI'),
  ('ETEKOU ETEKOU JEAN CHRISTIAN', 'Chargé d''Achat et Logistique', 'SIT BTP'),
  ('Serge Tahi', 'Comptable', 'CILAGRI'),
  ('Estelle BOA', 'Assistante de Direction', 'JOEL K PROPERTIES'),
  ('Estelle BOA', 'Comptable', 'CILAGRI'),
  ('Serge AMOUZOU', 'Responsable Achat', 'ECORIGINE'),
  ('Jeronime GBAGUIDI', 'Assistant(e) de direction', 'KOFFI & DIABATE'),
  ('Mme BRISSI', 'Caissier(ère)', 'AFRIC URBA'),
  ('Delphin Zoungrana', 'Chef de Projet', 'ONPOINT'),
  ('HILARION YAO', 'Assistant(e) Comptable', 'EGBV'),
  ('Jean-Claude SAMPENNIE', 'Responsable Administratif & Financier', 'S-TEL'),
  ('Olivier Kacou', 'Responsable Commercial & Marketing', 'ONPOINT'),
  ('CHARLES IPO', 'Assistante de Direction', 'FALCON'),
  ('CHRISTELLE NGBECHE', 'Comptable', '2AAZ'),
  ('Ousseyni Oumarou', 'Directeur Administratif et Financier', 'CILAGRI'),
  ('Aristide Kouadio', 'Comptable', 'CILAGRI'),
  ('CEDRIC EMMANUELLA', 'Autres', 'ONPOINT'),
  ('KALOGO Nabarakissa', 'Chef de Projet', 'S-TEL'),
  ('Léa N''GUESSAN', 'Chef du Département des Affaires Juridiques, du Contentieux et des Ressources Humaines', 'ONPOINT'),
  ('M. Traoré (SAEFI)', 'Consultant', 'KORI TRANSPORT'),
  ('Cabinet SAEFI', 'Consultant Comptable', 'KORI TRANSPORT'),
  ('Patrice KOUAO', 'Comptable', 'KOFFI & DIABATE'),
  ('Sanata Coulibaly', 'Directeur Planification & Production', 'CILAGRI'),
  ('CISSOKO Mamadou', 'Directeur général', 'KORI TRANSPORT'),
  ('Rachel AKA', 'Directeur général', 'JOEL K PROPERTIES'),
  ('OLIVIA NGO', 'Business Developper', 'ONPOINT'),
  ('YAO épouse KOSSONOU N''Guessan Esterne Nattacha', 'Responsable Commercial & Marketing', 'EDIPRESSE'),
  ('OLIVIER GUIZA', 'Responsable Commercial', 'S-TEL'),
  ('Eudes Yapi', 'Contrôleur de Gestion', 'CILAGRI'),
  ('MADAME ALAO', 'Responsable Commercial & Marketing', 'ONPOINT'),
  ('Huberte ZOUNVO', 'Comptable', 'KOFFI & DIABATE'),
  ('Auguste QUENUM', 'Comptable', 'KOFFI & DIABATE'),
  ('HERVE GERARD YOH', 'Directeur d''Exploitation', 'FIRST CAPITAL'),
  ('M. SIE KONAN', 'Autres', 'ONPOINT'),
  ('LYDIE N''GUESSAN', 'Assistant(e) Administrative', 'KOFFI & DIABATE'),
  ('MODESTE PRODJINOTHO', 'Gestionnaire/Responsable  Parc Automobile', 'KOFFI & DIABATE'),
  ('EMMANUEL KOUKPOLOU', 'Autres', 'KOFFI & DIABATE'),
  ('WILLANE DAN', 'Comptable', 'KOFFI & DIABATE'),
  ('SERGE ARIKO', 'Directeur Administratif et Financier', 'CSCTICAO'),
  ('Georges KOFFI', 'Autres', 'KOFFI & DIABATE'),
  ('ERIC ATSE', 'Responsable Commercial & Marketing', 'EGBV'),
  ('Aude KOFFI', 'Comptable', 'OTOMASYS'),
  ('Joël SIE', 'Activation Specialist', 'SIS'),
  ('KOUAME KONAN GUY ROGER', 'Directeur général', 'SIT BTP'),
  ('Jonathan N''DOUBA', 'Gestionnaire/Responsable  Parc Automobile', 'CIP'),
  ('KONE HASSANE', 'Comptable', 'SIS'),
  ('Joël SIE', 'Activation Specialist', 'ARIC'),
  ('Marius Coffi', 'Responsable Commercial', 'EDIPRESSE'),
  ('Léa N''GUESSAN', 'Responsable du Contentieux, des Affaires Juridiques et des Ressources Humaines', 'ONPOINT'),
  ('MONSIEUR ADOU', 'Contrôleur de Gestion', 'EGBV'),
  ('OURAGA Edwige', 'Chef Comptable', 'CIP'),
  ('Bénédicte ZONTODJI', 'Magasinier', 'KORI TRANSPORT'),
  ('Mme SOPPI', 'Assistant(e) Comptable', 'EJARA'),
  ('Léa DIABATE', 'Responsable du Contentieux, des Affaires Juridiques et des Ressources Humaines', 'CILAGRI'),
  ('Jacob N''DJAN', 'Autres', 'KOFFI & DIABATE'),
  ('Mme EBEQUOI', 'Autres', 'ONPOINT'),
  ('ESTHER ALIDJA', 'Assistant(e) de direction', 'ONPOINT'),
  ('Marina NATCHIA', 'Assistant(e) Comptable', 'CIP'),
  ('KOFFI MARIUS', 'Comptable', 'ONPOINT'),
  ('KONATE TAYOU', 'Directeur Administratif et Financier', 'VENUS DISTRIBUTION'),
  ('SERIGNE DIOME', 'Autres', 'ARIC'),
  ('Mme MICHELLE', 'Office Manager', 'ONPOINT'),
  ('DAF Venus', 'Directeur Administratif et Financier', 'VENUS DISTRIBUTION'),
  ('BAKARY NDIAYE', 'Assistante de Direction', 'SERTEM'),
  ('Constant KINDOHO', 'Comptable', 'KOFFI & DIABATE'),
  ('M. ECARE', 'Directeur des Ressources Humaines', 'KORI TRANSPORT'),
  ('SEU ERIC', 'Comptable', 'LABOGEM'),
  ('Natasha DELAGE', 'Responsable Commercial & Marketing', 'KOFFI & DIABATE'),
  ('Marilyne SINAMA', 'Responsable Commercial & Marketing', 'KOFFI & DIABATE'),
  ('MADAME CISSE', 'Directeur Commercial et Marketing', 'EGBV'),
  ('KADIA KOFFI', 'Autres', 'KOFFI & DIABATE'),
  ('Marius KOFFI', 'Comptable', 'KOFFI & DIABATE'),
  ('MONSIEUR KOUASSI', 'Chef Comptable', 'FALCON'),
  ('Thierno DIALLO', 'Architecte', 'KOFFI & DIABATE'),
  ('CHEICK SANGARE', 'Assistant(e) Logisticien', 'KORI TRANSPORT'),
  ('M. SIABA', 'Responsable Achat', 'SIT BTP'),
  ('Matogoma SAGANOGO', 'Comptable', 'ETRAKOM-CI'),
  ('Faiz Deen AMINOU', 'Responsable Administratif & Financier', 'KOFFI & DIABATE'),
  ('Oscar BOKOVO', 'Directeur Technique Adjoint', 'KOFFI & DIABATE'),
  ('BENJAMIN KOFFI', 'Directeur général', 'KOFFI & DIABATE'),
  ('Siaka TIOTE', 'Consultant DAF', 'ONPOINT'),
  ('Yves ASSANVO', 'Gestionnaire de Stock', 'KOFFI & DIABATE'),
  ('M. Martial', 'Directeur général', 'ONPOINT'),
  ('Eric KOFFI', 'Directeur général', 'KOFFI & DIABATE'),
  ('KASSI KABLAN', 'Autres', 'LABOGEM'),
  ('Koné SEYDOU', 'Chef Comptable', 'VENUS DISTRIBUTION'),
  ('Léa N''GUESSAN', 'Responsable Administratif & Financier', 'CILAGRI'),
  ('Abdoulaye Faye', 'Comptable', 'SERTEM'),
  ('Joël SIE', 'Activation Specialist', 'ARTIS HOLDING'),
  ('Mme Traoré', 'Comptable', 'KORI TRANSPORT'),
  ('Narcisse Abaleyty KOFFI', 'Directeur Technique', 'CILAGRI'),
  ('LAURENT IDOHOU', 'Autres', 'KOFFI & DIABATE'),
  ('OUATTARA GNEKITTA', 'Comptable', 'ETRAKOM-CI'),
  ('Mr KOFFI', 'Comptable', 'EJARA'),
  ('Alassane MEITE', 'Responsable IT', 'KOFFI & DIABATE'),
  ('KADIA KOFFI', 'Responsable Stratégie Financière', 'KORI TRANSPORT'),
  ('ISSA DIABATE', 'Directeur général', 'KOFFI & DIABATE'),
  ('DESIRE ERIKA SARAKA', 'Autres', 'KOFFI & DIABATE'),
  ('KOFFI MARIUS', 'Comptable', 'KOFFI & DIABATE'),
  ('MOGOU Stephane', 'Contrôleur de Gestion', 'MATRELEC'),
  ('KOUASSI Jean-Jacques', 'Chef Comptable', 'KOFFI & DIABATE'),
  ('SUPPORT', 'Activation Specialist', 'ONPOINT'),
  ('Mamadou KONE', 'Directeur général', 'ETRAKOM-CI'),
  ('CAMARA Alexandre', 'Comptable', 'ONPOINT'),
  ('Mme Doriane COULIBALY', 'Autres', 'ONPOINT'),
  ('YOUZAN Christelle', 'Comptable', 'JOEL K PROPERTIES'),
  ('Sandrine KOUMAN', 'Directeur Administratif et Financier', 'KORI TRANSPORT'),
  ('ANGUIDOU', 'Comptable', 'KORI TRANSPORT'),
  ('M. DIAKITE', 'Comptable', 'LABOGEM'),
  ('STEPHANE MOGOU', 'Contrôleur de Gestion', 'MATRELEC'),
  ('Koné Mamadou', 'Chef de Projet', 'ONPOINT'),
  ('M.SANANKOUA', 'Directeur général', 'ONPOINT'),
  ('ESTELLE KANGA', 'Gestionnaire de Stock', 'SIS'),
  ('KONE Mamadou', 'Directeur général', 'ETRAKOM-CI'),
  ('MONSIEUR KONE', 'Directeur Administratif et Financier', 'VENUS DISTRIBUTION'),
  ('Oumar KONE', 'Directeur général', 'ETRAKOM-CI'),
  ('Madame FALL', 'Directeur Commercial et Marketing', 'SERTEM'),
  ('M. KOFFI', 'Directeur Administratif et Financier', 'EDIPRESSE'),
  ('Edwige MESSOU', 'Comptable', 'SIAM'),
  ('M. Coulibaly', 'Chef de Projet', 'KORI TRANSPORT'),
  ('SEY ARTHUR', 'Directeur Administratif et Financier', 'ENVAL LABORATOIRE'),
  ('MYRIAM', 'Responsable Commercial & Marketing', 'ONPOINT'),
  ('Joel A', 'Assistant(e) Comptable', 'JOEL K PROPERTIES'),
  ('AKA', 'Assistante de Direction', 'EGBV'),
  ('EGBV', 'Chef Comptable', 'EGBV'),
  ('SUPPORT', 'Activation Specialist', 'CSCTICAO'),
  ('HAMED DOUMBIA', 'Comptable', 'ROCFED')
ON CONFLICT (full_name, company_name) DO NOTHING;

DO $$
DECLARE
  v_user RECORD;
  v_company_id UUID;
  v_existing_user_id UUID;
  v_created_count INTEGER := 0;
  v_updated_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
BEGIN
  FOR v_user IN 
    SELECT DISTINCT 
      t.full_name,
      t.job_title,
      t.company_name,
      c.id as company_id
    FROM temp_client_users t
    LEFT JOIN companies c ON UPPER(TRIM(c.name)) = UPPER(TRIM(t.company_name))
    WHERE t.full_name IS NOT NULL 
      AND TRIM(t.full_name) != ''
      AND t.company_name IS NOT NULL
      AND TRIM(t.company_name) != ''
  LOOP
    IF v_user.company_id IS NULL THEN
      RAISE NOTICE 'Entreprise non trouvée: % (utilisateur: %)', v_user.company_name, v_user.full_name;
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;
    
    SELECT id INTO v_existing_user_id
    FROM profiles
    WHERE UPPER(TRIM(full_name)) = UPPER(TRIM(v_user.full_name))
      AND (company_id = v_user.company_id OR company_id IS NULL)
    LIMIT 1;
    
    IF v_existing_user_id IS NOT NULL THEN
      UPDATE profiles
      SET 
        company_id = COALESCE(company_id, v_user.company_id),
        job_title = COALESCE(job_title, v_user.job_title),
        role = CASE WHEN role IS NULL OR role = 'agent' THEN 'client' ELSE role END,
        is_active = COALESCE(is_active, true)
      WHERE id = v_existing_user_id
        AND (
          company_id IS DISTINCT FROM v_user.company_id OR
          job_title IS DISTINCT FROM v_user.job_title
        );
      
      IF FOUND THEN
        v_updated_count := v_updated_count + 1;
        RAISE NOTICE 'Utilisateur mis à jour: % (entreprise: %)', v_user.full_name, v_user.company_name;
      ELSE
        v_skipped_count := v_skipped_count + 1;
      END IF;
    ELSE
      INSERT INTO profiles (
        full_name,
        job_title,
        company_id,
        role,
        is_active
      )
      VALUES (
        TRIM(v_user.full_name),
        NULLIF(TRIM(v_user.job_title), ''),
        v_user.company_id,
        'client',
        true
      );
      
      v_created_count := v_created_count + 1;
      RAISE NOTICE 'Utilisateur créé: % (entreprise: %, fonction: %)', v_user.full_name, v_user.company_name, v_user.job_title;
    END IF;
  END LOOP;
  
  RAISE NOTICE '=== RÉSUMÉ ===';
  RAISE NOTICE 'Utilisateurs créés: %', v_created_count;
  RAISE NOTICE 'Utilisateurs mis à jour: %', v_updated_count;
  RAISE NOTICE 'Utilisateurs ignorés: %', v_skipped_count;
END $$;

DROP TABLE IF EXISTS temp_client_users;
