# 前端模組總覽與開發指南（features）

本文件說明 `frontend/src/features` 的模組化設計與實作準則，並分別從「架構師角度」與「前端工程師角度」提供開發指南、評估與改進建議。

## 模組清單（現況）

目前已存在的功能模組如下（依資料夾）：

- accounting3（會計 v3：科目、機構、交易、付款）
- customer（客戶）
- daily-journal（日常記帳）
- dashboard（儀表板）
- employees（員工）
- product（商品與套裝）
- purchase-order（進貨單）
- sale（銷售/收銀）
- shipping-order（出貨單）
- supplier（供應商）

共用元件、型別與工具集中於 `@/components`、`@pharmacy-pos/shared` 與 `shared/enums`。

## 標準模組結構（約定）

每個功能模組採用相同的目錄佈局（以 `sale` 為例）：

```TEXT
features/[module]/
├─ api/            # RTK Query 端點、Axios 客戶端、DTO 與對應
├─ components/     # UI 元件（可再分 list/edit/detail 等子資料夾）
├─ hooks/          # 模組專屬邏輯（資料抓取、互動行為）
├─ model/          # Redux Toolkit slice（僅存放 UI/流程狀態）
├─ pages/          # 頁面元件（路由進入點）
├─ types/          # 型別與介面（page/list/edit/detail）
└─ utils/          # 工具函式（格式轉換、計算、在地化等）
```

---

## 架構師角度：指南、評估與建議

### 設計原則

- 邊界清晰：頁面/元件/邏輯/型別/工具在模組內自洽，跨模組透過共用層（`shared/*`、`@/components/*`）。
- 資料單一事實來源：Server State 優先使用 RTK Query；本地 UI 狀態放入 slice 或元件狀態。
- 契約先行：以 DTO 明確前後端契約，提供 map 函式進行雙向轉換（如 `mapSaleResponseToSaleData`）。
- 可觀測性：錯誤統一經 `api/client.ts` 攔截轉換為 `ApiError`；保留友善訊息與調試資訊。
- 移動優先：所有頁面與元件需考量 RWD（現有 `sale` 已有 phone/tablet 行為）。

### 依賴與資料流

- Pages → Hooks → API/Model/Utils → Components（無循環依賴）。
- RTK Query 統一處理資料抓取、快取與失效（`tagTypes`），slice 僅處理 UI/流程。
- Axios 客戶端集中於 `api/client.ts`，加上 token 攔截與錯誤映射，避免重複實作。

### 現況評估

- 優點：
  - 模組邊界明確、命名一致、檔案結構清晰。
  - `sale` 模組示範完善（列表/新建/編輯/詳細、DTO 映射、RTK Query 與服務 v2 並行）。
  - 共用型別與 UI 元件利用度高（`@pharmacy-pos/shared/*`、`CommonListPageLayout`）。
- 風險/技術債：
  - API 取用模式混雜（部分使用 RTK Query，部分走 service v2）。
  - 多語系與在地化未集中治理（日期/數字格式分散在 utils）。
  - 權限/角色（`shared/enums/index.ts`）未在前端路由/畫面做一致性約束。

### 改進建議（優先順序由高到低）

1) API 層一致化：
   - 以 RTK Query 為主，逐步將 service v2 包成 `createApi` 的 `queryFn`，統一快取與錯誤處理。
   - DTO 與 map 函式統一歸檔（每模組 `api/dto.ts`），避免重複定義與型別飄移。
2) 權限與路由守衛：
   - 於 AppRouter 或 Layout 層增加 Role-based Guard；畫面層面執行權限降級（隱藏/禁用操作）。
3) 在地化與可存取性：
   - 抽離本地化字串、統一日期/數字格式化入口；MUI DataGrid 文字集中管理。
   - 補齊 aria-*、鍵盤操作與對比度檢查基準。
4) 效能治理：
   - 大清單採虛擬化、按需載入頁面與區塊，審視 re-render（`memo`/`useMemo`/`useCallback`）。
5) 測試策略：
   - 模組層提供 contract tests（MSW 模擬 API）、hooks/工具單元測試、關鍵頁面整合測試。

---

## 前端工程師角度：開發指南與流程

### 命名與目錄

