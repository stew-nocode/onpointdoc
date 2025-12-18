import { writeFileSync } from 'fs';

// Fonction pour échapper les valeurs CSV
function escapeCsvValue(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Les données ont été récupérées via MCP Supabase
// Nous allons utiliser une requête SQL directe via le script
console.log('📝 Script pour exporter les tickets du 9 décembre 2025 en CSV');
console.log('ℹ️  Exécutez ce script avec les variables d\'environnement Supabase configurées');
console.log('ℹ️  Ou utilisez le MCP Supabase pour récupérer les données et créer le CSV manuellement');

// Headers CSV
const headers = [
  'jira_issue_key',
  'title',
  'created_at',
  'updated_at',
  'ticket_type',
  'status',
  'priority',
  'duration_minutes',
  'action_menee',
  'objet_principal',
  'company_name',
  'reporter_name',
  'contact_user_name'
];

// Créer un fichier CSV avec juste les headers pour l'instant
const csvLines = [headers.join(',')];
const csvContent = csvLines.join('\n');
writeFileSync('tickets-2025-12-09-template.csv', csvContent, 'utf-8');

console.log('\n✅ Fichier template créé: tickets-2025-12-09-template.csv');
console.log('📊 Pour remplir les données, utilisez les données récupérées via MCP Supabase');












