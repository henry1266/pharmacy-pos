# 藥局POS系統

這是一個專為藥局設計的POS（銷售點）系統，提供藥品管理、供應商管理、銷售和庫存追蹤、記帳報表等功能。系統支援商品和藥品的分類管理，以及多種報表和數據分析工具。

## 功能特點

### 產品管理
藥局POS系統提供了全面的產品管理功能，能夠同時處理一般商品和專業藥品。系統針對這兩種不同類型的產品提供了專門的屬性和管理方式，使藥局能夠精確地追蹤和管理所有庫存項目。

商品和藥品在系統中被區分處理，商品包含國際條碼等零售特有屬性，而藥品則包含健保碼、健保價等醫療特有屬性。這種雙類型產品支援確保了藥局能夠同時管理處方藥品和非處方商品，提高了營運效率。

系統的庫存管理功能包括庫存水平即時監控、低庫存自動警告、庫存價值精確計算，以及按產品類型分類的詳細庫存報表。這些功能協助藥局維持最佳庫存水平，避免過度庫存或缺貨情況。

### 供應商管理
完善的供應商管理系統允許藥局建立和維護與供應商的關係。用戶可以添加、編輯和刪除供應商資料，並通過CSV批量匯入功能快速導入大量供應商數據。

系統存儲詳細的供應商信息，包括聯絡人、電話、電子郵件、地址、稅號和付款條件等。此外，系統還將供應商與相關的進貨單關聯起來，使藥局能夠追蹤與每個供應商的交易歷史。

### 銷售功能
系統提供了直覺式的銷售界面，使日常銷售操作變得簡單高效。界面設計考慮了藥局的特殊需求，支援多種支付方式，包括現金、信用卡、行動支付等。

所有銷售記錄都被系統自動追蹤，並可生成詳細的銷售報表。這些報表可以按日期、產品、客戶或其他參數進行過濾和分組，提供了對銷售趨勢的深入洞察。

### 進出貨管理
進出貨管理模組允許藥局創建和管理進貨單與出貨單。系統支援CSV批量匯入/匯出功能，大大提高了數據處理效率。

每個進出貨單都有狀態追蹤功能，使用戶能夠監控訂單從創建到完成的整個過程。系統還提供了庫存自動更新功能，確保庫存數據始終保持最新狀態。

### 報表系統
系統提供了多種報表類型，幫助藥局分析業務數據並做出明智決策。

銷售報表可以按日期、產品或客戶進行分組，提供銷售趨勢分析和產品銷售排名。這些報表幫助藥局識別熱銷產品和銷售模式。

庫存報表將商品與藥品分類顯示，提供庫存價值分析和低庫存警告。這些報表幫助藥局維持最佳庫存水平，避免過度庫存或缺貨情況。

記帳報表提供了多種圖表視圖（柱狀圖、折線圖、餅圖）和表格數據視圖，可按日期、班別或類別分組。系統支援CSV數據導出功能，並顯示摘要統計數據，幫助藥局追蹤財務狀況。

## 系統架構

### 整體架構設計
藥局POS系統採用現代化的 **Monorepo** 架構，使用 **pnpm workspace** 管理多個相關套件，確保代碼重用性和型別一致性。系統分為三個主要模組：

- **Frontend**: React + TypeScript 前端應用
- **Backend**: Node.js + Express 後端服務  
- **Shared**: 共享型別定義和工具函數庫

### 前端技術棧
前端採用現代化的 React 生態系統，提供優秀的用戶體驗：

- **React 18**: 核心前端框架，支援 Concurrent Features
- **TypeScript**: 提供完整的型別安全保障
- **Material-UI v5**: 現代化的 UI 組件庫，支援主題定制
- **Redux Toolkit**: 現代化的狀態管理解決方案
- **React Router v6**: 聲明式路由管理
- **Formik & Yup**: 表單處理和驗證
- **Chart.js & Recharts**: 數據可視化圖表庫
- **Framer Motion**: 流暢的動畫效果
- **Axios**: HTTP 客戶端，統一 API 調用
- **CRACO**: Create React App 配置覆蓋工具

### 後端技術棧
後端基於 Node.js 平台，提供穩定可靠的 API 服務：

- **Node.js**: 高效能的 JavaScript 運行環境
- **Express.js**: 輕量級 Web 框架
- **TypeScript**: 型別安全的後端開發
- **MongoDB**: NoSQL 文檔數據庫
- **Mongoose**: 優雅的 MongoDB ODM
- **JWT**: 無狀態身份驗證
- **Bcrypt.js**: 密碼加密
- **Multer**: 文件上傳處理
- **CSV-Parser**: CSV 文件處理
- **PDFKit**: PDF 報表生成
- **Day.js**: 輕量級日期處理庫

