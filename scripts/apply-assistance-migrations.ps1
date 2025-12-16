# Script PowerShell pour appliquer toutes les migrations des tickets d'assistance
# Utilise npx supabase pour exécuter chaque fichier SQL

$migrationsDir = "supabase\migrations\assistance-tickets-split"
$dbUrl = "postgresql://postgres:[OnpointGrowthe34#]@db.xjcttqaiplnoalolebls.supabase.co:5432/postgres"

# Récupérer tous les fichiers de migration dans l'ordre
$migrationFiles = Get-ChildItem -Path $migrationsDir -Filter "2025-12-09-sync-assistance-tickets-part-*.sql" | Sort-Object Name

Write-Host "📦 Application de $($migrationFiles.Count) migrations..." -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$errorCount = 0

foreach ($file in $migrationFiles) {
    $partNumber = $file.Name -replace '.*part-(\d+).*', '$1'
    Write-Host "🔄 Application de la partie $partNumber/11 : $($file.Name)" -ForegroundColor Yellow
    
    try {
        # Lire le contenu du fichier SQL
        $sqlContent = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        
        # Utiliser npx supabase pour exécuter le SQL
        $result = $sqlContent | npx supabase db execute --db-url $dbUrl 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Partie $partNumber appliquée avec succès" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "❌ Erreur lors de l'application de la partie $partNumber" -ForegroundColor Red
            Write-Host $result -ForegroundColor Red
            $errorCount++
        }
    } catch {
        Write-Host "❌ Erreur lors de l'application de la partie $partNumber : $_" -ForegroundColor Red
        $errorCount++
    }
    
    Write-Host ""
    Start-Sleep -Seconds 1  # Pause d'une seconde entre chaque migration
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 Résumé :" -ForegroundColor Cyan
Write-Host "  ✅ Succès : $successCount" -ForegroundColor Green
Write-Host "  ❌ Erreurs : $errorCount" -ForegroundColor $(if ($errorCount -eq 0) { "Green" } else { "Red" })
Write-Host "========================================" -ForegroundColor Cyan

if ($errorCount -eq 0) {
    Write-Host ""
    Write-Host "✨ Toutes les migrations ont été appliquées avec succès !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Vérifiez le résultat avec :" -ForegroundColor Yellow
    Write-Host "SELECT COUNT(*) FROM tickets WHERE ticket_type = 'ASSISTANCE';" -ForegroundColor Gray
}

