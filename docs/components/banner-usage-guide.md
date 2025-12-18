# Guide d'utilisation du composant Banner

## 📋 État actuel

Le composant `Banner` est un composant réutilisable et fermable permettant d'afficher des messages d'information importants dans l'application. Il est intégré dans le système de layout via `PageLayoutWithFilters`.

### Localisation
- **Composant** : `src/components/ui/banner.tsx`
- **Helper** : `BannerCode` pour formater le code dans les bannières
- **Intégration** : `PageLayoutWithFilters` et `PageContent` supportent la prop `banner`

## 🎨 Variantes disponibles

Le composant supporte 4 variantes de style :

| Variante | Usage | Couleur |
|----------|-------|---------|
| `info` | Informations générales, configurations | Bleu |
| `warning` | Avertissements, actions requises | Jaune |
| `success` | Confirmations, succès | Vert |
| `error` | Erreurs, problèmes critiques | Rouge |

## 🔧 Configuration

### Props du composant Banner

```typescript
type BannerProps = {
  title: string;              // Titre de la bannière (requis)
  description?: string;       // Description/sous-titre (optionnel)
  children?: ReactNode;       // Contenu personnalisé (optionnel)
  variant?: BannerVariant;    // 'info' | 'warning' | 'success' | 'error' (défaut: 'info')
  icon?: ReactNode;           // Icône à afficher dans le titre (optionnel)
  dismissible?: boolean;      // Si true, affiche le bouton de fermeture (défaut: true)
  storageKey?: string;        // Clé pour persister l'état dans localStorage (optionnel)
  onDismiss?: () => void;     // Callback appelé à la fermeture (optionnel)
  className?: string;         // Classes CSS supplémentaires (optionnel)
};
```

## 📝 Utilisation

### 1. Utilisation basique (sans persistance)

```tsx
import { Banner } from '@/components/ui/banner';

<Banner
  title="Information importante"
  description="Ceci est un message d'information"
  variant="info"
>
  <p>Contenu de la bannière</p>
</Banner>
```

### 2. Utilisation avec persistance (localStorage)

```tsx
import { Banner, BannerCode } from '@/components/ui/banner';

<Banner
  title="🚀 Configuration requise"
  description="Avant d'utiliser cette fonctionnalité, vous devez :"
  variant="info"
  storageKey="feature-config-banner"  // Clé unique pour cette bannière
>
  <ol className="list-decimal list-inside space-y-2">
    <li>
      <strong>Étape 1</strong> : <BannerCode>commande</BannerCode>
    </li>
    <li>
      <strong>Étape 2</strong> : Configuration
    </li>
  </ol>
</Banner>
```

### 3. Utilisation dans PageLayoutWithFilters

```tsx
import { PageLayoutWithFilters } from '@/components/layout/page';
import { Banner, BannerCode } from '@/components/ui/banner';

export default async function MyPage() {
  return (
    <PageLayoutWithFilters
      sidebar={null}
      header={{
        icon: 'Mail',
        title: 'Ma Page',
        description: 'Description de la page'
      }}
      banner={
        <Banner
          title="⚠️ Attention"
          description="Action requise"
          variant="warning"
          storageKey="my-page-warning-banner"
        >
          <p>Message d'avertissement important</p>
        </Banner>
      }
      card={{
        title: 'Contenu principal',
        // ...
      }}
    >
      {/* Contenu de la page */}
    </PageLayoutWithFilters>
  );
}
```

### 4. Utilisation standalone (sans layout)

```tsx
import { Banner } from '@/components/ui/banner';

export default function MyPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Banner
        title="✅ Succès"
        description="Opération réussie"
        variant="success"
        dismissible={true}
        onDismiss={() => {
          console.log('Bannière fermée');
        }}
      >
        <p>Votre action a été effectuée avec succès.</p>
      </Banner>
      
      {/* Autre contenu */}
    </div>
  );
}
```

## 🎯 Cas d'usage recommandés

### Configuration requise
```tsx
<Banner
  title="🚀 Configuration requise"
  description="Avant d'utiliser cette fonctionnalité :"
  variant="info"
  storageKey="feature-setup-banner"
>
  <ol className="list-decimal list-inside space-y-2">
    <li>Étape de configuration 1</li>
    <li>Étape de configuration 2</li>
  </ol>
</Banner>
```

### Avertissement système
```tsx
<Banner
  title="⚠️ Maintenance programmée"
  description="Le système sera indisponible le..."
  variant="warning"
  storageKey="maintenance-warning-banner"
>
  <p>Date : <strong>15 janvier 2025, 02h00 - 04h00</strong></p>
</Banner>
```

### Message de succès
```tsx
<Banner
  title="✅ Synchronisation réussie"
  description="Les données ont été synchronisées avec succès"
  variant="success"
  dismissible={true}
>
  <p>50 campagnes importées depuis Brevo</p>
</Banner>
```

