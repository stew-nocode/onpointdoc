# Analyse d'alignement : Page Entreprise vs Page Ticket

## 📋 Résumé Exécutif

Ce document analyse la structure UI/UX de la page ticket (`/gestion/tickets/[id]`) et compare avec la page entreprise (`/config/companies/[id]`) pour identifier les différences et garantir la cohérence des composants.

## 🔍 Comparaison Détaillée

### 1. Structure Globale

#### ✅ **Similaire**
- Layout en 2 colonnes sur desktop (détails à gauche, timeline à droite)
- Tabs sur mobile/tablet (`< lg` breakpoint)
- Header avec titre, navigation prev/next, bouton Éditer
- Utilisation de `h-[calc(100vh-4rem)]` pour la hauteur
- Grid layout `lg:grid-cols-3` avec détails en `lg:col-span-2` et info card en `lg:col-span-1`

#### ⚠️ **Différences**

| Aspect | Ticket | Entreprise | Impact |
|--------|--------|------------|--------|
| **Wrapper Actions** | `TicketActionsMenu` | Aucun | ❌ Incohérent |
| **Actions spécifiques** | Transférer, Valider | Aucune | ✅ OK (logique métier différente) |
| **Nombre de tabs** | 3 (Détails, Timeline, Commentaires) | 2 (Détails, Historique) | ✅ OK (pas de commentaires pour entreprises) |

### 2. Composants InfoCard

#### **TicketInfoCard** (`src/components/tickets/ticket-info-card.tsx`)
```typescript
// ✅ Server Component (pas de 'use client')
// Structure :
// - Card avec CardHeader + CardTitle "Informations"
// - CardContent avec space-y-4
// - Labels avec text-sm font-medium text-slate-700 dark:text-slate-300
// - Values avec mt-1 text-sm text-slate-600 dark:text-slate-400
// - Badges pour Type, Statut, Priorité
// - Texte simple pour Canal, Produit, Module
```

#### **CompanyInfoCard** (`src/components/companies/company-info-card.tsx`)
```typescript
// ❌ Client Component ('use client') - DOIT ÊTRE SERVER COMPONENT
// Structure similaire mais :
// - Marquée 'use client' alors qu'elle n'a pas besoin d'interactivité
// - Structure identique (Card, CardHeader, CardContent)
// - Labels et values avec mêmes classes
```

**🔴 Action Requise** : Retirer `'use client'` de `CompanyInfoCard` pour cohérence.

### 3. Composants Timeline

#### **TicketTimeline** vs **CompanyTimeline**

| Aspect | Ticket | Entreprise | Statut |
|--------|--------|------------|--------|
| **Structure Card** | Identique | Identique | ✅ OK |
| **Header** | "Timeline des interactions" | "Historique de l'entreprise" | ✅ OK |
| **Empty state** | MessageSquare icon | History icon | ✅ OK |
| **Scroll interne** | `overflow-y-auto` | `overflow-y-auto` | ✅ OK |
| **Structure items** | TicketTimelineItem | CompanyTimelineItem | ✅ OK |

**✅ Cohérent** : Les deux timelines suivent le même pattern.

### 4. Composants DetailTabs

#### **TicketDetailTabs** vs **CompanyDetailTabs**

| Aspect | Ticket | Entreprise | Statut |
|--------|--------|------------|--------|
| **Structure Tabs** | Identique | Identique | ✅ OK |
| **Nombre de tabs** | 3 | 2 | ✅ OK (logique métier) |
| **Badges compteurs** | Présents | Présents | ✅ OK |
| **TabsContent structure** | Card + TicketInfoCard | Card + CompanyInfoCard | ✅ OK |

**✅ Cohérent** : Structure similaire, nombre de tabs adapté au contexte.

### 5. Layout Desktop - Colonne Gauche

#### **Ticket Page**
```tsx
<div className="flex flex-1 flex-col gap-4 overflow-y-auto">
  <div className="grid gap-4 lg:grid-cols-3">
    {/* Card Détails (lg:col-span-2) */}
    <Card className="lg:col-span-2">
      <CardHeader><CardTitle>Détails du ticket</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        - Description (TicketDescription)
        - Contexte client (conditionnel)
        - Durée assistance (conditionnel)
        - Attachments (TicketAttachments, conditionnel)
      </CardContent>
    </Card>
    
    {/* InfoCard (lg:col-span-1) */}
    <TicketInfoCard />
  </div>
  
  {/* Section Commentaires */}
  <CommentsSectionClient />
</div>
```

#### **Company Page**
```tsx
<div className="flex flex-1 flex-col gap-4 overflow-y-auto">
  <div className="grid gap-4 lg:grid-cols-3">
    {/* Card Détails (lg:col-span-2) */}
    <Card className="lg:col-span-2">
      <CardHeader><CardTitle>Détails de l'entreprise</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        - Nom
        - Pays (conditionnel)
        - Point focal (conditionnel)
        - Secteurs (conditionnel, badges)
      </CardContent>
    </Card>
    
    {/* InfoCard (lg:col-span-1) */}
    <CompanyInfoCard />
  </div>
  
  {/* Pas de section commentaires - logique métier différente */}
</div>
```

