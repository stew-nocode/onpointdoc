# Diagnostic : Champ Contact Bloqué dans le Formulaire de Ticket

**Date** : 2025-01-27  
**Problème** : Le champ Contact semble bloqué/désactivé dans le formulaire de création de ticket

---

## 🔍 Analyse du Code

### Condition de Désactivation (Ligne 165 de `ticket-form.tsx`)

```typescript
disabled={!contacts.length || form.watch('channel') === 'Constat Interne' || isSubmitting}
```

Le champ Contact est désactivé si **l'une** de ces conditions est vraie :
1. ✅ `!contacts.length` → Pas de contacts disponibles
2. ✅ `form.watch('channel') === 'Constat Interne'` → Canal = "Constat Interne"
3. ✅ `isSubmitting` → Formulaire en cours de soumission

---

## 🎯 Causes Probables

### 1. **Liste des Contacts Vide** ⚠️ **PROBABLE**

**Fichier** : `src/services/users/server.ts`  
**Fonction** : `listBasicProfiles()`

La fonction a été modifiée pour inclure les informations d'entreprise :

```typescript
.select(`
  id,
  full_name,
  email,
  company_id,
  companies:company_id (
    id,
    name
  )
`)
```

**Problème potentiel** :
- La syntaxe de jointure Supabase pourrait échouer silencieusement
- Le `catch` retourne `[]` (tableau vide) → masque l'erreur
- Si la requête échoue, `contacts.length === 0` → champ désactivé

**Vérification** :
```typescript
} catch {
  return []; // ❌ Retourne tableau vide sans logger l'erreur
}
```

### 2. **Erreur de Requête Supabase**

La requête avec jointure pourrait échouer si :
- RLS (Row Level Security) bloque l'accès aux entreprises
- Syntaxe de jointure incorrecte
- Relation `company_id` non définie correctement

### 3. **Canal "Constat Interne" Sélectionné**

Si le canal est "Constat Interne", le champ Contact est automatiquement désactivé (comportement attendu).

### 4. **Problème de Mapping des Données**

Le mapping après la jointure pourrait être incorrect :

```typescript
const company = Array.isArray(p.companies) ? p.companies[0] : p.companies;
company_name: company?.name ?? null,
```

Si `p.companies` est `null` ou a une structure différente, `company_name` sera `null`.

---

## 🔧 Diagnostic à Effectuer

### Test 1 : Vérifier si la liste des contacts est vide

```typescript
// Dans le composant TicketForm ou CreateTicketDialog
console.log('Contacts chargés:', contacts.length);
console.log('Contacts:', contacts);
```

### Test 2 : Vérifier les erreurs dans la console

- Ouvrir la console du navigateur
- Vérifier s'il y a des erreurs liées à Supabase
- Vérifier les logs réseau pour la requête

### Test 3 : Vérifier le canal sélectionné

```typescript
console.log('Canal actuel:', form.watch('channel'));
```

### Test 4 : Vérifier si `listBasicProfiles()` retourne des données

Ajouter des logs dans `src/services/users/server.ts` :

```typescript
export async function listBasicProfiles(): Promise<BasicProfile[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        company_id,
        companies:company_id (
          id,
          name
        )
      `)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('[listBasicProfiles] Erreur Supabase:', error);
      throw error;
    }

    console.log('[listBasicProfiles] Profils récupérés:', profiles?.length || 0);
    
    const mapped = (profiles || []).map((p: any) => {
      console.log('[listBasicProfiles] Mapping profil:', p.id, 'company:', p.companies);
      const company = Array.isArray(p.companies) ? p.companies[0] : p.companies;
      return {
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        company_id: p.company_id,
        company_name: company?.name ?? null,
      };
    });
    
    console.log('[listBasicProfiles] Résultat final:', mapped.length, 'contacts');
    return mapped;
  } catch (error) {
    console.error('[listBasicProfiles] Erreur capturée:', error);
    return [];
  }
}
```

---

## 📋 Checklist de Diagnostic

- [ ] Vérifier `contacts.length` dans la console
- [ ] Vérifier les erreurs dans la console du navigateur
- [ ] Vérifier le canal sélectionné (`form.watch('channel')`)
- [ ] Vérifier si `isSubmitting` est `true`
- [ ] Ajouter des logs dans `listBasicProfiles()`
- [ ] Vérifier la requête Supabase dans les logs réseau
- [ ] Tester la requête Supabase directement avec SQL

---

## 🎯 Solution Probable

**Hypothèse principale** : La requête Supabase avec jointure échoue silencieusement, retournant un tableau vide.

**Solution** :
1. Améliorer la gestion d'erreur dans `listBasicProfiles()`
2. Logger les erreurs pour diagnostic
3. Tester la requête Supabase directement
4. Vérifier les RLS policies si nécessaire

---

**Document créé pour diagnostic - À compléter après tests**

