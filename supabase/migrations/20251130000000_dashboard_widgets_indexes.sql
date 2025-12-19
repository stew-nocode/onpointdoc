-- Migration: Indexes pour optimiser les requêtes dashboard widgets
-- Date: 2025-11-30
-- Description: Ajoute des index sur les tables dashboard pour améliorer les performances des requêtes

-- Index sur dashboard_role_widgets pour les requêtes par rôle et enabled
-- Utilisé dans getRoleWidgets() : SELECT ... WHERE role = ? AND enabled = true
CREATE INDEX IF NOT EXISTS idx_dashboard_role_widgets_role_enabled 
ON dashboard_role_widgets(role, enabled) 
WHERE enabled = true; -- Index partiel pour ne stocker que les widgets actifs

-- Index sur dashboard_role_widgets pour les requêtes par widget_id
-- Utile pour les recherches inverses et les validations
CREATE INDEX IF NOT EXISTS idx_dashboard_role_widgets_widget_id 
ON dashboard_role_widgets(widget_id);

-- Index sur dashboard_user_preferences pour les requêtes par profile_id
-- Utilisé dans getUserWidgetPreferences() : SELECT ... WHERE profile_id = ? AND visible = false
CREATE INDEX IF NOT EXISTS idx_dashboard_user_preferences_profile_id_visible 
ON dashboard_user_preferences(profile_id, visible) 
WHERE visible = false; -- Index partiel pour ne stocker que les widgets masqués

-- Index sur dashboard_user_preferences pour les requêtes par widget_id
-- Utile pour les recherches inverses (quels utilisateurs ont masqué un widget)
CREATE INDEX IF NOT EXISTS idx_dashboard_user_preferences_widget_id 
ON dashboard_user_preferences(widget_id);

-- Index sur dashboard_configurations pour les requêtes par rôle
-- Utilisé dans getDashboardConfigurationFromDB() : SELECT ... WHERE role = ?
CREATE INDEX IF NOT EXISTS idx_dashboard_configurations_role 
ON dashboard_configurations(role);

-- Commentaires pour documentation
COMMENT ON INDEX idx_dashboard_role_widgets_role_enabled IS 
'Index pour optimiser les requêtes de widgets par rôle et état actif';

COMMENT ON INDEX idx_dashboard_user_preferences_profile_id_visible IS 
'Index pour optimiser les requêtes de préférences utilisateur par profil et widgets masqués';

COMMENT ON INDEX idx_dashboard_configurations_role IS 
'Index pour optimiser les requêtes de configuration dashboard par rôle';


