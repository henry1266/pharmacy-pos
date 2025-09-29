# 變更日誌（範本）

> 本檔案由 Release Manager 維護，所有版本須附任務卡與測試證據連結。

## [Unreleased]

### Shared
- _範例：新增 `inventoryAdjustment` schema，需同步 API 契約。_

### OpenAPI
- _範例：更新 `/inventory/adjustments` 回應模型，SemVer `minor`。_

### Backend
- _範例：整合 shared schema，補契約測試與覆蓋率連結。_

### Frontend
- _範例：調整 RTK Query 型別與 UI 驗證，附 E2E 測試。_

---

## [1.0.0] - 2025-01-01

### Shared
- 初始版本。供應基底 Zod Schemas。

### OpenAPI
- 初始版本。公開 POS 主要 API 契約。

### Backend
- 初始版本。提供庫存、訂單、會計服務。

### Frontend
- 初始版本。React POS 介面與驗證流程。

> 備註：請依照 PR 任務卡填寫測試連結、SemVer 決策與風險/回滾說明。
