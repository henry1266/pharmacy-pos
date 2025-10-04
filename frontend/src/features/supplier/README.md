# Supplier 模組（ts-rest x RTK Query）

> 供應商資料維護（列表 / 詳細 / 建立 / 更新 / 刪除）全面以 shared Zod schema 與 ts-rest 契約為單一事實來源。前端透過 contract client 取得型別安全的 API，並保留 service v2 作為共用工具層。

## 功能總覽

- 供應商列表：搜尋、篩選、分頁、快取失效管理。
- 供應商詳情：單筆查詢、錯誤提示、資料驗證。
- 供應商維護：建立、更新、刪除，支援分頁重整與提示。

## 目錄結構

```text
supplier/
├─ api/
│  ├─ client.ts                # ts-rest contract client（自動注入 Authorization header）
│  ├─ supplierApi.ts           # RTK Query slice，queryFn 直接呼叫 contract client
│  └─ dto.ts                   # 型別 re-export（從 shared schema 推導）
├─ components/…               # 模組專屬 UI 元件（列表、詳情、對話框）
├─ hooks/…                    # 業務邏輯 hooks（useSupplierData、useSupplierManagement…）
├─ model/                     # Redux slice（若需要 UI 狀態）
├─ pages/                     # React Router 進入點
├─ types/                     # 型別整合
├─ services/                  # `supplierServiceV2.ts`（結合 ts-rest 客戶端）
└─ README.md                  # 本文件
```

## API / Service 責任分工

| 檔案 | 角色 | 說明 |
| --- | --- | --- |
| `api/client.ts` | Contract client | 使用 `createSuppliersContractClient`；統一 token 注入與 response envelope。 |
| `api/supplierApi.ts` | RTK Query slice | `queryFn` 直接呼叫 contract client，成功路徑回傳 `data`，失敗轉成 `FetchBaseQueryError`，並以 `tagTypes` 管理快取。 |
| `services/supplierServiceV2.ts` | 服務工具層 | 以 contract client 實作 CRUD；`assertSuccessBody / assertSuccessData / rethrow` 封裝 envelope 與錯誤，供 legacy hooks / components 使用。 |

## 資料流（列表查詢）

```
Component → useGetSuppliersQuery
          → supplierContractClient.listSuppliers
          → shared/api/contracts/suppliers.ts（Zod schema 驗證）
          → backend @ts-rest/express handler
```

- 型別來源：`SupplierCreateRequest` 等型別以 shared schema (`z.infer`) 推導。
- 回傳包裝：契約維持 `success / message / data`；前端只在成功時取 `data`。
- 錯誤處理：契約錯誤 → `toFetchError`；網路/執行期錯誤 → `toUnknownFetchError`。

## 開發守則

1. **契約優先**：調整欄位前請先更新 `shared/schemas/zod/supplier.ts` 與 `shared/api/contracts/suppliers.ts`，再同步前端。
2. **RTK Query 為主**：畫面資料請使用 `supplierApi` hooks；共用邏輯以 hooks 或 service v2 包裝。
3. **服務層共用**：非 RTK Query 場景可呼叫 `supplierServiceV2.ts`，保持 envelope 檢查一致。
4. **錯誤訊息一致**：沿用 `assertSuccessBody / assertSuccessData / rethrow`，避免自訂錯誤格式。
5. **測試策略**：
   - 契約／整合：以 `supplierContractClient` 直接呼叫後端。
   - Hooks：使用 MSW 模擬成功、400、404 等情境。

## 常見問題

- **為何仍保留 service v2？** 舊 hooks 仍依賴 service v2。透過 ts-rest client 封裝可避免雙份實作。
- **快取何時失效？** `supplierApi` mutation 已設定 `invalidatesTags: [{ type: 'Supplier', id: 'LIST' }]`，操作後會自動重新抓取列表資料。
- **Legacy 查詢參數？** `supplierSearchSchema` 允許 `.passthrough()`，舊參數仍可使用，但正式欄位需同步更新 shared schema 與 OpenAPI。

---

PR Checklist：
- 附上 shared 契約／schema diff。
- 提供測試證據（單元／整合／契約）。
- 說明風險與回滾策略（若涉及資料或批次操作）。
