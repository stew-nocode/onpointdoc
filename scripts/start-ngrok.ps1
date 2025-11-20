# Script PowerShell pour démarrer ngrok avec vérifications
# Usage: .\scripts\start-ngrok.ps1

Write-Host ""
Write-Host "🔍 Vérification de l'environnement..." -ForegroundColor Cyan
Write-Host ""

# Vérifier que ngrok est installé
try {
    $ngrokVersion = ngrok version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "ngrok non trouvé"
    }
    Write-Host "✅ ngrok est installé" -ForegroundColor Green
} catch {
    Write-Host "❌ ngrok n'est pas installé ou non trouvé dans le PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Options d'installation:" -ForegroundColor Yellow
    Write-Host "   1. winget install ngrok.ngrok" -ForegroundColor White
    Write-Host "   2. Télécharger depuis https://ngrok.com/download" -ForegroundColor White
    Write-Host "   3. choco install ngrok" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Vérifier que Next.js est démarré
Write-Host "🔍 Vérification que Next.js est actif sur le port 3000..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Next.js est actif sur le port 3000" -ForegroundColor Green
} catch {
    Write-Host "❌ Next.js n'est pas démarré sur le port 3000" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Démarrez d'abord Next.js dans un autre terminal:" -ForegroundColor Yellow
    Write-Host "   npm run dev" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "🚀 Démarrage de ngrok..." -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Instructions:" -ForegroundColor Yellow
Write-Host "   1. Copiez l'URL HTTPS affichée par ngrok (ex: https://xxxx.ngrok-free.app)" -ForegroundColor White
Write-Host "   2. Configurez le webhook JIRA avec cette URL: https://xxxx.ngrok-free.app/api/webhooks/jira" -ForegroundColor White
Write-Host "   3. Interface ngrok: http://127.0.0.1:4040 (pour voir les requêtes)" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Gardez ce terminal ouvert pendant les tests!" -ForegroundColor Yellow
Write-Host ""

# Démarrer ngrok
ngrok http 3000

