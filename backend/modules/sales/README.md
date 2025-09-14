# Sales 模組結構評估與優化建議

> 角色：以後端工程師與資深架構師的角度，針對 `backend/modules/sales` 目錄進行結構評估與優化建議，協助提升可維護性、正確性與可擴展性。

## 目前結構與職責

```
backend/modules/sales/
├─ index.ts                      # 匯出 router
├─ sales.routes.ts               # 路由宣告（含 Swagger 註解）
├─ sales.controller.ts           # HTTP 控制器，組裝 ApiResponse
├─ sales.service.ts              # 應用服務（查詢、建立、更新、刪除、流程編排）
├─ sales.types.ts                # 請求/回應與內部型別
├─ services/
│  ├─ search.service.ts          # Aggregation 查詢（一般/萬用字元）
│  ├─ inventory.service.ts       # 銷售對庫存的副作用
│  ├─ customer.service.ts        # 銷售對客戶積分/紀錄的副作用
│  └─ validation.service.ts      # 物件 Id 檢查、存在性、庫存檢查與驗證
└─ utils/
   └─ sales.utils.ts             # 銷貨單號產生、欄位建構
```

- 流程走向：`routes -> controller -> sales.service (編排) -> services/* (領域副作用/查詢) -> models`。
- 主要相依：`../../models/*`、`shared/types/api`、`logger`、`express-validator`、Mongoose。

## 優點

- 分層清楚：`routes/controller/service` 基本分工已具備。
- 邏輯拆分：庫存、客戶、查詢、驗證已各自抽成 service。
- 有型別檔與共用回應格式，便於前後端協作。
- 查詢具備萬用字元與一般搜尋兩種模式，並有基本 ReDoS 防護與投影。

## 問題與風險（建議優先級：高→中→低）

- 高：資料一致性與交易邊界
  - 建立/更新銷售後才更新庫存、客戶，缺少交易性；任何一步失敗會造成最終不一致。
  - 建議以 Mongoose Transaction（session + withTransaction）包住「銷售、庫存、客戶」三者的變更，或採用 Outbox/Event 驅動保證最終一致。
