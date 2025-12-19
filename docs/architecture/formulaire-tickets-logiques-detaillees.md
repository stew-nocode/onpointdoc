# Analyse Détaillée : Logiques du Formulaire de Création de Tickets

**Date** : 2025-01-27  
**Source** : Analyse MCP Supabase + MCP Next.js + Code source complet  
**Objectif** : Identifier TOUTES les logiques et interactions du formulaire actuel

---

## 📋 Vue d'Ensemble

### Structure du Formulaire

```
TicketTypeSection (Type + Canal)
  ↓
Titre
  ↓
Entreprise (Combobox)
  ↓
Contact (Combobox)
  ↓
Description (TextEditor)
  ↓
Type de bug (si BUG)
  ↓
Produit (RadioGroup ou hidden)
  ↓
Module / Sous-module / Fonctionnalité (3 Combobox en cascade)
  ↓
Priorité (RadioGroup)
  ↓
Statut (si mode edit + ASSISTANCE)
  ↓
Durée (minutes)
  ↓
Contexte client (Textarea)
  ↓
Pièces jointes (Drag & Drop)
```

---

## 🔄 Logiques de Cascade et Interactions

### 1. **Cascade Produit → Module → Sous-module → Fonctionnalité**

**Localisation** : `src/hooks/forms/use-ticket-form.ts`

#### Logique de Filtrage
```typescript
// Modules filtrés par produit
filteredModules = modules.filter(m => m.product_id === selectedProductId)

// Sous-modules filtrés par module
filteredSubmodules = submodules.filter(sm => sm.module_id === selectedModuleId)

// Fonctionnalités filtrées par sous-module
filteredFeatures = features.filter(f => 
  f.submodule_id === submoduleId && 
  filteredSubmodules.some(sm => sm.id === f.submodule_id)
)
```

#### Logique de Réinitialisation Automatique

**Quand le Produit change** (lignes 247-250) :
```typescript
onValueChange={(v) => {
  form.setValue('productId', v);
  setSelectedProductId(v);
  // ⚠️ Module, sous-module et fonctionnalité sont automatiquement réinitialisés
  // via useEffect dans useTicketForm (lignes 128-136)
}}
```

**Quand le Module change** (lignes 276-281) :
```typescript
onValueChange={(v) => {
  form.setValue('moduleId', v);
  setSelectedModuleId(v);
  form.setValue('submoduleId', '');      // ⚠️ Vidé automatiquement
  form.setValue('featureId', '');        // ⚠️ Vidé automatiquement
}}
```

**Quand le Sous-module change** (lignes 290-293) :
```typescript
onValueChange={(v) => {
  form.setValue('submoduleId', v);
  form.setValue('featureId', '');        // ⚠️ Vidé automatiquement
}}
```

**Effect automatique** (lignes 128-136 de `use-ticket-form.ts`) :
```typescript
useEffect(() => {
  if (filteredModules.length > 0) {
    form.setValue('moduleId', filteredModules[0].id);  // ⚠️ Auto-sélection premier module
    setSelectedModuleId(filteredModules[0].id);
  } else {
    form.setValue('moduleId', '');
    setSelectedModuleId('');
  }
}, [filteredModules, form]);
```

**Impact** : 
- ✅ Changer de produit réinitialise automatiquement module/sous-module/fonctionnalité
- ✅ Le premier module disponible est pré-sélectionné automatiquement

---

### 2. **Logique Type → Bug Type**

**Localisation** : `src/hooks/forms/use-ticket-form.ts` (lignes 120-125)

```typescript
useEffect(() => {
  if (ticketType !== 'BUG') {
    form.setValue('bug_type', null);  // ⚠️ Vidé automatiquement si type ≠ BUG
  }
}, [ticketType, form]);
```

**Affichage conditionnel** (lignes 216-236) :
```typescript
{ticketType === 'BUG' && (
  // Champ "Type de bug" affiché uniquement si type = BUG
)}
```

**Validation Zod** (lignes 44-56 de `ticket.ts`) :
```typescript
.refine((data) => {
  if (data.type === 'BUG') {
    return data.bug_type !== undefined && data.bug_type !== null;
  }
  return true;
}, {
  message: 'Le type de bug est requis pour les tickets BUG',
  path: ['bug_type']
})
```

