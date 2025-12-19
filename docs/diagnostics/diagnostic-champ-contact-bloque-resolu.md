# Diagnostic Résolu : Champ Contact Bloqué

**Date** : 2025-01-27  
**Statut** : ✅ **RÉSOLU**

---

## 🎯 Problème

Le champ Contact dans le formulaire de ticket était désactivé/bloqué.

## 🔍 Cause Identifiée

La syntaxe de jointure Supabase utilisée dans `listBasicProfiles()` causait une erreur :
```typescript
companies:company_id (
  id,
  name
)
```

Cette syntaxe retournait une erreur Supabase vide `{}`, ce qui faisait échouer la requête et retourner un tableau vide de contacts.

## ✅ Solution Appliquée

Remplacement de la jointure par **deux requêtes séparées** :

1. **Première requête** : Récupérer tous les profils avec `company_id`
2. **Deuxième requête** : Récupérer les entreprises correspondantes via `.in('id', companyIds)`
3. **Mapping** : Combiner les résultats ensemble

### Code Corrigé

```typescript
// Première requête : profils
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, full_name, email, company_id')
  .order('full_name', { ascending: true });

// Deuxième requête : entreprises
const companyIds = [...new Set(profiles.map((p) => p.company_id).filter(Boolean))];
const { data: companies } = await supabase
  .from('companies')
  .select('id, name')
  .in('id', companyIds);

// Mapping
const companiesMap = new Map(companies.map((c) => [c.id, c.name]));
```

## 🎉 Résultat

- ✅ Le champ Contact est maintenant **fonctionnel**
- ✅ Les contacts sont chargés avec le format **"Nom - Entreprise"**
- ✅ Gestion d'erreur améliorée avec logs détaillés
- ✅ Performance acceptable (2 requêtes simples)

---

**Problème résolu avec succès !**

