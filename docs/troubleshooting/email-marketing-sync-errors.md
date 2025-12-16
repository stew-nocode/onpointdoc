# Guide de Diagnostic - Erreurs de Synchronisation Email Marketing

## 🔍 Problèmes Courants et Solutions

### 1. Erreur : "Configuration Brevo manquante"

**Symptôme :** Message d'erreur mentionnant `BREVO_API_KEY`

**Cause :** La clé API Brevo n'est pas configurée dans les variables d'environnement.

**Solution :**
1. Vérifier que `.env.local` contient :
   ```env
   BREVO_API_KEY=votre_cle_api_brevo
   BREVO_API_URL=https://api.brevo.com/v3
   ```
2. Redémarrer le serveur de développement après modification
3. Vérifier que la clé API est valide dans votre compte Brevo

### 2. Erreur : "Non authentifié" ou "Vous n'avez pas les permissions"

**Symptôme :** Message d'erreur d'authentification ou de permissions

**Cause :** 
- L'utilisateur n'est pas connecté
- L'utilisateur n'a pas le rôle `admin` ou `direction`

**Solution :**
1. Vérifier que vous êtes bien connecté
2. Vérifier votre rôle dans la table `profiles` :
   ```sql
   SELECT id, role FROM profiles WHERE auth_uid = 'votre_user_id';
   ```
3. Seuls les rôles `admin` et `direction` peuvent synchroniser

### 3. Erreur : "Erreur API Brevo 401" - Adresse IP non autorisée

**Symptôme :** Message d'erreur mentionnant "unrecognised IP address" ou "IP address"

**Cause :** Brevo a activé la restriction par adresse IP et votre IP n'est pas dans la liste autorisée.

**Solution :**

**Option 1 : Désactiver la restriction IP (Recommandé pour le développement)**
1. Accéder à la page de sécurité Brevo : https://app.brevo.com/security/authorised_ips
2. Désactiver l'option "IP Restriction" ou "Restrict API access by IP"
3. Voir le guide détaillé : `docs/configuration/brevo-disable-ip-restriction.md`

**Option 2 : Ajouter votre adresse IP ou plage IP**
1. Accéder à la page de sécurité Brevo : https://app.brevo.com/security/authorised_ips
2. **Pour une plage IP (CIDR) :** Ajouter `2001:42d8:3205:5100::/64` (voir `docs/configuration/brevo-add-ip-range.md`)
3. **Pour une IP individuelle :**
   - Ajouter votre adresse IP actuelle à la liste des IPs autorisées
   - Si vous êtes en développement local :
     - Utiliser un VPN avec une IP fixe
     - Ajouter votre IP publique (trouvable sur https://whatismyipaddress.com/)
4. Réessayer la synchronisation après avoir ajouté l'IP

**Note :** Si Brevo ne supporte pas le format CIDR, désactiver la restriction IP est la solution la plus simple.

**Note :** 
- Pour le développement, désactiver la restriction IP est plus pratique
- Pour la production, garder la restriction IP activée et ajouter uniquement les IPs des serveurs
- Si votre IP change fréquemment (connexion mobile, DHCP), désactiver la restriction IP est recommandé

### 4. Erreur : "Erreur API Brevo 401" - Clé API invalide

**Symptôme :** Erreur HTTP 401 sans mention d'IP

**Cause :** 
- Clé API Brevo invalide ou expirée
- Clé API n'a pas les permissions nécessaires

**Solution :**
1. Vérifier que la clé API est correcte dans Brevo
2. Vérifier que la clé API a les permissions `Email Campaigns` et `Read`
3. Générer une nouvelle clé API si nécessaire

### 5. Erreur : "Erreur API Brevo 403" - Permissions insuffisantes

### 6. Erreur : "Timeout: l'API Brevo n'a pas répondu"

**Symptôme :** Message de timeout après 30 secondes

**Cause :** 
- L'API Brevo est lente ou surchargée
- Problème de connexion réseau

**Solution :**
1. Vérifier votre connexion internet
2. Réessayer après quelques instants
3. Réduire le nombre de campagnes à synchroniser (paramètre `limit`)

### 7. Erreur : "Erreur lors de la synchronisation de la campagne X"

**Symptôme :** Certaines campagnes échouent mais pas toutes

**Cause :** 
- Données de campagne invalides dans Brevo
- Problème de mapping des données
- Contrainte Supabase non respectée

**Solution :**
1. Consulter les logs serveur pour voir l'erreur exacte
2. Vérifier que la table `brevo_email_campaigns` existe et a la bonne structure
3. Vérifier les contraintes de la table (notamment `brevo_campaign_id` unique)

### 8. Erreur : "Échec de synchronisation globale des campagnes"

**Symptôme :** Aucune campagne n'est synchronisée

**Cause :** 
- Erreur lors de la récupération de la liste des campagnes
- Problème de connexion à l'API Brevo

**Solution :**
1. Vérifier les logs serveur pour l'erreur exacte
2. Tester l'API Brevo manuellement :
   ```bash
   curl -X GET "https://api.brevo.com/v3/emailCampaigns?limit=10" \
     -H "api-key: VOTRE_CLE_API"
   ```
3. Vérifier que le compte Brevo est actif

## 📋 Checklist de Diagnostic

Avant de signaler un problème, vérifiez :

- [ ] La clé API Brevo est configurée dans `.env.local`
- [ ] Le serveur a été redémarré après modification de `.env.local`
- [ ] Vous êtes connecté avec un compte ayant le rôle `admin` ou `direction`
- [ ] La table `brevo_email_campaigns` existe dans Supabase
- [ ] La migration `2025-12-15-add-brevo-email-marketing.sql` a été appliquée
- [ ] Votre connexion internet fonctionne
- [ ] Le compte Brevo est actif et la clé API est valide

## 🔧 Logs à Consulter

### Côté Serveur (Terminal)
Les logs suivants sont affichés dans la console serveur :
- `[SYNC]` : Informations de synchronisation
- `[SYNC ERROR]` : Erreurs de synchronisation
- `[ERROR]` : Erreurs générales

### Côté Client (Console navigateur)
Les erreurs sont également loggées dans la console du navigateur avec le préfixe `[ERROR]`.

## 🆘 Support

Si le problème persiste après avoir vérifié tous les points ci-dessus :

1. Consultez les logs serveur complets
2. Vérifiez les logs Supabase (Dashboard > Logs)
3. Testez l'API Brevo directement avec curl ou Postman
4. Vérifiez que toutes les migrations Supabase sont appliquées

