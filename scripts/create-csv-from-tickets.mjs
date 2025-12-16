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

// Données des tickets (copiées depuis la réponse MCP)
const tickets = [
  // Les données seront insérées ici depuis la réponse MCP
];

// En-têtes CSV
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

// Créer les lignes CSV
const csvLines = [headers.join(',')];

for (const ticket of tickets) {
  const row = [
    escapeCsvValue(ticket.jira_issue_key),
    escapeCsvValue(ticket.title),
    escapeCsvValue(ticket.created_at),
    escapeCsvValue(ticket.updated_at),
    escapeCsvValue(ticket.ticket_type),
    escapeCsvValue(ticket.status),
    escapeCsvValue(ticket.priority),
    escapeCsvValue(ticket.duration_minutes),
    escapeCsvValue(ticket.action_menee),
    escapeCsvValue(ticket.objet_principal),
    escapeCsvValue(ticket.company_name),
    escapeCsvValue(ticket.reporter_name),
    escapeCsvValue(ticket.contact_user_name)
  ];
  csvLines.push(row.join(','));
}

// Écrire le fichier CSV
const csvContent = csvLines.join('\n');
const outputPath = 'tickets-2025-12-09.csv';
writeFileSync(outputPath, csvContent, 'utf-8');

console.log(`✅ Fichier CSV créé: ${outputPath}`);
console.log(`📊 ${tickets.length} tickets exportés`);