### Shared 模組架構
共享模組是系統的核心創新，提供統一的型別定義和工具函數：

#### 型別定義 (`types/`)
- **entities.ts**: 基礎實體型別（Product、Customer、Sale 等）
- **api.ts**: API 請求/回應型別定義
- **forms.ts**: 表單數據結構型別
- **accounting.ts**: 會計相關型別
- **business.ts**: 業務邏輯型別
- **models.ts**: 數據模型型別
- **utils.ts**: 工具函數型別

#### V2 統一 API 客戶端架構 (`services/`)
系統實現了基於 shared 模組的統一 API 客戶端架構，大幅減少代碼重複並提高一致性：

- **baseApiClient.ts**: 抽象基類，提供通用 CRUD 操作和錯誤處理
- **accountingApiClient.ts**: 會計服務 API 客戶端
- **productApiClient.ts**: 產品服務 API 客戶端
- **supplierApiClient.ts**: 供應商服務 API 客戶端
- **customerApiClient.ts**: 客戶服務 API 客戶端
- **salesApiClient.ts**: 銷售服務 API 客戶端
- **shippingOrderApiClient.ts**: 出貨訂單服務 API 客戶端
- **purchaseOrderApiClient.ts**: 採購訂單服務 API 客戶端
- **inventoryApiClient.ts**: 庫存服務 API 客戶端
- **employeeApiClient.ts**: 員工服務 API 客戶端

**V2 架構優勢**：
- **代碼重用**: 消除 80-85% 的重複 API 調用代碼
- **型別安全**: 完整的 TypeScript 支援和泛型設計
- **統一錯誤處理**: 標準化的錯誤處理機制
- **依賴注入**: 支援不同 HTTP 客戶端實現
- **可擴展性**: 新服務可輕鬆擴展基礎架構

#### 工具函數 (`utils/`)
- **dateUtils.ts**: 日期處理工具
- **stringUtils.ts**: 字串處理工具
- **numberUtils.ts**: 數字格式化工具
- **validationUtils.ts**: 數據驗證工具
- **workHoursUtils.ts**: 工時計算工具
- **roleUtils.ts**: 角色權限工具
- **accountingTypeConverters.ts**: 型別轉換工具

#### 常數和列舉 (`constants/`, `enums/`)
- **actionTypes.ts**: Redux Action 型別常數
- **index.ts**: 系統常數定義

#### Schema 驗證 (`schemas/`)
- 統一的數據驗證規則
- 支援前後端共用驗證邏輯

### 型別安全保障
系統實現了完整的型別安全機制：

1. **統一型別定義**: 前後端共用相同的型別定義
2. **型別轉換工具**: 提供安全的數據轉換函數
3. **自動型別檢查**: 使用 TypeScript 編譯時檢查
4. **一致性驗證**: 自動化腳本檢查型別一致性

## 安裝說明

### 系統需求
- **Node.js**: 18.x 或更高版本
- **pnpm**: 8.x 或更高版本（推薦使用 pnpm 作為套件管理器）
- **MongoDB**: 4.x 或更高版本
- **TypeScript**: 4.9 或更高版本
- **現代瀏覽器**: Chrome, Firefox, Edge 等

### 完整安裝步驟

#### 1. 克隆倉庫
```bash
git clone https://github.com/henry1266/pharmacy-pos.git
cd pharmacy-pos
```

#### 2. 安裝 pnpm（如果尚未安裝）
npm install -g pnpm

#### 3. 安裝所有依賴
pnpm install

#### 4. 建構 Shared 模組
```bash
# 建構共享型別定義
pnpm --filter shared build
```

#### 5. 配置數據庫
1. 確保 MongoDB 服務已啟動
2. 在 `backend/config` 目錄中創建或編輯 `default.json` 文件
3. 設置 MongoDB 連接字符串

#### 6. 啟動開發環境
pnpm run dev

### 快速啟動腳本
系統提供了便捷的安裝和啟動腳本：

#### Windows 用戶
```batch
setup.bat  # 首次安裝依賴
start.bat  # 啟動系統
```

#### Linux/Mac 用戶
```bash
chmod +x setup.sh  # 設置執行權限
./setup.sh         # 首次安裝依賴
```

### 開發工具指令

#### 建構專案

# 建構所有專案
pnpm run build

## 開發指南

### 開發規範

#### 代碼品質標準
藥局POS系統遵循嚴格的開發規範：

