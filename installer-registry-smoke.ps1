$ErrorActionPreference = 'Stop'

$productName = "Jazzy Jay's Accessible Game Lounge"
$installer = Join-Path (Resolve-Path '.\dist').Path 'AccessibleGameLounge Setup 1.0.21.exe'
if (!(Test-Path $installer)) { throw "Installer not found: $installer" }

function Get-UninstallEntries {
  $paths = @(
    'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*',
    'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*',
    'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*'
  )
  foreach ($path in $paths) {
    Get-ItemProperty -Path $path -ErrorAction SilentlyContinue |
      Where-Object { $_.DisplayName -eq $productName } |
      Select-Object PSPath, DisplayName, DisplayVersion, InstallLocation, UninstallString, QuietUninstallString
  }
}

function Invoke-Uninstall {
  param(
    [Parameter(Mandatory = $true)]
    $Entry
  )

  $uninstallCmd = if ($Entry.QuietUninstallString) { $Entry.QuietUninstallString } else { $Entry.UninstallString }
  if (-not $uninstallCmd) {
    throw 'No uninstall command found in registry entry.'
  }

  if ($uninstallCmd -notmatch '/S') { $uninstallCmd = "$uninstallCmd /S" }
  Write-Output "Running uninstall command: $uninstallCmd"
  $uProc = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $uninstallCmd -PassThru -Wait
  Write-Output "Uninstaller exit code: $($uProc.ExitCode)"
  if ($uProc.ExitCode -notin @(0, 3010)) {
    throw "Uninstaller returned non-success exit code: $($uProc.ExitCode)"
  }
}

function Get-UninstallExePath {
  param(
    [string]$Command
  )

  if (-not $Command) { return $null }
  if ($Command -match '^"([^"]+)"') { return $matches[1] }
  return ($Command -split ' ')[0]
}

$before = @(Get-UninstallEntries)
$baselinePaths = @($before | ForEach-Object { $_.PSPath })
Write-Output "Entries before install: $($before.Count)"

$proc = Start-Process -FilePath $installer -ArgumentList '/S', '/CURRENTUSER' -PassThru -Wait
Write-Output "Installer exit code: $($proc.ExitCode)"
if ($proc.ExitCode -notin @(0, 3010)) {
  throw "Installer returned non-success exit code: $($proc.ExitCode)"
}

$afterInstall = @(Get-UninstallEntries)
Write-Output "Entries after install: $($afterInstall.Count)"
$newEntries = @($afterInstall | Where-Object { $baselinePaths -notcontains $_.PSPath })
Write-Output "New entries from this install: $($newEntries.Count)"
if ($newEntries.Count -lt 1) {
  throw 'Installer did not create a new uninstall entry.'
}

$entry = $newEntries | Select-Object -First 1
Write-Output "Installed version: $($entry.DisplayVersion)"
if ($entry.InstallLocation) { Write-Output "Install location: $($entry.InstallLocation)" }

$exeCandidates = @()
if ($entry.InstallLocation -and (Test-Path $entry.InstallLocation)) {
  $exeCandidates += Get-ChildItem -Path $entry.InstallLocation -Filter '*.exe' -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notlike '*Uninstall*' } |
    Select-Object -ExpandProperty FullName
}
if ($exeCandidates.Count -eq 0) {
  $roots = @((Join-Path $env:LOCALAPPDATA 'Programs'), 'C:\Program Files', 'C:\Program Files (x86)')
  foreach ($root in $roots) {
    if (Test-Path $root) {
      $exeCandidates += Get-ChildItem -Path $root -Recurse -Filter '*.exe' -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like '*Accessible*Game*Lounge*.exe' -or $_.FullName -like '*Accessible Game Lounge*' } |
        Select-Object -ExpandProperty FullName
    }
  }
}

if ($exeCandidates.Count -lt 1) {
  throw 'Installed executable was not discovered.'
}

$exePath = $exeCandidates[0]
Write-Output "Installed executable found: $exePath"

Invoke-Uninstall -Entry $entry

$afterUninstall = @(Get-UninstallEntries)
Write-Output "Entries after uninstall: $($afterUninstall.Count)"
$remainingNewEntries = @($afterUninstall | Where-Object { $baselinePaths -notcontains $_.PSPath })
Write-Output "New entries remaining after uninstall: $($remainingNewEntries.Count)"
if ($remainingNewEntries.Count -gt 0) {
  Write-Output 'Uninstall entries left from this smoke test:'
  $remainingNewEntries | Select-Object PSPath, DisplayVersion, InstallLocation, UninstallString, QuietUninstallString | Format-List
  throw 'Uninstall entry from smoke test still exists after uninstall.'
}

Write-Output 'Installer registry/install/uninstall smoke check passed.'
