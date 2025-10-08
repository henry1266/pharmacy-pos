# 產品模組 ts-rest 遷移計畫

## 狀態快照

| 階段 | 狀態 | 最新更新 | 備註 |
| ----- | ----- | ----------- | ----- |
| 階段 0 - 對齊與範疇 | 已完成 | 2025-10-05 | ADR 已建立，端點盤點確認。 |
| 階段 1 - 共享 SSOT 基礎 | 進行中 | 2025-10-05 | 已完成 Zod 結構與產品契約草稿；待 SSOT 審查與 OpenAPI 同步。 |
| 階段 2 - 後端模組 | 進行中 | 2025-10-05 | 讀寫端點已遷移；契約回歸測試與回退計畫已記錄；封套轉接器待完成。 |
| 階段 3 - 前端整合 | 進行中 | 2025-10-06 | ts-rest client 導入進行中，待表單驗證與 UI 回歸測試完成。 |
| 階段 4 - 遷移與清理 | 尚未開始 | N/A | 需建立正式環境信心與監控鉤子。 |
| 階段 5 - 強化與附加 | 尚未開始 | N/A | 契約採用穩定後排程。 |

## 階段說明

### 階段 0 - 對齊與範疇

- 出場條件：使命、限制與封套預期皆記錄於 ADR，並完成審查者簽核。
- 已交付：`docs/adr/2025-10-05-products-contract-migration-alignment.md`、端點矩陣、相容性假設。
- 待跟進：在後端切換前解決 ADR 中的開放問題。
- 任務清單：
  - [x] 記錄遷移 ADR 並送審。
  - [x] 盤點舊版路由、封套與消費者。
  - [ ] 取得 HITL 對包裝單位路由、分頁中繼資料與 ProductApiClient 退役的回覆。

### 階段 1 - 共享 SSOT 基礎

- 出場條件：產品 schema 與契約落地於 `shared/` 與 `openapi/`，與舊版回應對齊，並釋出產生的 client。
- 主要負責：Schema Steward（主責）、API Contract Enforcer（複核）。
- 依賴：ADR 決議、上游包裝單位 schema、ts-rest 工具鏈。
- 任務清單：
  - [x] 撰寫 `shared/schemas/zod/product.ts`，涵蓋 DTO、查詢與包裝單位。
  - [x] 撰寫 `shared/api/contracts/products.ts`，維持封套格式的回應。
  - [x] 更新 OpenAPI 路徑/元件以符合 `productsContract`（產生 ts-rest 綁定與 SDK）。
  - [x] 在確認相容性後將 `productsContract` 納入 `shared/api/contracts/index.ts` router。
  - [x] 發布契約測試用的合法/非法樣本（`shared/testing/products`）。
  - [x] 評估 SemVer 影響並記錄於發佈準備日誌（`docs/release-notes/products-contract.md`）。

### 階段 2 - 後端模組

- 出場條件：`backend/modules/products` 暴露 mirror 舊行為的 ts-rest router，封套維持相容，並通過自動化測試。
- 主要負責：Backend Orchestrator，並由 API Contract Enforcer 支援。
- 任務清單：
  - [x] 在 `backend/modules/products` 下腳手架 ts-rest router 與 controller（初始 handler 回傳 501，待移植舊邏輯）。
  - [x] 重構舊服務為 orchestrator/services 分層並重用包裝單位（create/update/delete 從舊 router 遷移）。
  - [x] 將讀取端點（清單 + 明細）移植至 `backend/modules/products/services/product.service.ts`，利用包裝單位 helper。
  - [x] 透過 `FEATURE_PRODUCTS_CONTRACT` 功能旗標控管 ts-rest router 上線（預設關閉）。
  - [x] 新增封套轉接器以對應舊版成功/錯誤封套（timestamp、statusCode、filters）。
  - [x] 補充契約測試與回歸套件涵蓋 create/update/delete 流程（`backend/modules/products/__tests__/products.contract.test.ts`）。
  - [x] 紀錄回退/旗標策略（`docs/release-notes/products-contract.md`）。

### 階段 3 - 前端整合