**Impact** :
- ✅ Si type change de BUG → ASSISTANCE/REQ, `bug_type` est automatiquement vidé
- ✅ Si type = BUG, le champ "Type de bug" apparaît et devient requis

---

### 3. **Logique Canal → Contact / Entreprise**

**Localisation** : `src/components/forms/ticket-form/sections/ticket-type-section.tsx` (lignes 49-55)

#### Quand Canal = "Constat Interne"

```typescript
onValueChange={(v) => {
  form.setValue('channel', v);
  if (v === 'Constat Interne') {
    form.setValue('contactUserId', '');  // ⚠️ Contact vidé automatiquement
  }
}}
```

#### Désactivation du Contact (lignes 188, 190-194)

```typescript
disabled={!contacts.length || form.watch('channel') === 'Constat Interne' || isSubmitting}
// ⚠️ Contact désactivé si canal = "Constat Interne"

{form.watch('channel') === 'Constat Interne' && (
  <p className="text-xs text-slate-500">
    Le champ Contact n'est pas disponible pour un constat interne.
    Vous pouvez sélectionner une entreprise ci-dessus.
  </p>
)}
```

#### Recommandation Entreprise (lignes 150, 165-169)

```typescript
<label>
  Entreprise {form.watch('channel') === 'Constat Interne' && 
    <span className="text-slate-500 text-xs">(recommandé)</span>
  }
</label>

{form.watch('channel') === 'Constat Interne' && (
  <p className="text-xs text-slate-500">
    Recommandé pour un constat interne afin d'associer le ticket à une entreprise.
  </p>
)}
```

**Validation Zod** (lignes 57-71 de `ticket.ts`) :
```typescript
.refine((data) => {
  if (data.channel === 'Constat Interne') {
    return true; // Contact optionnel pour constat interne
  }
  return true; // ⚠️ Contact recommandé mais pas obligatoire même pour autres canaux
}, {
  message: 'Le contact n\'est pas requis pour un constat interne',
  path: ['contactUserId']
})
```

**Impact** :
- ✅ Si canal = "Constat Interne" → Contact vidé et désactivé
- ✅ Si canal = "Constat Interne" → Entreprise devient "recommandée"
- ⚠️ **Aucune validation obligatoire** : Contact n'est pas vraiment requis (juste recommandé dans le label)

---

### 4. **Logique Contact ↔ Entreprise**

**⚠️ POINT CRITIQUE NON IMPLÉMENTÉ** :

Il n'existe **AUCUNE logique** qui :
- Pré-remplit l'entreprise quand un contact est sélectionné
- Lie l'entreprise du contact (`profiles.company_id`) au champ `companyId` du formulaire
- Suggère l'entreprise basée sur le contact sélectionné

**État actuel** :
- `contactUserId` et `companyId` sont **complètement indépendants** dans le formulaire
- L'agent doit sélectionner manuellement l'entreprise même si le contact a une `company_id`

**Dans la base de données** :
- `profiles.company_id` existe (liaison profil → entreprise)
- `tickets.contact_user_id` → `profiles.id` → `profiles.company_id` existe
- Mais cette relation n'est **pas utilisée dans le formulaire**

**Dans la lecture des tickets** (`listTicketsPaginated`) :
- La relation est utilisée pour l'**affichage** uniquement
- `contact_user.company_id` est extrait pour transformer les données (ligne 380-386)
- Mais pas pour pré-remplir le formulaire

---

### 5. **Logique Produit Unique**

**Localisation** : `src/components/forms/ticket-form.tsx` (lignes 240-266)

```typescript
{products.length === 1 ? (
  <input type="hidden" {...productField} />  // ⚠️ Produit caché si seul
) : (
  <RadioGroup>  // ⚠️ RadioGroup affiché si plusieurs produits
    {/* ... */}
  </RadioGroup>
)}
```

**Effect automatique** (`use-ticket-form.ts`, lignes 107-117) :
```typescript
useEffect(() => {
  if (products.length === 1 && products[0]?.id) {
    const singleProductId = products[0].id;
    form.setValue('productId', singleProductId);  // ⚠️ Auto-sélection si seul produit
    setSelectedProductId(singleProductId);
  }
}, [products, form]);
```

**Impact** :
- ✅ Si un seul produit → champ caché, valeur automatique
- ✅ Si plusieurs produits → RadioGroup affiché

