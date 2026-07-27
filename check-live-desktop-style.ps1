$ErrorActionPreference = 'Stop'

$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$url = "https://accessible-game-lounge.onrender.com/lounge-accessibility.js?nocache=$stamp"
$src = (Invoke-WebRequest -Uri $url -UseBasicParsing).Content

$hasDesktopShell = $src.Contains('lounge-client-shell') -and $src.Contains('lounge-client-menubar')
$hasSightedStates = $src.Contains('button:hover') -and $src.Contains('button:active') -and $src.Contains('button:disabled')
$hasFocusEnhancement = $src.Contains('li:focus-visible') -and $src.Contains('.space:focus-visible')

Write-Output ("hasDesktopShell=" + $hasDesktopShell)
Write-Output ("hasSightedStates=" + $hasSightedStates)
Write-Output ("hasFocusEnhancement=" + $hasFocusEnhancement)

if ($hasDesktopShell -and $hasSightedStates -and $hasFocusEnhancement) {
  Write-Output 'LIVE_HAS_RS_DESKTOP_STYLE_UPDATE'
} else {
  Write-Output 'LIVE_MISSING_RS_DESKTOP_STYLE_UPDATE'
}
