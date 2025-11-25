/**
 * Formate une date relative (ex: "il y a 3 jours")
 * 
 * @param dateString - Date ISO string
 * @returns Date formatée relative
 */
export function formatRelativeDate(dateString: string | null): string {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

