param(
    [switch]$Apply,
    [switch]$Force
)

. "$PSScriptRoot\onec-env.ps1"

$env1C = Resolve-OneCEnvironment
$connArgs = Get-OneCConnectionArgs -Env $env1C

Write-Host '=== Полная загрузка конфигурации 1С ==='
Write-Host "База: $($env1C.DBPath)"
Write-Host "Источник: $($env1C.SrcDir)"

if (-not $Force) {
    $answer = Read-Host 'Продолжить полный импорт? [y/N]'
    if ($answer -notmatch '^[Yy]$') { Write-Host 'Отменено'; exit 0 }
}

$importArgs = @('infobase', 'config', 'import') + $connArgs + @($env1C.SrcDir)
& $env1C.IBCmd @importArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if ($Apply) {
    $applyArgs = @('infobase', 'config', 'apply') + $connArgs + @('--force', '--dynamic=auto', '--session-terminate=force')
    & $env1C.IBCmd @applyArgs
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
