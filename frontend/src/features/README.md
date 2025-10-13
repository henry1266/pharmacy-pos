# 前端功能模組總覽

`frontend/src/features` 收納各應用模組實作，採「hooks-first + ts-rest + shared Zod」的單一事實來源（SSOT）策略。本文提供工程師與架構師對齊的規範，亦可作為新增模組時的作業模板。

## SSOT 與 ts-rest 對齊

- **唯一結構來源**
  - 所有資料結構由 `shared/schemas/zod/*` 定義，前後端驗證、DTO 與 OpenAPI 皆從同一份 Zod schema 推導。
  - ts-rest 契約集中於 `shared/api/contracts/*`，frontend/backend 僅透過 contract 互動，禁止手寫重複結構。
- **客戶端統一**
  - `shared/api/clients/*` 產生型別安全的契約 client。
  - 前端模組內的 API 呼叫一律使用 contract client；自訂包裝需在 hooks 層實作，禁止在元件中直接呼叫 `fetch`／`axios`。
- **OpenAPI 與文件**
  - `pnpm --filter @pharmacy-pos/shared generate:openapi` 每次 schema 變更後必跑，確保公開文件與 SSOT 同步。

## 模組標準結構

```text
features/[module]/
|-- api/         # ts-rest client 包裝、RTK Query endpoints、DTO
|-- components/  # UI 元件（list/edit/detail 子目錄視需求拆分）
|-- hooks/       # 模組專屬邏輯（查詢、表單、體驗流程）
|-- model/       # Redux slice / entity adapters（僅存放 UI/流程狀態）
|-- pages/       # React Router 頁面進入點
|-- types/       # 前端專用型別（延伸 shared 契約補齊 UI 所需欄位）
|-- utils/       # 工具函式（計算、格式化、快捷鍵處理等）
|-- README.md    # 模組說明（依本文件模板撰寫）
```

> 新增模組請先建立 README，記錄契約、流程、風險與測試策略；PR 描述需附 `agent_task` YAML，標註對應 Agent（Schema Steward、Frontend Builder、Backend Orchestrator 等）。

## 風險控管與治理

- 契約變更必須先修改 shared schema，再同步 generate OpenAPI 與前後端代碼。
- 所有 API 層錯誤需統一映射為 `ApiError` 系列型別，避免元件直接處理裸回應。
- 模組內若需非同步流程（例如條碼輸入、批次匯入），請在 README 記錄重試／回滾策略。
- 欄位或金額調整需附測試證據（單元、整合或契約測試），並更新相關文件。

## 開發指引

- **React 與 Hooks**
  - 元件側重展示與互動，業務邏輯封裝於 hooks（`useModuleList`, `useModuleForm` 等）。
  - 使用 `useMemo`／`useCallback` 控制 re-render；長列表建議搭配虛擬化或分頁。
- **狀態管理**
  - Server State 採 RTK Query（`createApi`），透過 `providesTags`／`invalidatesTags` 管理快取。
  - Redux slice 僅存 UI/流程狀態，例如面板開合、暫存草稿。
- **API 客戶端**
  - `api/client.ts` 為唯一客戶端入口，內建 token 攔截與錯誤映射；呼叫端不得直接操作 axios。
  - DTO 轉換（`mapXxxResponseToXxxData`）集中於 `api/dto.ts`，確保欄位映射一致。
- **RWD 與可用性**
  - 採 MUI breakpoints 實作桌面／平板／手機行為差異；必要時提供 FAB、Drawer 等行動友善體驗。
  - 表單需處理輸入解析與格式化，鼓勵將共用邏輯下放至 `utils/`。
- **錯誤與回饋**
  - 關鍵操作（刪除、退款、批次匯入）需具備二次確認與失敗回滾；訊息透過 Snackbar／Dialog 統一呈現。

## 既有模組清單（2025-10-14）

- `accounting3`：收支、科目、交易、付款設定
- `customer`：客戶管理
- `daily-journal`：每日記帳
- `dashboard`：儀表板
- `employees`：員工與帳號
- `product`：商品與組合
- `purchase-order`：進貨單
- `sale`：銷售流程
- `shipping-order`：出貨單
- `supplier`：廠商維護

> 跨模組共用的元件請放置於 `@/components`，共用型別放置於 `@pharmacy-pos/shared` 或 `shared/enums`。若發現需求重複，優先抽象為共用層，避免在 features 之間互相引用。

## 參考資源

- shared schema 與契約：`@pharmacy-pos/shared`
- 共用列舉與常數：`shared/enums/index.ts`
- 模組範例：`frontend/src/features/sale`（完整 ts-rest + hooks-first 實作）

鼓勵工程師在新增或調整模組時，以 `sale` 模組為範本，並遵循上述 SSOT、hooks-first 與治理要求，確保系統結構長期一致可維護。
