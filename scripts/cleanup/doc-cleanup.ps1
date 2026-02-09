<#
.SYNOPSIS
    AeonSage Document Cleanup Script
    
.DESCRIPTION
    Safely organizes temporary files, backups, and audit directories
    into .local/ without affecting build, pack, or deployment.
    
.PARAMETER Preview
    Preview mode - only shows what would be done (default)
    
.PARAMETER Execute
    Actually execute the cleanup operations
    
.PARAMETER Restore
    Restore files from .local/ back to original locations

.EXAMPLE
    .\doc-cleanup.ps1 -Preview
    .\doc-cleanup.ps1 -Execute
#>

param(
    [switch]$Preview = $true,
    [switch]$Execute,
    [switch]$Restore
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$LocalDir = Join-Path $RootDir ".local"
$ConfigPath = Join-Path $ScriptDir "cleanup.config.json"

# Colors
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }

# Load config
if (-not (Test-Path $ConfigPath)) {
    Write-Err "Config file not found: $ConfigPath"
    exit 1
}

$Config = Get-Content $ConfigPath | ConvertFrom-Json

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║          AeonSage Doc Cleanup System v1.0                ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

if ($Execute) {
    Write-Warn "EXECUTE MODE - Files will be moved!"
    $Confirm = Read-Host "Type 'YES' to confirm"
    if ($Confirm -ne "YES") {
        Write-Info "Cancelled."
        exit 0
    }
} else {
    Write-Info "PREVIEW MODE - No files will be moved"
    Write-Info "Use -Execute to actually move files"
}

Write-Host ""

# Ensure .local directory structure
$Subdirs = @("archive", "backups", "temp", "configs", "docs-private")
foreach ($sub in $Subdirs) {
    $path = Join-Path $LocalDir $sub
    if ($Execute -and -not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
        Write-Success "Created: .local/$sub/"
    }
}

# Process rules
foreach ($rule in $Config.rules) {
    Write-Host ""
    Write-Info "Rule: $($rule.id) - $($rule.description)"
    
    $patterns = if ($rule.pattern -is [array]) { $rule.pattern } else { @($rule.pattern) }
    
    foreach ($pattern in $patterns) {
        $items = Get-ChildItem -Path $RootDir -Filter $pattern -ErrorAction SilentlyContinue
        
        foreach ($item in $items) {
            $relativePath = $item.Name
            $targetDir = Join-Path $RootDir $rule.target
            $targetPath = Join-Path $targetDir $item.Name
            
            if ($Execute) {
                if (-not (Test-Path $targetDir)) {
                    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
                }
                Move-Item -Path $item.FullName -Destination $targetPath -Force
                Write-Success "Moved: $relativePath -> $($rule.target)$($item.Name)"
            } else {
                Write-Host "  Would move: $relativePath -> $($rule.target)$($item.Name)" -ForegroundColor Gray
            }
        }
    }
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor DarkGray

if ($Execute) {
    Write-Success "Cleanup complete!"
    Write-Info "Run 'git status' to verify no tracked files were affected"
} else {
    Write-Info "Preview complete. Use -Execute to apply changes."
}