- **型別安全**: 所有代碼必須通過 TypeScript 嚴格模式檢查
- **代碼簡潔性**: 保持代碼簡潔、可讀、前後端一致
- **DRY 原則**: 避免重複代碼，優先使用 shared 模組
- **可讀性優先**: 優先考慮代碼可讀性而非過度簡潔
- **命名規範**: 使用有意義的變數和函數名稱
- **註釋原則**: 關鍵邏輯必須有 JSDoc 註釋說明

#### Monorepo 開發原則
1. **模組化設計**: 功能按模組劃分，避免循環依賴
2. **型別統一**: 所有型別定義統一放在 shared 模組
3. **工具函數共享**: 通用邏輯提取到 shared/utils
4. **版本同步**: 使用 workspace 協議管理內部依賴
5. **建構順序**: shared → backend → frontend

### Git提交規範
項目採用Conventional Commits規範進行Git提交，格式如下：
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

常用的type包括：
- feat: 新功能
- fix: 錯誤修復
- docs: 文檔更新
- style: 代碼格式調整
- refactor: 代碼重構
- test: 添加或修改測試
- chore: 構建過程或輔助工具的變動

### 避免代碼耦合
為了維持系統的可維護性和可擴展性，開發者應遵循以下原則：

1. **單一責任原則**: 每個組件只負責一件事
2. **資料注入設計**: UI組件只處理數據展示，不處理業務邏輯
3. **避免雙向耦合**: 子組件不應引用父層特定狀態或方法命名
4. **區分UI狀態與數據狀態**: 使用適當的狀態管理工具
5. **集中管理共用狀態**: 使用Redux或自定義hooks管理共享狀態
6. **統一錯誤處理**: 使用攔截器處理共通錯誤
7. **功能導向的資料夾設計**: 採用feature-based結構
8. **穩定的API層**: 所有API調用封裝在服務層
9. **延後抽象**: 只有在多處使用時才抽離為共用組件

## 使用指南

### 產品管理
產品管理模組是藥局POS系統的核心功能之一，允許用戶添加、編輯和刪除產品。使用此模組時，請按照以下步驟操作：

1. 在系統導航菜單中選擇「產品管理」
2. 點擊「新增產品」按鈕創建新產品
3. 在產品創建表單中，首先選擇產品類型（商品或藥品）
4. 根據選擇的產品類型，系統會顯示相應的字段：
   - 商品類型會顯示國際條碼、品牌等字段
   - 藥品類型會顯示健保碼、健保價、藥品分類等字段
5. 填寫產品的基本信息，如名稱、描述、價格等
6. 設置庫存相關參數，包括初始庫存量、最低庫存警告閾值等
7. 點擊「保存」按鈕完成產品創建

產品列表頁面提供了多種過濾和排序選項，幫助用戶快速找到所需產品。用戶可以按產品類型、庫存狀態、價格範圍等條件進行過濾，也可以按名稱、價格、庫存量等字段進行排序。

## FIFO庫存管理

系統實現了先進先出(FIFO)庫存管理方法，確保庫存價值計算的準確性和一致性。FIFO方法假設最早購入的庫存最先被售出，這種方法在藥品管理中尤為重要，因為藥品通常有有效期限制。

FIFO功能的主要特點包括：

- **批次追蹤**: 系統追蹤每批進貨的數量、成本和日期
- **自動計算**: 出貨時自動按FIFO原則計算成本和利潤
- **庫存分佈明細**: 顯示當前庫存的批次分佈情況
- **過程日誌**: 記錄FIFO計算過程，便於審計和問題排查
- **模擬查詢**: 允許用戶模擬不同出貨情況下的FIFO計算結果

在產品詳情頁面，用戶可以查看該產品的FIFO庫存分佈，了解每批庫存的進貨日期、數量和成本。這些信息對於庫存管理和定價決策非常有價值。

## 用戶角色與權限

系統定義了以下用戶角色，具有不同的權限級別：

- **admin**: 管理員，擁有最高權限，可以訪問和管理系統的所有功能，包括用戶管理、系統設置等。
- **pharmacist**: 藥師，可以執行大部分藥局相關操作，如銷售、庫存管理、藥品管理等，但無法訪問某些管理功能。
- **staff**: 員工，權限最低，通常僅限於執行基本銷售操作和查看報表，無法修改系統設置或管理用戶。

新用戶的預設角色是 `staff`。用戶角色可以在建立用戶時指定，或由管理員後續修改。系統實現了基於角色的訪問控制(RBAC)，確保用戶只能訪問其角色允許的功能。

## V2 統一 API 架構

