# 📧 Intégration Brevo Email Marketing

## ✅ Ce qui a été créé

### 1. **Migration Supabase**
📁 `supabase/migrations/2025-12-15-add-brevo-email-marketing.sql`

**Tables créées** :
- `brevo_email_campaigns` - Stockage des campagnes avec statistiques
- `brevo_config` - Configuration API Brevo (singleton)

**Fonctionnalités** :
- RLS policies pour roles `marketing`, `manager`, `direction`, `admin`
- Triggers `updated_at` automatiques
- Contraintes de validation (rates 0-100%, counts >= 0)
- Index pour performance (status, sent_at, campaign_id)

### 2. **Types TypeScript**
📁 `src/types/brevo.ts` + exports dans `src/types/index.ts`

**20+ types couvrant** :
- Types Supabase (Row, Insert, Update)
- Types API Brevo (responses, statistics)
- Types application (payloads, filters, results)

### 3. **Validateurs Zod**
📁 `src/lib/validators/brevo.ts`

**12+ schémas** :
- Configuration (`brevoConfigSchema`)
- Campagnes (`createEmailCampaignSchema`, `campaignFiltersSchema`)
- Emails transactionnels (`sendTransactionalEmailSchema`)
- Contacts (`brevoContactSchema`)
- Webhooks (`brevoWebhookEventSchema`)

### 4. **Services Brevo**
📁 `src/services/brevo/`

**Fichiers créés** :
- `client.ts` - Client API Brevo (wrapper REST API v3)
- `campaigns.ts` - Gestion campagnes + sync Brevo ↔ Supabase
- `index.ts` - Exports

**Fonctionnalités** :
- Récupération campagnes avec filtres/pagination
- Création/modification/suppression campagnes
- Synchronisation bidirectionnelle Brevo ↔ Supabase
- Envoi emails transactionnels
- Gestion contacts et templates
- Statistiques agrégées

### 5. **API Routes**
📁 `src/app/api/brevo/`

**Routes créées** :
- `GET /api/brevo/campaigns` - Liste campagnes (filtres + pagination)
- `POST /api/brevo/campaigns` - Créer campagne
- `POST /api/brevo/campaigns/sync` - Synchroniser depuis Brevo
- `GET /api/brevo/config` - Récupérer config
- `PATCH /api/brevo/config` - Mettre à jour config

**Sécurité** :
- Authentification obligatoire
- Permissions role-based
- Validation Zod des inputs
- Gestion erreurs centralisée

### 6. **Navigation UI**
**Fichiers modifiés** :
- `src/lib/constants/navigation.ts` - Ajout segment `marketing`
- `src/components/layout/navigation-menu.tsx` - Support sous-menu Marketing
- `src/components/layout/sidebar.tsx` - État `marketingOpen`

**Fichier créé** :
- `src/components/layout/marketing-submenu.tsx` - Sous-menu Email/Ads

### 7. **Page Email Marketing**
📁 `src/app/(main)/marketing/email/page.tsx`

**Fonctionnalités** :
- Affichage statistiques globales (placeholder)
- Liste campagnes avec loader
- Instructions de configuration
- Boutons Sync et Nouvelle campagne

---

## 🚀 PROCHAINES ÉTAPES

### **Étape 1 : Appliquer la migration Supabase** (CRITIQUE)

**Option A - Via Dashboard** (Recommandé) :
1. Allez sur https://supabase.com/dashboard/project/xjcttqaiplnoalolebls/sql/new
2. Copiez tout le contenu de `supabase/migrations/2025-12-15-add-brevo-email-marketing.sql`
3. Collez dans le SQL Editor
4. Cliquez sur "Run"

**Option B - Via CLI** :
```bash
cd "c:\Projects\OnpointDoc"
npx supabase link --project-ref xjcttqaiplnoalolebls
npx supabase db push
```

### **Étape 2 : Régénérer les types TypeScript**

```bash
# Avec SUPABASE_ACCESS_TOKEN configuré
npx supabase gen types typescript --project-id xjcttqaiplnoalolebls > src/types/database.types.ts
```

### **Étape 3 : Configurer Brevo**

1. **Récupérez votre clé API Brevo** :
   - Allez sur https://app.brevo.com/settings/keys/api
   - Copiez votre clé (commence par `xkeysib-`)

