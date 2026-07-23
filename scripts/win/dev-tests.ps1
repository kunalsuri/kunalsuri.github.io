#Requires -Version 5.1
<#
.SYNOPSIS
  Run the full pre-publish verification suite.
#>
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..\..')

# Filter out inaccessible directories and variables from admin-local to prevent Node EPERM errors
if ($env:NVM_HOME -like '*admin-local*') {
    Remove-Item env:NVM_HOME -ErrorAction SilentlyContinue
}

# Auto-detect user fnm Node installation if available to avoid broken system NVM symlinks
$userFnmDir = Join-Path $env:APPDATA 'fnm\node-versions'
if (Test-Path $userFnmDir) {
    $fnmNodes = Get-ChildItem -Path $userFnmDir -Directory -ErrorAction SilentlyContinue
    if ($fnmNodes) {
        $latestFnm = ($fnmNodes | Sort-Object Name -Descending)[0]
        $nodeBin = Join-Path $latestFnm.FullName 'installation'
        if (Test-Path $nodeBin) {
            $env:PATH = "$nodeBin;$env:PATH"
        }
    }
}

$env:PATH = ($env:PATH -split ';' | Where-Object { $_ -and ($_ -notlike '*admin-local*') }) -join ';'



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
