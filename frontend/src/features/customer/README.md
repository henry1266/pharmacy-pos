# Customer 模組（ts-rest x RTK Query）

> 本模組負責顧客資料維護（列表 / 詳細 / 建立 / 更新 / 快速建檔）。所有欄位、驗證與 API 契約皆以 `shared/` 內的 Zod schema 與 ts-rest router 為單一事實來源（SSOT），確保前後端同步。

## 功能總覽

- 顧客列表：支援搜尋（姓名、電話等）、篩選、分頁與快取失效管理。
- 顧客詳情：單筆查詢、錯誤提示、回應驗證。
- 顧客維護：建立、更新、刪除，快速建檔（身分證號雙寫並回傳 `created` 標記）。

## 目錄結構

```text
customer/
├─ api/
│  ├─ client.ts                # 透過 ts-rest 契約產生的型別安全 client（自動帶入 Authorization header）
│  ├─ customerApi.ts           # RTK Query slice；queryFn 直接呼叫 contract client
│  └─ dto.ts                   # 由 shared Zod schema 推導出的型別 re-export
├─ components/…               # 顧客專屬 UI 元件（列表、表單、對話框等）
├─ hooks/…                    # 業務邏輯 hooks（如 useCustomerData）
├─ model/                     # Redux slice（若需要額外 UI 狀態）
├─ pages/                     # React Router 進入點
├─ services/                  # 服務層（例如 `customerServiceV2.ts`）
└─ README.md                  # 本文件
```

## API / Service 責任分工

| 檔案 | 角色 | 說明 |
| --- | --- | --- |
| `api/client.ts` | Contract client | 以 `createCustomersContractClient` 建立 ts-rest client，負責設定 Authorization header 並維持 shared 定義的回應包裝。 |
| `api/customerApi.ts` | RTK Query slice | `queryFn` 直接呼叫 contract client；成功時取 `body.data`，失敗時轉成 `FetchBaseQueryError`，並以 `tagTypes` 管控快取。 |
| `services/customerServiceV2.ts` | 服務工具層 | 使用 contract client 實作 CRUD 與快速建檔；`assertSuccessBody / assertSuccessData / rethrow` 封裝 envelope 與錯誤，讓 legacy hooks 與元件共用。 |

> 建議新增功能優先使用 RTK Query。若暫時必須支援舊 hooks，請透過 service v2 呼叫，避免分散契約存取點。

## 資料流（列表查詢範例）

```text
Component → useGetCustomersQuery
          → customerContractClient.listCustomers
          → shared/api/contracts/customers.ts（Zod schema 驗證）
          → backend @ts-rest/express handler
```

- 型別來源：`CustomerCreateRequest` 等型別皆以 `z.infer` 從 shared schema 推導。
- 回傳包裝：後端維持 `success / message / data` envelope；前端只在成功時回傳 `data`。
- 錯誤處理：
  - 契約錯誤 → `toFetchError(status, body)`。
  - 網路 / 執行期錯誤 → `toUnknownFetchError(error)`。

## 開發守則（ts-rest）

1. **契約優先**：更新欄位時請先調整 `shared/schemas/zod/customer.ts` 與 `shared/api/contracts/customers.ts`，再同步前端。
2. **RTK Query 為主**：畫面資料流請優先使用 `customerApi` hooks；若需額外邏輯，再以 hooks 封裝。
3. **服務層共用**：非 RTK Query 場景可呼叫 `customerServiceV2.ts`，其內已包裝 ts-rest client 與 envelope 檢查。
4. **錯誤處理一致**：持續使用 `assertSuccessBody / assertSuccessData / rethrow` 取得成功/失敗訊息。
5. **測試策略**：
   - 契約／整合測試：以 `customerContractClient` 直接呼叫後端。
   - Hooks 測試：搭配 MSW 模擬成功、400、404 等情境。

## 常見問題

- **為何保留 service v2？** 舊版 hooks（例如 `useCustomerData`）尚未全面改用 RTK Query。透過 service v2 集中管理契約呼叫，可避免雙軌維護。
- **快取失效怎麼處理？** RTK Query mutation 已設定 `invalidatesTags: [{ type: 'Customer', id: 'LIST' }]`，呼叫完成後列表會自動重新取得。
- **Legacy 查詢參數？** `shared/schemas/zod/customer.ts` 使用 `.passthrough()` 允許舊參數，但正式欄位應同步更新 shared schema 與 OpenAPI。

---

提交 PR 時請附上：

- 契約／schema 變動（`shared/`、`openapi/`）。
- 測試證據（單元／整合／契約）。
- 風險與回滾策略（若涉及資料遷移）。