---

### 6. **Valeurs par Défaut**

**Localisation** : `src/components/forms/ticket-form/utils/reset-form.ts` + `use-ticket-form.ts`

#### Valeurs par défaut (reset-form.ts)
```typescript
{
  title: '',
  description: '',
  type: 'ASSISTANCE',              // ⚠️ ASSISTANCE par défaut
  channel: 'Whatsapp',             // ⚠️ Whatsapp par défaut
  productId: products[0]?.id ?? '',
  moduleId: '',
  submoduleId: '',
  featureId: '',
  customerContext: '',
  priority: 'Medium',              // ⚠️ Medium par défaut
  contactUserId: contacts[0]?.id ?? '',  // ⚠️ Premier contact par défaut
  companyId: '',                   // ⚠️ Vide par défaut
  bug_type: null
}
```

#### Valeurs par défaut (use-ticket-form.ts, lignes 61-75)
```typescript
{
  type: initialValues?.type ?? 'ASSISTANCE',
  channel: initialValues?.channel ?? 'Whatsapp',
  productId: initialValues?.productId ?? products[0]?.id ?? '',
  moduleId: initialValues?.moduleId ?? modules[0]?.id ?? '',  // ⚠️ Premier module
  contactUserId: initialValues?.contactUserId ?? contacts[0]?.id ?? '',
  priority: initialValues?.priority ?? 'Medium',
  // ...
}
```

**Impact** :
- ✅ Type par défaut : ASSISTANCE
- ✅ Canal par défaut : Whatsapp
- ✅ Priorité par défaut : Medium
- ✅ Premier contact pré-sélectionné (si disponible)
- ✅ Premier produit pré-sélectionné (si disponible)
- ✅ Premier module pré-sélectionné (si disponible)
- ⚠️ **Entreprise vide par défaut** (pas de pré-sélection)

---

### 7. **Réinitialisation Après Soumission**

**Localisation** : `src/components/forms/ticket-form.tsx` (lignes 108-116, 121-129)

```typescript
const resetFormAfterSubmit = () => {
  const defaultValues = getDefaultFormValues(products, contacts);
  form.reset({
    ...defaultValues,
    moduleId: modules[0]?.id ?? ''  // ⚠️ Premier module réinitialisé
  });
  setSelectedProductId(defaultValues.productId ?? '');
  setSelectedModuleId(modules[0]?.id ?? '');
};

const handleSubmit = form.handleSubmit(async (values) => {
  await onSubmit(values, selectedFiles);
  clearFiles();  // ⚠️ Fichiers vidés
  
  if (mode === 'create') {
    resetFormAfterSubmit();  // ⚠️ Réinitialisation uniquement en mode création
  }
});
```

**Impact** :
- ✅ Après création réussie → formulaire réinitialisé aux valeurs par défaut
- ✅ Fichiers supprimés de la liste
- ✅ Mode édition → pas de réinitialisation

---

### 8. **Logique Durée (Minutes)**

**Localisation** : `src/components/forms/ticket-form.tsx` (lignes 341-365)

```typescript
<div className="grid gap-2">
  <label>Durée de l'assistance (minutes)</label>
  <input
    type="number"
    min={0}
    {...form.register('durationMinutes', { valueAsNumber: true })}
  />
  <p className="text-xs text-slate-500">
    Obligatoire pour les tickets Assistance.  // ⚠️ Texte informatif uniquement
  </p>
</div>
```

**Validation Zod** :
```typescript
durationMinutes: z.union([z.number().int().min(0), z.null()]).optional()
// ⚠️ Optionnel dans le schéma, pas de validation conditionnelle par type
```

**Impact** :
- ⚠️ **Texte dit "obligatoire"** mais validation Zod dit **optionnel**
- ⚠️ Pas de validation conditionnelle selon le type de ticket
- ⚠️ Potentielle incohérence entre UI et validation

---

### 9. **Logique Mode Création vs Édition**

**Localisation** : `src/components/forms/ticket-form.tsx`

#### Différences Mode Édition

**Statut affiché** (lignes 318-339) :
```typescript
{mode === 'edit' && ticketType === 'ASSISTANCE' && (
  // ⚠️ Champ Statut affiché uniquement en mode édition pour ASSISTANCE
  <Combobox
    options={ASSISTANCE_LOCAL_STATUSES.map(...)}
    // ...
  />
)}
```

