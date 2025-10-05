# Employees 模組（ts-rest x Service）

> 員工（employees）與員工帳號（employee account）操作改採 shared Zod schema + ts-rest 契約，前端透過契約 client / service 封裝，統一出入口。

## 功能範圍

- 員工基本資料的新增、查詢、更新、刪除。
- 員工帳號（EmployeeAccount）的查詢、權限調整、啟停用。
- 後續可擴充工作時數、加班、排班等模組。

## 目錄結構

```text
employees/
├─ api/
│  └─ client.ts                # ts-rest employee contract client，自動加入 Authorization header
├─ components/…               # 員工列表、表單、對話框等 UI
├─ hooks/…                    # `useEmployeeData` 等資料存取 hooks
├─ pages/                     # `EmployeesPage`、`EmployeeDetailPage` 等路由
├─ services/                  # `employeeServiceV2.ts`（封裝 contract client）
├─ types/                     # 前端專用型別（若仍需要）
└─ README.md                  # 本文件
```

## API / Service 流程

```
Component / Hook → employeeServiceV2
                → employeeContractClient (ts-rest)
                → shared/api/contracts/employees.ts（Zod 驗證）
                → backend `/api/employees`, `/api/employees/:id`, `/api/employees/:id/account`...
```

- Service 層統一使用 `unwrapResponse`/`createError` 封裝 envelope 與錯誤訊息。
- 查詢條件透過 contract 的 `employeeSearchSchema`（`search`/`department`/`isActive` 等）。

## 開發守則

1. **契約優先**：欄位調整請先更新 `shared/schemas/zod/employee.ts` 與 `shared/api/contracts/employees.ts`，再同步前端。
2. **共用 client**：前端請透過 `employeeServiceV2` 或 `employeeContractClient` 呼叫 API，避免散落 axios。
3. **錯誤處理一致**：保持 `unwrapResponse` + `createError` 流程，確保錯誤與訊息一致。
4. **測試策略**：
   - 契約／整合：使用 `employeeContractClient` 直接打後端。
   - Hooks：配合 MSW 模擬成功／400／404 等情境。

---

PR Checklist：
- shared 契約／schema diff。
- 測試證據（unit / integration / contract）。
- 風險與回滾策略（如大批刪除、同步權限等特別注意）。
