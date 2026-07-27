$roots = @(
  (Join-Path $env:LOCALAPPDATA 'Programs'),
  'C:\Program Files',
  'C:\Program Files (x86)'
)

$matches = @()
foreach ($root in $roots) {
  if (Test-Path $root) {
    $matches += Get-ChildItem -Path $root -Recurse -Filter "Jazzy Jay's Accessible Game Lounge.exe" -ErrorAction SilentlyContinue |
      Select-Object FullName, LastWriteTime
  }
}

if ($matches.Count -eq 0) {
  Write-Output 'No installed executable found in standard install locations.'
} else {
  $matches | Sort-Object LastWriteTime -Descending | Format-Table -AutoSize
}
