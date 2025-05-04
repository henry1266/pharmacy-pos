# 藥局POS系統前端耦合度改善提案

## 前言

本提案基於對 `pharmacy-pos` 專案前端程式碼的分析，並參考了 `開發指南/避免程式碼過度耦合.md` 和 `程式碼耦合度改善報告.md` 文件。旨在識別現有程式碼中的耦合問題，並提出具體的改善方向與實施步驟，以提升專案的可維護性、可讀性與可擴展性。

## 主要觀察到的耦合問題

經過分析，目前前端程式碼主要存在以下耦合相關問題：

1.  **頁面元件職責過重**: `pages/` 目錄下的許多元件（如 `SalesPage.js`, `PurchaseOrdersPage.js`, `DashboardPage.js` 等）檔案體積龐大，混合了 UI 渲染、本地狀態管理、資料獲取邏輯（甚至直接調用 `axios`）和業務流程控制，違反了單一責任原則（SRP）。
2.  **API 層未嚴格執行**: 發現部分元件（如 `SalesPage.js` 的初步檢視）直接導入 `axios`，繞過了 `services/` 層。這導致 API 呼叫邏輯散佈在不同元件中，難以統一管理和修改。
3.  **通用元件抽象可能不當**: `components/common/` 目錄下存在一些大型且複雜的元件（如 `InventoryList.js`, `FIFOSimulationDialog.js`, `ProductItemsTable.js`）。需要進一步評估這些元件是否真正通用，或者是否存在過早抽象、設計僵化（如 `ProductItemsTable` 的例子）的問題，導致在特定場景下難以複用或需要額外處理。
4.  **專案結構非功能導向**: 目前的 `src/` 目錄結構主要按類型（`components`, `pages`, `hooks`, `services`, `redux`）劃分，而非 `程式碼耦合度改善報告.md` 推薦的按功能（feature-based）劃分。這降低了模組的內聚性，增加了不同功能模組間的潛在耦合。
5.  **缺乏類型系統與自動化檢查**: 專案使用 JavaScript，缺乏靜態類型檢查，增加了潛在的類型錯誤和介面不明確的風險。同時，缺少自動化的依賴關係檢查工具，難以及時發現循環依賴或不合理的跨層引用。
6.  **狀態管理界線模糊**: 雖然使用了 Redux 和 useState，但需要確保兩者職責清晰：Redux 用於全局/伺服器狀態，useState 用於本地 UI 狀態。需要檢查是否存在將本地 UI 狀態誤放入 Redux 的情況。
7.  **錯誤處理分散**: 雖然可能存在統一的 API 服務 (`utils/apiService.js`)，但仍需確認錯誤處理（特別是 API 錯誤）是否已完全集中處理，或仍有部分散落在元件內部。

## 改善建議與實施步驟

針對上述問題，提出以下改善建議：

1.  **重構頁面元件 (Refactor Page Components)**
    *   **目標**: 降低頁面元件的複雜度，使其專注於佈局和協調子元件。
    *   **步驟**:
        *   將頁面元件中的 UI 渲染邏輯抽離成更小的、可複用的展示型元件（Presentational Components），放置於對應的 `components/` 子目錄下（或未來 feature-based 結構中的 `components/`）。
        *   將資料獲取、狀態管理邏輯移出頁面元件。可考慮：
            *   創建自定義 Hooks (`hooks/` 或 `features/xxx/hooks/`) 來封裝特定頁面的資料獲取和業務邏輯。
            *   對於全局或跨元件共享的狀態，利用 Redux 的 actions 和 reducers (或 selectors) 進行管理。
            *   考慮引入 React Query 或 Zustand 等庫，專門處理伺服器狀態（Server State），簡化資料獲取、快取、同步和錯誤處理。
        *   頁面元件應主要負責從 Hooks 或 Redux 獲取資料和狀態，並將其透過 props 傳遞給子元件。

2.  **強制執行 API 層 (Enforce API Layer)**
    *   **目標**: 統一 API 請求的出口，方便管理和維護。
    *   **步驟**:
        *   全面檢查 `pages/` 和 `components/` 目錄，找出所有直接使用 `axios` 或 `fetch` 的地方。
        *   將這些直接呼叫重構為使用 `services/` 目錄下（或 `features/xxx/services.js`）提供的函數。
        *   如果 `services/` 中缺少對應的函數，則創建新的服務函數來封裝該 API 呼叫。
        *   嚴禁在元件或 Hooks 中直接進行 API 請求。

