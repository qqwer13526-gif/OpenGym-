param([switch]$Dev)
$ErrorActionPreference='Stop'
Set-Location $PSScriptRoot
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCommand) { $nodePath=$nodeCommand.Source } else { $nodePath=Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' }
if (!(Test-Path $nodePath)) { throw '请先安装 Node.js 20.9 或更高版本。' }
$env:NEXT_TELEMETRY_DISABLED='1'
if (!(Test-Path 'node_modules/next/dist/bin/next')) { throw '缺少依赖，请先运行 pnpm install。' }
if ($Dev) { & $nodePath node_modules/next/dist/bin/next dev --hostname 127.0.0.1 }
else {
 if (!(Test-Path '.next/BUILD_ID')) { & $nodePath node_modules/next/dist/bin/next build; if ($LASTEXITCODE -ne 0) { throw '前端构建失败。' } }
 & $nodePath node_modules/next/dist/bin/next start --hostname 127.0.0.1
}
