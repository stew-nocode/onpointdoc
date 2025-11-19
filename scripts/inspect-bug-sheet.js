import Papa from 'papaparse';

const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1CDvRfXWWctpR8-VxIY8TyLmefEcJQIwG2FA48DFHX9A/export?format=csv&gid=1336282900';

async function main() {
  const response = await fetch(SHEET_URL);
  if (!response.ok) {
    throw new Error(`Impossible de télécharger le Google Sheet: ${response.status} ${response.statusText}`);
  }

  const csvText = await response.text();
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true
  });

  if (parsed.errors.length) {
    console.error('Erreurs PapaParse:', parsed.errors);
  }

  const rows = parsed.data;
  console.log('Colonnes disponibles:', parsed.meta.fields);
  console.log('Exemple première ligne:', rows[0]);
  const bugTypes = new Set();

  rows.forEach((row) => {
    const bugType = row['Champs personnalisés (Type de bugs)'];
    if (bugType && typeof bugType === 'string') {
      bugTypes.add(bugType.trim());
    }
  });

  console.log('Types de bugs uniques:', [...bugTypes]);
  console.log('Total lignes:', rows.length);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

