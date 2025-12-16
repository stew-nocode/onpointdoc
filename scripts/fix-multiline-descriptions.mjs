/**
 * Script pour corriger les descriptions multi-lignes tronquées dans les fichiers de migration
 */

import { readFileSync, writeFileSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations', 'assistance-tickets-split');
const ORIGINAL_FILE = join(__dirname, '..', 'supabase', 'migrations', '2025-12-09-sync-assistance-tickets-from-sheet.sql');

async function fixMultilineDescriptions() {
  try {
    // Lire le fichier original pour référence
    console.log('📖 Lecture du fichier original...');
    const originalContent = readFileSync(ORIGINAL_FILE, 'utf-8');
    const originalLines = originalContent.split('\n');
    
    // Créer un index des tickets complets depuis le fichier original
    const ticketMap = new Map();
    let currentTicket = null;
    let ticketLines = [];
    
    for (let i = 0; i < originalLines.length; i++) {
      const line = originalLines[i];
      const trimmed = line.trim();
      
      // Détecter le début d'un ticket
      if (trimmed.startsWith('(') && trimmed.includes("'OBCS-")) {
        // Si on avait un ticket en cours, le sauvegarder
        if (currentTicket) {
          const ticketKey = currentTicket.match(/'OBCS-(\d+)'/)?.[1];
          if (ticketKey) {
            ticketMap.set(ticketKey, ticketLines.join('\n'));
          }
        }
        
        // Nouveau ticket
        currentTicket = trimmed;
        ticketLines = [line];
      } else if (currentTicket) {
        // Continuer à collecter les lignes du ticket
        ticketLines.push(line);
        
        // Si la ligne se termine par ), c'est la fin du ticket
        if (trimmed.endsWith('),') || trimmed.endsWith(');')) {
          const ticketKey = currentTicket.match(/'OBCS-(\d+)'/)?.[1];
          if (ticketKey) {
            ticketMap.set(ticketKey, ticketLines.join('\n'));
          }
          currentTicket = null;
          ticketLines = [];
        }
      }
    }
    
    console.log(`📊 ${ticketMap.size} tickets indexés depuis le fichier original\n`);
    
    // Lister tous les fichiers de migration
    const files = await readdir(MIGRATIONS_DIR);
    const migrationFiles = files
      .filter(f => f.startsWith('2025-12-09-sync-assistance-tickets-part-') && f.endsWith('.sql'))
      .sort();
    
    console.log(`🔧 Vérification de ${migrationFiles.length} fichiers...\n`);
    
    for (const file of migrationFiles) {
      const filePath = join(MIGRATIONS_DIR, file);
      let content = readFileSync(filePath, 'utf-8');
      let modified = false;
      
      // Chercher les tickets avec des descriptions incomplètes
      const lines = content.split('\n');
      const newLines = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // Détecter un ticket qui commence mais semble incomplet
        if (trimmed.startsWith('(') && trimmed.includes("'OBCS-") && !trimmed.endsWith('),') && !trimmed.endsWith(');')) {
          // Vérifier si la ligne suivante commence aussi par ('OBCS- (ticket suivant)
          const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
          if (nextLine.startsWith("('OBCS-")) {
            // Le ticket actuel est probablement incomplet
            const ticketKey = trimmed.match(/'OBCS-(\d+)'/)?.[1];
            if (ticketKey && ticketMap.has(ticketKey)) {
              console.log(`  ⚠️  Ticket OBCS-${ticketKey} incomplet détecté, correction...`);
              // Remplacer par la version complète du ticket
              const completeTicket = ticketMap.get(ticketKey);
              // Normaliser l'indentation (pas d'indentation pour les tickets)
              const completeLines = completeTicket.split('\n');
              // Supprimer l'indentation de toutes les lignes
              const normalizedLines = completeLines.map(l => l.trimStart());
              // Ajouter les lignes normalisées
              for (const normalizedLine of normalizedLines) {
                if (normalizedLine) {
                  newLines.push(normalizedLine);
                }
              }
              modified = true;
              // Sauter les lignes suivantes jusqu'à trouver le prochain ticket valide
              i++; // Skip la ligne actuelle qui sera remplacée
              while (i < lines.length && !lines[i].trim().startsWith("('OBCS-")) {
                i++;
              }
              i--; // Pour que la boucle traite le prochain ticket
              continue;
            }
          }
        }
        
        newLines.push(line);
      }
      
      if (modified) {
        writeFileSync(filePath, newLines.join('\n'), 'utf-8');
        console.log(`  ✅ ${file} corrigé`);
      } else {
        console.log(`  ✓ ${file} OK`);
      }
    }
    
    console.log('\n✨ Vérification terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

fixMultilineDescriptions();

