$exePath = "$env:LOCALAPPDATA\VieNeu\vieneu-app.exe"
$bytes = [System.IO.File]::ReadAllBytes($exePath)
$text = [System.Text.Encoding]::ASCII.GetString($bytes)

Write-Host "--- Looking for features near tts/dialogue ---"
$matches = [regex]::Matches($text, '(\b(tts|dialogue|dubbing|lecture|audiobook|agent|server|cloning)\b)', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
$matches | Select-Object -First 30 -ExpandProperty Value | Select-Object -Unique

Write-Host "--- Looking for json schema around Account ---"
$matches2 = [regex]::Matches($text, '\{[^{}]{0,100}"tier"[^{}]{0,100}\}')
$matches2 | Select-Object -First 10 -ExpandProperty Value
