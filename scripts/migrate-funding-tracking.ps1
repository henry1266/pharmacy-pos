# 資金來源追蹤功能資料庫遷移 PowerShell 腳本
# 執行資料庫遷移以支援新的資金來源追蹤功能

param(
    [string]$Environment = "development",
    [switch]$DryRun = $false,
    [switch]$Force = $false
)

# 設定錯誤處理
$ErrorActionPreference = "Stop"

# 顏色輸出函數
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    $colors = @{
        "Red" = [ConsoleColor]::Red
        "Green" = [ConsoleColor]::Green
        "Yellow" = [ConsoleColor]::Yellow
        "Blue" = [ConsoleColor]::Blue
        "Cyan" = [ConsoleColor]::Cyan
        "Magenta" = [ConsoleColor]::Magenta
        "White" = [ConsoleColor]::White
    }
    
    Write-Host $Message -ForegroundColor $colors[$Color]
}

# 檢查 Node.js 環境
function Test-NodeEnvironment {
    Write-ColorOutput "🔍 檢查 Node.js 環境..." "Cyan"
    
    try {
        $nodeVersion = node --version
        Write-ColorOutput "✅ Node.js 版本: $nodeVersion" "Green"
    }
    catch {
        Write-ColorOutput "❌ 找不到 Node.js，請確保已安裝 Node.js" "Red"
        exit 1
    }
    
    # 檢查是否在正確的目錄
    if (-not (Test-Path "package.json")) {
        Write-ColorOutput "❌ 請在專案根目錄執行此腳本" "Red"
        exit 1
    }
    
    Write-ColorOutput "✅ 環境檢查通過" "Green"
}

# 設定環境變數
function Set-EnvironmentVariables {
    param([string]$Env)
    
    Write-ColorOutput "⚙️ 設定環境變數 ($Env)..." "Cyan"
    
    switch ($Env) {
        "development" {
            $env:NODE_ENV = "development"
            $env:MONGODB_URI = "mongodb://localhost:27017/pharmacy-pos"
        }
        "production" {
            $env:NODE_ENV = "production"
            # 生產環境的 MongoDB URI 應該從安全的地方獲取
            if (-not $env:MONGODB_URI) {
                Write-ColorOutput "⚠️ 生產環境需要設定 MONGODB_URI 環境變數" "Yellow"
            }
        }
        default {
            Write-ColorOutput "❌ 不支援的環境: $Env" "Red"
            exit 1
        }
    }
    
    Write-ColorOutput "✅ 環境變數設定完成" "Green"
    Write-ColorOutput "   NODE_ENV: $env:NODE_ENV" "White"
    Write-ColorOutput "   MONGODB_URI: $env:MONGODB_URI" "White"
}

# 備份資料庫
function Backup-Database {
    Write-ColorOutput "💾 建立資料庫備份..." "Cyan"
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupDir = "backup/funding-tracking-migration_$timestamp"
    
    try {
        # 建立備份目錄
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        
        # 使用 mongodump 備份
        $mongoUri = $env:MONGODB_URI
        if ($mongoUri -match "mongodb://([^/]+)/(.+)") {
            $mongoHost = $matches[1]
            $database = $matches[2]
            
            Write-ColorOutput "   備份資料庫: $database" "White"
            mongodump --host $mongoHost --db $database --out $backupDir
            
            if ($LASTEXITCODE -eq 0) {
                Write-ColorOutput "✅ 資料庫備份完成: $backupDir" "Green"
                return $backupDir
            } else {
                Write-ColorOutput "❌ 資料庫備份失敗" "Red"
                exit 1
            }
        } else {
            Write-ColorOutput "⚠️ 無法解析 MongoDB URI，跳過備份" "Yellow"
            return $null
        }
    }
    catch {
        Write-ColorOutput "⚠️ 備份過程中發生錯誤: $($_.Exception.Message)" "Yellow"
        Write-ColorOutput "⚠️ 繼續執行遷移（風險自負）" "Yellow"
        return $null
    }
}

# 執行遷移
function Invoke-Migration {
    param([bool]$IsDryRun)
    
    if ($IsDryRun) {
        Write-ColorOutput "🧪 執行乾跑模式（不會實際修改資料）..." "Yellow"
    } else {
        Write-ColorOutput "🚀 執行資料庫遷移..." "Cyan"
    }
    
    try {
        # 切換到後端目錄
        Push-Location "backend"
        
        # 執行遷移腳本
        $migrationScript = "scripts/migrate-funding-tracking.js"
        
        if ($IsDryRun) {
            # 乾跑模式：只檢查不修改
            $env:DRY_RUN = "true"
        }
        
        Write-ColorOutput "   執行遷移腳本: $migrationScript" "White"
        node $migrationScript
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ 遷移執行完成" "Green"
        } else {
            Write-ColorOutput "❌ 遷移執行失敗" "Red"
            exit 1
        }
    }
    catch {
        Write-ColorOutput "❌ 遷移過程中發生錯誤: $($_.Exception.Message)" "Red"
        exit 1
    }
    finally {
        Pop-Location
    }
}

