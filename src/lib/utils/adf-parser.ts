/**
 * Utilitaires pour parser le format ADF (Atlassian Document Format) de Jira
 * Logique métier isolée - peut être utilisée côté serveur
 */

type ADFMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

type ADFLinkMark = ADFMark & {
  type: 'link';
  attrs?: {
    href?: string;
    [key: string]: unknown;
  };
};

type ADFNode = {
  type: string;
  content?: ADFNode[];
  text?: string;
  marks?: ADFMark[];
  attrs?: Record<string, unknown>;
  version?: number; // Version ADF (requis pour le nœud racine 'doc')
};

/**
 * Échappe les caractères HTML pour éviter les injections XSS
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
 * Rend un nœud ADF en HTML
 */
function renderADF(node: ADFNode): string {
  if (!node) return '';

  // Nœud texte
  if (node.type === 'text' && node.text) {
    let text = escapeHtml(node.text);
    
    // Appliquer les marques (gras, italique, etc.) dans l'ordre inverse pour respecter l'imbrication
    if (node.marks) {
      // Traiter les liens en premier
      const linkMark = node.marks.find((m) => m.type === 'link') as ADFLinkMark | undefined;
      if (linkMark?.attrs?.href && typeof linkMark.attrs.href === 'string') {
        const href = linkMark.attrs.href;
        text = `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline">${text}</a>`;
      }
      
      // Appliquer les autres marques
      node.marks.forEach((mark) => {
        if (mark.type === 'link') return; // Déjà traité
        switch (mark.type) {
          case 'strong':
            text = `<strong>${text}</strong>`;
            break;
          case 'em':
            text = `<em>${text}</em>`;
            break;
          case 'code':
            text = `<code class="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs font-mono">${text}</code>`;
            break;
          case 'underline':
            text = `<u>${text}</u>`;
            break;
          case 'strike':
            text = `<s>${text}</s>`;
            break;
        }
      });
    }
    
    return text;
  }

  // Nœud paragraphe
  if (node.type === 'paragraph') {
    const content = node.content?.map(renderADF).join('') || '';
    return `<p>${content}</p>`;
  }

  // Nœud heading
  if (node.type === 'heading') {
    const level = node.attrs?.level || 1;
    const content = node.content?.map(renderADF).join('') || '';
    return `<h${level}>${content}</h${level}>`;
  }

  // Nœud liste
  if (node.type === 'bulletList' || node.type === 'orderedList') {
    const tag = node.type === 'orderedList' ? 'ol' : 'ul';
    const items = node.content?.map(renderADF).join('') || '';
    return `<${tag}>${items}</${tag}>`;
  }

  // Nœud élément de liste
  if (node.type === 'listItem') {
    const content = node.content?.map(renderADF).join('') || '';
    return `<li>${content}</li>`;
  }

  // Nœud bloc de code
  if (node.type === 'codeBlock') {
    const content = node.content?.map(renderADF).join('') || '';
    const language = node.attrs?.language || '';
    return `<pre><code${language ? ` class="language-${language}"` : ''}>${content}</code></pre>`;
  }

  // Nœud hardBreak (saut de ligne)
  if (node.type === 'hardBreak') {
    return '<br />';
  }

  // Nœud générique avec contenu
  if (node.content) {
    return node.content.map(renderADF).join('');
  }

  return '';
}

/**
 * Extrait le texte brut d'un nœud ADF (sans formatage HTML)
 */
function extractTextFromADF(node: ADFNode): string {
  if (!node) return '';

  // Nœud texte
  if (node.type === 'text' && node.text) {
    return node.text;
  }

  // Nœud hardBreak (saut de ligne)
  if (node.type === 'hardBreak') {
    return '\n';
  }

  // Nœud paragraphe ou autre nœud avec contenu
  if (node.content) {
    return node.content.map(extractTextFromADF).join('');
  }

  return '';
}

/**
 * Parse le format ADF (Atlassian Document Format) de Jira et extrait uniquement le texte brut
 * Utile pour les tooltips et autres contextes où le HTML n'est pas souhaité
 */
export function parseADFToText(adfString: string | null): string {
  if (!adfString) return '';

  try {
    const adf = JSON.parse(adfString) as ADFNode;
    const text = extractTextFromADF(adf);
    // Nettoyer les espaces multiples et les sauts de ligne excessifs
    return text.replace(/\n{3,}/g, '\n\n').trim();
  } catch {
    // Si ce n'est pas du JSON valide, retourner tel quel
    return adfString;
  }
}

/**
 * Parse le format ADF (Atlassian Document Format) de Jira et le convertit en HTML
 * Fonction utilitaire côté serveur
 */
export function parseADFToHTML(adfString: string | null): string {
  if (!adfString) return '';

  try {
    const adf = JSON.parse(adfString) as ADFNode;
    return renderADF(adf);
  } catch {
    // Si ce n'est pas du JSON valide, retourner tel quel (échappé)
    return escapeHtml(adfString);
  }
}

/**
 * Convertit un texte brut en format ADF (Atlassian Document Format)
 * Utilisé pour créer des descriptions JIRA depuis du texte simple
 */
export function textToADF(text: string | null | undefined): ADFNode {
  if (!text || text.trim().length === 0) {
    return {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: []
        }
      ]
    };
  }

  // Diviser le texte en paragraphes (séparés par deux sauts de ligne)
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

  const content = paragraphs.map((paragraph) => {
    const trimmedParagraph = paragraph.trim();
    
    // Diviser chaque paragraphe en lignes
    const lines = trimmedParagraph.split('\n');
    
    if (lines.length === 1) {
      // Paragraphe simple
      return {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: lines[0].trim()
          }
        ]
      };
    } else {
      // Plusieurs lignes - créer un paragraphe avec des sauts de ligne
      const textContent: ADFNode[] = [];
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.length > 0) {
          textContent.push({
            type: 'text',
            text: trimmedLine
          });
          if (index < lines.length - 1) {
            textContent.push({
              type: 'hardBreak'
            });
          }
        }
      });
      return {
        type: 'paragraph',
        content: textContent.length > 0 ? textContent : []
      };
    }
  });

  return {
    type: 'doc',
    version: 1,
    content: content.length > 0 ? content : [
      {
        type: 'paragraph',
        content: []
      }
    ]
  };
}

