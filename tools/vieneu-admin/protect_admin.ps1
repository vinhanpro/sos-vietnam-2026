# ============================================================
# VieNeu Admin Config Protector
# Tự động khôi phục account.json nếu bị ghi đè
# Chạy: powershell -ExecutionPolicy Bypass -File protect_admin.ps1
# ============================================================

$configDir  = "$env:LOCALAPPDATA\com.vieneu.app"
$targetFile = Join-Path $configDir "account.json"
$backupFile = Join-Path $configDir "account_admin.json"

# --- Lưu bản admin nếu chưa có ---
if (-not (Test-Path $backupFile)) {
    Copy-Item $targetFile $backupFile -Force
    Write-Host "[INIT] Saved admin backup: $backupFile"
}

Write-Host "[WATCH] Monitoring $targetFile for changes..."
Write-Host "[WATCH] Press Ctrl+C to stop.`n"

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $configDir
$watcher.Filter = "account.json"
$watcher.NotifyFilter = [System.IO.NotifyFilters]::LastWrite -bor [System.IO.NotifyFilters]::Size
$watcher.EnableRaisingEvents = $false

while ($true) {
    $result = $watcher.WaitForChanged([System.IO.WatcherChangeTypes]::Changed, 2000)

    if (-not $result.TimedOut) {
        Start-Sleep -Milliseconds 500  # Chờ app ghi xong

        # Kiểm tra xem file có bị ghi đè về "free" không
        try {
            $current = Get-Content $targetFile -Raw -Encoding UTF8 | ConvertFrom-Json
            if ($current.tier -ne "VieNeu Pro" -or $current.is_lifetime -ne $true) {
                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] DETECTED: Config overwritten (tier=$($current.tier)). Restoring admin..."

                # Xóa read-only flag tạm thời
                Set-ItemProperty $targetFile -Name IsReadOnly -Value $false

                # Ghi đè lại bản admin
                Copy-Item $backupFile $targetFile -Force

                # Đặt lại read-only
                Set-ItemProperty $targetFile -Name IsReadOnly -Value $true

                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] RESTORED: Admin config restored successfully!"
            } else {
                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] OK: Config unchanged (tier=VieNeu Pro)"
            }
        } catch {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ERROR: $_"
        }
    }
}
