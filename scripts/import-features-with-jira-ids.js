/**
 * Script d'import des fonctionnalités avec leurs Jira ID
 * 
 * Ce script importe les fonctionnalités depuis un tableau de données
 * et les lie aux sous-modules appropriés.
 * 
 * @requires dotenv
 * @requires @supabase/supabase-js
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Charger .env.local en priorité si présent
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch {}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

/**
 * Données des fonctionnalités à importer
 * Format: { nom, jiraId, sousModule }
 */
const featuresData = [
  // Première série (déjà importée)
  { nom: 'Paramétrage', jiraId: 10923, sousModule: 'Comptabilité analytique' },
  { nom: 'Gestion de temps', jiraId: 10953, sousModule: 'Gestion employé' },
  { nom: 'Livres comptables', jiraId: 10921, sousModule: 'Comptabilité Générale' },
  { nom: 'Shipping et facturation', jiraId: 10873, sousModule: 'Achat' },
  { nom: 'Contrat employé', jiraId: 10952, sousModule: 'Gestion employé' },
  { nom: 'Banque', jiraId: 10930, sousModule: 'Trésorerie' },
  { nom: 'Achat', jiraId: 10871, sousModule: 'Achat' },
  { nom: 'Traitements comptables', jiraId: 10920, sousModule: 'Comptabilité Générale' },
  { nom: 'Document/Personnel', jiraId: 10962, sousModule: 'Documents' },
  { nom: 'Dettes antérieures', jiraId: 10918, sousModule: 'Comptabilité Générale' },
  { nom: 'Facturation', jiraId: 10878, sousModule: 'Achat' },
  { nom: 'Demande d\'Achat', jiraId: 10877, sousModule: 'Achat' },
  { nom: 'Audit', jiraId: 10922, sousModule: 'Comptabilité Générale' },
  { nom: 'Général', jiraId: 10972, sousModule: 'Activités commerciales' },
  { nom: 'Document/Admin', jiraId: 10961, sousModule: 'Documents' },
  // Deuxième série (nouvelles fonctionnalités)
  { nom: 'Rapports', jiraId: 10884, sousModule: 'Vente' },
  { nom: 'Mouvement de stock', jiraId: 10887, sousModule: 'Gestion de stock' },
  { nom: 'Analyser mes immobilisations', jiraId: 10875, sousModule: 'Immobilisations' },
  { nom: 'Commande', jiraId: 10879, sousModule: 'Achat' },
  { nom: 'Gestion des débours', jiraId: 10882, sousModule: 'Vente' },
  { nom: 'Comptabilité', jiraId: 10959, sousModule: 'Comptabilité Générale' },
  { nom: 'Calcul de salaire', jiraId: 10957, sousModule: 'Salaire' },
  { nom: 'Caisse', jiraId: 10915, sousModule: 'Comptabilité Générale' },
  { nom: 'Règlement de salaire', jiraId: 10960, sousModule: 'Salaire' },
  { nom: 'Cycle de vente', jiraId: 10885, sousModule: 'Vente' },
  { nom: 'Déclarations', jiraId: 10933, sousModule: 'Impôts et taxes' },
  { nom: 'Paramétrage société', jiraId: 10949, sousModule: 'Paramétrage' }, // Lié à Paramétrage par logique
  { nom: 'Exécution', jiraId: 10946, sousModule: 'Centre de paiement' },
  { nom: 'Paramétrage paie', jiraId: 10950, sousModule: 'Paramétrage' },
  { nom: 'Gestion de prêts', jiraId: 10956, sousModule: 'Gestion employé' },
  // Troisième série (nouvelles fonctionnalités)
  { nom: 'Offre BTP', jiraId: 10970, sousModule: 'Offres' },
  { nom: 'Décaissement', jiraId: 10937, sousModule: 'Budget' },
  { nom: 'Congé', jiraId: 10958, sousModule: 'Salaire' },
  { nom: 'Salaire', jiraId: 10963, sousModule: 'Salaire' },
  { nom: 'Mission', jiraId: 10954, sousModule: 'Gestion employé' },
  { nom: 'Facture tiers', jiraId: 10917, sousModule: 'Comptabilité Générale' }
];

