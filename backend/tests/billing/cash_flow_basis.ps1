# Aceite: cash-flow CASH vs ACCRUAL no mesmo dataset (M4)
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/../lib/Api.ps1"
Reset-AcceptResults

$owner = Connect-AcceptSession -Role Owner
$reception = Connect-AcceptSession -Role Reception
$unitId = Get-AcceptClinicUnitId -Session $reception
$patientId = Find-AcceptPatientId -Session $reception
$inst = Find-AcceptOpenInstallment -Session $reception -PatientId $patientId -MinBalanceCents 200
[void](Ensure-AcceptCashSessionOpen -Session $reception -UnitId $unitId)

$balance = [Math]::Min(400, [int64]$inst.amountCents - [int64]$inst.paidCents)
$pix = [Math]::Floor($balance / 2)
$cash = $balance - $pix
$pay = Invoke-ApiJson -Method POST -Path ("/api/v1/installments/{0}/payments" -f $inst.id) `
  -Token $reception.Token -TenantId $reception.TenantId -IdempotencyKey (New-IdempotencyKey) `
  -Body @{
    amountCents = $balance
    splits      = @(
      @{ method = 'PIX'; amountCents = $pix },
      @{ method = 'CASH'; amountCents = $cash }
    )
  }
Assert-Accept 'cash_flow_seed_payment' ($pay.Status -in @(200, 201)) ("HTTP {0}" -f $pay.Status)

$today = (Get-Date).ToString('yyyy-MM-dd')
$monthStart = ([datetime]::new((Get-Date).Year, (Get-Date).Month, 1)).ToString('yyyy-MM-dd')
$monthEnd = ([datetime]::new((Get-Date).Year, (Get-Date).Month, 1).AddMonths(1).AddDays(-1)).ToString('yyyy-MM-dd')

$cashPath = '/api/v1/reports/cash-flow?from={0}&to={1}&basis=CASH' -f $today, $today
$accPath = '/api/v1/reports/cash-flow?from={0}&to={1}&basis=ACCRUAL' -f $monthStart, $monthEnd

$cashFlow = Invoke-ApiJson -Method GET -Path $cashPath -Token $owner.Token -TenantId $owner.TenantId
$accrual = Invoke-ApiJson -Method GET -Path $accPath -Token $owner.Token -TenantId $owner.TenantId

Assert-Accept 'cash_flow_cash_ok' ($cashFlow.Status -eq 200) ("HTTP {0}" -f $cashFlow.Status)
Assert-Accept 'cash_flow_accrual_ok' ($accrual.Status -eq 200) ("HTTP {0}" -f $accrual.Status)

$inCash = [int64]$cashFlow.Body.data.inflowsCents
$inAcc = [int64]$accrual.Body.data.inflowsCents
Assert-Accept 'cash_flow_inflows_integer' ($inCash -ge 0 -and $inAcc -ge 0) ("CASH={0} ACCRUAL={1}" -f $inCash, $inAcc)
Assert-Accept 'cash_flow_cash_has_inflow' ($inCash -gt 0) ("inflowsCents CASH={0}" -f $inCash)
Assert-Accept 'cash_flow_regimes_present' ($null -ne $cashFlow.Body.data -and $null -ne $accrual.Body.data) ''

$receptionForbidden = Invoke-ApiJson -Method GET -Path $cashPath -Token $reception.Token -TenantId $reception.TenantId
Assert-Accept 'reception_cash_flow_403' ($receptionForbidden.Status -eq 403) ("HTTP {0}" -f $receptionForbidden.Status)

Exit-AcceptSummary
