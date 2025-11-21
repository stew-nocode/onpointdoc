/**
 * Utilitaires pour formater l'analyse générée par N8N
 * 
 * Formatage basique pour l'affichage HTML
 */

/**
 * Formate l'analyse pour l'affichage HTML
 * 
 * Pour l'instant, on fait un simple formatage basique.
 * Si N8N retourne du Markdown, on pourrait utiliser `react-markdown` ici.
 * 
 * @param text - Le texte de l'analyse
 * @returns Le texte formaté en HTML
 * 
 * @example
 * const formatted = formatAnalysis('# Titre\n\nContenu...');
 * // Returns: '<p># Titre<br><br>Contenu...</p>'
 */
export function formatAnalysis(text: string): string {
  // Échapper les caractères HTML pour la sécurité
  const escaped = escapeHtml(text);
  
  // Formatage basique : convertir les sauts de ligne en <br>
  const withBreaks = escaped.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
  
  return `<p>${withBreaks}</p>`;
}

/**
 * Échappe les caractères HTML pour la sécurité
 * 
 * @param text - Le texte à échapper
 * @returns Le texte avec les caractères HTML échappés
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

