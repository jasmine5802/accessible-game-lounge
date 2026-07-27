$ErrorActionPreference = 'Stop'

$proc = Get-Process | Where-Object {
  $_.ProcessName -like '*Accessible*Game*Lounge*' -or
  ($_.Path -and $_.Path -like '*accessible-game-lounge*')
} | Select-Object -First 1

if (-not $proc) {
  Write-Output 'APP_PROCESS_NOT_FOUND'
  exit 0
}

Write-Output ('PROC_NAME=' + $proc.ProcessName)
Write-Output ('PROC_ID=' + $proc.Id)
if ($proc.Path) { Write-Output ('PROC_PATH=' + $proc.Path) }

$conns = Get-NetTCPConnection -State Established -OwningProcess $proc.Id -ErrorAction SilentlyContinue
if (-not $conns) {
  Write-Output 'NO_ESTABLISHED_CONNECTIONS'
} else {
  foreach ($c in $conns) {
    Write-Output ('CONN=' + $c.LocalAddress + ':' + $c.LocalPort + ' -> ' + $c.RemoteAddress + ':' + $c.RemotePort)
  }
}

$listens = Get-NetTCPConnection -State Listen -OwningProcess $proc.Id -ErrorAction SilentlyContinue
if (-not $listens) {
  Write-Output 'NO_LISTEN_PORTS'
} else {
  foreach ($l in $listens) {
    Write-Output ('LISTEN=' + $l.LocalAddress + ':' + $l.LocalPort)
  }
}
