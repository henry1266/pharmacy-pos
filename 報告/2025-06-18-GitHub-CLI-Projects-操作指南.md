# GitHub CLI Projects 操作指南 - TypeScript 轉型專案管理

## 概述
本指南將展示如何使用 GitHub CLI 來管理 TypeScript 轉型專案的 GitHub Projects，實現自動化的專案管理和進度追蹤。

---

## 前置準備

### 1. 安裝 GitHub CLI
```bash
# Windows (使用 winget)
winget install --id GitHub.cli

# macOS (使用 Homebrew)
brew install gh

# Linux (Ubuntu/Debian)
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

### 2. 認證和設定
```bash
# 登入 GitHub
gh auth login

# 設定預設 repository (在專案根目錄執行)
gh repo set-default

# 檢查認證狀態
gh auth status
```

---

## 建立 TypeScript 轉型專案

### 1. 建立新的 GitHub Project
```bash
# 建立新專案
gh project create --title "TypeScript 轉型專案" --body "藥局POS系統 JavaScript 轉 TypeScript 專案管理"

# 或者建立組織層級的專案
gh project create --owner "your-org" --title "TypeScript 轉型專案" --body "藥局POS系統 JavaScript 轉 TypeScript 專案管理"
```

### 2. 取得專案資訊
```bash
# 列出所有專案
gh project list

# 取得特定專案詳情
gh project view [PROJECT_NUMBER]

# 取得專案 URL
gh project view [PROJECT_NUMBER] --format json | jq -r '.url'
```

---

## 設定專案結構

### 1. 建立自訂欄位
```bash
# 建立階段欄位 (Single Select)
gh project field-create [PROJECT_NUMBER] --name "階段" --type "single_select" --single-select-option "階段一：基礎設置" --single-select-option "階段二：型別定義" --single-select-option "階段三：Hooks轉換" --single-select-option "階段四：共用元件" --single-select-option "階段五：業務元件" --single-select-option "階段六：頁面元件" --single-select-option "階段七：入口檔案" --single-select-option "階段八：測試優化"

# 建立優先級欄位
gh project field-create [PROJECT_NUMBER] --name "優先級" --type "single_select" --single-select-option "高" --single-select-option "中" --single-select-option "低"

# 建立預估時間欄位
gh project field-create [PROJECT_NUMBER] --name "預估時間" --type "single_select" --single-select-option "0.5天" --single-select-option "1天" --single-select-option "2天" --single-select-option "3天" --single-select-option "1週"

# 建立負責人欄位
gh project field-create [PROJECT_NUMBER] --name "負責人" --type "text"

# 建立完成百分比欄位
gh project field-create [PROJECT_NUMBER] --name "完成度" --type "single_select" --single-select-option "0%" --single-select-option "25%" --single-select-option "50%" --single-select-option "75%" --single-select-option "100%"
```

### 2. 建立專案檢視
```bash
# 建立按階段分組的檢視
gh project view-create [PROJECT_NUMBER] --name "按階段檢視" --layout "table"

# 建立看板檢視
gh project view-create [PROJECT_NUMBER] --name "進度看板" --layout "board"
```

---

## 批量建立 Issues

### 1. 建立 Issues 建立腳本
```bash
# 建立腳本檔案
cat > create_typescript_issues.sh << 'EOF'
#!/bin/bash

PROJECT_NUMBER="1"  # 替換為您的專案編號
REPO="your-username/your-repo"  # 替換為您的 repository

# 階段一：基礎設置
echo "建立階段一 Issues..."
gh issue create --title "安裝 TypeScript 核心依賴" --body "安裝 typescript, @types/react, @types/react-dom, @types/node" --label "typescript,setup" --assignee "@me"
gh issue create --title "安裝 Redux 相關型別定義" --body "安裝 @types/react-redux, @types/redux, @types/redux-thunk" --label "typescript,setup" --assignee "@me"
gh issue create --title "建立 tsconfig.json 配置檔案" --body "設定 TypeScript 編譯選項和專案配置" --label "typescript,config" --assignee "@me"
gh issue create --title "建立型別定義資料夾結構" --body "建立 src/types/ 資料夾和基礎型別檔案" --label "typescript,setup" --assignee "@me"

