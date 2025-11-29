#!/usr/bin/env node

/**
 * Script pour rafraîchir TOUS les champs des tickets rapportés par "Edwidge Kouassi" 
 * depuis JIRA et les lier à "Edwige KOUASSI" dans Supabase
 * 
 * Stratégie: Récupérer tous les tickets OD depuis Supabase, vérifier le reporter dans JIRA,
 * puis mettre à jour tous les champs pour ceux d'Edwidge
 * 
 * Usage:
 *   node scripts/refresh-edwige-tickets-complete.mjs [--confirm]
 */

// Copier toute la logique de mapping depuis import-edwige-tickets-from-jira.mjs
// et l'adapter pour récupérer depuis Supabase au lieu de rechercher dans JIRA

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('════════════════════════════════════════════════════════════════════════════════');
console.log('🔄 RAFRAÎCHISSEMENT COMPLET DES TICKETS "EDWIDGE KOUASSI"');
console.log('════════════════════════════════════════════════════════════════════════════════\n');
console.log('💡 Ce script utilise le script refresh-all-tickets-from-jira.mjs');
console.log('   en filtrant uniquement les tickets d\'Edwidge Kouassi\n');
console.log('⚠️  Pour l\'instant, utilisez le script refresh-all-tickets-from-jira.mjs');
console.log('   qui mettra à jour TOUS les tickets OD depuis JIRA\n');





