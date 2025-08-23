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

## Redux Toolkit 與 RTK Query 導入指南

本章節提供了將 Redux Toolkit 和 RTK Query 導入模組的最佳實踐和注意事項，基於銷售模組的實際重構經驗。

### 目錄結構

使用 Redux Toolkit 和 RTK Query 時，建議採用以下目錄結構：

```
modules/[module-name]/
├── api/
│   ├── client.ts         # API 客戶端配置 (Axios 實例、攔截器、錯誤處理)
│   ├── dto.ts            # 數據傳輸對象 (Request/Response 型別)
│   └── [resource]Api.ts  # RTK Query API 定義
├── model/
│   └── [resource]Slice.ts # Redux 狀態切片 (UI 狀態管理)
├── hooks/
│   └── use[Resource].ts   # 封裝 RTK Query hooks
```

### 實施步驟

1. **安裝依賴**
   ```bash
   npm install @reduxjs/toolkit react-redux
   ```

2. **配置 Store**
   - 創建 `app/store/index.ts` 文件
   - 使用 `configureStore` 配置 Redux store
   - 導入並組合所有 API 和 slice reducers

3. **實現 API 層**
   - 創建 API 客戶端 (`client.ts`)
   - 定義 DTO 型別 (`dto.ts`)
   - 使用 `createApi` 定義 API endpoints

4. **實現 UI 狀態管理**
   - 使用 `createSlice` 定義 UI 狀態
   - 實現 reducers 和 actions
   - 定義 selectors

5. **封裝 Hooks**
   - 封裝 RTK Query 的 hooks，提供更簡潔的 API
   - 實現向後兼容的 hooks，方便逐步遷移

### 最佳實踐

1. **Server State 與 Client State 分離**
   - 使用 RTK Query 管理伺服器數據 (獲取、緩存、更新)
   - 使用 Redux Toolkit 的 createSlice 管理 UI 狀態
   - 避免在 Redux store 中存儲可以通過 API 獲取的數據

2. **類型安全**
   - 為所有 API 請求和響應定義明確的型別
   - 使用 TypeScript 泛型增強代碼的靈活性
   - 確保 API 和 UI 層之間的型別一致性

3. **錯誤處理**
   - 在 API 客戶端中統一處理錯誤
   - 將 HTTP 錯誤映射為應用錯誤
   - 使用 RTK Query 的錯誤處理機制

4. **性能優化**
   - 使用 RTK Query 的緩存機制
   - 實現選擇性數據獲取
   - 使用 `selectFromResult` 優化渲染性能

### 常見錯誤與解決方案

1. **型別不匹配問題**
   
   **問題**: 在使用 RTK Query 時，API 響應型別與組件期望的型別不匹配。
   
   **解決方案**:
   - 使用型別轉換函數 (如 `mapSaleResponseToSaleData`)
   - 修改組件屬性型別，使其接受多種型別 (如 `SaleItem[] | SaleItemWithDetailsDto[]`)
   - 使用泛型型別 (如 `<T extends { price: number; quantity: number }>`)

   **示例**:
   ```typescript
   // 修改前
   export interface SalesEditItemsTableProps {
     items: SaleItem[];
   }
   
   // 修改後
   export interface SalesEditItemsTableProps {
     items: SaleItem[] | import('../api/dto').SaleItemWithDetailsDto[];
   }
   ```

2. **可選屬性處理問題**
   
   **問題**: TypeScript 的 `exactOptionalPropertyTypes: true` 設置導致可選屬性型別不兼容。
   
   **解決方案**:
   - 明確聲明 `undefined` 作為可選屬性的可能值
   - 使用型別聯合 (如 `Product | undefined`)
   - 使用可選鏈操作符 (`?.`) 和空值合併操作符 (`??`)

3. **API 錯誤處理問題**
   
   **問題**: API 錯誤沒有被正確處理或顯示。
   
   **解決方案**:
   - 實現統一的錯誤處理邏輯
   - 使用 Axios 攔截器捕獲和轉換錯誤
   - 使用 RTK Query 的 `transformErrorResponse` 選項

4. **Store 配置問題**
   
   **問題**: Redux store 配置不正確，導致 middleware 或 reducer 不工作。
   
   **解決方案**:
   - 確保正確配置 `configureStore`
   - 添加所有必要的 middleware
   - 正確組合所有 reducers

### 遷移策略

1. **漸進式遷移**
   - 先實現基礎設施 (store, API 客戶端)
   - 為一個資源實現 RTK Query API
   - 創建向後兼容的 hooks
   - 逐步遷移組件使用新的 hooks

2. **並行運行**
   - 保留舊的狀態管理方式
   - 實現新的 RTK Query API
   - 在新功能中使用新的 API
   - 逐步替換舊的實現

### 結論

通過遵循上述最佳實踐和避免常見錯誤，可以順利地將 Redux Toolkit 和 RTK Query 導入到項目中，實現 Server state 與 Client/UI state 的分離，提高代碼的可維護性和可擴展性。