# 階段二：型別定義
echo "建立階段二 Issues..."
gh issue create --title "建立 API 相關型別定義" --body "定義 ApiResponse, ErrorResponse, PaginationParams 等型別" --label "typescript,types" --assignee "@me"
gh issue create --title "建立業務實體型別定義" --body "定義 Employee, Product, Sale, Inventory 等業務型別" --label "typescript,types" --assignee "@me"
gh issue create --title "建立表單型別定義" --body "定義各種表單的型別介面" --label "typescript,types" --assignee "@me"
gh issue create --title "建立 Redux 狀態型別定義" --body "定義 RootState 和各模組的 State 型別" --label "typescript,types,redux" --assignee "@me"

# 階段三：服務層轉換
echo "建立服務層轉換 Issues..."
services=("apiService" "authService" "employeeAccountService" "employeeService" "productService" "salesService" "inventoryService" "accountingService" "customerService" "supplierService" "reportsService" "dashboardService")

for service in "${services[@]}"; do
    gh issue create --title "轉換 ${service}.js 為 TypeScript" --body "將 src/services/${service}.js 轉換為 ${service}.ts，添加適當的型別註解" --label "typescript,service" --assignee "@me"
done

# 階段四：工具函數轉換
echo "建立工具函數轉換 Issues..."
utils=("apiConfig" "calendarUtils" "dataTransformations" "roleUtils" "workHoursUtils" "overtimeDataProcessor" "configSync")

for util in "${utils[@]}"; do
    gh issue create --title "轉換 ${util}.js 為 TypeScript" --body "將 src/utils/${util}.js 轉換為 ${util}.ts，添加適當的型別註解" --label "typescript,utils" --assignee "@me"
done

# 階段五：Hooks 轉換
echo "建立 Hooks 轉換 Issues..."
hooks=("useAccountingData" "useDashboardData" "useEmployeeAccounts" "useInventoryData" "useProductData" "useSalesData" "useReportsData" "useSupplierData" "useEmployeeScheduling" "useOvertimeData" "useOvertimeManager" "useScheduleOperations" "useScheduleCalculations" "useWorkHoursCalculation" "useSaleManagement" "useSaleEditManagement" "useSalesEditData" "useKeyboardNavigation" "usePurchaseOrderData" "usePurchaseOrdersData" "usePurchaseOrderItems" "useShippingOrdersData")

for hook in "${hooks[@]}"; do
    gh issue create --title "轉換 ${hook}.js 為 TypeScript" --body "將 src/hooks/${hook}.js 轉換為 ${hook}.ts，添加適當的型別註解" --label "typescript,hooks" --assignee "@me"
done

echo "所有 Issues 建立完成！"
EOF

# 給腳本執行權限
chmod +x create_typescript_issues.sh

# 執行腳本
./create_typescript_issues.sh
```

### 2. 將 Issues 加入專案
```bash
# 取得所有相關 Issues
gh issue list --label "typescript" --json number,title | jq -r '.[] | "\(.number) \(.title)"'

# 批量將 Issues 加入專案
gh issue list --label "typescript" --json number | jq -r '.[].number' | while read issue_number; do
    gh project item-add [PROJECT_NUMBER] --url "https://github.com/your-username/your-repo/issues/$issue_number"
done
```

---

## 專案管理自動化腳本

### 1. 更新 Issue 狀態腳本
```bash
cat > update_issue_status.sh << 'EOF'
#!/bin/bash

PROJECT_NUMBER="1"
ISSUE_NUMBER="$1"
STATUS="$2"  # Todo, In Progress, Done
STAGE="$3"   # 階段一, 階段二, etc.

