$ErrorActionPreference = 'Stop'

$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$url = "https://accessible-game-lounge.onrender.com/game-help.js?nocache=$stamp"
$src = (Invoke-WebRequest -Uri $url -UseBasicParsing).Content

$hasNewYesNoLabels = $src.Contains("Yes") -and $src.Contains("No")
$hasMonopolyLoadingGuard = $src.Contains("Loading Monopoly table settings. Please wait.")
$hasLegacyKeyFallback = $src.Contains("keyCode===89") -and $src.Contains("keyCode===78")

Write-Output ("hasNewYesNoLabels=" + $hasNewYesNoLabels)
Write-Output ("hasMonopolyLoadingGuard=" + $hasMonopolyLoadingGuard)
Write-Output ("hasLegacyKeyFallback=" + $hasLegacyKeyFallback)

if ($hasNewYesNoLabels -and $hasMonopolyLoadingGuard -and $hasLegacyKeyFallback) {
  Write-Output 'LIVE_HAS_RS_PROMPT_AND_MONOPOLY_FIX'
} else {
  Write-Output 'LIVE_MISSING_RS_PROMPT_AND_MONOPOLY_FIX'
}
