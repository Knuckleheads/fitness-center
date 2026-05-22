. "$PSScriptRoot\onec-env.ps1"

$env1C = Resolve-OneCEnvironment
$connArgs = Get-OneCConnectionArgs -Env $env1C

Write-Host '=== Выгрузка конфигурации 1С ==='
Write-Host "База: $($env1C.DBPath)"
Write-Host "Источник: $($env1C.SrcDir)"

$cmdArgs = @('infobase', 'config', 'export') + $connArgs + @($env1C.SrcDir)
if (Test-Path -LiteralPath (Join-Path $env1C.SrcDir 'ConfigDumpInfo.xml')) {
    $cmdArgs += '--sync'
}

& $env1C.IBCmd @cmdArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
