# Création utilisateur Marketing - Résumé

**Date** : 2025-01-23  
**Statut** : ✅ Données créées (Auth à créer)

## Utilisateur créé

- **Email** : `marketing.demo@onpointdoc.com`
- **Nom** : Sophie Marketing
- **Rôle** : agent
- **Département** : Marketing
- **Profil ID** : `b33c6f8b-bd3a-44a1-b514-b0fe25bc54a2`
- **Auth UID temporaire** : `e531d062-a086-439b-b945-848dfb9a638e`

⚠️ **Important** : L'utilisateur Auth n'a pas encore été créé. Pour permettre la connexion, vous devez :

1. **Option 1** : Créer l'utilisateur Auth via l'interface Supabase Auth
   - Aller dans Supabase Dashboard > Authentication > Users
   - Créer un nouvel utilisateur avec l'email `marketing.demo@onpointdoc.com`
   - Copier l'UUID de l'utilisateur créé
   - Mettre à jour le profil avec cet UUID :
     ```sql
     UPDATE profiles 
     SET auth_uid = '<UUID_DE_L_UTILISATEUR_AUTH>' 
     WHERE email = 'marketing.demo@onpointdoc.com';
     ```

2. **Option 2** : Utiliser le script JavaScript
   ```bash
   # Configurer les variables d'environnement dans .env.local
   NEXT_PUBLIC_SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE=...
   
   # Exécuter le script
   node scripts/seed-marketing-user.js
   ```

## Tâches créées (5)

### Tâches à faire (3)
1. **Analyser les performances des campagnes email**
   - ID: `16ebbb93-45c2-4178-80f8-1c7b98bb3fcf`
   - Date: Demain
   - Durée estimée: 3.5h
   - Statut: A_faire

2. **Préparer le rapport mensuel marketing**
   - ID: `3f25aaf5-09bd-4b95-a1ae-7192dcc2264a`
   - Date: Dans 2 jours
   - Durée estimée: 4h
   - Statut: A_faire

3. **Organiser la campagne de lancement produit**
   - ID: `f70adf07-131b-441f-860d-3d579420cda2`
   - Date: Dans 5 jours
   - Durée estimée: 8h
   - Statut: A_faire

### Tâches terminées (2)
4. **Mettre à jour le site web avec les nouveaux contenus**
   - ID: `7e589065-1d63-4a40-9d7e-5b48e32bc57e`
   - Date: Il y a 2 jours
   - Durée estimée: 6h
   - Durée réelle: 7.5h (dépassement de 1.5h)
   - Statut: Termine

5. **Créer les visuels pour les réseaux sociaux**
   - ID: `eb405b62-5ca5-4d42-91b3-6487868e6f8d`
   - Date: Hier
   - Durée estimée: 2h
   - Durée réelle: 2.5h (dépassement de 0.5h)
   - Statut: Termine

## Activités créées (5)

### Activités planifiées (3)
1. **Réunion de revue stratégique marketing**
   - ID: `57331a35-49bd-4db4-bae8-8e89e0df74a0`
   - Type: Revue
   - Date: Dans 3 jours (10:00 - 12:00)
   - Durée estimée: 2h
   - Statut: Planifie

2. **Atelier de brainstorming nouveaux produits**
   - ID: `5e252729-3fa0-4bc3-862a-ee106561bafa`
   - Type: Atelier
   - Date: Dans 7 jours (14:00 - 17:00)
   - Durée estimée: 3h
   - Statut: Planifie

3. **Présentation des résultats trimestriels**
   - ID: `8035ab0e-769a-45f5-b27e-4918a27d73ef`
   - Type: Presentation
   - Date: Dans 10 jours (09:00 - 11:30)
   - Durée estimée: 2.5h
   - Statut: Planifie

### Activités terminées (2)
4. **Démo produit pour les clients**
   - ID: `8e4972ad-dfe0-4a42-a7f4-5cc4c0f70f27`
   - Type: Demo
   - Date: Il y a 3 jours (13:00 - 15:30)
   - Durée estimée: 2.5h
   - Durée réelle: 3h (dépassement de 0.5h)
   - Statut: Termine

5. **Revue de process campagne email**
   - ID: `1b5cd8e1-c888-45be-8fe8-4e77a522f88e`
   - Type: Revue
   - Date: Hier (10:00 - 12:00)
   - Durée estimée: 2h
   - Durée réelle: 1.75h (plus rapide de 0.25h)
   - Statut: Termine

## Participants aux activités

L'utilisateur Sophie Marketing a été ajouté comme participant interne à toutes ses activités (5 activités).

## Notes

- Toutes les données utilisent les nouveaux champs de durée (`estimated_duration_hours`, `actual_duration_hours`)
- Les tâches et activités terminées ont des durées réelles pour permettre la comparaison avec les estimations
- Les durées réelles montrent des écarts variés (certaines plus longues, une plus rapide) pour illustrer la fonctionnalité de comparaison



