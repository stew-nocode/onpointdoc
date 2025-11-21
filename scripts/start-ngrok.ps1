# Script PowerShell pour demarrer ngrok avec verifications
# Usage: .\scripts\start-ngrok.ps1

Write-Host ""
Write-Host "[INFO] Verification de l'environnement..." -ForegroundColor Cyan
Write-Host ""

# Verifier que ngrok est installe
try {
    $ngrokVersion = ngrok version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "ngrok non trouve"
    }
    Write-Host "[OK] ngrok est installe" -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] ngrok n'est pas installe ou non trouve dans le PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Options d'installation:" -ForegroundColor Yellow
    Write-Host "   1. winget install ngrok.ngrok" -ForegroundColor White
    Write-Host "   2. Telecharger depuis https://ngrok.com/download" -ForegroundColor White
    Write-Host "   3. choco install ngrok" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Verifier que Next.js est demarre
Write-Host "[INFO] Verification que Next.js est actif sur le port 3000..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "[OK] Next.js est actif sur le port 3000" -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] Next.js n'est pas demarre sur le port 3000" -ForegroundColor Red
    Write-Host ""
    Write-Host "Demarrez d'abord Next.js dans un autre terminal:" -ForegroundColor Yellow
    Write-Host "   npm run dev" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "[INFO] Demarrage de ngrok..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Instructions:" -ForegroundColor Yellow
Write-Host "   1. Copiez l'URL HTTPS affichee par ngrok (ex: https://xxxx.ngrok-free.app)" -ForegroundColor White
Write-Host "   2. Configurez le webhook JIRA avec cette URL: https://xxxx.ngrok-free.app/api/webhooks/jira" -ForegroundColor White
Write-Host "   3. Interface ngrok: http://127.0.0.1:4040 (pour voir les requetes)" -ForegroundColor White
Write-Host ""
Write-Host "[ATTENTION] Gardez ce terminal ouvert pendant les tests!" -ForegroundColor Yellow
Write-Host ""

# Demarrer ngrok
ngrok http 3000

