$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "VieNeu Pro.lnk"
$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"C:\Users\dienv\.gemini\antigravity-ide\scratch\vieneu-admin\run_vieneu_pro.vbs`""
$shortcut.IconLocation = "$env:LOCALAPPDATA\VieNeu\vieneu-app.exe,0"
$shortcut.WorkingDirectory = "$env:LOCALAPPDATA\VieNeu"
$shortcut.Description = "Khoi chay VieNeu voi quyen Pro Admin Lifetime"
$shortcut.Save()
Write-Host "Created shortcut successfully: $shortcutPath"
