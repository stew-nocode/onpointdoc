# Plan d'Import des Données - OnpointDoc

## 📋 Vue d'ensemble

Cette approche table par table permet d'importer proprement les données en respectant les dépendances (foreign keys) et en gérant les mappings nécessaires.

## ✅ Avantages de cette approche

1. **Contrôle total** : Chaque table est importée séparément avec validation
2. **Gestion des dépendances** : Ordre d'import respectant les foreign keys
3. **Mapping flexible** : Transformation des données (JIRA → Supabase) à chaque étape
4. **Traçabilité** : Logs détaillés pour chaque import
5. **Réversibilité** : Possibilité de nettoyer et réimporter si nécessaire

## 📊 Ordre d'import recommandé

### Phase 1 : Données de référence ✅
- ✅ **Companies** (entreprises) - Importé avec IDs JIRA
  - 35+ entreprises importées avec mapping JIRA
  - Script : `import-companies-complete.js`

### Phase 2 : Structure produit ✅
- ✅ **Products** (OBC, SNI, Credit Factory) - Déjà présents
- ✅ **Modules** (avec product_id) - Déjà présents
- ✅ **Submodules** (avec module_id) - Importés pour Finance, RH, Opérations, CRM, Projets, Paiement
  - Scripts : `import-submodules-{module}.js`
- ⏳ **Features** (avec submodule_id) - À importer si nécessaire

### Phase 3 : Utilisateurs et contacts ✅ (En cours)
- ✅ **Profiles - Utilisateurs internes Support OBC**
  - Script : `import-users-support.js`
  - 10+ utilisateurs Support avec affectations modules
- ✅ **Profiles - Contacts clients** (25+ entreprises)
  - Scripts : `import-contacts-{company}.js`
  - Entreprises importées : ARIC, 2AAZ, AFRIC URBA, CIP, CSCTICAO, CILAGRI, ECORIGINE, EDIPRESSE, EGBV, EJARA, ENVAL, ETRAKOM, ETS MAB, FALCON, FIRST CAPITAL, IVOIRE DEVELOPPEMENT, JOEL K PROPERTIES, KOFFI & DIABATE, KORI TRANSPORT, LABOGEM, OTOMASYS, ROCFED, S-TEL, SIE-TRAVAUX, SIS, SIT BTP, VENUS DISTRIBUTION
  - Champs : email, full_name, role='client', company_id, job_title
- ⏳ **Profiles - Utilisateurs ONPOINT AFRICA GROUP**
  - Script : `import-onpoint-africa-group-users.js`
  - Gère utilisateurs internes (éditeur) + clients (externe)
  - En attente des données CSV

### Phase 4 : Tickets principaux ⏳
- ⏳ **Tickets**
  - Mapping complexe : JIRA → Supabase
  - Dépendances : contact_user_id, product_id, module_id, created_by
  - Gestion : jira_issue_key, origin='jira', status mapping
  - Script template : `import-tickets-template.js`

### Phase 5 : Relations et historique ⏳
- ⏳ **jira_sync** (métadonnées de synchronisation)
- ⏳ **ticket_status_history** (historique des statuts)
- ⏳ **ticket_comments** (commentaires depuis JIRA)

## 🔧 Scripts d'import disponibles

### Structure standardisée

Tous les scripts suivent une structure cohérente :
- ✅ Gestion des variables d'environnement (`.env.local`)
- ✅ Connexion Supabase avec service role
- ✅ Détection automatique des doublons
- ✅ Gestion d'erreurs individuelle
- ✅ Rapports détaillés (succès, ignorés, erreurs)
- ✅ Support des mises à jour (upsert)

### Scripts par catégorie

#### Entreprises
- `import-companies.js` - Import initial
- `import-companies-complete.js` - Import complet avec IDs JIRA

#### Structure produit
- `import-submodules-finance.js`
- `import-submodules-rh.js`
- `import-submodules-operations.js`
- `import-submodules-crm.js`
- `import-submodules-projets.js`
- `import-submodules-paiement.js`

#### Utilisateurs internes
- `import-users-support.js` - Équipe Support OBC
- `import-onpoint-africa-group-users.js` - Employés ONPOINT AFRICA GROUP (interne + client)

#### Contacts clients
- `import-contacts-{company}.js` - 25+ scripts par entreprise
- `update-cilagri-job-titles.js` - Mise à jour fonctions CILAGRI

#### Tickets (template)
- `import-tickets-template.js` - Template pour import tickets JIRA

## 📝 Format des données attendu

### Pour les contacts clients
```javascript
{
  "Nom Complet": "John Doe",
  "Email": "john@company.com",
  "Fonction": "Chef comptable" // Optionnel
}
```

### Pour les utilisateurs internes ONPOINT AFRICA GROUP
```javascript
{
  "Nom Complet": "Jane Smith",
  "Email": "jane@onpoint.africa",
  "Rôle": "agent" | "manager" | "admin" | "director" | "client",
  "Département": "Support" | "IT" | "Marketing", // Requis pour internes
  "Fonction": "Chef de projet", // Optionnel
  "Modules": "Finance, RH", // Noms séparés par virgule
  "Mot de passe": "TempPass123!" // Optionnel, généré si absent
}
```

## 🎯 Prochaines étapes

1. ⏳ **Import ONPOINT AFRICA GROUP** : Fournir CSV des employés
2. ⏳ **Import tickets JIRA** : Utiliser template et mapping documenté
3. ⏳ **Validation** : Vérifier cohérence des données importées
4. ⏳ **Tests** : Valider les relations et RLS après import

## 📚 Documentation complémentaire

- `scripts/README-IMPORT.md` - Guide d'utilisation des scripts
- `docs/import/GESTION-FONCTIONS-UTILISATEURS.md` - Gestion du champ `job_title`
- `docs/workflows/MAPPING-JIRA-SUPABASE.md` - Mapping complet JIRA ↔ Supabase

---

**Note** : Cette approche est idéale pour un import initial propre et maîtrisé. Une fois les données importées, la synchronisation continue se fera via N8N.

