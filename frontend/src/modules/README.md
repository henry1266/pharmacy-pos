# 模組目錄結構說明與最佳實踐

## 當前目錄分配型態

目前 `frontend/src/modules` 目錄下包含以下主要模組：

1. **accounting3** - 會計模組 (結構最為完整)
   - accounts/ - 帳戶相關功能
   - components/ - UI 元件
   - core/ - 核心邏輯與服務
   - features/ - 功能模組
   - pages/ - 頁面元件
   - services/ - API 服務
   - shared/ - 共用資源
   - types/ - 型別定義

2. **daily-journal** - 日誌模組
   - components/ - UI 元件
   - pages/ - 頁面元件

3. **dashboard** - 儀表板模組
   - components/ - UI 元件
   - hooks/ - 自定義 Hooks
   - pages/ - 頁面元件
   - utils/ - 工具函數

4. **employees** - 員工管理模組
   - components/ - UI 元件
   - core/ - 核心邏輯
   - pages/ - 頁面元件
   - types/ - 型別定義
   - utils/ - 工具函數

5. **sale** - 銷售模組
   - components/ - UI 元件
   - hooks/ - 自定義 Hooks
   - pages/ - 頁面元件
   - types/ - 型別定義
   - utils/ - 工具函數

## 當前結構問題

1. **一致性不足** - 各模組間的目錄結構不一致，有些模組結構完整（如 accounting3），有些則較為簡單
2. **文檔缺乏** - 除了 accounting3 外，其他模組缺乏 README 文件說明
3. **功能劃分不明確** - 部分模組缺乏明確的功能劃分，可能導致代碼重複或難以維護
4. **共用資源管理不統一** - 缺乏統一的共用資源管理方式
5. **目錄結構過於複雜** - 目錄嵌套層次過深，多層相同名稱的目錄導致開發人員容易混淆
6. **目錄命名重複** - 不同層級使用相同的目錄名稱（如 components、hooks、utils 等），增加了理解和導航的難度

## 最佳實踐目錄理想配置

以下是建議的更扁平化的模組目錄標準結構：

```
modules/
├── [module-name]/                # 模組名稱，如 accounting, sales 等
│   ├── README.md                 # 模組說明文件
│   ├── index.ts                  # 模組入口，導出公共 API
│   ├── ui/                       # UI 相關文件
│   │   ├── index.ts              # 導出所有 UI 元件
│   │   ├── [ComponentName].tsx   # 具體 UI 元件
│   │   └── [ComponentName].css   # 元件樣式
│   ├── pages/                    # 頁面元件
│   │   ├── index.ts              # 導出所有頁面
│   │   ├── [PageName].tsx        # 頁面元件
│   │   └── [PageName].css        # 頁面樣式
│   ├── api/                      # API 相關
│   │   ├── index.ts              # 導出所有 API 函數
│   │   └── [resourceName].ts     # 資源相關 API 函數
│   ├── model/                    # 數據模型與類型
│   │   ├── index.ts              # 導出所有模型與類型
│   │   ├── types.ts              # 類型定義
│   │   └── constants.ts          # 常量定義
│   └── lib/                      # 工具函數與邏輯
│       ├── index.ts              # 導出所有工具函數
│       ├── hooks.ts              # 自定義 Hooks
│       └── utils.ts              # 工具函數
└── shared/                       # 跨模組共用資源
    ├── ui/                       # 共用 UI 元件
    ├── api/                      # 共用 API 函數
    ├── model/                    # 共用數據模型與類型
    └── lib/                      # 共用工具函數與邏輯
```

## 模組設計原則

1. **模組獨立性**
   - 每個模組應盡可能獨立，減少對其他模組的依賴
   - 模組間的依賴應通過明確的公共 API 進行

2. **一致的目錄結構**
   - 所有模組應遵循相同的目錄結構
   - 即使某些目錄暫時為空，也應保持結構一致性

3. **明確的責任劃分**
   - ui/ - 僅包含 UI 元件，不包含業務邏輯
   - pages/ - 頁面級元件，組合多個 UI 元件
   - api/ - 處理 API 調用和數據獲取
   - model/ - 定義數據模型、類型和常量
   - lib/ - 提供工具函數、hooks 和業務邏輯
   - features/ - 組織大型功能模組（可選）
   - modules/common/ - 跨模組共用資源

4. **文檔完整性**
   - 每個模組根目錄應包含 README.md
   - 文檔應說明模組的用途、架構和使用方式

5. **導出規範**
   - 每個目錄應有 index.ts 文件導出公共 API
   - 模組根目錄的 index.ts 應只導出需要被外部使用的內容

## 重構建議

1. **標準化目錄結構**
   - 為所有模組實施統一的目錄結構
   - 將現有代碼遷移到新結構中

2. **添加缺失的文檔**
   - 為每個模組添加 README.md
   - 說明模組的用途、架構和使用方式

3. **整理共用資源**
   - 識別並提取跨模組共用的元件、函數和類型，將它們移至頂層 common/ 目錄
   - 按照資源類型（ui、api、model、lib）組織共用資源
   - 明確區分模組特定資源和跨模組共用資源

4. **實施功能模組化**
   - 對於大型模組，使用 features/ 目錄組織相關功能
   - 每個功能模組使用扁平化結構（ui、api、model 文件）
   - 避免在功能模組內創建過多子目錄

5. **統一命名規範**
   - 元件使用 PascalCase
   - 文件、目錄和函數使用 camelCase
   - 常量使用 UPPER_SNAKE_CASE

## 結論

通過實施上述最佳實踐，我們可以提高代碼的可維護性、可讀性和可擴展性。標準化的目錄結構和明確的責任劃分將使新開發人員更容易理解和貢獻代碼，同時減少技術債務的積累。

建議逐步實施這些變更，先從一個模組開始，然後擴展到其他模組，以最小化對開發工作的干擾。