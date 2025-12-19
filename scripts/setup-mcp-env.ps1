#!/usr/bin/env pwsh
# Script de configuration des variables d'environnement pour les MCP
# Usage: .\scripts\setup-mcp-env.ps1

Write-Host "🔧 Configuration des variables MCP pour OnpointDoc" -ForegroundColor Cyan
Write-Host ""

$envFile = ".env.local"

# Vérifier si .env.local existe
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Fichier $envFile introuvable. Créez-le d'abord." -ForegroundColor Red
    exit 1
}

Write-Host "📝 Fichier $envFile trouvé" -ForegroundColor Green
Write-Host ""

# Fonction pour vérifier si une variable existe déjà
function Test-EnvVariable {
    param($varName)
    $content = Get-Content $envFile -Raw
    return $content -match "^$varName="
}

# Fonction pour ajouter une variable
function Add-EnvVariable {
    param($varName, $prompt)

    if (Test-EnvVariable $varName) {
        Write-Host "✅ $varName déjà configuré" -ForegroundColor Green
        return
    }

    Write-Host "❓ $prompt" -ForegroundColor Yellow
    $value = Read-Host "Valeur"

    if ([string]::IsNullOrWhiteSpace($value)) {
        Write-Host "⏭️  Ignoré (valeur vide)" -ForegroundColor Gray
        return
    }

    Add-Content -Path $envFile -Value "`n# --- $varName (ajouté par setup-mcp-env.ps1) ---"
    Add-Content -Path $envFile -Value "$varName=`"$value`""
    Write-Host "✅ $varName ajouté" -ForegroundColor Green
}

# Configuration des variables
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "1️⃣  Configuration Supabase Database" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour trouver le mot de passe :"
Write-Host "1. Va sur https://app.supabase.com"
Write-Host "2. Ouvre ton projet 'xjcttqaiplnoalolebls'"
Write-Host "3. Settings → Database → Connection string"
Write-Host "4. Copie le mot de passe depuis l'URL PostgreSQL"
Write-Host ""

Add-EnvVariable "SUPABASE_DB_PASSWORD" "Mot de passe Supabase Database"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "2️⃣  Configuration GitHub Token" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour créer un token :"
Write-Host "1. Va sur https://github.com/settings/tokens"
Write-Host "2. Generate new token (classic)"
Write-Host "3. Permissions : repo (Full control) + workflow"
Write-Host "4. Copie le token 'ghp_...'"
Write-Host ""

Add-EnvVariable "GITHUB_TOKEN" "GitHub Personal Access Token"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "3️⃣  Configuration JIRA Auth Basic" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Vérifier si JIRA_AUTH_BASIC existe déjà
if (-not (Test-EnvVariable "JIRA_AUTH_BASIC")) {
    # Récupérer les credentials JIRA existants
    $content = Get-Content $envFile -Raw
    if ($content -match 'JIRA_API_EMAIL="([^"]+)"') {
        $jiraEmail = $matches[1]
    }
    if ($content -match 'JIRA_API_TOKEN="([^"]+)"') {
        $jiraToken = $matches[1]
    }

    if ($jiraEmail -and $jiraToken) {
        Write-Host "✅ Credentials JIRA trouvés dans $envFile" -ForegroundColor Green
        Write-Host "   Email: $jiraEmail"
        Write-Host "   Token: $($jiraToken.Substring(0, 20))..." -ForegroundColor Gray
        Write-Host ""

        # Générer JIRA_AUTH_BASIC
        $jiraCredentials = "${jiraEmail}:${jiraToken}"
        $jiraAuthBasic = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($jiraCredentials))

        Add-Content -Path $envFile -Value "`n# --- JIRA Auth Basic (ajouté par setup-mcp-env.ps1) ---"
        Add-Content -Path $envFile -Value "JIRA_AUTH_BASIC=`"$jiraAuthBasic`""
        Write-Host "✅ JIRA_AUTH_BASIC généré automatiquement" -ForegroundColor Green
    } else {
        Write-Host "⚠️  JIRA_API_EMAIL ou JIRA_API_TOKEN introuvable dans $envFile" -ForegroundColor Yellow
        Write-Host "   Génération manuelle requise :"
        Write-Host "   echo -n 'email:token' | base64" -ForegroundColor Gray
    }
} else {
    Write-Host "✅ JIRA_AUTH_BASIC déjà configuré" -ForegroundColor Green
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Configuration terminée !" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Prochaines étapes :" -ForegroundColor Yellow
Write-Host "1. Redémarre Claude Code pour charger les nouveaux MCP"
Write-Host "2. Vérifie les MCP actifs avec : /mcp"
Write-Host "3. Consulte la documentation : docs/MCP-CONFIGURATION.md"
Write-Host ""
Write-Host "🔒 Sécurité : Ne commite JAMAIS .env.local dans Git !" -ForegroundColor Red
Write-Host ""
