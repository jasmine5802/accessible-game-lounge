$ErrorActionPreference = 'Stop'

$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$url = "https://accessible-game-lounge.onrender.com/game-help.js?nocache=$stamp"
$src = (Invoke-WebRequest -Uri $url -UseBasicParsing).Content

$hasLegacyFallback = $src.Contains("keyCode===89") -and $src.Contains("keyCode===78")
$hasKeypressFallback = $src.Contains("addEventListener('keypress'")
$hasButtonFallback = $src.Contains('Yes (Y or Enter)') -and $src.Contains('No (N or Escape)')

if ($hasLegacyFallback -and $hasKeypressFallback -and $hasButtonFallback) {
  Write-Output 'LIVE_HAS_FULL_PROMPT_FALLBACK_FIX'
} else {
  Write-Output 'LIVE_MISSING_FULL_PROMPT_FALLBACK_FIX'
}