**Bouton de soumission** (lignes 484-488) :
```typescript
<Button disabled={isSubmitting} type="submit">
  {isSubmitting 
    ? (mode === 'edit' ? 'Enregistrement...' : 'Création...')
    : (mode === 'edit' ? 'Enregistrer les modifications' : 'Créer le ticket')
  }
</Button>
```

**Réinitialisation** (ligne 126) :
```typescript
if (mode === 'create') {
  resetFormAfterSubmit();  // ⚠️ Réinitialisation uniquement en création
}
```

**Impact** :
- ✅ Mode édition : Statut affiché pour ASSISTANCE
- ✅ Mode création : Statut non affiché (défini automatiquement)
- ✅ Pas de réinitialisation après édition

---

### 10. **Gestion des Fichiers**

**Localisation** : `src/components/forms/ticket-form.tsx` (lignes 67-81, 379-481)

#### Contraintes
```typescript
useFileUpload({
  acceptTypes: ['image/*', 'application/pdf'],  // ⚠️ Images et PDF uniquement
  maxSizeBytes: 20 * 1024 * 1024  // ⚠️ 20 MB max par fichier
})
```

#### Fonctionnalités
- ✅ Drag & Drop
- ✅ Prévisualisation des images
- ✅ Suppression individuelle des fichiers
- ✅ Affichage de la taille des fichiers
- ✅ Upload séparé après création du ticket (dans `CreateTicketDialog`)

#### Upload Après Création (lignes 52-61 de `create-ticket-dialog.tsx`)
```typescript
if (files && files.length) {
  const { uploadTicketAttachments } = await import('@/services/tickets/attachments.client');
  await uploadTicketAttachments(id, files);
  // ⚠️ Upload séparé, ne bloque pas la création si échoue
}
```

**Impact** :
- ✅ Ticket créé même si upload échoue
- ✅ Toast d'avertissement si upload échoue

---

### 11. **Logique de Validation Zod**

**Localisation** : `src/lib/validators/ticket.ts`

#### Validations Conditionnelles

**Bug Type requis si BUG** (lignes 44-56) :
```typescript
.refine((data) => {
  if (data.type === 'BUG') {
    return data.bug_type !== undefined && data.bug_type !== null;
  }
  return true;
}, {
  message: 'Le type de bug est requis pour les tickets BUG',
  path: ['bug_type']
})
```

**Contact optionnel si Constat Interne** (lignes 57-71) :
```typescript
.refine((data) => {
  if (data.channel === 'Constat Interne') {
    return true; // Contact optionnel
  }
  return true; // ⚠️ Contact recommandé mais pas obligatoire même pour autres canaux
}, {
  message: 'Le contact n\'est pas requis pour un constat interne',
  path: ['contactUserId']
})
```

**⚠️ INCOHÉRENCE IDENTIFIÉE** :
- Label UI dit "Contact *" (requis) si canal ≠ "Constat Interne" (ligne 175)
- Mais validation Zod dit **optionnel** même pour les autres canaux
- **Pas de validation réelle** qui rend le contact obligatoire

---

### 12. **Logique de Création JIRA**

**Localisation** : `src/services/tickets/index.ts` (lignes 56-114)

#### Workflow Automatique

```typescript
// 1. Créer le ticket dans Supabase
const { data } = await supabase.from('tickets').insert({...}).select('id').single();

// 2. Si type = BUG ou REQ → Créer automatiquement dans JIRA
if (payload.type === 'BUG' || payload.type === 'REQ') {
  const jiraResponse = await createJiraIssue({...});
  
  if (jiraResponse.success) {
    // ⚠️ Mettre à jour le ticket avec jira_issue_key
    await supabase.from('tickets').update({
      jira_issue_key: jiraResponse.jiraIssueKey,
      origin: 'supabase'
    });
    
    // ⚠️ Enregistrer dans jira_sync
    await supabase.from('jira_sync').upsert({...});
  } else {
    // ⚠️ Ticket créé dans Supabase même si JIRA échoue
    // Erreur enregistrée dans jira_sync pour diagnostic
  }
}
```

**Impact** :
- ✅ Ticket ASSISTANCE : Créé uniquement dans Supabase
- ✅ Ticket BUG/REQ : Créé dans Supabase + JIRA automatiquement
- ✅ Si JIRA échoue : Ticket Supabase reste, erreur enregistrée