3.  **審查與重構通用元件 (Review Common Components)**
    *   **目標**: 確保 `components/common/` 下的元件真正通用、職責單一且設計靈活。
    *   **步驟**:
        *   逐一審查 `components/common/` 下的元件，特別是大型或複雜的元件。
        *   評估其通用性：是否在多個（建議至少2-3個）不同的功能模組中使用？
        *   檢查其是否遵循單一責任原則和 Props-Driven 設計：是否僅負責 UI 展示？所有資料和行為是否都由 props 決定？
        *   對於過於特定或僵化的通用元件，考慮：
            *   將其移回主要使用的功能模組目錄下。
            *   重構元件，使其接受更多配置性 props，提高靈活性。
            *   如果無法輕易重構，考慮廢棄該通用元件，在各自功能模組中實現特定版本。
        *   遵循「延後抽象」原則，避免過早創建通用元件。

4.  **逐步遷移至功能導向結構 (Adopt Feature-Based Structure)**
    *   **目標**: 提高模組內聚性，降低模組間耦合。
    *   **步驟**:
        *   規劃新的 `src/features/` 目錄結構，按主要業務功能（如 `sales`, `purchaseOrders`, `products`, `inventory`, `accounting` 等）劃分。
        *   每個 feature 目錄下包含其自身的 `components/`, `hooks/`, `pages/`, `services.js`, `state.js` (或 Redux slice) 等。
        *   選擇一個功能模組開始試點遷移，將相關的元件、頁面、Hooks、服務、狀態管理邏輯移動到對應的 feature 目錄下。
        *   逐步將其他功能模組遷移到新結構。
        *   `src/components/`, `src/hooks/`, `src/services/` 等頂層目錄僅保留真正跨功能、全局通用的程式碼。

5.  **引入 TypeScript (Introduce TypeScript)**
    *   **目標**: 提升程式碼健壯性、可讀性和可維護性，明確元件契約。
    *   **步驟**:
        *   將專案開發環境配置為支持 TypeScript。
        *   逐步將 `.js` / `.jsx` 文件重命名為 `.ts` / `.tsx`。
        *   為元件的 props 和 state 添加 Interface 或 Type 定義。
        *   為函數參數和返回值添加類型定義。
        *   利用 TypeScript 的靜態檢查能力發現並修復潛在的類型錯誤。
        *   可以從新開發的功能或小型、獨立的模組開始引入 TypeScript。

6.  **實施自動化依賴檢查 (Implement Dependency Checks)**
    *   **目標**: 自動檢測循環依賴和不合理的跨層/跨模組引用。
    *   **步驟**:
        *   引入 `madge` 或 `eslint-plugin-boundaries` (配合 `depcruise`) 工具。
        *   配置規則，例如：
            *   禁止 `components/` 依賴 `pages/`。
            *   禁止 `features/sales/` 直接引用 `features/purchaseOrders/` 的內部元件（應透過共享的 `components/common` 或狀態管理）。
            *   檢測並禁止循環依賴。
        *   將檢查命令整合到 CI/CD 流程或 Git pre-commit hook 中。

7.  **優化狀態管理 (Refine State Management)**
    *   **目標**: 明確狀態管理職責，提高效率和可維護性。
    *   **步驟**:
        *   審查 Redux store 的結構和使用方式。
        *   為訪問 store slice 創建專用的 selector hooks，簡化元件中的 `useSelector`。
        *   確保僅將全局共享狀態或需要持久化的伺服器狀態放入 Redux。
        *   對於僅限單一元件或小範圍共享的 UI 狀態，優先使用 `useState` 或 `useReducer`。
        *   評估引入 React Query/Zustand 等現代狀態管理庫處理伺服器狀態的可能性，以簡化資料同步邏輯。

8.  **加強統一錯誤處理 (Enhance Error Handling)**
    *   **目標**: 集中處理 API 和其他潛在錯誤，提供一致的用戶體驗。
    *   **步驟**:
        *   確保 `utils/apiService.js` (或類似的 API 客戶端設置) 中配置了 axios interceptor。
        *   在 interceptor 中統一處理常見的 HTTP 錯誤（如 401, 403, 5xx），例如顯示通知、導向登入頁等。
        *   `services/` 層在捕獲到特定 API 錯誤時，可以進行初步處理或轉換，並拋出標準化的錯誤物件。
        *   元件層面應主要依賴 Hooks 或狀態管理層提供的 `error` 狀態來顯示錯誤訊息，避免過多的 `try...catch`。

## 實施建議

*   **逐步進行**: 耦合度的改善是一個持續的過程，建議分階段、按模組進行重構，避免一次性大規模修改帶來風險。
*   **優先級**: 可以優先處理最明顯的問題，如強制執行 API 層、重構職責過重的頁面元件。
*   **Code Review**: 加強 Code Review，確保新的程式碼遵循低耦合原則和開發指南。
*   **測試**: 在重構過程中，確保有足夠的測試（單元測試、整合測試）來保證功能的正確性。

透過實施以上建議，期望能顯著降低 pharmacy-pos 前端專案的程式碼耦合度，使其更易於理解、修改和擴展。

