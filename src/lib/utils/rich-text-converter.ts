/**
 * Utilitaires pour convertir entre HTML, ADF et texte brut
 * Logique métier isolée - peut être utilisée côté serveur
 */

import { parseADFToHTML, textToADF } from './adf-parser';
import type { RichTextFormat } from '@/types/rich-text';

/**
 * Convertit le contenu depuis n'importe quel format vers HTML pour l'éditeur
 * 
 * @param content - Le contenu dans le format d'origine
 * @param fromFormat - Le format d'origine (html, adf, plain)
 * @returns Le contenu en HTML pour l'éditeur
 */
export function convertToEditorHTML(
  content: string | null | undefined,
  fromFormat: RichTextFormat = 'plain'
): string {
  if (!content || content.trim().length === 0) {
    return '';
  }

  switch (fromFormat) {
    case 'html':
      // Déjà en HTML, retourner tel quel (sécurisé par l'éditeur)
      return content;
    
    case 'adf':
      // Parser depuis ADF vers HTML
      return parseADFToHTML(content);
    
    case 'plain':
    default:
      // Convertir le texte brut en HTML simple (préserver les sauts de ligne)
      return content
        .split('\n\n')
        .map(para => `<p>${para.replace(/\n/g, '<br />')}</p>`)
        .join('');
  }
}

/**
 * Convertit le contenu HTML de l'éditeur vers le format de stockage souhaité
 * 
 * @param html - Le contenu HTML de l'éditeur
 * @param toFormat - Le format de destination (html, adf, plain)
 * @returns Le contenu dans le format de destination
 */
export function convertFromEditorHTML(
  html: string,
  toFormat: RichTextFormat = 'plain'
): string {
  if (!html || html.trim().length === 0) {
    return '';
  }

  switch (toFormat) {
    case 'html':
      // Retourner le HTML tel quel
      return html;
    
    case 'adf':
      // Convertir HTML vers ADF (implémentation simplifiée)
      // Pour une conversion complète, utiliser une bibliothèque dédiée
      // Pour l'instant, convertir en ADF simple depuis le texte
      const tempDiv = typeof document !== 'undefined' 
        ? document.createElement('div')
        : null;
      
      if (tempDiv) {
        tempDiv.innerHTML = html;
        const text = tempDiv.textContent || tempDiv.innerText || '';
        const adf = textToADF(text);
        return JSON.stringify(adf);
      }
      
      // Fallback : extraire le texte et convertir en ADF
      const textOnly = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
      const adfSimple = textToADF(textOnly);
      return JSON.stringify(adfSimple);
    
    case 'plain':
    default:
      // Extraire le texte brut (sans HTML)
      if (typeof document !== 'undefined') {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        return tempDiv.textContent || tempDiv.innerText || '';
      }
      
      // Fallback côté serveur : extraction basique
      return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }
}

