#Requires -Version 5.1
<#
.SYNOPSIS
  Install dependencies and verify the local toolchain.
#>
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..\..')

function Require-Command([string]$Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command not found: $Name"
    }
}

Require-Command node
Require-Command npm

$nodeVersion = node -p "process.versions.node"
$major = [int]($nodeVersion.Split('.')[0])
if ($major -lt 20) {
    throw "Node.js 20+ is required (found $nodeVersion). CI uses Node 22."
}

Write-Host "Node $nodeVersion detected."
Write-Host "Installing dependencies..."
npm install

Write-Host "Verifying toolchain (astro check)..."
npm run check
if ($LASTEXITCODE -ne 0) { throw "astro check failed." }

Write-Host ""
Write-Host "Setup complete." -ForegroundColor Green
Write-Host "Next: .\scripts\win\dev-tests.ps1"
