#!/usr/bin/env node

/**
 * Script pour télécharger toutes les images des tickets Bug et Requêtes depuis JIRA
 * 
 * Processus:
 * 1. Récupère tous les tickets Bug/Requêtes depuis Supabase
 * 2. Pour chaque ticket, récupère les attachments depuis JIRA
 * 3. Télécharge les images (jpg, png, gif, etc.)
 * 4. Stocke dans Supabase Storage
 * 5. Récupère aussi les images des commentaires
 * 
 * Usage:
 *   node scripts/download-jira-images.mjs [--limit N] [--resume]
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch {
  dotenv.config();
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE ??
  '';

// Configuration JIRA
const jiraUrl = process.env.JIRA_URL || process.env.JIRA_BASE_URL;
const jiraUsername = process.env.JIRA_USERNAME || process.env.JIRA_EMAIL || process.env.JIRA_API_EMAIL;
const jiraToken = process.env.JIRA_TOKEN || process.env.JIRA_API_TOKEN;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌ Variables Supabase manquantes');
  process.exit(1);
}

if (!jiraUrl || !jiraUsername || !jiraToken) {
  console.error('❌ Variables JIRA manquantes');
  process.exit(1);
}

const JIRA_URL = jiraUrl.replace(/^["']|["']$/g, '').replace(/\/$/, '').trim();
const JIRA_EMAIL = jiraUsername.replace(/^["']|["']$/g, '').trim();
const JIRA_API_TOKEN = jiraToken.replace(/^["']|["']$/g, '').replace(/\s+/g, '').trim();
const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false }
});

const LIMIT_ARG = process.argv.find(arg => arg.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1]) : null;
const RESUME = process.argv.includes('--resume');
const PROGRESS_FILE = path.join(__dirname, 'download-images-progress.json');

// Extensions d'images supportées
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];

console.log('════════════════════════════════════════════════════════════════════════════════');
console.log('📸 TÉLÉCHARGEMENT DES IMAGES DEPUIS JIRA');
console.log('════════════════════════════════════════════════════════════════════════════════\n');

/**
 * Charge la progression sauvegardée
 */
function loadProgress() {
  if (!RESUME || !existsSync(PROGRESS_FILE)) {
    return null;
  }
  
  try {
    const progressData = JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'));
    console.log(`📂 Reprise depuis la sauvegarde:`);
    console.log(`   - Dernier ticket traité: ${progressData.lastProcessedKey || 'Aucun'}`);
    console.log(`   - Images téléchargées: ${progressData.downloadedCount || 0}`);
    console.log(`   - Erreurs: ${progressData.errorCount || 0}\n`);
    return progressData;
  } catch (error) {
    console.warn(`⚠️  Impossible de charger la progression: ${error.message}`);
    return null;
  }
}

/**
 * Sauvegarde la progression
 */
function saveProgress(progress) {
  try {
    writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf-8');
  } catch (error) {
    console.error(`❌ Erreur lors de la sauvegarde: ${error.message}`);
  }
}

/**
 * Vérifie si un fichier est une image
 */