if [ $# -lt 2 ]; then
    echo "使用方式: $0 <issue_number> <status> [stage]"
    echo "狀態選項: Todo, 'In Progress', Done"
    exit 1
fi

# 更新 Issue 狀態
gh project item-edit --project-id [PROJECT_NUMBER] --id [ITEM_ID] --field-id "Status" --single-select-option-id "$STATUS"

# 如果提供了階段，也更新階段
if [ ! -z "$3" ]; then
    gh project item-edit --project-id [PROJECT_NUMBER] --id [ITEM_ID] --field-id "階段" --single-select-option-id "$STAGE"
fi

echo "Issue #$ISSUE_NUMBER 狀態已更新為: $STATUS"
EOF

chmod +x update_issue_status.sh
```

### 2. 進度報告腳本
```bash
cat > generate_progress_report.sh << 'EOF'
#!/bin/bash

PROJECT_NUMBER="1"

echo "=== TypeScript 轉型專案進度報告 ==="
echo "生成時間: $(date)"
echo ""

# 取得專案統計
echo "## 整體統計"
total_items=$(gh project item-list $PROJECT_NUMBER --format json | jq length)
echo "總任務數: $total_items"

# 按狀態統計
echo ""
echo "## 按狀態統計"
gh project item-list $PROJECT_NUMBER --format json | jq -r '
    group_by(.status.name) | 
    map({status: .[0].status.name, count: length}) | 
    .[] | 
    "- \(.status): \(.count) 項"
'

# 按階段統計
echo ""
echo "## 按階段統計"
gh project item-list $PROJECT_NUMBER --format json | jq -r '
    group_by(.stage.name) | 
    map({stage: .[0].stage.name, count: length}) | 
    .[] | 
    "- \(.stage): \(.count) 項"
'

# 計算完成百分比
completed=$(gh project item-list $PROJECT_NUMBER --format json | jq '[.[] | select(.status.name == "Done")] | length')
if [ $total_items -gt 0 ]; then
    percentage=$((completed * 100 / total_items))
    echo ""
    echo "## 完成度"
    echo "已完成: $completed/$total_items ($percentage%)"
fi

echo ""
echo "=== 報告結束 ==="
EOF

chmod +x generate_progress_report.sh
```

### 3. 自動化工作流程腳本
```bash
cat > typescript_workflow.sh << 'EOF'
#!/bin/bash

PROJECT_NUMBER="1"

# 函數：開始工作
start_work() {
    local issue_number=$1
    echo "開始處理 Issue #$issue_number"
    
    # 更新狀態為進行中
    gh issue edit $issue_number --add-label "in-progress"
    
    # 在專案中更新狀態
    # gh project item-edit ... (需要取得 item ID)
    
    echo "Issue #$issue_number 已標記為進行中"
}

# 函數：完成工作
complete_work() {
    local issue_number=$1
    echo "完成 Issue #$issue_number"
    
    # 更新狀態為完成
    gh issue edit $issue_number --add-label "completed" --remove-label "in-progress"
    gh issue close $issue_number
    
    echo "Issue #$issue_number 已標記為完成並關閉"
}

# 函數：建立 Pull Request
create_pr() {
    local branch_name=$1
    local issue_number=$2
    local title=$3
    
    echo "為 Issue #$issue_number 建立 Pull Request"
    
    gh pr create --title "$title" --body "Closes #$issue_number" --head "$branch_name" --base "main"
    
    echo "Pull Request 已建立"
}

# 主選單
case "$1" in
    "start")
        start_work $2
        ;;
    "complete")
        complete_work $2
        ;;
    "pr")
        create_pr $2 $3 "$4"
        ;;
    "report")
        ./generate_progress_report.sh
        ;;
    *)
        echo "使用方式:"
        echo "  $0 start <issue_number>              - 開始處理 Issue"
        echo "  $0 complete <issue_number>           - 完成 Issue"
        echo "  $0 pr <branch> <issue> <title>       - 建立 PR"
        echo "  $0 report                            - 生成進度報告"
        ;;
esac
EOF

chmod +x typescript_workflow.sh
```

---

## 進階自動化

### 1. GitHub Actions 整合
```yaml
# .github/workflows/typescript-migration.yml
name: TypeScript Migration Progress

on:
  issues:
    types: [closed]
  pull_request:
    types: [merged]