# 驗證遷移結果
function Test-MigrationResult {
    Write-ColorOutput "🔍 驗證遷移結果..." "Cyan"
    
    try {
        Push-Location "backend"
        
        # 執行驗證腳本
        $verificationScript = @"
const mongoose = require('mongoose');
const TransactionGroup = require('./models/TransactionGroup');
const AccountingEntry = require('./models/AccountingEntry');

async function verify() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const tgCount = await TransactionGroup.countDocuments({ 
        linkedTransactionIds: { `$exists: true },
        fundingType: { `$exists: true }
    });
    
    const aeCount = await AccountingEntry.countDocuments({
        fundingPath: { `$exists: true }
    });
    
    console.log(`TransactionGroup 已遷移: ${tgCount}`);
    console.log(`AccountingEntry 已遷移: ${aeCount}`);
    
    await mongoose.connection.close();
}

verify().catch(console.error);
"@
        
        $verificationScript | Out-File -FilePath "temp_verify.js" -Encoding UTF8
        node "temp_verify.js"
        Remove-Item "temp_verify.js" -Force
        
        Write-ColorOutput "✅ 遷移結果驗證完成" "Green"
    }
    catch {
        Write-ColorOutput "⚠️ 驗證過程中發生錯誤: $($_.Exception.Message)" "Yellow"
    }
    finally {
        Pop-Location
    }
}

# 主要執行流程
function Main {
    Write-ColorOutput "🎯 資金來源追蹤功能資料庫遷移" "Magenta"
    Write-ColorOutput "=" * 50 "Magenta"
    
    # 顯示參數
    Write-ColorOutput "📋 執行參數:" "Cyan"
    Write-ColorOutput "   環境: $Environment" "White"
    Write-ColorOutput "   乾跑模式: $DryRun" "White"
    Write-ColorOutput "   強制執行: $Force" "White"
    Write-ColorOutput ""
    
    # 確認執行
    if (-not $Force -and -not $DryRun) {
        $confirmation = Read-Host "⚠️ 即將執行資料庫遷移，是否繼續？ (y/N)"
        if ($confirmation -ne "y" -and $confirmation -ne "Y") {
            Write-ColorOutput "❌ 使用者取消執行" "Yellow"
            exit 0
        }
    }
    
    try {
        # 1. 檢查環境
        Test-NodeEnvironment
        
        # 2. 設定環境變數
        Set-EnvironmentVariables -Env $Environment
        
        # 3. 備份資料庫（生產環境或非乾跑模式）
        $backupPath = $null
        if ($Environment -eq "production" -or (-not $DryRun)) {
            $backupPath = Backup-Database
        }
        
        # 4. 執行遷移
        Invoke-Migration -IsDryRun $DryRun
        
        # 5. 驗證結果（非乾跑模式）
        if (-not $DryRun) {
            Test-MigrationResult
        }
        
        Write-ColorOutput ""
        Write-ColorOutput "🎉 資金來源追蹤功能遷移完成！" "Green"
        
        if ($backupPath) {
            Write-ColorOutput "💾 備份位置: $backupPath" "Cyan"
        }
        
        if ($DryRun) {
            Write-ColorOutput "🧪 這是乾跑模式，沒有實際修改資料" "Yellow"
            Write-ColorOutput "   如要執行實際遷移，請移除 -DryRun 參數" "Yellow"
        }
        
    }
    catch {
        Write-ColorOutput ""
        Write-ColorOutput "💥 遷移過程中發生錯誤: $($_.Exception.Message)" "Red"
        
        if ($backupPath) {
            Write-ColorOutput "💾 如需還原，請使用備份: $backupPath" "Cyan"
        }
        
        exit 1
    }
}

# 顯示使用說明
function Show-Help {
    Write-ColorOutput "資金來源追蹤功能資料庫遷移腳本" "Magenta"
    Write-ColorOutput ""
    Write-ColorOutput "使用方式:" "Cyan"
    Write-ColorOutput "  .\scripts\migrate-funding-tracking.ps1 [參數]" "White"
    Write-ColorOutput ""
    Write-ColorOutput "參數:" "Cyan"
    Write-ColorOutput "  -Environment <string>  環境 (development|production) [預設: development]" "White"
    Write-ColorOutput "  -DryRun               乾跑模式，不實際修改資料" "White"
    Write-ColorOutput "  -Force                強制執行，不詢問確認" "White"
    Write-ColorOutput "  -Help                 顯示此說明" "White"
    Write-ColorOutput ""
    Write-ColorOutput "範例:" "Cyan"
    Write-ColorOutput "  .\scripts\migrate-funding-tracking.ps1 -DryRun" "White"
    Write-ColorOutput "  .\scripts\migrate-funding-tracking.ps1 -Environment production -Force" "White"
}

# 檢查是否需要顯示說明
if ($args -contains "-Help" -or $args -contains "--help" -or $args -contains "-h") {
    Show-Help
    exit 0
}

# 執行主程式
Main