function isImageFile(filename) {
  if (!filename) return false;
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * Télécharge un fichier depuis JIRA
 */
async function downloadFileFromJira(attachmentId, filename, jiraKey) {
  return new Promise((resolve, reject) => {
    const url = `${JIRA_URL}/rest/api/3/attachment/content/${attachmentId}`;
    const fileUrl = new URL(url);
    const protocol = fileUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: fileUrl.hostname,
      port: fileUrl.port || (fileUrl.protocol === 'https:' ? 443 : 80),
      path: fileUrl.pathname + fileUrl.search,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': '*/*'
      }
    };

    const chunks = [];
    
    const req = protocol.request(options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

/**
 * Upload une image dans Supabase Storage et enregistre les métadonnées
 */
async function uploadImageToSupabase(buffer, filename, jiraKey, attachmentId, ticketId, sizeBytes) {
  // Créer le chemin: tickets/{jira_key}/{filename}
  const filePath = `tickets/${jiraKey}/${attachmentId}-${filename}`;
  
  // Vérifier si l'attachment existe déjà
  const { data: existing } = await supabase
    .from('ticket_attachments')
    .select('id')
    .eq('ticket_id', ticketId)
    .eq('file_path', filePath)
    .limit(1)
    .maybeSingle();
  
  if (existing) {
    return { path: filePath, skipped: true };
  }
  
  const { data, error } = await supabase.storage
    .from('ticket-attachments')
    .upload(filePath, buffer, {
      contentType: getContentType(filename),
      upsert: true
    });

  if (error) {
    throw error;
  }

  // Enregistrer les métadonnées dans ticket_attachments
  const { error: metaError } = await supabase
    .from('ticket_attachments')
    .insert({
      ticket_id: ticketId,
      file_path: filePath,
      mime_type: getContentType(filename),
      size_kb: Math.ceil(sizeBytes / 1024)
    });

  if (metaError) {
    console.warn(`   ⚠️  Image téléchargée mais métadonnées non enregistrées: ${metaError.message}`);
  }

  return { path: filePath, skipped: false };
}

/**
 * Détermine le content type d'un fichier
 */
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };
  return types[ext] || 'application/octet-stream';
}

/**
 * Récupère les attachments d'un ticket depuis JIRA
 */
async function getTicketAttachments(jiraKey) {
  try {
    const response = await fetch(
      `${JIRA_URL}/rest/api/3/issue/${jiraKey}?fields=attachment`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      return [];
    }

    const issue = await response.json();
    const attachments = issue.fields?.attachment || [];
    
    // Filtrer uniquement les images
    return attachments.filter(att => isImageFile(att.filename));
  } catch (error) {
    console.error(`   ❌ Erreur lors de la récupération des attachments: ${error.message}`);
    return [];
  }
}

/**
 * Récupère les commentaires et leurs attachments (images) depuis JIRA
 */
async function getCommentAttachments(jiraKey) {
  try {
    const response = await fetch(
      `${JIRA_URL}/rest/api/3/issue/${jiraKey}/comment?expand=renderedBody`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      return [];
    }

    const commentsData = await response.json();
    const attachments = [];
    
    // Pour chaque commentaire, récupérer les attachments
    for (const comment of commentsData.comments || []) {
      // Les attachments des commentaires sont dans le champ "attachment" de chaque commentaire
      // Note: L'API JIRA peut nécessiter une requête séparée pour les attachments de commentaires
      // Pour l'instant, on extrait les URLs d'images du body (ADF)
      
      const body = comment.body || '';
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
      
      // Chercher les attachments dans le body ADF
      // Format ADF: {"type":"image","attrs":{"url":"..."}}
      try {
        const bodyObj = typeof body === 'object' ? body : JSON.parse(bodyStr);
        if (bodyObj && bodyObj.content) {
          const extractImagesFromADF = (node) => {
            const images = [];
            if (node.type === 'image' && node.attrs && node.attrs.url) {
              const url = node.attrs.url;
              if (isImageFile(url)) {
                images.push({ url, commentId: comment.id, filename: url.split('/').pop() });
              }
            }
            if (node.content && Array.isArray(node.content)) {
              node.content.forEach(child => {
                images.push(...extractImagesFromADF(child));
              });
            }
            return images;
          };
          
          const commentImages = extractImagesFromADF(bodyObj);
          attachments.push(...commentImages);
        }
      } catch (e) {
        // Si ce n'est pas du JSON, chercher des URLs d'images dans le texte
        const imageUrlRegex = /(https?:\/\/[^\s"']+\.(jpg|jpeg|png|gif|bmp|webp|svg))/gi;
        const matches = bodyStr.match(imageUrlRegex);
        if (matches) {
          attachments.push(...matches.map(url => ({ 
            url, 
            commentId: comment.id, 
            filename: url.split('/').pop() 
          })));
        }
      }
    }
    
    return attachments;
  } catch (error) {
    console.error(`   ❌ Erreur lors de la récupération des commentaires: ${error.message}`);
    return [];
  }
}

/**
 * Télécharge une image depuis une URL
 */
async function downloadImageFromUrl(url, filename) {
  return new Promise((resolve, reject) => {
    const fileUrl = new URL(url);
    const protocol = fileUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: fileUrl.hostname,
      port: fileUrl.port || (fileUrl.protocol === 'https:' ? 443 : 80),
      path: fileUrl.pathname + fileUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    };

    const chunks = [];
    
    const req = protocol.request(options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

/**
 * Fonction principale
 */
async function downloadAllImages() {
  try {
    // Charger la progression si reprise
    const savedProgress = loadProgress();
    let startFromKey = null;
    if (savedProgress && savedProgress.lastProcessedKey) {
      startFromKey = savedProgress.lastProcessedKey;
    }

    // 1. Vérifier/créer le bucket de storage
    console.log('🔍 Vérification du bucket de storage...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erreur lors de la vérification des buckets:', bucketsError.message);
      return;
    }

    const bucketExists = buckets.some(b => b.name === 'ticket-attachments');
    if (!bucketExists) {
      console.log('📦 Création du bucket ticket-attachments...');
      const { error: createError } = await supabase.storage.createBucket('ticket-attachments', {
        public: false,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml']
      });
      
      if (createError) {
        console.error('❌ Erreur lors de la création du bucket:', createError.message);
        return;
      }
      console.log('✅ Bucket créé\n');
    } else {
      console.log('✅ Bucket ticket-attachments existe\n');
    }

    // 2. Récupérer tous les tickets Bug/Requêtes depuis Supabase
    console.log('📥 Récupération des tickets Bug/Requêtes depuis Supabase...');
    
    let allTickets = [];
    let start = 0;
    const pageSize = 1000;
    let hasMore = true;
    let totalCount = 0;

    while (hasMore) {
      let query = supabase
        .from('tickets')
        .select('id, jira_issue_key, title, ticket_type', { count: 'exact' })
        .in('ticket_type', ['BUG', 'REQ'])
        .like('jira_issue_key', 'OD-%')
        .order('jira_issue_key', { ascending: true })
        .range(start, start + pageSize - 1);

      if (LIMIT && allTickets.length + pageSize > LIMIT) {
        query = query.limit(LIMIT - allTickets.length);
      }

      const { data: tickets, error: ticketsError, count } = await query;

      if (ticketsError) {
        console.error('❌ Erreur lors de la récupération des tickets:', ticketsError.message);
        break;
      }

      if (count !== null) {
        totalCount = count;
      }

      if (tickets && tickets.length > 0) {
        allTickets = allTickets.concat(tickets);
        console.log(`   📊 ${allTickets.length}/${totalCount || '?'} tickets récupérés...`);
      }

      hasMore = tickets && tickets.length === pageSize && (!LIMIT || allTickets.length < LIMIT);
      start += pageSize;
    }

    const tickets = allTickets;
    console.log(`✅ ${tickets.length} tickets trouvés\n`);

    if (tickets.length === 0) {
      console.log('⚠️  Aucun ticket à traiter.');
      return;
    }

    // Filtrer les tickets déjà traités si reprise
    let ticketsToProcess = tickets;
    if (startFromKey) {
      const startIndex = tickets.findIndex(t => t.jira_issue_key === startFromKey);
      if (startIndex >= 0) {
        ticketsToProcess = tickets.slice(startIndex + 1);
        console.log(`   ⏭️  Reprise après ${startFromKey}, ${ticketsToProcess.length} tickets restants\n`);
      }
    }

    // Initialiser les compteurs
    let processed = savedProgress?.processedCount || 0;
    let downloaded = savedProgress?.downloadedCount || 0;
    let errors = savedProgress?.errorCount || 0;
    let lastProcessedKey = savedProgress?.lastProcessedKey || null;
    const SAVE_INTERVAL = 10;
    let lastSaveCount = processed;

    // 3. Traiter chaque ticket
    console.log('📸 Téléchargement des images...\n');

    for (const ticket of ticketsToProcess) {
      processed++;
      const jiraKey = ticket.jira_issue_key;

      try {
        console.log(`[${processed}/${tickets.length}] ${jiraKey}...`);

        // Récupérer les attachments (images)
        const attachments = await getTicketAttachments(jiraKey);
        
        // Récupérer les images des commentaires
        const commentAttachments = await getCommentAttachments(jiraKey);

        let ticketImagesCount = 0;

        // Télécharger les attachments du ticket
        for (const attachment of attachments) {
          try {
            console.log(`   📎 ${attachment.filename} (${(attachment.size / 1024).toFixed(2)} KB)...`);
            
            const buffer = await downloadFileFromJira(attachment.id, attachment.filename, jiraKey);
            const result = await uploadImageToSupabase(
              buffer, 
              attachment.filename, 
              jiraKey, 
              attachment.id,
              ticket.id,
              attachment.size
            );
            
            if (!result.skipped) {
              downloaded++;
              ticketImagesCount++;
              console.log(`   ✅ Téléchargé`);
            } else {
              console.log(`   ⏭️  Déjà téléchargé`);
            }
          } catch (error) {
            console.error(`   ❌ Erreur: ${error.message}`);
            errors++;
          }
        }

        // Télécharger les images des commentaires
        for (const commentAtt of commentAttachments) {
          try {
            console.log(`   💬 Image commentaire: ${commentAtt.filename || 'image'}...`);
            
            const buffer = await downloadImageFromUrl(commentAtt.url, commentAtt.filename || 'image.jpg');
            const commentAttachmentId = `comment-${commentAtt.commentId}`;
            const result = await uploadImageToSupabase(
              buffer,
              commentAtt.filename || 'image.jpg',
              jiraKey,
              commentAttachmentId,
              ticket.id,
              buffer.length
            );
            
            if (!result.skipped) {
              downloaded++;
              ticketImagesCount++;
              console.log(`   ✅ Téléchargé`);
            } else {
              console.log(`   ⏭️  Déjà téléchargé`);
            }
          } catch (error) {
            console.error(`   ❌ Erreur: ${error.message}`);
            errors++;
          }
        }

        if (attachments.length === 0 && commentAttachments.length === 0) {
          console.log(`   ℹ️  Aucune image trouvée`);
        } else {
          console.log(`   📊 Total: ${ticketImagesCount} image(s) pour ce ticket`);
        }

        lastProcessedKey = jiraKey;

        // Sauvegarder la progression
        if (processed - lastSaveCount >= SAVE_INTERVAL) {
          saveProgress({
            lastProcessedKey,
            processedCount: processed,
            downloadedCount: downloaded,
            errorCount: errors,
            timestamp: new Date().toISOString()
          });
          lastSaveCount = processed;
          console.log(`   💾 Progression sauvegardée (${downloaded} images téléchargées)\n`);
        }

        // Pause pour éviter le rate limiting
        if (processed % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`   ❌ Erreur pour ${jiraKey}: ${error.message}`);
        errors++;
      }
    }

    // Sauvegarder la progression finale
    saveProgress({
      lastProcessedKey,
      processedCount: processed,
      downloadedCount: downloaded,
      errorCount: errors,
      timestamp: new Date().toISOString(),
      completed: true
    });

    console.log('\n════════════════════════════════════════════════════════════════════════════════');
    console.log('📊 RÉSUMÉ');
    console.log('════════════════════════════════════════════════════════════════════════════════');
    console.log(`   ✅ Tickets traités: ${processed}`);
    console.log(`   📸 Images téléchargées: ${downloaded}`);
    console.log(`   ❌ Erreurs: ${errors}`);
    console.log(`\n💾 Progression sauvegardée dans: ${PROGRESS_FILE}`);
    console.log(`💡 Pour reprendre: node scripts/download-jira-images.mjs --resume`);

  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

downloadAllImages();

