#Requires -Version 5.1
<#
.SYNOPSIS
  Run the full pre-publish verification suite.
#>
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..\..')

if (-not (Test-Path 'node_modules')) {
    Write-Host "node_modules not found - running setup first..."
    & (Join-Path $PSScriptRoot 'dev-setup.ps1')
}

$steps = @(
    @{ Name = 'Type check';           Command = 'npm run check' },
    @{ Name = 'Unit tests';           Command = 'npm run test:unit' },
    @{ Name = 'Integration tests';    Command = 'npm run test:integration' },
    @{ Name = 'Production build';     Command = 'npm run build' }
)
foreach ($step in $steps) {
    Write-Host ""
    Write-Host "=== $($step.Name) ===" -ForegroundColor Cyan
    Invoke-Expression $step.Command
    if ($LASTEXITCODE -ne 0) {
        throw "$($step.Name) failed with exit code $LASTEXITCODE"
    }
}

Write-Host ""
Write-Host "All checks passed. Safe to commit and push to main." -ForegroundColor Green
