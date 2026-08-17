<#
.SYNOPSIS
  Runner de aceite de código HTTP contra API local (backend/tests).

.DESCRIPTION
  Estrutura:
    backend/tests/<modulo>/<funcao>.ps1
    backend/tests/lib/Api.ps1          # login, curl, asserts
    backend/tests/Invoke-Acceptance.ps1

  Exemplos:
    # Lista scripts de um módulo
    .\Invoke-Acceptance.ps1 -Module billing -List

    # Roda um script
    .\Invoke-Acceptance.ps1 -Module billing -Name payment_idempotency

    # Roda todos os .ps1 de um módulo (exceto Run-*.ps1)
    .\Invoke-Acceptance.ps1 -Module billing

    # Pedido ad-hoc (sem script): login + GET/POST
    .\Invoke-Acceptance.ps1 -AdHoc -Role Reception -Method GET -Path '/api/v1/installments?limit=5'

  Variáveis:
    ACCEPT_API_URL  (default http://localhost:3333)
#>
[CmdletBinding(DefaultParameterSetName = 'Module')]
param(
  [Parameter(ParameterSetName = 'Module')]
  [string]$Module = '',

  [Parameter(ParameterSetName = 'Module')]
  [string]$Name = '',

  [Parameter(ParameterSetName = 'Module')]
  [switch]$List,

  [Parameter(ParameterSetName = 'AdHoc', Mandatory)]
  [switch]$AdHoc,

  [Parameter(ParameterSetName = 'AdHoc')]
  [ValidateSet('Owner', 'Reception', 'Finance', 'Dentist', 'Assistant')]
  [string]$Role = 'Owner',

  [Parameter(ParameterSetName = 'AdHoc')]
  [ValidateSet('GET', 'POST', 'PUT', 'PATCH', 'DELETE')]
  [string]$Method = 'GET',

  [Parameter(ParameterSetName = 'AdHoc', Mandatory)]
  [string]$Path,

  [Parameter(ParameterSetName = 'AdHoc')]
  [string]$BodyJson = ''
)

$ErrorActionPreference = 'Stop'
$testsRoot = $PSScriptRoot
. "$testsRoot/lib/Api.ps1"

function Get-ModuleScripts {
  param([Parameter(Mandatory)][string]$ModuleName)
  $dir = Join-Path $testsRoot $ModuleName
  if (-not (Test-Path $dir)) { throw "módulo não encontrado: $ModuleName (pasta $dir)" }
  Get-ChildItem -Path $dir -Filter '*.ps1' -File |
    Where-Object { $_.Name -notlike 'Run-*.ps1' -and $_.Name -notlike '_*' } |
    Sort-Object Name
}

if ($PSCmdlet.ParameterSetName -eq 'AdHoc') {
  $session = Connect-AcceptSession -Role $Role
  $body = $null
  if ($BodyJson) { $body = $BodyJson }
  $res = Invoke-ApiJson -Method $Method -Path $Path -Token $session.Token -TenantId $session.TenantId -Body $body
  Write-Host "HTTP $($res.Status)"
  if ($res.Text) { Write-Host $res.Text }
  if ($res.Status -ge 400) { exit 1 }
  exit 0
}

if (-not $Module) {
  Write-Host 'Módulos disponíveis:'
  Get-ChildItem -Path $testsRoot -Directory |
    Where-Object { $_.Name -ne 'lib' } |
    ForEach-Object { Write-Host "  - $($_.Name)" }
  Write-Host ''
  Write-Host 'Uso: .\Invoke-Acceptance.ps1 -Module <nome> [-Name <script>] [-List]'
  Write-Host '     .\Invoke-Acceptance.ps1 -AdHoc -Role Owner -Method GET -Path /api/v1/clinic'
  exit 0
}

$scripts = @(Get-ModuleScripts -ModuleName $Module)
if ($List) {
  Write-Host "Scripts em $Module`:"
  if ($scripts.Count -eq 0) { Write-Host '  (nenhum ainda)' }
  else { $scripts | ForEach-Object { Write-Host "  - $($_.BaseName)" } }
  exit 0
}
if ($scripts.Count -eq 0) {
  Write-Host "Nenhum script em ${Module}. Crie backend/tests/${Module}/<funcao>.ps1"
  exit 0
}

if ($Name) {
  $target = $scripts | Where-Object { $_.BaseName -eq $Name } | Select-Object -First 1
  if (-not $target) { throw "script '$Name' nao encontrado em ${Module}" }
  Write-Host ">>> ${Module}/$($target.BaseName)"
  & $target.FullName
  exit $LASTEXITCODE
}

$failed = 0
foreach ($s in $scripts) {
  Write-Host ''
  Write-Host "========== ${Module}/$($s.BaseName) =========="
  & $s.FullName
  if ($LASTEXITCODE -ne 0) { $failed++ }
}
Write-Host ''
if ($failed -gt 0) {
  Write-Host "Modulo ${Module}: $failed script(s) com falha"
  exit 1
}
Write-Host "Modulo ${Module}: todos os scripts OK"
exit 0
