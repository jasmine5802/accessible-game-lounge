$ErrorActionPreference = 'Stop'

$productName = "Jazzy Jay's Accessible Game Lounge"
$paths = @(
  'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*',
  'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*',
  'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*'
)

foreach ($path in $paths) {
  Get-ItemProperty -Path $path -ErrorAction SilentlyContinue |
    Where-Object { $_.DisplayName -eq $productName } |
    ForEach-Object {
      $cmd = if ($_.QuietUninstallString) { $_.QuietUninstallString } else { $_.UninstallString }
      $uninstallExe = if ($cmd -match '^"([^"]+)"') { $matches[1] } else { ($cmd -split ' ')[0] }
      [pscustomobject]@{
        PSPath = $_.PSPath
        DisplayVersion = $_.DisplayVersion
        InstallLocation = $_.InstallLocation
        UninstallString = $_.UninstallString
        QuietUninstallString = $_.QuietUninstallString
        UninstallExePath = $uninstallExe
        UninstallExeExists = if ($uninstallExe) { Test-Path $uninstallExe } else { $false }
      }
    } |
    Format-List
}
