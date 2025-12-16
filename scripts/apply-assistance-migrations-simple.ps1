# Script PowerShell simplifié pour appliquer les migrations via l'API Supabase
# Alternative : Utilise directement l'API Supabase pour exécuter le SQL

$migrationsDir = "supabase\migrations\assistance-tickets-split"

# Récupérer tous les fichiers de migration dans l'ordre
$migrationFiles = Get-ChildItem -Path $migrationsDir -Filter "2025-12-09-sync-assistance-tickets-part-*.sql" | Sort-Object Name

Write-Host "📦 $($migrationFiles.Count) fichiers de migration trouvés" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Instructions pour appliquer les migrations :" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1 : Via l'éditeur SQL Supabase (Recommandé)" -ForegroundColor Green
Write-Host "  1. Allez sur https://supabase.com/dashboard/project/xjcttqaiplnoalolebls/sql/new" -ForegroundColor Gray
Write-Host "  2. Ouvrez chaque fichier dans l'ordre (part-01 à part-11)" -ForegroundColor Gray
Write-Host "  3. Copiez-collez le contenu et exécutez" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2 : Via npx supabase" -ForegroundColor Green
Write-Host "  Exécutez : .\scripts\apply-assistance-migrations.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "Fichiers à exécuter dans l'ordre :" -ForegroundColor Yellow
$counter = 1
foreach ($file in $migrationFiles) {
    $size = [math]::Round($file.Length / 1KB, 2)
    Write-Host "  $counter. $($file.Name) ($size KB)" -ForegroundColor Gray
    $counter++
}

