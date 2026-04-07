# Run PowerShell as Administrator, then:
#   cd mobile
#   .\scripts\allow-expo-firewall.ps1
# Allows phones on your Wi-Fi to reach Metro (8081) and your Nest API (3000).

$ports = @(8081, 3000)
foreach ($p in $ports) {
  $name = "FinTrack Dev TCP $p"
  $existing = Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue
  if ($existing) {
    Write-Host "Rule already exists: $name"
  } else {
    New-NetFirewallRule -DisplayName $name -Direction Inbound -Action Allow -Protocol TCP -LocalPort $p | Out-Null
    Write-Host "Created firewall rule: $name"
  }
}
Write-Host "Done. Restart Expo (`npx expo start`) and try the QR code again."
