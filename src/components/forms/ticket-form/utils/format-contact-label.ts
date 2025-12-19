/**
 * Formate le label d'un contact pour l'affichage dans les combobox
 * Format : "Nom Complet - Nom Entreprise" ou "Nom Complet" si pas d'entreprise
 * 
 * @param contact - Profil contact avec informations d'entreprise
 * @returns Label formaté pour l'affichage
 */
export function formatContactLabel(contact: {
  full_name: string | null;
  email: string | null;
  company_name: string | null;
}): string {
  const name = contact.full_name || contact.email || 'Utilisateur';
  
  if (contact.company_name) {
    return `${name} - ${contact.company_name}`;
  }
  
  return name;
}

/**
 * Crée le texte de recherche pour un contact (inclut nom, email et entreprise)
 * 
 * @param contact - Profil contact
 * @returns Texte de recherche
 */
export function getContactSearchableText(contact: {
  full_name: string | null;
  email: string | null;
  company_name: string | null;
}): string {
  const parts: string[] = [];
  
  if (contact.full_name) {
    parts.push(contact.full_name);
  }
  
  if (contact.email) {
    parts.push(contact.email);
  }
  
  if (contact.company_name) {
    parts.push(contact.company_name);
  }
  
  return parts.join(' ').trim();
}