**✅ Cohérent** : Structure identique, contenu adapté au contexte.

### 6. Layout Desktop - Colonne Droite

#### **Ticket Page**
```tsx
<div className="w-96 flex-shrink-0">
  <TicketTimeline interactions={interactions} ticketTitle={ticket.title} />
</div>
```

#### **Company Page**
```tsx
<div className="w-96 flex-shrink-0">
  <CompanyTimeline history={history} companyName={company.name} />
</div>
```

**✅ Cohérent** : Largeur fixe `w-96`, même structure.

### 7. Header et Navigation

#### **Ticket Page**
```tsx
<div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
  <div className="flex-1">
    <Link href="/gestion/tickets">← Retour à la liste</Link>
    <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{ticket.title}</h1>
  </div>
  
  <div className="flex items-center gap-2">
    <TicketNavigationLink direction="previous" />
    <TicketNavigationLink direction="next" />
    <Link href={`/gestion/tickets/${id}?edit=true`}>
      <Button variant="outline" size="sm"><Edit /> Éditer</Button>
    </Link>
    {canTransfer && <TransferTicketButton />}
    {canValidate && <ValidateTicketButton />}
  </div>
</div>
```

#### **Company Page**
```tsx
<div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
  <div className="flex-1">
    <Link href="/config/companies">← Retour à la liste</Link>
    <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{company.name}</h1>
  </div>
  
  <div className="flex items-center gap-2">
    <CompanyNavigationLink direction="previous" />
    <CompanyNavigationLink direction="next" />
    <Link href={`/config/companies/${id}?edit=true`}>
      <Button variant="outline" size="sm"><Edit /> Éditer</Button>
    </Link>
    {/* Pas d'actions spécifiques - logique métier différente */}
  </div>
</div>
```

**✅ Cohérent** : Structure identique, actions adaptées au contexte.

### 8. Wrapper Actions

#### **Ticket Page**
```tsx
<TicketActionsMenu
  ticket={ticket}
  comments={comments}
  attachments={attachments}
  canEdit={true}
  canArchive={canValidate}
>
  {/* Contenu de la page */}
</TicketActionsMenu>
```

#### **Company Page**
```tsx
{/* Pas de wrapper - contenu directement */}
<div className="flex h-[calc(100vh-4rem)] flex-col gap-4">
  {/* Contenu */}
</div>
```

**❓ Question** : Faut-il un wrapper d'actions pour les entreprises ?

**Analyse** :
- `TicketActionsMenu` gère probablement des actions contextuelles (menu, shortcuts, etc.)
- Pour les entreprises, on pourrait avoir besoin d'actions similaires (export, archiver, etc.)
- **Recommandation** : Créer `CompanyActionsMenu` si des actions contextuelles sont nécessaires, sinon laisser tel quel.

## 🎯 Actions Requises

### 🔴 Priorité Haute

1. **Retirer `'use client'` de `CompanyInfoCard`**
   - Fichier : `src/components/companies/company-info-card.tsx`
   - Raison : Cohérence avec `TicketInfoCard` qui est un Server Component
   - Impact : Amélioration des performances (moins de JS côté client)

### 🟡 Priorité Moyenne

2. **Évaluer la nécessité d'un `CompanyActionsMenu`**
   - Si des actions contextuelles sont prévues (menu, shortcuts, export, etc.)
   - Créer le composant suivant le pattern de `TicketActionsMenu`

### ✅ Déjà Aligné

- ✅ Structure layout 2 colonnes
- ✅ Tabs mobile/tablet
- ✅ Navigation prev/next
- ✅ Header avec même structure
- ✅ Timeline components (structure identique)
- ✅ DetailTabs components (structure identique)
- ✅ Grid layout responsive

## 📊 Matrice de Cohérence

| Composant | Ticket | Entreprise | Statut |
|-----------|--------|------------|--------|
| **Page Layout** | ✅ | ✅ | ✅ Aligné |
| **Header** | ✅ | ✅ | ✅ Aligné |
| **Navigation Links** | ✅ | ✅ | ✅ Aligné |
| **InfoCard** | Server | ❌ Client | 🔴 À corriger |
| **DetailTabs** | ✅ | ✅ | ✅ Aligné |
| **Timeline** | ✅ | ✅ | ✅ Aligné |
| **Actions Menu** | ✅ | ❌ | ⚠️ À évaluer |

## 🔧 Plan d'Action

1. **Immédiat** : Retirer `'use client'` de `CompanyInfoCard`
2. **Court terme** : Évaluer si `CompanyActionsMenu` est nécessaire
3. **Moyen terme** : Si actions menu nécessaire, créer le composant suivant le pattern ticket

## 📝 Notes

- La différence du nombre de tabs (3 vs 2) est justifiée par la logique métier
- L'absence d'actions spécifiques (Transférer, Valider) est normale pour les entreprises
- La structure globale est déjà très cohérente, seulement 1 correction mineure nécessaire