### Erreur critique
```tsx
<Banner
  title="❌ Erreur de configuration"
  description="Une erreur est survenue"
  variant="error"
  dismissible={false}  // Ne peut pas être fermée pour les erreurs critiques
>
  <p>Veuillez vérifier votre configuration API.</p>
</Banner>
```

## 💾 Persistance avec localStorage

### Comment ça fonctionne

Quand vous fournissez une `storageKey`, la bannière :
1. Vérifie au montage si elle a déjà été fermée (`localStorage.getItem('banner-dismissed-{storageKey}')`)
2. Si fermée, ne s'affiche pas
3. Quand l'utilisateur clique sur X, sauvegarde l'état dans `localStorage`
4. Reste fermée même après rechargement de la page

### Clés de stockage

Le format de la clé est : `banner-dismissed-{storageKey}`

Exemple :
- `storageKey="email-marketing-config"` → `localStorage: "banner-dismissed-email-marketing-config"`

### Réinitialiser une bannière fermée

Pour réafficher une bannière qui a été fermée, supprimez la clé dans localStorage :

```javascript
// Dans la console du navigateur
localStorage.removeItem('banner-dismissed-email-marketing-config-banner');
```

## 🎨 Personnalisation

### Utiliser BannerCode pour formater le code

```tsx
<Banner variant="info">
  <p>
    Configurez <BannerCode variant="info">.env.local</BannerCode> avec votre clé API
  </p>
</Banner>
```

### Ajouter une icône personnalisée

```tsx
import { AlertCircle } from 'lucide-react';

<Banner
  title="Alerte"
  icon={<AlertCircle className="h-5 w-5" />}
  variant="warning"
>
  <p>Message d'alerte</p>
</Banner>
```

### Classes CSS personnalisées

```tsx
<Banner
  title="Bannière personnalisée"
  className="my-custom-class"
>
  <p>Contenu</p>
</Banner>
```

## 📍 Position dans le layout

Quand utilisée avec `PageLayoutWithFilters`, la bannière est affichée dans cet ordre :

1. **Header** (titre de la page)
2. **Banner** ← Ici
3. **KPIs** (statistiques)
4. **Card** (contenu principal)

## 🔄 Exemple complet (page email marketing)

```tsx
import { PageLayoutWithFilters } from '@/components/layout/page';
import { Banner, BannerCode } from '@/components/ui/banner';

export default async function EmailMarketingPage() {
  return (
    <PageLayoutWithFilters
      sidebar={null}
      header={{
        icon: 'Mail',
        title: 'Email Marketing',
        description: 'Gestion des campagnes email Brevo',
        actions: (
          <>
            <SyncCampaignsButton />
            <Button>Nouvelle campagne</Button>
          </>
        )
      }}
      banner={
        <Banner
          title="🚀 Configuration requise"
          description="Avant d'utiliser l'email marketing, vous devez :"
          variant="info"
          storageKey="email-marketing-config-banner"
        >
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong>Appliquer la migration Supabase</strong> :{' '}
              <BannerCode>
                supabase/migrations/2025-12-15-add-brevo-email-marketing.sql
              </BannerCode>
            </li>
            <li>
              <strong>Configurer votre clé API Brevo</strong> dans{' '}
              <BannerCode>.env.local</BannerCode>
            </li>
            <li>
              <strong>Synchroniser les campagnes</strong> depuis Brevo
            </li>
          </ol>
        </Banner>
      }
      kpis={<EmailMarketingKPISection />}
      card={{
        title: 'Campagnes récentes',
        search: <CampaignsSearchBar />,
        quickFilters: <CampaignsQuickFilters />
      }}
    >
      <CampaignsList />
    </PageLayoutWithFilters>
  );
}
```

## ✅ Bonnes pratiques

1. **Utilisez `storageKey`** pour les bannières de configuration qui ne doivent s'afficher qu'une fois
2. **Choisissez la bonne variante** selon le type de message
3. **Rendez les erreurs critiques non-fermables** (`dismissible={false}`)
4. **Utilisez `BannerCode`** pour formater les chemins de fichiers, commandes, etc.
5. **Gardez les messages concis** et actionnables
6. **Utilisez des icônes** pour améliorer la lisibilité (🚀, ⚠️, ✅, ❌)

## 🐛 Dépannage

### La bannière ne s'affiche pas
- Vérifiez que `storageKey` n'est pas déjà dans localStorage
- Vérifiez que `dismissible` n'est pas `false` si vous voulez la fermer
- Vérifiez la console pour les erreurs

### La bannière ne persiste pas
- Assurez-vous que `storageKey` est fourni
- Vérifiez que localStorage est disponible (pas en mode privé)

### Styles incorrects
- Vérifiez que la variante est correcte (`info`, `warning`, `success`, `error`)
- Vérifiez que les classes Tailwind sont compilées