2. **Créez/modifiez `.env.local`** :
```env
# Ajoutez ces lignes
BREVO_API_KEY=xkeysib-votre-cle-api-ici
BREVO_DEFAULT_SENDER_NAME=Onpoint Business Cloud
BREVO_DEFAULT_SENDER_EMAIL=noreply@votre-domaine.com
```

3. **Redémarrez le serveur dev** :
```bash
npm run dev
```

### **Étape 4 : Tester l'intégration**

1. Connectez-vous avec un compte `marketing`, `manager`, `direction` ou `admin`
2. Allez sur `/marketing/email`
3. Cliquez sur "Synchroniser" pour importer vos campagnes depuis Brevo

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                       │
│                                                              │
│  /marketing/email  →  Affichage campagnes + stats          │
│         ↓                                                    │
│  /api/brevo/*  →  API Routes (auth + validation)           │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                   SERVICES LAYER                            │
│                                                              │
│  src/services/brevo/                                        │
│  ├── client.ts       →  Brevo API v3 wrapper               │
│  └── campaigns.ts    →  Sync + CRUD operations             │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
┌───────▼────────┐                   ┌───────▼────────┐
│   SUPABASE     │                   │  BREVO API v3  │
│                │                   │                │
│  • campaigns   │ ◄─── Sync ────►  │  • Campaigns   │
│  • config      │                   │  • Statistics  │
└────────────────┘                   └────────────────┘
```

---

## 🔐 Permissions

| Rôle | Lecture campagnes | Création | Modification | Sync | Config |
|------|-------------------|----------|--------------|------|--------|
| **marketing** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **manager** | ✅ | ✅ | ✅ | ❌ | ✅ (lecture) |
| **direction** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **admin** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 📦 Fichiers créés/modifiés

### **Nouveaux fichiers** (17)
```
supabase/migrations/
└── 2025-12-15-add-brevo-email-marketing.sql

src/types/
└── brevo.ts

src/lib/validators/
└── brevo.ts

src/services/brevo/
├── client.ts
├── campaigns.ts
└── index.ts

src/app/api/brevo/
├── campaigns/
│   ├── route.ts
│   └── sync/route.ts
└── config/route.ts

src/components/layout/
└── marketing-submenu.tsx

src/app/(main)/marketing/email/
└── page.tsx

.env.brevo.example
BREVO-INTEGRATION-README.md (ce fichier)
```

### **Fichiers modifiés** (3)
```
src/types/index.ts                           (+22 lignes - exports Brevo)
src/lib/constants/navigation.ts              (+5 lignes - segment marketing)
src/components/layout/navigation-menu.tsx    (+40 lignes - sous-menu)
src/components/layout/sidebar.tsx            (+2 lignes - état marketing)
```

---

## 🧪 Test rapide

Une fois la migration appliquée et la clé API configurée :

```bash
# Dans un terminal
curl -X GET "http://localhost:3000/api/brevo/campaigns?limit=5" \
  -H "Cookie: your-session-cookie"

# Ou dans le navigateur (après connexion)
# https://localhost:3000/marketing/email
```

---

## 🎯 Prochaines fonctionnalités (Phase 2)

- [ ] **UI avancée** : Tableau campagnes avec filtres
- [ ] **Création campagne** : Formulaire complet
- [ ] **Statistiques détaillées** : Graphiques performance
- [ ] **Webhooks Brevo** : Sync automatique events
- [ ] **Gestion contacts** : Import/export
- [ ] **Templates** : Bibliothèque templates
- [ ] **Ads campaigns** : LinkedIn + Google Ads

---

## ❓ Besoin d'aide ?

### Erreur "Cannot find project ref"
```bash
# Lier le projet Supabase
npx supabase link --project-ref xjcttqaiplnoalolebls
```

### Erreur "BREVO_API_KEY not configured"
Vérifiez que `.env.local` contient bien :
```env
BREVO_API_KEY=xkeysib-votre-cle-ici
```

### Types TypeScript non à jour
```bash
# Régénérer les types après migration
npx supabase gen types typescript --project-id xjcttqaiplnoalolebls > src/types/database.types.ts
```

---

## 📚 Documentation Brevo

- API Documentation : https://developers.brevo.com/reference
- Dashboard : https://app.brevo.com
- Support : https://help.brevo.com

---

**Créé le** : 2025-12-15
**Version** : 1.0
**Status** : ✅ Code complet - En attente de configuration