/**
 * Récupère l'ID d'un sous-module par son nom
 * @param {string} submoduleName - Nom du sous-module
 * @returns {Promise<string|null>} UUID du sous-module ou null si non trouvé
 */
async function getSubmoduleId(submoduleName) {
  if (!submoduleName) return null;

  const { data, error } = await supabase
    .from('submodules')
    .select('id')
    .eq('name', submoduleName)
    .maybeSingle();

  if (error) {
    console.error(`   ❌ Erreur lors de la recherche du sous-module "${submoduleName}":`, error.message);
    return null;
  }

  return data?.id || null;
}

/**
 * Importe ou met à jour une fonctionnalité
 * @param {Object} featureData - Données de la fonctionnalité
 * @returns {Promise<Object>} Résultat de l'import
 */
async function importFeature(featureData) {
  const { nom, jiraId, sousModule } = featureData;

  console.log(`\n📦 ${nom} (Jira ID: ${jiraId})`);

  // Récupérer le sous-module si spécifié
  let submoduleId = null;
  if (sousModule) {
    submoduleId = await getSubmoduleId(sousModule);
    if (submoduleId) {
      console.log(`   ✅ Sous-module trouvé: ${sousModule}`);
    } else {
      console.warn(`   ⚠️  Sous-module "${sousModule}" non trouvé, fonctionnalité créée sans sous-module`);
    }
  } else {
    console.log(`   ℹ️  Aucun sous-module spécifié`);
  }

  // Vérifier si la fonctionnalité existe déjà (par nom ou Jira ID)
  const { data: existing } = await supabase
    .from('features')
    .select('id, name, jira_feature_id, submodule_id')
    .or(`name.eq.${nom},jira_feature_id.eq.${jiraId}`)
    .maybeSingle();

  if (existing) {
    console.log(`   🔄 Fonctionnalité existante trouvée (ID: ${existing.id})`);
    
    const updateData = {
      name: nom,
      jira_feature_id: jiraId,
      submodule_id: submoduleId || existing.submodule_id
    };

    const { error: updateError } = await supabase
      .from('features')
      .update(updateData)
      .eq('id', existing.id);

    if (updateError) {
      throw new Error(`Erreur mise à jour: ${updateError.message}`);
    }

    console.log(`   ✅ Fonctionnalité mise à jour`);
    return { id: existing.id, action: 'updated' };
  } else {
    // Créer la fonctionnalité
    if (!submoduleId) {
      throw new Error(`Impossible de créer la fonctionnalité "${nom}" : sous-module requis mais introuvable${sousModule ? ` ("${sousModule}")` : ''}`);
    }

    const { data: newFeature, error: insertError } = await supabase
      .from('features')
      .insert({
        name: nom,
        jira_feature_id: jiraId,
        submodule_id: submoduleId
      })
      .select('id')
      .single();

    if (insertError) {
      throw new Error(`Erreur création: ${insertError.message}`);
    }

    console.log(`   ✅ Fonctionnalité créée (ID: ${newFeature.id})`);
    return { id: newFeature.id, action: 'created' };
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Import des fonctionnalités avec Jira ID\n');
  console.log(`📊 ${featuresData.length} fonctionnalité(s) à traiter\n`);

  const results = {
    created: 0,
    updated: 0,
    errors: 0
  };

  for (const featureData of featuresData) {
    try {
      const result = await importFeature(featureData);
      if (result.action === 'created') {
        results.created++;
      } else {
        results.updated++;
      }
    } catch (error) {
      console.error(`   ❌ Erreur: ${error.message}`);
      results.errors++;
    }
  }

  console.log('\n📊 Résumé:');
  console.log(`   ✅ Créées: ${results.created}`);
  console.log(`   🔄 Mises à jour: ${results.updated}`);
  console.log(`   ❌ Erreurs: ${results.errors}`);
  console.log('\n✨ Import terminé!');
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

