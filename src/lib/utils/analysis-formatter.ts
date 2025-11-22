/**
 * Utilitaires pour formater l'analyse générée par N8N
 * 
 * Formatage amélioré pour l'affichage HTML avec sections colorées
 */

/**
 * Détecte et formate les numéros suivis d'un point (1. Titre, 2. Titre)
 * 
 * @param text - Le texte à formater
 * @returns Le texte formaté
 */
function formatNumberedSections(text: string): string {
  return text.replace(/^(\d+\.)\s+(.+)$/gm, (match, number, title) => {
    return `\n## ${number} ${title}\n`;
  });
}

/**
 * Détecte et formate les numéros entre parenthèses (1) Titre, 2) Titre
 * 
 * @param text - Le texte à formater
 * @returns Le texte formaté
 */
function formatParenthesizedSections(text: string): string {
  return text.replace(/^(\d+\))\s+(.+)$/gm, (match, number, title) => {
    return `\n## ${number} ${title}\n`;
  });
}

/**
 * Détecte et formate les titres Markdown (# Titre, ## Titre)
 * 
 * @param text - Le texte à formater
 * @returns Le texte formaté
 */
function formatMarkdownHeaders(text: string): string {
  return text.replace(/^#{1,2}\s+(.+)$/gm, (match, title) => {
    return `\n## ${title}\n`;
  });
}

/**
 * Détecte et formate les puces avec tiret ou astérisque
 * 
 * @param text - Le texte à formater
 * @returns Le texte formaté
 */
function formatBulletPoints(text: string): string {
  return text.replace(/^[-*]\s+(.+)$/gm, (match, content) => {
    // Si la ligne commence par une majuscule et semble être un titre, en faire un H3
    if (content.length < 60 && !content.match(/[.!?]$/)) {
      return `\n### ${content}\n`;
    }
    return `\n- ${content}\n`;
  });
}

/**
 * Détecte et formate les sections numérotées dans le texte
 * 
 * @param text - Le texte de l'analyse
 * @returns Le texte avec les sections formatées
 */
function formatSections(text: string): string {
  let formatted = formatNumberedSections(text);
  formatted = formatParenthesizedSections(formatted);
  formatted = formatMarkdownHeaders(formatted);
  formatted = formatBulletPoints(formatted);
  
  return formatted;
}

/**
 * Formate l'analyse pour l'affichage HTML avec sections colorées
 * 
 * Améliore la lisibilité en :
 * - Détectant les sections numérotées (1. Titre, 2. Titre, etc.)
 * - Les transformant en H2
 * - Ajoutant des couleurs légères pour délimiter les sections
 * 
 * @param text - Le texte de l'analyse
 * @returns Le texte formaté en HTML avec sections colorées
 * 
 * @example
 * const formatted = formatAnalysis('1. Résumé\nContenu...\n2. Recommandations\nContenu...');
 * // Returns: HTML avec sections colorées
 */
export function formatAnalysis(text: string): string {
  if (!text || text.trim().length === 0) {
    return '';
  }

  // Échapper les caractères HTML pour la sécurité
  const escaped = escapeHtml(text);
  
  // Formater les sections
  const withSections = formatSections(escaped);
  
  // Séparer le texte en sections (par lignes vides ou titres)
  const sections = splitIntoSections(withSections);
  
  // Formater chaque section avec une couleur légère
  const formattedSections = sections.map((section, index) => {
    return formatSection(section, index);
  });
  
  return formattedSections.join('');
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
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Traite une partie du texte et l'ajoute à la section courante ou en crée une nouvelle
 * 
 * @param trimmed - La partie du texte à traiter (trimmed)
 * @param currentSection - La section courante
 * @param sections - Le tableau de sections
 * @returns La nouvelle section courante
 */
function processTextPart(trimmed: string, currentSection: string, sections: string[]): string {
  // Si la partie commence par ##, c'est un nouveau titre
  if (trimmed.startsWith('##')) {
    if (currentSection) {
      sections.push(currentSection);
    }
    return trimmed;
  }
  
  // Ajouter à la section courante
  return currentSection 
    ? currentSection + '\n\n' + trimmed 
    : trimmed;
}

/**
 * Sépare le texte en sections basées sur les titres ou lignes vides
 * 
 * @param text - Le texte à séparer
 * @returns Tableau de sections
 */
function splitIntoSections(text: string): string[] {
  const parts = text.split(/\n\n+/);
  const sections: string[] = [];
  let currentSection = '';
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    
    currentSection = processTextPart(trimmed, currentSection, sections);
  }
  
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections.length > 0 ? sections : [text];
}

/**
 * Formate une section avec une couleur légère et un titre
 * 
 * @param section - Le texte de la section
 * @param index - L'index de la section (pour les couleurs alternées)
 * @returns Le HTML formaté de la section
 */
function formatSection(section: string, index: number): string {
  const colors = [
    'bg-slate-50 dark:bg-slate-900/30',
    'bg-blue-50 dark:bg-blue-900/20',
    'bg-purple-50 dark:bg-purple-900/20',
    'bg-green-50 dark:bg-green-900/20',
    'bg-amber-50 dark:bg-amber-900/20'
  ];
  
  const color = colors[index % colors.length];
  
  // Extraire le titre si présent (commence par ##)
  const titleMatch = section.match(/^##\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : null;
  const content = titleMatch ? section.replace(/^##\s+.+$/m, '').trim() : section.trim();
  
  // Formater le contenu (conserver les sauts de ligne)
  const formattedContent = content
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br>');
  
  let html = `<div class="mb-4 rounded-lg ${color} p-4 border border-slate-200 dark:border-slate-700">`;
  
  if (title) {
    html += `<h2 class="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-200 dark:border-slate-700">${title}</h2>`;
  }
  
  html += `<div class="text-slate-700 dark:text-slate-300 leading-relaxed"><p class="mb-2">${formattedContent}</p></div>`;
  html += `</div>`;
  
  return html;
}
