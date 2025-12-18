# Analyse : Recherche dans l'Historique Entreprise

## ✅ **OUI, C'EST TRÈS FACILE À IMPLÉMENTER !**

---

## 📊 Analyse de Faisabilité

### 1. **Structure Actuelle**

**Composant** : `CompanyTimeline` (Client Component)
- ✅ Déjà un composant client (`'use client'`)
- ✅ Reçoit `history: CompanyHistoryItem[]` en props
- ✅ Affiche une liste simple avec `.map()`

**Données** : `CompanyHistoryItem[]`
```typescript
{
  id: string;
  type: 'ticket' | 'user' | 'modification';
  title: string;              // ✅ Recherchable
  description?: string;       // ✅ Recherchable
  timestamp: string;
  user?: {
    full_name: string;        // ✅ Recherchable
  };
  metadata?: Record<string, any>; // ✅ Recherchable (ticket_type, status, etc.)
}
```

**Limite actuelle** : 100 items maximum
- ✅ Parfait pour filtrage côté client (pas de problème de performance)

---

## 🎯 Options d'Implémentation

### **Option 1 : Recherche Simple (Recommandée) ⭐**

**Complexité** : ⭐ Très facile (15-20 minutes)

**Fonctionnalités** :
- Input de recherche dans le header
- Recherche dans : `title`, `description`, `user.full_name`
- Filtrage en temps réel (debounce optionnel)
- Compteur de résultats

**Avantages** :
- ✅ Implémentation rapide
- ✅ Pas de modification backend
- ✅ Performance OK (< 100 items)
- ✅ Pattern déjà utilisé dans le projet (`TicketsSearchBar`)

**Code estimé** :
- 1 composant : `CompanyHistorySearch` (~50 lignes)
- Modification : `CompanyTimeline` (+20 lignes)
- Total : ~70 lignes

---

### **Option 2 : Recherche Avancée**

**Complexité** : ⭐⭐ Facile (30-45 minutes)

**Fonctionnalités** :
- Recherche simple (Option 1) +
- Filtres par type (`ticket`, `user`, `comment`, etc.)
- Filtres par période (7 jours, 30 jours, etc.)
- Recherche dans métadonnées (statut, type de ticket, etc.)

**Avantages** :
- ✅ Plus puissant
- ✅ Meilleure UX pour historiques longs

**Code estimé** :
- 1 composant : `CompanyHistorySearchAdvanced` (~150 lignes)
- Modification : `CompanyTimeline` (+30 lignes)
- Total : ~180 lignes

---

### **Option 3 : Recherche Full-Text (Backend)**

**Complexité** : ⭐⭐⭐ Moyenne (2-3 heures)

**Fonctionnalités** :
- Recherche côté serveur avec PostgreSQL `tsvector`
- Support recherche avancée (AND, OR, phrases)
- Pagination des résultats
- Performance optimale pour > 1000 items

**Avantages** :
- ✅ Scalable
- ✅ Recherche puissante

**Inconvénients** :
- ❌ Plus complexe
- ❌ Nécessite migration DB
- ❌ Overkill pour < 100 items

---

## 🎨 Design Proposé

### **Option 1 : Recherche Simple**

```
┌─────────────────────────────────────────┐
│ Historique de l'entreprise        [🔍]  │
├─────────────────────────────────────────┤
│ [Rechercher...]                         │
│                                         │
│ 📋 15 résultats trouvés                 │
├─────────────────────────────────────────┤
│ 📅 Ticket #123 : Bug module RH         │
│    Ticket BUG - En cours                │
│    Par Jean Dupont                      │
│    Il y a 2 jours                      │
│                                         │
│ 👤 Marie Martin                         │
│    Utilisateur ajouté à l'entreprise   │
│    Il y a 5 jours                      │
└─────────────────────────────────────────┘
```

**Composants ShadCN à utiliser** :
- `Input` : pour la recherche
- `Search` icon (lucide-react)
- Badge pour le compteur

---

## 🔧 Implémentation Technique

### **Pattern à Suivre**