- 高：銷貨單號產生的併發風險
  - 目前以「找當日最大序號 +1」策略（`utils/sales.utils.ts`）存在競態條件，在高併發下易產生重複 key（雖有 unique index）。
  - 建議改為：
    - 使用 `counters` 集合（`findOneAndUpdate` with `$inc` + upsert + session`）原子自增；或
    - 在 `saleNumber` 上保留唯一索引，失敗時重試重新產號（最多 N 次）。
- 中：讀寫邊界、型別與命名不一致
  - `SaleItemInput.notes` vs `Sale.items.note` 命名不一致（複數/單數），易導致資料遺失或對不上；請統一命名並在 `buildSaleFields` 做映射或調整 Schema。
  - `sales.types.ts` 中多處 `any/Record<string, any>` 造成型別安全不足，建議以嚴格型別描述 `SaleDocument` 與 `SaleItem`。
  - `search.service.ts` 聚合使用 `productData.name`/`customerData.name`/`note` 等欄位，需與 `models` 實際欄位保持一致並加上索引。
- 中：查詢效能與邏輯位置
  - 多處查詢未使用 `.lean()`（例如 `sales.service.ts` 的讀操作），會回傳 Mongoose Document，增加記憶體/序列化成本。
  - 查詢/投影與報表性需求應聚合為 `queries/`（唯讀模型 `SaleView`），避免與交易模型混雜。
- 中：跨模組強耦合
  - 直接引用 `../../models/*`，使得模組難以替換資料層；建議以 Repository 介面隔離持久層，整合點（庫存、客戶）以 Gateway 介面抽象。
- 低：錯誤處理/日誌/國際化
  - 控制器內重複錯誤包裝、訊息中英文混雜且出現編碼亂碼；建議集中錯誤處理與訊息常數，統一編碼為 UTF-8。

## 建議的目錄重構（DDD 友善）

```
backend/modules/sales/
├─ application/
│  ├─ sales.routes.ts
│  ├─ sales.controller.ts
│  ├─ sales.service.ts          # 編排用（與交易邊界）
│  ├─ dto/
│  │  └─ sale.dto.ts            # CreateSaleDto / UpdateSaleDto / QueryDto
│  ├─ validators/
│  │  └─ sale.validator.ts      # zod 或 class-validator（取代/補強 express-validator）
│  └─ mappers/
│     └─ sale.mapper.ts         # DTO <-> Domain Entity 映射
├─ domain/
│  ├─ entities/
│  │  ├─ sale.entity.ts
│  │  └─ sale-item.vo.ts
│  ├─ services/
│  │  ├─ sale-number.service.ts # 單號產生策略 + 競態處理
│  │  └─ sale-policy.service.ts # 折扣/最小庫存/業務規則
│  ├─ events/
│  │  └─ sale-created.event.ts
│  └─ types/
│     └─ index.ts
├─ infrastructure/
│  ├─ persistence/
│  │  ├─ sale.model.ts          # Mongoose Schema（可由現有 models 遷入或包裝）
│  │  └─ sale.repository.ts     # Repository + 接口
│  ├─ integrations/
│  │  ├─ inventory.gateway.ts   # 抽象庫存整合
│  │  └─ customer.gateway.ts    # 抽象客戶整合
│  └─ queries/
│     └─ sale.search.ts         # 聚合/快取/投影專屬
├─ README.md
└─ index.ts
```

> 若短期不重構層次，也建議先以 `repositories/`、`dto/`、`validators/`、`queries/` 子資料夾在現有模組下落地，逐步去耦合。

## 具體優化建議（可逐步落地）

- 交易一致性（高）
  - 在 `sales.service.ts` 的建立/更新流程使用 Mongoose Session：
    - `withTransaction`: 建立銷售 -> 寫入庫存 -> 更新客戶 -> commit。
    - ReplicaSet 不可用時，考慮 Outbox + 消費者（Inventory/Customer）確保最終一致。
- 單號產生（高）
  - 保留 `saleNumber` 唯一索引，新增重試機制捕捉 Duplicate Key；或切換 `counters` 集合原子自增策略。
  - 若採 counters：以 `findOneAndUpdate({_id: YYYYMMDD}, {$inc:{seq:1}}, {upsert:true, new:true})` 取得序號，格式化為 3 位數。
- 型別與命名（中）
  - 統一 `SaleItem.note` 命名：將 `sales.types.ts` 的 `notes` 改為 `note`，或在 `buildSaleFields` 做欄位映射。
  - 去除 `any/Record<string, any>`：為 `SaleDocument`、`SaleItem`、查詢回傳定義嚴謹型別。
- 查詢效能（中）
  - 純讀 API 使用 `.lean()`；為 `saleNumber`、`date`、`items.product`、`customer` 加索引（若尚未）。
  - `search.service.ts` 中 Aggregation：加上最大返回筆數與必要投影，避免記憶體壓力；規劃 `queries/` 隔離。
- 去耦合（中）
  - 新增 `SaleRepository` 包住 Mongoose Model；`inventory/customer` 以 Gateway 介面注入，便於測試與替換實作。
- 驗證與錯誤（低）
  - 採用 `zod` 或 `class-validator` 定義 DTO 驗證，Controller 僅接收乾淨資料。
  - 集中錯誤轉換為一致的 `ApiResponse`，並統一訊息常數與語言。
- 其他（低）
  - 將 `utils/sales.utils.ts` 中與領域相關的 `generateSaleNumber`、`buildSaleFields` 移至 `domain/services` 或 `application/mappers`。
  - 修正檔案編碼為 UTF-8，避免中文亂碼；統一註解語言。

## Quick Wins（低風險立即收益）

- 在純讀函式加 `.lean()`：
  - `backend/modules/sales/sales.service.ts: findAllSales`
  - `backend/modules/sales/sales.service.ts: findTodaySales`
- 將 `SaleItemInput.notes` 與 `Sale.items.note` 對齊；在 `buildSaleFields` 補上欄位轉換。
- 在 Controller 建立 `param('id')` middleware：統一 ObjectId 檢查與 404 回覆，移除重複樣板碼。
- 對 `saleNumber` Duplicate Key 增加一次重試（短期緩解競態）。

## 漸進式調整計畫（建議）

- Phase 1（本週）：Quick Wins + 型別對齊 + `.lean()` + 統一編碼/訊息常數。
- Phase 2（下週）：新增 Repository/Gateway/DTO/Validator；Search 移入 `queries/`；補整合測試。
- Phase 3：單號產生策略切換至 `counters` 或補齊重試閉環；加壓測試驗證。
- Phase 4：導入交易（或 Outbox/Event）；建立失敗補償流程與告警。
- Phase 5：目錄重構到 `application/domain/infrastructure`；完善單元/整合測試矩陣。

## 驗收與測試建議

- 單元測試：單號產生策略、欄位映射、驗證邏輯、搜尋 Regex 清洗。
- 整合測試：建立/更新/刪除銷售的交易一致性（含庫存/客戶）、Duplicate Key 重試、查詢正確性與效能。
- 壓測：並發建立銷售（100~1k RPS）驗證單號唯一與交易成功率。

---

如需我直接為此模組落地 Repository 介面、`.lean()` 快速優化或單號重試機制，請告訴我要先從哪一項開始。
