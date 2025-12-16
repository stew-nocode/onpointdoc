# Guide : Ajouter une Plage IP (CIDR) dans Brevo

## 🎯 Objectif

Ajouter une plage IP au format CIDR dans Brevo pour autoriser toutes les adresses IP d'un réseau spécifique.

## 📋 Votre Plage IP

**Plage IPv6 CIDR :** `2001:42d8:3205:5100::/64`

Cette plage couvre toutes les adresses IP de `2001:42d8:3205:5100:0000:0000:0000:0000` à `2001:42d8:3205:5100:ffff:ffff:ffff:ffff`

## 📝 Étapes pour Ajouter la Plage IP

### 1. Accéder aux Paramètres de Sécurité

1. Connectez-vous à Brevo : https://app.brevo.com
2. Allez dans **Settings** → **Security** → **Authorised IPs**
3. Ou directement : https://app.brevo.com/security/authorised_ips

### 2. Ajouter la Plage IP

Selon la documentation officielle Brevo, vous pouvez ajouter des **plages d'adresses IP** (pas seulement des IPs individuelles).

1. Cliquez sur **"Add IP"** ou **"Add IP Range"** ou **"Ajouter une adresse IP autorisée"**
2. Entrez la plage IP au format CIDR : `2001:42d8:3205:5100::/64`
   - **Format accepté :** CIDR (ex: `2001:42d8:3205:5100::/64`)
   - **Format alternatif :** Si CIDR n'est pas accepté, essayez le format étendu : `2001:42d8:3205:5100:0000:0000:0000:0000/64`
3. Cliquez sur **"Save"** ou **"Add"** ou **"Ajouter une adresse IP autorisée"**

### 3. Support des Plages IP dans Brevo

**✅ Confirmation :** D'après la documentation officielle Brevo :
- Brevo permet d'ajouter des **plages d'adresses IP** (pas seulement des IPs individuelles)
- Vous pouvez saisir une "plage d'adresses IP" dans le champ d'ajout
- Le format CIDR devrait être accepté

**Si le format CIDR n'est pas accepté directement :**

**Option A : Désactiver la restriction IP** (Recommandé pour le développement)
- Voir : `docs/configuration/brevo-disable-ip-restriction.md`

**Option B : Ajouter l'IP spécifique actuelle**
- Trouvez votre IP IPv6 actuelle
- Ajoutez-la individuellement
- ⚠️ Problème : L'IP peut changer

**Option C : Contacter le support Brevo**
- Demander si le format CIDR IPv6 est supporté
- Demander une alternative pour autoriser une plage IP

## 🔍 Vérification

Après avoir ajouté la plage IP :

1. Testez la synchronisation depuis votre application
2. Vérifiez que l'erreur "unrecognised IP address" ne se produit plus
3. Si l'erreur persiste, vérifiez :
   - Que le format CIDR est bien accepté par Brevo
   - Que votre IP actuelle est bien dans la plage `2001:42d8:3205:5100::/64`

## 📊 Comprendre le Format CIDR

**Format :** `2001:42d8:3205:5100::/64`

- **2001:42d8:3205:5100::** = Préfixe réseau (64 premiers bits)
- **/64** = Masque de sous-réseau (64 bits fixes)
- **Résultat :** Autorise toutes les IPs où les 64 premiers bits correspondent

**Exemples d'IPs couvertes :**
- ✅ `2001:42d8:3205:5100:1076:7359:f62d:b3c` (votre IP actuelle)
- ✅ `2001:42d8:3205:5100:0000:0000:0000:0001`
- ✅ `2001:42d8:3205:5100:ffff:ffff:ffff:ffff`
- ❌ `2001:42d8:3205:5101::1` (hors plage)

## ⚠️ Si Brevo ne Supporte pas CIDR

Si Brevo n'accepte pas le format CIDR, vous avez deux options principales :

### Option 1 : Désactiver la Restriction IP (Recommandé)

C'est la solution la plus simple pour le développement :
- Voir le guide : `docs/configuration/brevo-disable-ip-restriction.md`

### Option 2 : Utiliser une IP Fixe

Si vous avez besoin de garder la restriction IP activée :
- Utiliser un VPN avec IP fixe
- Utiliser un serveur dédié avec IP fixe
- Ajouter manuellement votre IP actuelle (mais elle peut changer)

## ✅ Après Configuration

Une fois la plage IP ajoutée (ou la restriction désactivée) :

1. ✅ La synchronisation devrait fonctionner
2. ✅ Plus d'erreur "unrecognised IP address"
3. ✅ Toutes les IPs de votre plage réseau seront autorisées
4. ✅ Les appels API depuis n'importe quelle IP de la plage `2001:42d8:3205:5100::/64` seront acceptés

## 📚 Références Officielles

- **Documentation Brevo IP Security :** https://developers.brevo.com/docs/ip-security
- **Page de configuration :** https://app.brevo.com/security/authorised_ips
- **Guide Brevo (FR) :** https://help.brevo.com/hc/fr/articles/5740111683858-Bloquer-des-adresses-IP-inconnues-pour-la-sécurité-de-l-API

## 🔍 Vérification du Format Accepté

Si vous n'êtes pas sûr du format exact accepté par Brevo :

1. **Essayez d'abord le format CIDR standard :** `2001:42d8:3205:5100::/64`
2. **Si refusé, essayez le format étendu :** `2001:42d8:3205:5100:0000:0000:0000:0000/64`
3. **Si toujours refusé :** Contactez le support Brevo ou désactivez la restriction IP

