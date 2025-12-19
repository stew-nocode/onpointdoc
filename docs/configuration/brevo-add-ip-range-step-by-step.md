# Guide Pas-à-Pas : Ajouter la Plage IP dans Brevo

## 🎯 Objectif

Ajouter la plage IP `2001:42d8:3205:5100::/64` dans Brevo pour autoriser les appels API.

## 📋 Étapes Détaillées

### Étape 1 : Se Connecter à Brevo

1. Ouvrez votre navigateur
2. Allez sur : https://app.brevo.com
3. Connectez-vous avec vos identifiants Brevo

### Étape 2 : Accéder aux Paramètres de Sécurité

**Méthode A : Via le Menu Profil**
1. Cliquez sur votre **profil** en haut à droite (icône utilisateur)
2. Dans le menu déroulant, sélectionnez **"Settings"** ou **"Paramètres"**
3. Dans le menu latéral, cliquez sur **"Security"** ou **"Sécurité"**
4. Cliquez sur **"Authorised IPs"** ou **"IP autorisées"**

**Méthode B : Lien Direct**
- Accédez directement à : https://app.brevo.com/security/authorised_ips

### Étape 3 : Ajouter la Plage IP

1. **Localiser le bouton d'ajout :**
   - Cherchez le bouton **"Add IP"** ou **"Add IP Range"** ou **"Ajouter une adresse IP autorisée"**
   - Il peut être en haut à droite ou au centre de la page

2. **Cliquer sur le bouton :**
   - Un formulaire ou une popup devrait s'ouvrir

3. **Remplir le formulaire :**
   - **Champ "IP Address"** ou **"Adresse IP"** : Entrez `2001:42d8:3205:5100::/64`
   - **Champ "Label"** ou **"Surnom"** (optionnel) : Entrez `Réseau IPv6 Principal` ou `Development Network`
   - **Format attendu :** CIDR IPv6 (ex: `2001:42d8:3205:5100::/64`)

4. **Si le format CIDR n'est pas accepté :**
   - Essayez le format étendu : `2001:42d8:3205:5100:0000:0000:0000:0000/64`
   - Ou contactez le support Brevo

5. **Sauvegarder :**
   - Cliquez sur **"Add"** ou **"Save"** ou **"Ajouter"**
   - Une confirmation devrait apparaître

### Étape 4 : Vérifier l'Ajout

1. **Vérifier dans la liste :**
   - La plage IP `2001:42d8:3205:5100::/64` devrait apparaître dans la liste des IPs autorisées
   - Vérifiez que le statut est **"Active"** ou **"Autorisée"**

2. **Vérifier la restriction IP :**
   - Assurez-vous que l'option **"IP Restriction"** ou **"Restrict API access by IP"** est **activée**
   - Si elle est désactivée, activez-la

### Étape 5 : Tester la Synchronisation

1. Retournez dans votre application OnpointDoc
2. Allez sur la page Email Marketing : `/marketing/email`
3. Cliquez sur le bouton **"Synchroniser"**
4. Vérifiez qu'il n'y a plus d'erreur "unrecognised IP address"

## ✅ Résultat Attendu

Après avoir ajouté la plage IP :

- ✅ La plage `2001:42d8:3205:5100::/64` apparaît dans la liste des IPs autorisées
- ✅ Toutes les IPs de cette plage sont autorisées pour les appels API
- ✅ Votre IP actuelle `2001:42d8:3205:5100:1076:7359:f62d:b3c` est couverte
- ✅ La synchronisation fonctionne sans erreur

## 🔍 Dépannage

### Problème : Le format CIDR n'est pas accepté

**Solution 1 :** Essayez le format étendu
```
2001:42d8:3205:5100:0000:0000:0000:0000/64
```

**Solution 2 :** Désactivez la restriction IP temporairement
- Voir : `docs/configuration/brevo-disable-ip-restriction.md`

**Solution 3 :** Contactez le support Brevo
- Email : contact@brevo.com
- Support : https://account.brevo.com/support

### Problème : Je ne trouve pas la page "Authorised IPs"

**Vérifications :**
1. Assurez-vous d'être connecté avec un compte administrateur
2. Vérifiez que votre compte a accès aux paramètres de sécurité
3. Essayez le lien direct : https://app.brevo.com/security/authorised_ips

### Problème : L'erreur persiste après ajout

**Vérifications :**
1. Vérifiez que votre IP actuelle est bien dans la plage `2001:42d8:3205:5100::/64`
2. Vérifiez que la restriction IP est bien activée
3. Attendez quelques minutes (la propagation peut prendre du temps)
4. Vérifiez les logs serveur pour voir l'IP exacte utilisée

## 📝 Notes Importantes

- **Format CIDR :** Le format `2001:42d8:3205:5100::/64` est la notation standard IPv6 CIDR
- **Propagation :** Les changements peuvent prendre quelques minutes à être effectifs
- **Sécurité :** Cette plage IP couvre un grand nombre d'adresses (2^64), assurez-vous que c'est votre réseau

## 🔗 Liens Utiles

- **Page de configuration :** https://app.brevo.com/security/authorised_ips
- **Documentation Brevo :** https://developers.brevo.com/docs/ip-security
- **Support Brevo :** https://account.brevo.com/support

