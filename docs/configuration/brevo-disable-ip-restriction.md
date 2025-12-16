# Guide : Désactiver la Restriction IP dans Brevo

## 🎯 Objectif

Désactiver la restriction par adresse IP dans Brevo pour éviter les erreurs de synchronisation liées aux IPs non autorisées.

## 📋 Étapes

### 1. Accéder aux Paramètres de Sécurité Brevo

1. Connectez-vous à votre compte Brevo : https://app.brevo.com
2. Allez dans **Settings** (Paramètres) → **Security** (Sécurité)
3. Ou accédez directement : https://app.brevo.com/security/authorised_ips

### 2. Désactiver la Restriction IP

1. Sur la page **Authorised IPs** (IPs Autorisées)
2. Cherchez l'option **"IP Restriction"** ou **"Restrict API access by IP"**
3. **Désactivez** cette option (toggle switch ou checkbox)
4. Confirmez la désactivation si une popup de confirmation apparaît

### 3. Vérifier la Désactivation

- L'option doit être désactivée (grisée ou non cochée)
- Vous ne devriez plus voir de liste d'IPs autorisées obligatoire
- Un message peut indiquer que l'accès API est maintenant ouvert depuis toutes les IPs

## ⚠️ Avertissements de Sécurité

### ⚠️ Important : Risques de Sécurité

**Désactiver la restriction IP réduit la sécurité de votre compte Brevo :**

- ✅ **Avantages :**
  - Plus besoin d'ajouter des IPs manuellement
  - Fonctionne depuis n'importe quelle connexion
  - Idéal pour le développement et les tests

- ❌ **Inconvénients :**
  - Si votre clé API est compromise, elle peut être utilisée depuis n'importe quelle IP
  - Risque de sécurité accru
  - Non recommandé pour les comptes en production avec données sensibles

### 🔒 Recommandations

**Pour le Développement :**
- ✅ Désactiver la restriction IP est acceptable
- Protégez votre clé API avec des variables d'environnement
- Ne commitez jamais votre clé API dans le code

**Pour la Production :**
- ⚠️ **Recommandé :** Garder la restriction IP activée
- Ajouter uniquement les IPs de vos serveurs de production
- Utiliser des IPs fixes pour les serveurs
- Surveiller les accès API dans les logs Brevo

## 🔄 Alternative : Ajouter une Plage IP (CIDR)

Si vous avez une plage IP (format CIDR), vous pouvez l'ajouter dans Brevo :

### Exemple : Plage IPv6 CIDR

**Format :** `2001:42d8:3205:5100::/64`

Cette notation signifie :
- **Préfixe réseau :** `2001:42d8:3205:5100::`
- **Masque :** `/64` (64 premiers bits fixes)
- **Couverture :** Toutes les IPs de cette plage réseau

### Comment l'ajouter dans Brevo

1. Accéder à : https://app.brevo.com/security/authorised_ips
2. Cliquer sur **"Add IP"** ou **"Add IP Range"**
3. Entrer la plage IP : `2001:42d8:3205:5100::/64`
4. Vérifier que Brevo accepte le format CIDR (certaines versions peuvent nécessiter des IPs individuelles)
5. Si le format CIDR n'est pas accepté, vous devrez :
   - Soit désactiver la restriction IP
   - Soit ajouter les IPs individuelles de la plage (non pratique pour /64)

### Autres Options

Si vous ne voulez pas désactiver la restriction IP, vous pouvez :

1. **Utiliser un VPN avec IP fixe**
2. **Utiliser un serveur dédié avec IP fixe**
3. **Ajouter votre IP actuelle** (mais elle changera si vous n'avez pas d'IP fixe)
4. **Ajouter une plage IP CIDR** (si supporté par Brevo)

## ✅ Vérification

Après avoir désactivé la restriction IP :

1. Testez la synchronisation depuis votre application
2. Vérifiez que l'erreur "unrecognised IP address" ne se produit plus
3. Consultez les logs Brevo pour confirmer que les appels API fonctionnent

## 📝 Notes

- La désactivation prend effet immédiatement
- Vous pouvez réactiver la restriction IP à tout moment
- Les IPs précédemment autorisées restent enregistrées si vous réactivez plus tard

