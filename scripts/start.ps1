<#
.SYNOPSIS
    Starts Label Studio for the Crochet label project.

.DESCRIPTION
    Uses the repo-local virtualenv and keeps all runtime data inside the repo
    (.label-studio/, gitignored) rather than the default location under
    %LOCALAPPDATA%, so the whole setup is self-contained and easy to reset.

    Reads .env if present — see .env.example for the recognised keys.

.EXAMPLE
    .\scripts\start.ps1
    .\scripts\start.ps1 -Port 9000
#>
[CmdletBinding()]
param(
    [int]$Port,
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$labelStudioExe = Join-Path $repoRoot '.venv\Scripts\label-studio.exe'
if (-not (Test-Path $labelStudioExe)) {
    Write-Error @"
No virtualenv found at .venv\ (or label-studio isn't installed in it)

Create it with:
  & "`$env:LOCALAPPDATA\Programs\Python\Python312\python.exe" -m venv .venv
  .\.venv\Scripts\python.exe -m pip install -r requirements.txt
"@
}

# Load .env (KEY=VALUE, # comments, blank lines ignored) into this process.
$envFile = Join-Path $repoRoot '.env'
if (Test-Path $envFile) {
    Write-Host "Loading .env" -ForegroundColor DarkGray
    foreach ($line in Get-Content $envFile) {
        $trimmed = $line.Trim()
        if ($trimmed -eq '' -or $trimmed.StartsWith('#')) { continue }
        $split = $trimmed.IndexOf('=')
        if ($split -lt 1) { continue }
        $key = $trimmed.Substring(0, $split).Trim()
        $value = $trimmed.Substring($split + 1).Trim().Trim('"').Trim("'")
        Set-Item -Path "Env:$key" -Value $value
    }
}

# Defaults, applied only where .env didn't already set something.
if (-not $env:LABEL_STUDIO_BASE_DATA_DIR) {
    $env:LABEL_STUDIO_BASE_DATA_DIR = Join-Path $repoRoot '.label-studio'
}
if (-not $env:COLLECT_ANALYTICS) { $env:COLLECT_ANALYTICS = 'false' }

# -Port beats .env beats the 8080 default.
if ($PSBoundParameters.ContainsKey('Port')) {
    $env:LABEL_STUDIO_PORT = $Port
}
if (-not $env:LABEL_STUDIO_PORT) { $env:LABEL_STUDIO_PORT = '8080' }

# A relative data dir would resolve against Label Studio's cwd; make it absolute.
if (-not [System.IO.Path]::IsPathRooted($env:LABEL_STUDIO_BASE_DATA_DIR)) {
    $env:LABEL_STUDIO_BASE_DATA_DIR =
        Join-Path $repoRoot $env:LABEL_STUDIO_BASE_DATA_DIR
}
New-Item -ItemType Directory -Force -Path $env:LABEL_STUDIO_BASE_DATA_DIR | Out-Null

$url = "http://localhost:$($env:LABEL_STUDIO_PORT)"

Write-Host ""
Write-Host "  Label Studio" -ForegroundColor Cyan
Write-Host "  url       $url"
Write-Host "  data dir  $($env:LABEL_STUDIO_BASE_DATA_DIR)"
Write-Host "  labeling  label-config\crochet-pattern-ner.xml"
Write-Host ""
Write-Host "  Ctrl+C to stop." -ForegroundColor DarkGray
Write-Host ""

# Not $args — that name collides with the automatic variable.
$lsArgs = @('start', '--port', $env:LABEL_STUDIO_PORT)
if ($NoBrowser) { $lsArgs += '--no-browser' }

# Non-interactive bootstrap of the first account, if .env supplies credentials.
if ($env:LABEL_STUDIO_USERNAME -and $env:LABEL_STUDIO_PASSWORD) {
    $lsArgs += @(
        '--username', $env:LABEL_STUDIO_USERNAME,
        '--password', $env:LABEL_STUDIO_PASSWORD
    )
}

& $labelStudioExe @lsArgs
exit $LASTEXITCODE
