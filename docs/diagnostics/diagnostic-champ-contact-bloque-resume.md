# Diagnostic Rapide : Champ Contact Bloqué

## 🔍 Résumé

Le champ Contact dans le formulaire de ticket est désactivé si **l'une** de ces conditions est vraie :

1. **`!contacts.length`** → Liste des contacts vide ⚠️ **CAUSE PROBABLE**
2. **`form.watch('channel') === 'Constat Interne'`** → Canal = "Constat Interne" (comportement normal)
3. **`isSubmitting`** → Formulaire en cours de soumission

## 🎯 Causes Probables (par ordre de probabilité)

### 1. Liste des contacts vide (90% probable)

**Fichier** : `src/services/users/server.ts`  
**Fonction** : `listBasicProfiles()`

**Problème** : La requête Supabase avec jointure pourrait échouer silencieusement.

**Symptômes** :
- Le champ Contact est grisé/désactivé
- Le placeholder affiche "Aucun contact disponible"
- Pas d'erreur visible dans la console

**Diagnostic** :
- Ouvrir la console du navigateur (F12)
- Chercher les logs `[listBasicProfiles]`
- Vérifier s'il y a des erreurs Supabase

### 2. Canal "Constat Interne" sélectionné (comportement normal)

Si le canal de contact est "Constat Interne", le champ Contact est automatiquement désactivé (c'est le comportement attendu).

**Vérification** :
- Regarder le champ "Canal de contact"
- Si "Constat Interne" est sélectionné → comportement normal
- Si un autre canal est sélectionné → problème réel

### 3. Formulaire en cours de soumission

Si le formulaire est en cours de soumission (`isSubmitting === true`), tous les champs sont désactivés temporairement.

**Vérification** :
- Le bouton de soumission devrait être désactivé aussi
- C'est temporaire, devrait se réactiver après la soumission

## 🔧 Actions à Effectuer

1. **Ouvrir la console du navigateur** (F12)
2. **Recharger la page** avec le formulaire
3. **Chercher les logs** `[listBasicProfiles]` dans la console
4. **Vérifier le nombre de contacts chargés** : `X contacts chargés`
5. **Vérifier les erreurs** : S'il y a des erreurs, elles seront loggées

## 📋 Informations à Fournir pour le Diagnostic

- Combien de contacts sont chargés ? (voir console)
- Y a-t-il des erreurs dans la console ?
- Quel canal est sélectionné ?
- Le champ est-il toujours bloqué ou seulement dans certains cas ?

---

**Document créé pour diagnostic rapide**