### 架構概述
藥局POS系統實現了基於 shared 模組的統一 API 客戶端架構，這是系統現代化的重要里程碑。V2 架構將原本分散在各個前端服務中的重複代碼整合到共享模組中，實現了代碼重用和一致性。

### 核心組件

#### BaseApiClient 基礎架構
- **抽象基類**: 提供通用的 CRUD 操作模板
- **統一錯誤處理**: 標準化的 `handleApiError` 機制
- **HttpClient 介面**: 支援依賴注入的 HTTP 客戶端抽象
- **泛型支援**: 完整的 TypeScript 泛型設計

#### 已實現的 V2 服務
系統已完成所有核心業務服務的 V2 架構實現：

1. **會計服務** - 分類管理、交易記錄
2. **產品服務** - 產品管理、庫存追蹤
3. **供應商服務** - 供應商管理、採購關係
4. **客戶服務** - 客戶管理、購買歷史
5. **銷售服務** - 銷售統計、退貨處理
6. **出貨訂單服務** - 出貨管理、批量操作
7. **採購訂單服務** - 採購管理、供應商整合
8. **庫存服務** - 庫存記錄、統計分析
9. **員工服務** - 員工管理、權限控制

### 前端適配器模式
每個前端 V2 服務都採用統一的適配器模式：

```typescript
// 創建 axios 適配器
const axiosAdapter: HttpClient = {
  get: axios.get.bind(axios),
  post: axios.post.bind(axios),
  put: axios.put.bind(axios),
  delete: axios.delete.bind(axios),
};

// 創建 API 客戶端實例
const apiClient = createXxxApiClient(axiosAdapter);

// 直接匯出方法，實現零重複代碼
export const getAllItems = apiClient.getAllItems.bind(apiClient);
export const getItemById = apiClient.getItemById.bind(apiClient);
```

### 架構優勢

#### 代碼減少量
- **原始服務**: 每個服務約 100-200 行重複的 API 調用代碼
- **V2 服務**: 每個服務僅需 20-30 行適配器代碼
- **減少比例**: 約 80-85% 的代碼減少

#### 技術優勢
- **型別安全**: 完整的 TypeScript 支援和編譯時檢查
- **一致性**: 統一的錯誤處理和響應格式處理
- **可擴展性**: 支援依賴注入和繼承架構
- **維護性**: 修改一次，所有服務受益

### 使用範例

```typescript
// 使用員工服務 V2
import {
  getAllEmployees,
  createEmployee,
  updateEmployee
} from '../services/employeeServiceV2';

const EmployeeComponent = () => {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await getAllEmployees();
        setEmployees(data);
      } catch (error) {
        console.error('獲取員工失敗:', error);
      }
    };
    
    fetchEmployees();
  }, []);

  const handleCreateEmployee = async (employeeData) => {
    try {
      const newEmployee = await createEmployee(employeeData);
      setEmployees(prev => [...prev, newEmployee]);
    } catch (error) {
      console.error('創建員工失敗:', error);
    }
  };

  // ... 組件渲染邏輯
};
```

### 文檔資源
- **V2 架構總結**: [`docs/V2_ARCHITECTURE_SUMMARY.md`](docs/V2_ARCHITECTURE_SUMMARY.md)
- **員工服務文檔**: [`docs/employee-service-v2.md`](docs/employee-service-v2.md)
- **採購訂單服務文檔**: [`docs/purchase-order-service-v2.md`](docs/purchase-order-service-v2.md)
- **出貨訂單服務文檔**: [`docs/shipping-order-service-v2.md`](docs/shipping-order-service-v2.md)

## 技術特色

### Monorepo 架構優勢
- **型別安全**: 前後端共享型別定義，消除型別不一致問題
- **代碼重用**: 共享工具函數和業務邏輯，減少重複開發
- **統一管理**: 使用 pnpm workspace 統一管理依賴和建構流程
- **開發效率**: 一次修改，多處生效，提高開發和維護效率

### 型別系統設計
- **漸進式型別化**: 支援從 JavaScript 逐步遷移到 TypeScript
- **嚴格模式**: Shared 模組採用 TypeScript 嚴格模式
- **型別轉換**: 提供安全的前後端數據轉換工具
- **自動檢查**: 自動化腳本確保型別一致性

### 現代化工具鏈
- **pnpm**: 高效能的套件管理器，支援 workspace
- **TypeScript**: 完整的型別安全保障
- **CRACO**: 靈活的 Create React App 配置
- **Concurrently**: 同時執行多個開發服務器

## 開發團隊

- Henry Chen - 項目負責人
- 藥局POS開發團隊

## 許可證

本項目採用 MIT 許可證 - 詳情請查看 LICENSE 文件