- 出場條件：前端查詢改用產生的 SDK，移除直接使用 axios，表單驗證與共享 schema 對齊。
- 主要負責：Frontend Builder。
- 任務清單：
  - [x] 以產生的 ts-rest client 取代 `ProductApiClient`。
  - [x] 更新 RTK Query slice 與 hook，導入新的封套 helper。
  - [x] 表單與列表視圖改用共享驗證器（不得重複定義 Zod）。
  - [ ] 為清單/明細/新增/更新流程補 UI 回歸測試。

### 階段 4 - 遷移與清理

- 出場條件：舊 Express 路由退場或別名化，文件與監控更新，回退計畫演練完成。
- 任務清單：
  - [ ] 設定流量切換與功能旗標策略。
  - [ ] 信心窗口後移除冗餘 axios 服務。
  - [ ] 更新 runbook、入門文件與變更日誌。
  - [ ] 建立參考舊路由的回退手冊。

### 階段 5 - 強化與附加

- 出場條件：關鍵路徑覆蓋率 ≥ 80%，效能與可觀測性基線完成紀錄，切換後事項關閉。
- 任務清單：
  - [ ] 增補契約/E2E 測試覆蓋邊界案例（分頁、軟刪除、包裝單位）。
  - [ ] 針對熱門端點進行效能測試並在監控看板記錄門檻。
  - [ ] 完成 CHANGELOG、SemVer 發佈與監控告警設定。

## 橫向依賴

- 執行期旗標 `FEATURE_PRODUCTS_CONTRACT` 控制 router 切換；封套轉接器與測試完成前保持關閉。
- `shared/` 仍為 DTO、驗證與契約輸出的 SSOT。
- `openapi/paths/products.json` 必須依 ts-rest 契約重新產生；遇到破壞性欄位需附註 SemVer 說明。
- 供前端/後臺使用的產生式 SDK 需協調版本調整。
- 舊資料模型（`backend/models/Product`, `ProductPackageUnit`）在遷移前仍為權威來源。

## 風險登錄

| 風險 | 影響 | 緩解措施 | 負責人 |
| ---- | ------ | ---------- | ----- |
| 舊回應與 ts-rest 契約封套出現漂移（例如包裝單位生效日為 null） | 中 | 契約回歸測試涵蓋可為 null 的包裝單位；持續監控新差異。 | API Contract Enforcer |
| 重構期間包裝單位異動語意退化 | 高 | 保留既有服務層，針對 `/:id/package-units` 增加整合測試。 | Backend Orchestrator |
| 分階段上線導致前端功能差異 | 中 | 提供具型別的相容 helper，並依畫面分階段開啟旗標。 | Frontend Builder |
| 遺漏 SemVer 與變更日誌更新 | 低 | 在合併前由 Release Manager 檢查清單確認。 | Release Manager |

## 驗證計畫

| 範疇 | 測試 | 備註 |
| ---- | ----- | ----- |
| 共享結構 | Zod 與舊版樣本對照測試；lint/tsc | 發布契約套件前執行。 |
| 後端 | ts-rest 契約測試、服務單元測試、supertest 回歸 | 確保 router 上線前 CI 綠燈並比對封套。 |
| 前端 | RTK Query 契約模擬、產品流程 Cypress 煙霧測試 | 在功能旗標金絲雀階段執行。 |
| 可觀測性 | Pino 結構化日誌、traceId 傳遞檢查 | 在移除舊路由前進行壓力驗證。 |

## 參考資料

- ts-rest router 腳手架：`../../../../backend/modules/products/http/routes/products.router.ts`
- 服務層移植（讀取流程）：`../../../../backend/modules/products/services/product.service.ts`
- ADR：`../../../../docs/adr/2025-10-05-products-contract-migration-alignment.md`
- 舊版 router 參考：`../../../../backend/routes/products.ts`
- 現行產品服務使用處：`../` UI 模組與 `../../services/productServiceV2.ts`

## 工作流負責

