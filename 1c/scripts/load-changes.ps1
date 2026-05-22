param(
    [switch]$Apply,
    [switch]$Force
)

. "$PSScriptRoot\onec-env.ps1"

$env1C = Resolve-OneCEnvironment
$connArgs = Get-OneCConnectionArgs -Env $env1C
Push-Location $env1C.ProjectDir
try {
    $changedFiles = git status --porcelain -- src/ | ForEach-Object { ($_ -split '\s+', 3)[-1] } | Where-Object { $_ }
    if (-not $changedFiles) {
        Write-Host 'Нет изменённых файлов в src/'
        exit 0
    }

    Write-Host '=== Частичная загрузка изменений 1С ==='
    Write-Host "База: $($env1C.DBPath)"
    $changedFiles | Select-Object -First 20 | ForEach-Object { Write-Host $_ }

    if (-not $Force) {
        $answer = Read-Host 'Загрузить изменения? [y/N]'
        if ($answer -notmatch '^[Yy]$') { Write-Host 'Отменено'; exit 0 }
    }

    $filesRel = $changedFiles | Where-Object { $_ -like 'src/*' } | ForEach-Object { $_.Substring(4) }
    $importArgs = @('infobase', 'config', 'import', 'files') + $connArgs + @("--base-dir=$($env1C.SrcDir)", '--partial') + $filesRel
    & $env1C.IBCmd @importArgs
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    if ($Apply) {
        $applyArgs = @('infobase', 'config', 'apply') + $connArgs + @('--force', '--dynamic=auto', '--session-terminate=force')
        & $env1C.IBCmd @applyArgs
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
} finally {
    Pop-Location
}
