$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $projectRoot
& "$projectRoot/.venv/Scripts/python.exe" -m pytest backend/tests -q
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& "$projectRoot/.venv/Scripts/python.exe" scripts/check_environment.py
