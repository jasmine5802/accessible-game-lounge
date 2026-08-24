$ErrorActionPreference = 'Stop'

$package = Get-Content -Raw '.\package.json' | ConvertFrom-Json
$installer = Join-Path (Resolve-Path '.\dist').Path "AccessibleGameLounge Setup $($package.version).exe"
if (!(Test-Path $installer)) { throw "Installer not found: $installer" }
$desktop = [Environment]::GetFolderPath('Desktop')
if ([string]::IsNullOrWhiteSpace($desktop)) {
  $desktop = Join-Path $env:USERPROFILE 'Desktop'
}
$shortcutName = "Jazzy Jay's Accessible Game Lounge.lnk"
$shortcutCandidates = @(
  (Join-Path $desktop $shortcutName),
  (Join-Path ([Environment]::GetFolderPath('CommonDesktopDirectory')) $shortcutName)
) | Select-Object -Unique
$shortcutStateBefore = @{}
foreach ($candidate in $shortcutCandidates) {
  $shortcutStateBefore[$candidate] = Test-Path -LiteralPath $candidate
}

$installDir = Join-Path ([IO.Path]::GetTempPath()) ("AGLInstallSmoke-" + [Guid]::NewGuid().ToString('N'))
$resolvedTemp = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$resolvedInstallDir = [IO.Path]::GetFullPath($installDir)
if (!$resolvedInstallDir.StartsWith($resolvedTemp, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Smoke-test path must stay inside the temporary directory: $resolvedInstallDir"
}
New-Item -ItemType Directory -Force -Path $installDir | Out-Null

Start-Process -FilePath $installer -ArgumentList '/S', "/D=$installDir" -WindowStyle Hidden -Wait
Start-Sleep -Seconds 2

if (!(Test-Path $installDir)) { throw 'Install directory missing after install.' }

$exe = Get-ChildItem -Path $installDir -Filter '*.exe' | Where-Object { $_.Name -notlike '*Uninstall*' } | Select-Object -First 1
if (-not $exe) { throw 'Installed app executable not found.' }

$uninstaller = Get-ChildItem -Path $installDir -Filter '*Uninstall*.exe' | Select-Object -First 1
if (-not $uninstaller) { throw 'Uninstaller executable not found.' }
$shortcut = $shortcutCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (!$shortcut) { throw "Desktop shortcut was not created in a personal or shared Desktop location: $($shortcutCandidates -join ', ')" }

Write-Output "Installed executable: $($exe.FullName)"
Write-Output "Uninstaller: $($uninstaller.FullName)"
Write-Output "Desktop shortcut: $shortcut"

Start-Process -FilePath $uninstaller.FullName -ArgumentList '/S' -WindowStyle Hidden -Wait
for ($attempt = 0; $attempt -lt 30 -and (Test-Path $installDir); $attempt++) {
  Start-Sleep -Seconds 1
}

if (Test-Path $installDir) {
  Write-Output 'Install folder still exists after uninstall (leftover files/settings possible).'
  Get-ChildItem -Path $installDir -Force | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize
} else {
  Write-Output 'Install folder removed after uninstall.'
}
foreach ($candidate in $shortcutCandidates) {
  if (!$shortcutStateBefore[$candidate] -and (Test-Path -LiteralPath $candidate)) {
    throw "Desktop shortcut remains after uninstall: $candidate"
  }
}
