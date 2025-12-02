# 📝 Note : Widgets par Département

## 🎯 Principe

Chaque département (Support, IT, Marketing, etc.) a ses propres indicateurs de performance et nécessite des widgets spécifiques.

---

## ✅ Widget Support (Implémenté)

**Fichiers** :
- `src/services/dashboard/support-evolution-data.ts`
- `src/components/dashboard/manager/support-evolution-chart.tsx`
- `src/components/dashboard/manager/support-evolution-chart-server.tsx`

**Indicateurs suivis** :
- ⏱️ Temps d'assistance (minutes)
- ✅ Tickets résolus (nombre)
- 📊 Tickets ouverts (charge active)
- 📈 MTTR (Mean Time To Resolution - jours)

**Filtrage** :
- Agents avec `department = 'Support'`
- Filtres locaux : Période, Type de ticket, Vue (équipe/agent)

---

## 🔄 Widget IT (À implémenter plus tard)

**Indicateurs possibles** :
- 🐛 Bugs résolus (nombre)
- ⏱️ Temps de correction moyen
- 📊 Backlog de bugs
- 📈 Taux de résolution de bugs
- 🔧 Temps de développement

**Architecture** :
- Créer `src/services/dashboard/it-evolution-data.ts`
- Créer `src/components/dashboard/manager/it-evolution-chart.tsx`
- Filtrage : `department = 'IT'`

---

## 📋 Autres Départements

Chaque département peut avoir ses propres widgets selon ses besoins spécifiques :
- **Marketing** : Campagnes, conversions, etc.
- **Direction** : KPIs globaux (déjà implémentés)

---

## 💡 Principe de Réutilisation

Bien que chaque département ait des indicateurs différents, la structure peut être réutilisée :
- Service de récupération des données (`*-evolution-data.ts`)
- Composant graphique avec filtres locaux
- Intégration dans le `WIDGET_REGISTRY`

**Important** : Toujours filtrer strictement par département dans les requêtes Supabase.