Le projet utilise déjà ce pattern dans :
- `TicketsSearchBar` → Recherche dans les tickets
- `CompaniesSearchBar` → Recherche dans les entreprises

**Structure** :
1. Composant client avec `useState` pour le terme de recherche
2. Fonction de filtrage `filterHistoryItems()`
3. Affichage conditionnel du compteur
4. Debounce optionnel (300ms) pour performance

---

## 📝 Code Exemple (Option 1)

### **Composant `CompanyHistorySearch`**

```typescript
'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/ui/input';
import { Badge } from '@/ui/badge';
import type { CompanyHistoryItem } from '@/services/companies/company-history';

type CompanyHistorySearchProps = {
  history: CompanyHistoryItem[];
  onFiltered: (filtered: CompanyHistoryItem[]) => void;
};

export function CompanyHistorySearch({ 
  history, 
  onFiltered 
}: CompanyHistorySearchProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) {
      onFiltered(history);
      return history;
    }

    const term = searchTerm.toLowerCase();
    const filtered = history.filter((item) => {
      // Recherche dans title
      if (item.title.toLowerCase().includes(term)) return true;
      
      // Recherche dans description
      if (item.description?.toLowerCase().includes(term)) return true;
      
      // Recherche dans nom utilisateur
      if (item.user?.full_name.toLowerCase().includes(term)) return true;
      
      // Recherche dans métadonnées (ticket_type, status, etc.)
      if (item.metadata) {
        const metadataStr = JSON.stringify(item.metadata).toLowerCase();
        if (metadataStr.includes(term)) return true;
      }
      
      return false;
    });

    onFiltered(filtered);
    return filtered;
  }, [history, searchTerm, onFiltered]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="text"
          placeholder="Rechercher dans l'historique..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>
      {searchTerm && (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <Badge variant="secondary">
            {filteredHistory.length} résultat{filteredHistory.length > 1 ? 's' : ''}
          </Badge>
        </div>
      )}
    </div>
  );
}
```

### **Modification `CompanyTimeline`**

```typescript
'use client';

import { useState } from 'react';
import { CompanyHistorySearch } from './company-history-search';
// ... autres imports

export function CompanyTimeline({ history, companyName }: CompanyTimelineProps) {
  const [filteredHistory, setFilteredHistory] = useState(history);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-shrink-0 border-b space-y-3">
        <CardTitle className="text-lg">Historique de l'entreprise</CardTitle>
        <CompanyHistorySearch 
          history={history} 
          onFiltered={setFilteredHistory} 
        />
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto pt-4">
        {filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500 dark:text-slate-400">
            <History className="mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">
              {history.length === 0 
                ? "Aucun historique pour le moment"
                : "Aucun résultat trouvé"}
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredHistory.map((item) => (
              <CompanyTimelineItem key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## ⚡ Performance

### **Filtrage Côté Client**

**Avantages** :
- ✅ Instantané (< 1ms pour 100 items)
- ✅ Pas de requête réseau
- ✅ Fonctionne offline

**Limites** :
- ⚠️ Si > 500 items, considérer pagination
- ⚠️ Si > 1000 items, considérer Option 3 (backend)

**Actuellement** : Limite à 100 items → **Parfait pour filtrage client**

---

## 🎯 Recommandation

### **Option 1 : Recherche Simple** ⭐

**Pourquoi** :
- ✅ Très facile à implémenter (15-20 min)
- ✅ Suffisant pour < 100 items
- ✅ Pattern déjà utilisé dans le projet
- ✅ UX immédiate et intuitive

**Quand passer à Option 2** :
- Si besoin de filtres avancés (type, période)
- Si utilisateurs demandent plus de fonctionnalités

**Quand passer à Option 3** :
- Si limite > 1000 items
- Si recherche devient lente côté client

---

## ✅ Conclusion

**OUI, c'est très facile à implémenter !**

- ✅ Composant client existant
- ✅ Données déjà chargées
- ✅ Pattern déjà utilisé dans le projet
- ✅ Performance OK (< 100 items)
- ✅ ~70 lignes de code

**Temps estimé** : 15-20 minutes

**Souhaitez-vous que je l'implémente maintenant ?** 🚀

