#Requires -Version 5.1
<#
.SYNOPSIS
  Install dependencies and verify the local toolchain.
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
