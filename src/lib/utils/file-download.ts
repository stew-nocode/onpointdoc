/**
 * Utilitaires pour le téléchargement de fichiers
 * 
 * Fonctions pures pour télécharger du contenu sous forme de fichier
 */

/**
 * Télécharge un contenu texte sous forme de fichier
 * 
 * @param content - Le contenu à télécharger
 * @param filename - Le nom du fichier (sans extension)
 * @param extension - L'extension du fichier (ex: 'txt', 'md', 'json')
 * 
 * @example
 * downloadTextFile('Contenu de l\'analyse', 'analyse-ticket-123', 'md');
 */
export function downloadTextFile(
  content: string,
  filename: string,
  extension: string = 'txt'
): void {
  // Créer un blob avec le contenu
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  
  // Créer une URL temporaire
  const url = URL.createObjectURL(blob);
  
  // Créer un élément <a> pour déclencher le téléchargement
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.${extension}`;
  
  // Ajouter au DOM, cliquer, puis retirer
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Libérer l'URL après un court délai
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Télécharge une analyse sous forme de fichier Markdown
 * 
 * @param analysis - Le contenu de l'analyse
 * @param context - Le contexte de l'analyse (ticket, company, contact)
 * @param id - L'identifiant de l'entité
 * 
 * @example
 * downloadAnalysisFile('Analyse complète...', 'ticket', 'OD-123');
 */
export function downloadAnalysisFile(
  analysis: string,
  context: string,
  id: string
): void {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `analyse-${context}-${id}-${timestamp}`;
  
  downloadTextFile(analysis, filename, 'md');
}

