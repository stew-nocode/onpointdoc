# Script PowerShell pour ouvrir la page Brevo et copier la plage IP
# Usage: .\scripts\brevo-add-ip-range.ps1

$plageIP = "2001:42d8:3205:5100::/64"
$urlBrevo = "https://app.brevo.com/security/authorised_ips"

Write-Host "🔗 Ouverture de la page de configuration Brevo..." -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Plage IP à ajouter : $plageIP" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Instructions :" -ForegroundColor Green
Write-Host "1. La plage IP va être copiée dans votre presse-papiers"
Write-Host "2. Collez-la dans le champ 'Adresse IP' sur la page Brevo"
Write-Host "3. Cliquez sur 'Ajouter' ou 'Save'"
Write-Host ""
Write-Host "🌐 URL : $urlBrevo" -ForegroundColor Blue

# Copier dans le presse-papiers
$plageIP | Set-Clipboard
Write-Host "✅ Plage IP copiée dans le presse-papiers !" -ForegroundColor Green

# Ouvrir le navigateur
Start-Process $urlBrevo

Write-Host ""
Write-Host "✅ Page ouverte dans votre navigateur par défaut" -ForegroundColor Green
Write-Host "📋 La plage IP est dans votre presse-papiers, collez-la (Ctrl+V) dans le formulaire" -ForegroundColor Yellow

