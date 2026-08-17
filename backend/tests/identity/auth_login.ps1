# Smoke de login do consultório de teste (identity)
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/../lib/Api.ps1"
Reset-AcceptResults

foreach ($role in @('Owner', 'Reception', 'Finance', 'Dentist', 'Assistant')) {
  try {
    $s = Connect-AcceptSession -Role $role
    Assert-Accept "login_$role" ($s.Token -and $s.TenantId) "tenant=$($s.TenantId)"
  } catch {
    Assert-Accept "login_$role" $false $_.Exception.Message
  }
}

Exit-AcceptSummary
