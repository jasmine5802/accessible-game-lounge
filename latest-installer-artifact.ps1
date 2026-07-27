$ErrorActionPreference = 'Stop'
Get-ChildItem -Path .\dist -File -Filter "AccessibleGameLounge Setup *.exe" |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1 FullName, Name, LastWriteTime, Length |
  Format-List
