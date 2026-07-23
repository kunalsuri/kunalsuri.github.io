#Requires -Version 5.1
<#
.SYNOPSIS
  Start the Astro dev server at http://localhost:4321
#>
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..\..')

if (-not (Test-Path 'node_modules')) {
    Write-Host "node_modules not found - running setup first..."
    & (Join-Path $PSScriptRoot 'dev-setup.ps1')
}

Write-Host "Starting dev server at http://localhost:4321"
Write-Host "Press Ctrl+C to stop."
npm run dev
