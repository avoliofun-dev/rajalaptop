# ==============================================================================
# AUTO PUSH KE GITHUB SETIAP ADA MODIFIKASI
# ==============================================================================
# Script ini memantau perubahan file dan secara otomatis melakukan:
# git add . -> git commit -> git push origin main
# ==============================================================================

param(
    [int]$DebounceSeconds = 3
)

$targetPath = $PSScriptRoot
Set-Location $targetPath

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " 🚀 AUTO-SYNC & AUTO-PUSH GITHUB DIAKTIFKAN" -ForegroundColor Green
Write-Host " Memantau perubahan di: $targetPath" -ForegroundColor Yellow
Write-Host " Tekan CTRL + C untuk berhenti." -ForegroundColor DarkGray
Write-Host "==========================================================" -ForegroundColor Cyan

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $targetPath
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

$ignoredPatterns = @('\.git', '\.next', 'node_modules', '\.env\.local', '\.env')

$script:lastChanged = [DateTime]::MinValue
$script:syncPending = $false

$action = {
    $itemPath = $Event.SourceEventArgs.FullPath
    
    # Lewati file yang diabaikan (.git, node_modules, .next, .env.local)
    foreach ($pattern in $ignoredPatterns) {
        if ($itemPath -match $pattern) {
            return
        }
    }

    $script:lastChanged = [DateTime]::Now
    $script:syncPending = $true
}

Register-ObjectEvent $watcher "Changed" -Action $action | Out-Null
Register-ObjectEvent $watcher "Created" -Action $action | Out-Null
Register-ObjectEvent $watcher "Deleted" -Action $action | Out-Null
Register-ObjectEvent $watcher "Renamed" -Action $action | Out-Null

while ($true) {
    Start-Sleep -Seconds 1

    if ($script:syncPending -and ([DateTime]::Now - $script:lastChanged).TotalSeconds -ge $DebounceSeconds) {
        $script:syncPending = $false
        
        $status = git status --porcelain
        if ($status) {
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            Write-Host "`n[$timestamp] 📝 Terdeteksi perubahan file, memproses push..." -ForegroundColor Yellow
            
            git add .
            git commit -m "auto: sinkronisasi otomatis per $timestamp"
            
            Write-Host "🚀 Mendorong ke GitHub (main)..." -ForegroundColor Cyan
            $pushResult = git push origin main 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Berhasil terpush ke GitHub!" -ForegroundColor Green
            } else {
                Write-Host "⚠️ Gagal push ke GitHub: $pushResult" -ForegroundColor Red
            }
        }
    }
}