---

## 🔍 Points Critiques Non Implémentés

### 1. **Aucune Liaison Contact → Entreprise**

**État actuel** :
- ❌ Quand un contact est sélectionné, l'entreprise n'est pas pré-remplie
- ❌ Même si `profiles.company_id` existe, elle n'est pas utilisée
- ❌ L'agent doit sélectionner manuellement l'entreprise

**Impact pour Solution 1** :
- ✅ **Opportunité** : Implémenter la logique de pré-remplissage
- ✅ **Opportunité** : Ajouter une logique pour suggérer l'entreprise du contact
- ✅ **Opportunité** : Permettre de surcharger si plusieurs entreprises concernées

### 2. **Validation Contact Non Réelle**

**État actuel** :
- ❌ Label dit "Contact *" (requis) mais validation Zod dit optionnel
- ❌ Pas de validation qui rend vraiment le contact obligatoire

**Impact pour Solution 1** :
- ⚠️ À clarifier : Le contact doit-il être obligatoire pour les canaux normaux ?
- ⚠️ À clarifier : Validation à renforcer si nécessaire

### 3. **Durée Optionnelle**

**État actuel** :
- ❌ Texte dit "Obligatoire pour les tickets Assistance"
- ❌ Validation Zod dit optionnel
- ❌ Pas de validation conditionnelle selon type

**Impact pour Solution 1** :
- ⚠️ À clarifier : Durée vraiment obligatoire pour ASSISTANCE ?
- ⚠️ À implémenter : Validation conditionnelle si nécessaire

---

## 📝 Implications pour Solution 1

### Modifications Nécessaires

1. **Ajouter logique Contact → Entreprise** :
   - Quand contact sélectionné → pré-remplir `companyId` depuis `profiles.company_id`
   - Permettre de modifier/surcharger si plusieurs entreprises

2. **Intégrer la Portée du Ticket** :
   - Ajouter RadioGroup pour sélectionner la portée (single/all/multiple)
   - Conditionner les champs selon la portée sélectionnée

3. **Gérer le MultiSelect** :
   - Créer composant MultiSelect pour plusieurs entreprises
   - Gérer l'ajout/suppression d'entreprises

4. **Respecter les Cascades Existantes** :
   - Conserver la logique Produit → Module → Sous-module → Fonctionnalité
   - Conserver la logique Type → Bug Type
   - Conserver la logique Canal → Contact

5. **Mettre à Jour les Validations** :
   - Ajouter validation pour la portée
   - Renforcer validation contact si nécessaire
   - Ajouter validation durée pour ASSISTANCE si nécessaire

---

## ✅ Résumé des Logiques Identifiées

| Logique | Localisation | Description |
|---------|--------------|-------------|
| Cascade Produit→Module→Sous-module→Fonctionnalité | `use-ticket-form.ts` | Filtrage et réinitialisation automatique |
| Type → Bug Type | `use-ticket-form.ts` | Vidage automatique si type ≠ BUG |
| Canal → Contact | `ticket-type-section.tsx` | Contact vidé si "Constat Interne" |
| Canal → Entreprise | `ticket-form.tsx` | Entreprise recommandée si "Constat Interne" |
| Produit Unique | `ticket-form.tsx` | Champ caché si un seul produit |
| Valeurs par défaut | `reset-form.ts` | ASSISTANCE, Whatsapp, Medium, premier contact |
| Réinitialisation après création | `ticket-form.tsx` | Formulaire réinitialisé en mode création |
| Mode Création vs Édition | `ticket-form.tsx` | Statut affiché uniquement en édition pour ASSISTANCE |
| Création JIRA automatique | `tickets/index.ts` | BUG/REQ créés automatiquement dans JIRA |
| Upload fichiers séparé | `create-ticket-dialog.tsx` | Upload après création, ne bloque pas |

| **Logique Manquante** | Impact |
|----------------------|--------|
| Contact → Entreprise | ⚠️ Aucune logique de pré-remplissage |
| Validation contact réel | ⚠️ Label dit requis mais validation optionnel |
| Validation durée ASSISTANCE | ⚠️ Texte dit obligatoire mais validation optionnel |

---

**Document généré via analyse complète MCP Supabase + MCP Next.js + Code source**

