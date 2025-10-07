# Employees 模組 — SSOT 合約導向

> 員工主檔、帳號綁定與排班管理的一站式後端模組，全面依賴 `shared/` Zod schemas 與 ts-rest 契約以維持單一事實來源（SSOT）。

## 目錄結構與責任

| 路徑 | 說明 |
| --- | --- |
| `employees.routes.ts` | 以 `@ts-rest/express` 建立 router，逐一實作 `employeesContract`，負責驗證、成功/錯誤包裝與中央記錄。 |
| `employees.service.ts` | 員工 CRUD 協調層，將 Mongoose `Employee` 模型結果轉型為 `employeeSchema`。 |
| `services/employeeAccountService.ts` | 員工 ↔ 使用者帳號綁定、密碼雜湊、去重檢查；回傳結構對齊 `employeeAccountSchema`。 |
| `services/schedule.service.ts` | 員工排班 CRUD 與日期區段查詢，提供衝突偵測與 `employeeSchedulesByDateSchema` 群組化。 |
| `services/overtimeRecords.ts` | 既有 Express router，處理加班紀錄查詢/統計（尚未遷移至 ts-rest，維持 legacy API）。 |
| `models/Employee.ts` | Mongoose schema，對應 `@pharmacy-pos/shared/types/entities.Employee`；支援 `userId` 綁定。 |
| `models/EmployeeSchedule.ts` | Mongoose schema，對應 `employeeScheduleSchema`，提供排班查詢索引。 |
| `utils/employeeAccountValidation.ts` | 共享驗證工具（存在檢查、帳號唯一性、帳號資料提取）。 |
| `employeeAccounts.ts` | 舊版 Express router，保留給尚未升級的客戶端；新功能請改走 `employees.routes.ts`。 |
| `__tests__/` | Jest 單元／整合測試（routes、service、account 驗證）。 |

## SSOT 契約流程

1. **Schema**：`shared/schemas/zod/employee.ts`、`employeeSchedule.ts` 定義所有欄位與驗證。
2. **Contract**：`shared/api/contracts/employees.ts` 以 ts-rest 宣告 REST 介面；自動生成 OpenAPI 與前端 SDK。
3. **Handler**：`backend/modules/employees/employees.routes.ts` 透過 `initServer().router(contract, ...)` 建立型別安全 handler。
4. **服務層**：`employees.service.ts`、`services/*.ts` 將資料庫結果轉成 SSOT schema；只暴露 domain 專注方法。
5. **OpenAPI/SDK**：執行 `pnpm --filter @pharmacy-pos/shared run generate:openapi` 後，前端透過 `shared/services/employeeApiClient.ts` 消費同一契約。

## API 一覽（`employeesContract`）

| Method | Path | Contract Key | Service/協調點 | 摘要 |
| --- | --- | --- | --- | --- |
| GET | `/employees` | `listEmployees` | `listEmployees()` | 分頁/條件查詢員工（部門、職稱、日期區間）。 |
| GET | `/employees/:id` | `getEmployeeById` | `getEmployeeById()` | 依 ID 取得員工詳細資料。 |
| POST | `/employees` | `createEmployee` | `createEmployee()` | 建立員工主檔，支援建立者追蹤。 |
| PUT | `/employees/:id` | `updateEmployee` | `updateEmployee()` | 更新員工主檔；自動同步 lean document。 |
| DELETE | `/employees/:id` | `deleteEmployee` | `deleteEmployee()` | 刪除員工，回傳標準成功訊息結構。 |
| GET | `/employee-accounts/:employeeId` | `getEmployeeAccount` | `getEmployeeAccount()` | 查詢員工綁定的登入帳號。 |
| POST | `/employee-accounts` | `createEmployeeAccount` | `createEmployeeAccount()` | 建立帳號，檢查 username/email 唯一並雜湊密碼。 |
| PUT | `/employee-accounts/:employeeId` | `updateEmployeeAccount` | `updateEmployeeAccount()` | 更新帳號資料（含啟用狀態、密碼重設）。 |
| DELETE | `/employee-accounts/:employeeId` | `deleteEmployeeAccount` | `deleteEmployeeAccount()` | 移除帳號並解除員工綁定。 |
| PUT | `/employee-accounts/:employeeId/unbind` | `unbindEmployeeAccount` | `unbindEmployeeAccount()` | 僅解除綁定，不刪除 `User`。 |
| GET | `/employee-schedules` | `listEmployeeSchedules` | `listSchedules()` | 依日期/員工/請假類型查詢排班。 |
| POST | `/employee-schedules` | `createEmployeeSchedule` | `createSchedule()` | 新增排班，內建時段衝突檢查。 |
| PUT | `/employee-schedules/:scheduleId` | `updateEmployeeSchedule` | `updateSchedule()` | 更新排班（含異動員工或時段）。 |
| DELETE | `/employee-schedules/:scheduleId` | `deleteEmployeeSchedule` | `deleteSchedule()` | 刪除排班資料。 |
| GET | `/employee-schedules/by-date` | `getEmployeeSchedulesByDate` | `getSchedulesByDate()` | 將排班依日期彙總成 `morning/afternoon/evening` 區塊。 |

## 核心協作重點

- **員工主檔**：`employees.service.ts` 使用 `mapEmployee()` 將 Mongoose document 轉為純物件，並確保日期、ID 格式與 `employeeSchema` 一致。
- **帳號綁定**：`services/employeeAccountService.ts` 透過 `utils/employeeAccountValidation.ts` 檢查員工是否已有帳號、username/email 是否重複，再寫入 `models/User`。
- **排班管理**：`services/schedule.service.ts` 以 Zod schema 驗證查詢與輸入，`assertScheduleAvailable()` 保障同員工同日/時段唯一；`EmployeeScheduleServiceError` 轉換為 HTTP 錯誤碼。
- **加班紀錄**：`services/overtimeRecords.ts` 仍為 Express router。若需擴充，優先補齊對應 Zod schema 與契約後再遷移。
- **前端整合**：`shared/services/employeeApiClient.ts` 暴露型別安全 client，React/RTK Query 模組直接重用，減少 DTO 漂移。

## 測試與驗證

| 類型 | 指令 | 說明 |
| --- | --- | --- |
| 型別檢查 | `pnpm --filter @pharmacy-pos/backend type-check` | 確認 ts-rest handler 與服務層型別安全。 |
| 單元/整合測試 | `pnpm --filter @pharmacy-pos/backend test -- --runTestsByPath modules/employees` | 執行 routes、service、account 驗證測試。 |
| 合約再生成 | `pnpm --filter @pharmacy-pos/shared run generate:openapi` | 確保 OpenAPI/SDK 與最新 schema 同步。 |

## PR Checklist（Employees 模組）

- [ ] `shared/schemas/zod/employee*.ts` 與 `shared/api/contracts/employees.ts` 已更新且通過 lint/type-check。
- [ ] 執行 `pnpm --filter @pharmacy-pos/shared run generate:openapi`；必要時更新前端 SDK。
- [ ] 新增/修改 handler 已覆蓋測試（`__tests__/`），並附上 coverage 報告連結。
- [ ] 若涉及 legacy Express router (`employeeAccounts.ts`、`services/overtimeRecords.ts`)，已標註後續遷移計畫或風險緩解。
- [ ] README / ADR 已同步最新決策與回滾策略。

---

如需新增欄位或用例，請依「Schema → Contract → Generator → Service/Route → Test」順序進行，並在 PR 任務卡記錄決策依據與風險緩解。
