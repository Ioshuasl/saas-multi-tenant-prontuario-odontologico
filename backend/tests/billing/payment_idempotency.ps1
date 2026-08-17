# Aceite: duplo POST payment mesma Idempotency-Key = 1 payment + 1 receipt_number
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/../lib/Api.ps1"
Reset-AcceptResults

$session = Connect-AcceptSession -Role Reception
$unitId = Get-AcceptClinicUnitId -Session $session
$patientId = Find-AcceptPatientId -Session $session
$inst = Find-AcceptOpenInstallment -Session $session -PatientId $patientId
[void](Ensure-AcceptCashSessionOpen -Session $session -UnitId $unitId)

$balance = [int64]$inst.amountCents - [int64]$inst.paidCents
$pix = [Math]::Floor($balance / 2)
$cash = $balance - $pix
$key = New-IdempotencyKey
$body = @{
  amountCents = $balance
  splits      = @(
    @{ method = 'PIX'; amountCents = $pix },
    @{ method = 'CASH'; amountCents = $cash }
  )
}

$payPath = "/api/v1/installments/{0}/payments" -f $inst.id
$a = Invoke-ApiJson -Method POST -Path $payPath `
  -Token $session.Token -TenantId $session.TenantId -IdempotencyKey $key -Body $body
$b = Invoke-ApiJson -Method POST -Path $payPath `
  -Token $session.Token -TenantId $session.TenantId -IdempotencyKey $key -Body $body

Assert-Accept 'payment_idempotency_first_2xx' ($a.Status -in @(200, 201)) ("HTTP {0}" -f $a.Status)
Assert-Accept 'payment_idempotency_replay_2xx' ($b.Status -in @(200, 201)) ("HTTP {0}" -f $b.Status)

$idA = [string]$a.Body.data.paymentId
$idB = [string]$b.Body.data.paymentId
$rnA = $a.Body.data.receiptNumber
$rnB = $b.Body.data.receiptNumber

Assert-Accept 'payment_idempotency_same_payment_id' ($idA -and $idA -eq $idB) ("{0} vs {1}" -f $idA, $idB)
Assert-Accept 'payment_idempotency_same_receipt_number' ($null -ne $rnA -and $rnA -eq $rnB) ("{0} vs {1}" -f $rnA, $rnB)

$other = Invoke-ApiJson -Method POST -Path $payPath `
  -Token $session.Token -TenantId $session.TenantId -IdempotencyKey $key `
  -Body @{ amountCents = 100; splits = @(@{ method = 'PIX'; amountCents = 100 }) }
$otherCode = $null
if ($other.Body.error) { $otherCode = $other.Body.error.code }
Assert-Accept 'payment_idempotency_reuse_conflict' ($other.Status -eq 409) ("HTTP {0} code={1}" -f $other.Status, $otherCode)

Exit-AcceptSummary