| 階段 | 主要代理角色 | 指派負責人 | HITL 審查者 | 備註 |
| ----- | ------------------ | -------------- | ------------- | ----- |
| 階段 0 | Schema Steward | Codex（待交接） | Product Lead | 已完成；等待開放問題回覆。 |
| 階段 1 | Schema Steward + API Contract Enforcer | Backend Guild | Architecture Council | 需 SSOT 簽核與 OpenAPI 重產。 |
| 階段 2 | Backend Orchestrator | Services Team | Tech Lead | 讀寫端點已在模組內；封套轉接器完成後以 `products-contract` 旗標推出 alpha。 |
| 階段 3 | Frontend Builder | Web Platform Squad | UX Lead | 與 POS 前線協調金絲雀發布。 |
| 階段 4 | Migrator + Release Manager | Platform Ops | CTO Delegate | 需完成回退演練與溝通計畫。 |
| 階段 5 | Testwright + Sec & Compliance Auditor | Quality Guild | Compliance Officer | 納入監控覆蓋度的事後檢討。 |

## 即將到來的里程碑

| 里程碑 | 目標日期 | 阻塞依賴 | 驗收證據 |
| --------- | ----------- | --------------------- | ------------- |
| 解決 ADR 開放問題 | 2025-10-07 | 包裝單位範圍、分頁、client 退役的 HITL 回覆 | ADR 更新並獲審查者核可。 |
| 發布 SSOT 產出 | 2025-10-09 | 重生 OpenAPI 路徑、schema 對等測試 | 具版本的 `openapi/paths/products.json` diff 與 schema 測試報告。 |
| 後端 ts-rest alpha 就緒 | 2025-10-16 | 階段 1 完成、功能旗標架構、回歸套件 | 新模組 CI 綠燈、封套快照測試、上線檢查表。 |
| 前端 POS 金絲雀切換 | 2025-10-24 | 後端 alpha 部署、SDK 版本釋出 | 金絲雀回饋文件 + UI 回歸報告。 |
| 舊路由退役投票 | 2025-11-07 | 指標穩定、兩週內無 Sev-1 事件 | 變更日誌條目、回退計畫封存、發佈簽核。 |

## 產出追蹤

| 產出項目 | 位置 | 負責人 | 狀態 | 備註 |
| -------- | -------- | ----- | ------ | ----- |
| 遷移 ADR | `docs/adr/2025-10-05-products-contract-migration-alignment.md` | Schema Steward | 已完成 | 待 HITL 回饋後更新。 |
| Zod 結構 | `shared/schemas/zod/product.ts` | Schema Steward | 審查中 | 需補驗證樣本與對等測試。 |
| ts-rest 契約 | `shared/api/contracts/products.ts` | API Contract Enforcer | 審查中 | 已接入 shared router；等待後端 handler 腳手架。 |
| OpenAPI 規格 | `openapi/paths/products.json` | Schema Steward | 已更新 | 2025-10-05 依共享契約重產。 |
| 後端模組 | `backend/modules/products` | Backend Orchestrator | 進行中 | 讀寫流程已接上 ts-rest；封套轉接器與 rollout 計畫待完成。 |
| 前端整合指南 | `frontend/src/features/product/README.md` | Frontend Builder | 進行中 | 金絲雀回饋後持續更新。 |
| 測試矩陣 | `shared/testing/products` | Testwright | 已初始化 | 已發布合法/非法樣本；覆蓋儀表板待建。 |
| 發佈紀錄 | `docs/release-notes/products-contract.md` | Release Manager | 草稿 | 已記錄功能旗標回退與 SemVer 指引。 |

## HITL 檢查點與升級路徑

- 階段 1 出場需 Architecture Council 確認 SSOT 對等與相容性樣本。
- 階段 2 佈署需 Tech Lead 審閱回歸與契約測試證據後手動核准。
- 階段 3 金絲雀 rollout 擴大前需 UX Lead 與 POS 前線代表確認。
- 階段 4 舊路由退役需 CTO Delegate 在回退演練後批准。

## 溝通計畫

- 非同步更新：每週四收盤前於 `#proj-products-contract-migration` Slack 頻道更新狀態快照差異。
- 決策紀錄：將關鍵決策補入 ADR 並從本 README 的參考區連結。
- 事件處理：Sev-2 以上事件依 on-call 手冊處理，並註明本遷移為變更背景。

