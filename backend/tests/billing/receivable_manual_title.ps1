# Aceite: titulo manual - soma das parcelas = total
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/../lib/Api.ps1"
Reset-AcceptResults

$session = Connect-AcceptSession -Role Finance
$patientId = Find-AcceptPatientId -Session $session
$total = 10000
$count = 3
$due = (Get-Date).AddDays(7).ToString('yyyy-MM-dd')

$recv = Invoke-ApiJson -Method POST -Path '/api/v1/receivables' `
  -Token $session.Token -TenantId $session.TenantId -IdempotencyKey (New-IdempotencyKey) `
  -Body @{
    patientId        = $patientId
    totalCents       = $total
    installmentCount = $count
    firstDueDate     = $due
    description      = '[accept] titulo manual soma parcelas'
  }

Assert-Accept 'manual_receivable_create' ($recv.Status -in @(200, 201)) ("HTTP {0}" -f $recv.Status)
$receivableId = [string]$recv.Body.data.id
if (-not $receivableId) { $receivableId = [string]$recv.Body.data.receivableId }

# Preferir parcelas do create (lista sem status pode omitir OPEN recentes entre PAID antigos).
$rows = @($recv.Body.data.installments)
if ($rows.Count -eq 0 -and $receivableId) {
  $listPath = '/api/v1/installments?patientId={0}&status=OPEN&limit=50' -f $patientId
  $list = Invoke-ApiJson -Method GET -Path $listPath -Token $session.Token -TenantId $session.TenantId
  $rows = @($list.Body.data) | Where-Object { $_.receivableId -eq $receivableId }
}

$sum = [int64]0
foreach ($r in $rows) { $sum += [int64]$r.amountCents }
Assert-Accept 'manual_installments_count' (@($rows).Count -eq $count) ("count={0}" -f @($rows).Count)
Assert-Accept 'manual_installments_sum' ($sum -eq $total) ("sum={0} total={1}" -f $sum, $total)

Exit-AcceptSummary
