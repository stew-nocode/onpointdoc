import csv
import json
import sys

# Les données JSON seront passées en argument ou lues depuis un fichier
# Pour l'instant, on va créer un script qui génère le CSV

def escape_csv_value(value):
    if value is None:
        return ''
    str_value = str(value)
    if ',' in str_value or '"' in str_value or '\n' in str_value:
        return f'"{str_value.replace('"', '""')}"'
    return str_value

# Headers
headers = [
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
]

# Pour l'instant, créer un fichier vide avec les headers
# L'utilisateur pourra ensuite utiliser le script Node.js avec les bonnes variables d'env
with open('tickets-2025-12-09.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(headers)
    print(f"✅ Fichier CSV créé avec les headers: tickets-2025-12-09.csv")
    print("ℹ️  Utilisez le script Node.js pour remplir les données")






