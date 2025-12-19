/**
 * Configuration des entreprises à exclure lors de l'import depuis Google Sheets
 * 
 * Cette liste contient les entreprises qui sont filtrées dans Google Sheets
 * et qui ne doivent pas être importées dans Supabase.
 * 
 * Mettre à jour cette liste si des filtres sont modifiés dans Google Sheets.
 */

export const EXCLUDED_COMPANIES = [
  'ROADMAP',
  'CHURN/TEST',
  'TEAM SUPPORT',
  // Ajouter d'autres entreprises filtrées ici
];

/**
 * Vérifie si une entreprise doit être exclue
 */
export function shouldExcludeCompany(companyName) {
  if (!companyName) return true;
  
  const normalized = companyName.trim().toUpperCase();
  
  // Exclure les valeurs vides, "Non enregistré", "Non renseigné", "ALL"
  if (
    normalized === '' ||
    normalized === 'NON ENREGISTRÉ' ||
    normalized === 'NON RENSEIGNÉ' ||
    normalized === 'ALL'
  ) {
    return true;
  }
  
  // Vérifier si l'entreprise est dans la liste d'exclusion
  return EXCLUDED_COMPANIES.some(
    excluded => excluded.toUpperCase() === normalized
  );
}





