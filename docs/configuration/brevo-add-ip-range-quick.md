# ⚡ Guide Rapide : Ajouter la Plage IP dans Brevo

## 🎯 Action Immédiate

### Option 1 : Utiliser le Script Automatique

```bash
npm run brevo:add-ip
```

Ce script va :
- ✅ Copier la plage IP dans votre presse-papiers
- ✅ Ouvrir la page Brevo dans votre navigateur
- ✅ Vous donner les instructions

### Option 2 : Ajout Manuel

1. **Ouvrir la page Brevo :** https://app.brevo.com/security/authorised_ips
2. **Cliquer sur "Add IP"** ou **"Ajouter une adresse IP autorisée"**
3. **Coller cette plage IP :** `2001:42d8:3205:5100::/64`
4. **Cliquer sur "Add"** ou **"Save"**

## 📋 Plage IP à Ajouter

```
2001:42d8:3205:5100::/64
```

**Cette plage couvre :**
- Votre IP actuelle : `2001:42d8:3205:5100:1076:7359:f62d:b3c` ✅
- Toutes les IPs de votre réseau IPv6

## ✅ Vérification

Après ajout :
1. La plage IP apparaît dans la liste des IPs autorisées
2. Testez la synchronisation : `/marketing/email` → Bouton "Synchroniser"
3. Plus d'erreur "unrecognised IP address" ✅

## 🔗 Liens

- **Page de configuration :** https://app.brevo.com/security/authorised_ips
- **Guide détaillé :** `docs/configuration/brevo-add-ip-range-step-by-step.md`

