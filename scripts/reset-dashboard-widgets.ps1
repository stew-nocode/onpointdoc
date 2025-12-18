# Script pour reinitialiser la configuration des widgets du dashboard
# Ajoute automatiquement tous les nouveaux widgets definis dans default-widgets.ts

Write-Host "Reinitialisation de la configuration des widgets..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/dashboard/widgets/initialize" `
                                   -Method POST `
                                   -ContentType "application/json" `
                                   -UseBasicParsing

    if ($response.success) {
        Write-Host "Widgets reinitialises avec succes !" -ForegroundColor Green
        Write-Host ""
        Write-Host "Le widget 'BUGs par Type' a ete ajoute a votre configuration." -ForegroundColor Green
        Write-Host ""
        Write-Host "Rechargez la page du dashboard pour voir les changements." -ForegroundColor Yellow
    } else {
        Write-Host "Erreur : $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "Erreur lors de la requete : $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Assurez-vous que :" -ForegroundColor Yellow
    Write-Host "   1. Le serveur est demarre (npm run dev)" -ForegroundColor White
    Write-Host "   2. Vous etes connecte en tant qu'admin" -ForegroundColor White
    Write-Host "   3. Vous avez recharge la page du dashboard au moins une fois" -ForegroundColor White
}