- 檔名：元件 `PascalCase.tsx`，hook `useXxx.ts`，slice `xxxSlice.ts`，DTO/型別於 `api/dto.ts` 與 `types/*`。
- Barrel 出口：`components/list|edit|detail/index.ts` 統一導出，頁面 `pages/index.ts` 匯整。

### 狀態管理策略

- RTK Query：伺服器資料、列表查詢、單筆查詢、變更與失效設定。
- Redux slice：只存 UI/流程狀態（視圖模式、表單提交、側欄開關、提示訊息等）。
- 元件狀態：短生命週期、只屬於該元件的交互狀態。

### Hook‑First 寫法

- 資料存取與業務邏輯放在 `hooks/`（如 `useSalesList`, `useSaleEdit`, `useSaleManagementV2`）。
- 元件保持展示與交互，避免耦合資料取得細節，便於測試與重用。

### API 使用

- 優先使用 `api/[module]Api.ts` 的 RTK Query hooks；若暫時使用 service v2，封裝於 hooks 層，避免散落於元件。
- Axios 客戶端：一律透過 `api/client.ts`（自帶 token 攔截與錯誤映射）。
- DTO 映射：新增/更新時使用 map 函式，確保型別正確與欄位對齊。

### 表單與驗證

- 控制式表單元件，數值欄位轉換（`parseFloat`/`toFixed`）集中於 utils，避免重複。
- 針對條碼/快捷輸入（`sale`）處理防抖/重入與焦點管理。

### RWD 與 UX

- 使用 MUI `breakpoints` 做手機/平板/桌面分歧；行動裝置使用 Drawer/FAB（`MobileSalesDrawer`/`MobileFabButton`）。
- 列表頁優先顯示核心資訊，側欄/預覽（`SalesDetailPanel`）承載詳情與操作。

### 錯誤處理與提示

- API 錯誤：以 `ApiError` 呈現友善訊息與追蹤資訊；畫面使用 Snackbar/對話框統一提示。
- 關鍵操作（刪除、退款）需二次確認與不可逆提示。

### 測試建議

- 工具/格式化：單元測試。
- hooks：React Testing Library + MSW 模擬 API。
- 頁面：整合測試（列表/詳情/新增或編輯的 happy path 與錯誤路徑）。

### 提交流程（建議）

- commit 使用 Conventional Commits（如 `feat(module): ...`, `fix`, `docs`, `refactor`）。
- 變更 READMEs 與對應路由/型別，一併更新。
- PR 描述包含：動機、設計、風險、測試與截圖（若為 UI 變更）。

---

## 路由（高階對照）

- `/dashboard` 儀表板與日期檢視
- `/products`, `/product-categories` 商品與分類
- `/customers`, `/suppliers` 客戶與供應商
- `/sales` 列表、`/sales/new` 新建、`/sales/edit/:id` 編輯、`/sales/:id` 詳細
- `/shipping-orders`, `/purchase-orders` 出/進貨單
- `/journals` 日常記帳與分類
- `/accounting3/*` 會計 v3 模組（科目、機構、交易、付款）
- `/settings/*` 帳號、員工、監控商品等設定

---

## 參考與共用

- 共用型別：`@pharmacy-pos/shared/types/*`
- 共用列舉：`shared/enums/index.ts`
- 銷售 API 與 DTO 參考：`features/sale/api/{client, dto, saleApi}.ts`

若需擴充新模組，建議以 `sale` 模組為樣板，優先導入 RTK Query、DTO 映射與 hooks-first 架構，並遵循上述兩種角度的檢查清單進行設計與實作。

---

## 客戶模組補充

- 參考 `customer/README.md`，了解 customer 模組全數改用 ts-rest 契約與 RTK Query 的開發守則。
- 新增或調整顧客 API 時，請先更新 shared 契約（Zod + ts-rest），同步 `customerServiceV2.ts`，再由 RTK Query `customerApi` 暴露 hooks。

## 每日記帳模組補充

- 參考 `daily-journal/README.md`，了解 accounting (daily journal) 模組如何透過 ts-rest 契約與 service v2 統一資料流程。
- 新增／調整記帳相關 API 時，請先更新 shared accounting 契約與 `accountingServiceV2.ts`，並確保 hooks 維持透過 service 呼叫。