jobs:
  update-progress:
    runs-on: ubuntu-latest
    if: contains(github.event.issue.labels.*.name, 'typescript') || contains(github.event.pull_request.labels.*.name, 'typescript')
    
    steps:
    - name: Update Project Progress
      run: |
        # 更新專案進度
        gh project item-edit --project-id ${{ vars.PROJECT_ID }} --id ${{ github.event.issue.node_id }} --field-id "Status" --single-select-option-id "Done"
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Generate Progress Report
      run: |
        # 生成並發布進度報告
        ./generate_progress_report.sh > progress_report.md
        gh issue comment ${{ github.event.issue.number }} --body-file progress_report.md
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 2. 每日進度報告
```bash
# 設定 cron job 每日生成報告
cat > daily_report.sh << 'EOF'
#!/bin/bash

PROJECT_NUMBER="1"
REPORT_FILE="daily_progress_$(date +%Y%m%d).md"

# 生成報告
./generate_progress_report.sh > "$REPORT_FILE"

# 發送到 Slack 或其他通知系統
# curl -X POST -H 'Content-type: application/json' --data '{"text":"Daily TypeScript Migration Progress Report"}' YOUR_SLACK_WEBHOOK_URL

echo "每日報告已生成: $REPORT_FILE"
EOF

chmod +x daily_report.sh

# 添加到 crontab (每天早上 9 點執行)
# 0 9 * * * /path/to/daily_report.sh
```

---

## 使用範例

### 1. 完整工作流程範例
```bash
# 1. 建立專案
gh project create --title "TypeScript 轉型專案"

# 2. 建立所有 Issues
./create_typescript_issues.sh

# 3. 開始工作
./typescript_workflow.sh start 123

# 4. 建立分支並開始開發
git checkout -b feature/typescript-api-service
# ... 進行開發工作 ...

# 5. 建立 Pull Request
./typescript_workflow.sh pr feature/typescript-api-service 123 "轉換 apiService 為 TypeScript"

# 6. 完成工作
./typescript_workflow.sh complete 123

# 7. 查看進度報告
./typescript_workflow.sh report
```

### 2. 查詢和篩選範例
```bash
# 查看特定階段的 Issues
gh issue list --label "typescript" --search "階段一 in:title"

# 查看進行中的 Issues
gh issue list --label "typescript,in-progress"

# 查看特定負責人的 Issues
gh issue list --assignee "username" --label "typescript"

# 匯出專案資料
gh project item-list [PROJECT_NUMBER] --format json > project_data.json
```

---

## 最佳實踐

### 1. 標籤策略
- `typescript` - 所有轉型相關 Issues
- `setup` - 基礎設置相關
- `types` - 型別定義相關
- `service` - 服務層轉換
- `component` - 元件轉換
- `high-priority` - 高優先級任務
- `blocked` - 被阻塞的任務

### 2. 分支命名規範
- `feature/typescript-[module-name]` - 功能開發分支
- `fix/typescript-[issue-description]` - 修復分支
- `refactor/typescript-[component-name]` - 重構分支

### 3. Commit 訊息規範
```
feat(typescript): convert apiService to TypeScript

- Add type definitions for API responses
- Update function signatures with proper types
- Add JSDoc comments for better documentation

Closes #123
```

---

## 故障排除

### 常見問題和解決方案

1. **無法建立專案項目**
   ```bash
   # 檢查權限
   gh auth status
   
   # 重新認證
   gh auth refresh
   ```

2. **專案 ID 找不到**
   ```bash
   # 列出所有專案並找到正確的 ID
   gh project list --format json | jq '.[] | {number: .number, title: .title}'
   ```

3. **批量操作失敗**
   ```bash
   # 添加錯誤處理
   for issue in $(gh issue list --label "typescript" --json number | jq -r '.[].number'); do
       if ! gh project item-add [PROJECT_NUMBER] --url "https://github.com/owner/repo/issues/$issue"; then
           echo "Failed to add issue #$issue"
       fi
   done
   ```

---

## 總結

透過 GitHub CLI 和 Projects 的整合，您可以：

1. **自動化專案管理** - 批量建立和管理 Issues
2. **即時進度追蹤** - 自動生成進度報告
3. **工作流程標準化** - 統一的工作流程和命名規範
4. **團隊協作優化** - 清晰的任務分配和狀態追蹤
5. **數據驅動決策** - 基於實際數據的專案管理

這套工具和流程將大大提升 TypeScript 轉型專案的管理效率和執行品質。

---

**最後更新**: 2025-06-18
**版本**: 1.0
**作者**: AI Assistant