# Aceite: papeis - DENTIST/ASB/recepcao sem finance sensivel; FINANCE OK
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/../lib/Api.ps1"
Reset-AcceptResults

$today = (Get-Date).ToString('yyyy-MM-dd')
$monthStart = ([datetime]::new((Get-Date).Year, (Get-Date).Month, 1)).ToString('yyyy-MM-dd')
$monthEnd = ([datetime]::new((Get-Date).Year, (Get-Date).Month, 1).AddMonths(1).AddDays(-1)).ToString('yyyy-MM-dd')
$flowPath = '/api/v1/reports/cash-flow?from={0}&to={1}&basis=CASH' -f $today, $today
$prodPath = '/api/v1/reports/production?from={0}&to={1}' -f $monthStart, $monthEnd

$dentist = Connect-AcceptSession -Role Dentist
$asb = Connect-AcceptSession -Role Assistant
$reception = Connect-AcceptSession -Role Reception
$finance = Connect-AcceptSession -Role Finance

$dPay = Invoke-ApiJson -Method GET -Path '/api/v1/installments?limit=5' -Token $dentist.Token -TenantId $dentist.TenantId
Assert-Accept 'dentist_installments_403' ($dPay.Status -eq 403) ("HTTP {0}" -f $dPay.Status)

$dCash = Invoke-ApiJson -Method GET -Path '/api/v1/cash-sessions/current' -Token $dentist.Token -TenantId $dentist.TenantId
Assert-Accept 'dentist_cash_403' ($dCash.Status -in @(400, 403, 422)) ("HTTP {0}" -f $dCash.Status)

$dFlow = Invoke-ApiJson -Method GET -Path $flowPath -Token $dentist.Token -TenantId $dentist.TenantId
Assert-Accept 'dentist_cash_flow_403' ($dFlow.Status -eq 403) ("HTTP {0}" -f $dFlow.Status)

$prod = Invoke-ApiJson -Method GET -Path $prodPath -Token $dentist.Token -TenantId $dentist.TenantId
Assert-Accept 'dentist_production_ok' ($prod.Status -eq 200) ("HTTP {0}" -f $prod.Status)

$aInst = Invoke-ApiJson -Method GET -Path '/api/v1/installments?limit=5' -Token $asb.Token -TenantId $asb.TenantId
Assert-Accept 'asb_finance_403' ($aInst.Status -eq 403) ("HTTP {0}" -f $aInst.Status)

$rFlow = Invoke-ApiJson -Method GET -Path $flowPath -Token $reception.Token -TenantId $reception.TenantId
Assert-Accept 'reception_cash_flow_403' ($rFlow.Status -eq 403) ("HTTP {0}" -f $rFlow.Status)

$fFlow = Invoke-ApiJson -Method GET -Path $flowPath -Token $finance.Token -TenantId $finance.TenantId
Assert-Accept 'finance_cash_flow_ok' ($fFlow.Status -eq 200) ("HTTP {0}" -f $fFlow.Status)

$overdue = Invoke-ApiJson -Method GET -Path '/api/v1/reports/overdue' -Token $finance.Token -TenantId $finance.TenantId
Assert-Accept 'finance_overdue_ok' ($overdue.Status -eq 200) ("HTTP {0}" -f $overdue.Status)

$buckets = @($overdue.Body.data.aging)
if ($buckets -and $buckets.Count -gt 0) {
  $ok = $false
  foreach ($b in $buckets) {
    $name = [string]($b.bucket)
    if (-not $name) { $name = [string]($b.label) }
    if (-not $name) { $name = [string]($b.range) }
    if ($name -match '15|30|60') { $ok = $true }
  }
  Assert-Accept 'overdue_aging_buckets' $ok ''
} else {
  Assert-Accept 'overdue_aging_buckets' ($null -ne $overdue.Body.data) 'data presente'
}

Exit-AcceptSummary
