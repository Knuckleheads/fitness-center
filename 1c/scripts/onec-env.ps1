param()

function Get-OneCConfigValue {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Name
    )

    $line = Get-Content -LiteralPath $Path -Encoding UTF8 | Where-Object { $_ -match "^$Name=" } | Select-Object -First 1
    if (-not $line) { return $null }

    $value = $line -replace "^$Name=", ''
    $value = $value.Trim().Trim('"')
    return $value
}

function Resolve-OneCEnvironment {
    $scriptDir = Split-Path -Parent $PSCommandPath
    $projectDir = Split-Path -Parent $scriptDir
    $configPath = Join-Path $projectDir 'config.env'
    $secretsPath = Join-Path $projectDir 'secrets.env'

    if (-not (Test-Path -LiteralPath $configPath)) {
        throw "config.env not found: $configPath"
    }

    $platformPath = Get-OneCConfigValue -Path $configPath -Name 'PLATFORM_PATH'
    $ibcmdRaw = Get-OneCConfigValue -Path $configPath -Name 'IBCMD'
    $dbType = Get-OneCConfigValue -Path $configPath -Name 'DB_TYPE'
    $dbPath = Get-OneCConfigValue -Path $configPath -Name 'DB_PATH'
    $srcDir = Get-OneCConfigValue -Path $configPath -Name 'SRC_DIR'
    $ibUser = Get-OneCConfigValue -Path $configPath -Name 'IB_USER'
    $ibPassword = $null

    if (Test-Path -LiteralPath $secretsPath) {
        $ibPassword = Get-OneCConfigValue -Path $secretsPath -Name 'IB_PASSWORD'
    }

    $ibcmd = $ibcmdRaw.Replace('${PLATFORM_PATH}', $platformPath)
    $srcDir = $srcDir.Replace('${PROJECT_DIR}', $projectDir)

    [PSCustomObject]@{
        ProjectDir = $projectDir
        IBCmd = $ibcmd
        DBType = $dbType
        DBPath = $dbPath
        SrcDir = $srcDir
        IBUser = $ibUser
        IBPassword = $ibPassword
    }
}

function Get-OneCConnectionArgs {
    param([Parameter(Mandatory = $true)]$Env)

    if ($Env.DBType -ne 'File') {
        throw 'PowerShell scripts currently support only DB_TYPE=File.'
    }

    $args = @("--db-path=$($Env.DBPath)")
    if ($Env.IBUser) {
        $args += @('-u', $Env.IBUser)
        if ($Env.IBPassword) {
            $args += @('-P', $Env.IBPassword)
        }
    }

    return $args
}

