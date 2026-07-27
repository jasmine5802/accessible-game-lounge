$ErrorActionPreference = 'Stop'

$installer = Join-Path (Resolve-Path '.\dist').Path 'AccessibleGameLounge Setup 1.0.21.exe'
if (!(Test-Path $installer)) { throw "Installer not found: $installer" }

$installDir = 'C:\Temp\AGLInstallSmoke'
if (Test-Path $installDir) { Remove-Item -Recurse -Force $installDir }
New-Item -ItemType Directory -Force -Path $installDir | Out-Null

& $installer /S /D=$installDir
Start-Sleep -Seconds 2

if (!(Test-Path $installDir)) { throw 'Install directory missing after install.' }

$exe = Get-ChildItem -Path $installDir -Filter '*.exe' | Where-Object { $_.Name -notlike '*Uninstall*' } | Select-Object -First 1
if (-not $exe) { throw 'Installed app executable not found.' }

$uninstaller = Get-ChildItem -Path $installDir -Filter '*Uninstall*.exe' | Select-Object -First 1
if (-not $uninstaller) { throw 'Uninstaller executable not found.' }

Write-Output "Installed executable: $($exe.FullName)"
Write-Output "Uninstaller: $($uninstaller.FullName)"

& $uninstaller.FullName /S
Start-Sleep -Seconds 2

if (Test-Path $installDir) {
  Write-Output 'Install folder still exists after uninstall (leftover files/settings possible).'
  Get-ChildItem -Path $installDir -Force | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize
} else {
  Write-Output 'Install folder removed after uninstall.'
}
