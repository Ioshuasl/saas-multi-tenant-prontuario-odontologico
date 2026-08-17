# Aceite: close com diferenca sem motivo 422; diferenca com motivo OK
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/../lib/Api.ps1"
Reset-AcceptResults

$session = Connect-AcceptSession -Role Reception
$unitId = Get-AcceptClinicUnitId -Session $session
[void](Ensure-AcceptCashSessionOpen -Session $session -UnitId $unitId)

$currentPath = '/api/v1/cash-sessions/current?unitId={0}' -f $unitId
$cur = Invoke-ApiJson -Method GET -Path $currentPath -Token $session.Token -TenantId $session.TenantId
$sid = [string]$cur.Body.data.id
$expected = @($cur.Body.data.expectedByMethod)
if (-not $expected -or $expected.Count -eq 0) {
  $expected = @(@{ method = 'CASH'; expectedCents = [int64]$cur.Body.data.expectedCents })
}

$badCount = @($expected) | ForEach-Object {
  @{ method = $_.method; countedCents = ([int64]$_.expectedCents) + 500 }
}

$noReason = Invoke-ApiJson -Method POST -Path ("/api/v1/cash-sessions/{0}/close" -f $sid) `
  -Token $session.Token -TenantId $session.TenantId -IdempotencyKey (New-IdempotencyKey) `
  -Body @{ countedByMethod = @($badCount); differenceReason = '' }
$code = $null
if ($noReason.Body.error) { $code = $noReason.Body.error.code }
Assert-Accept 'close_diff_without_reason_422' ($noReason.Status -eq 422) ("HTTP {0} code={1}" -f $noReason.Status, $code)

$withReason = Invoke-ApiJson -Method POST -Path ("/api/v1/cash-sessions/{0}/close" -f $sid) `
  -Token $session.Token -TenantId $session.TenantId -IdempotencyKey (New-IdempotencyKey) `
  -Body @{
    countedByMethod  = @($badCount)
    differenceReason = 'divergencia registrada no aceite de codigo S6'
  }
Assert-Accept 'close_diff_with_reason_ok' ($withReason.Status -in @(200, 201)) ("HTTP {0}" -f $withReason.Status)

Exit-AcceptSummary
