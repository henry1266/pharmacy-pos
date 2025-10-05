# Dashboard 模組（ts-rest x RTK Query/service）

> 儀表板的統計資訊與趨勢圖改採 shared Zod schema 與 ts-rest 契約，透過共用的 contract client + service 封裝，確保資料來源一致。

## 功能總覽

- 儀表板摘要：銷售總覽、基本統計、低庫存警示、熱門商品、近期銷售。
- 銷售趨勢：近 30 天銷售額與筆數、商品分類銷售統計。

## 目錄結構

```text
dashboard/
├─ api/
│  └─ client.ts                # ts-rest dashboard contract client（自動帶入 Authorization header）
├─ components/…               # 儀表板 UI（統計卡片、清單、圖表）
├─ hooks/…                    # `useDashboardData` 等資料存取/處理 hooks
├─ pages/                     # `DashboardPage` 等路由進入點
├─ shared/、utils/            # 共用型別/轉換函式（仍可保留）
└─ README.md                  # 本文件
```

## API / Service 流程

```text
Component / Hook → dashboardService
                → dashboardContractClient.getDashboardSummary / getSalesTrend
                → shared/api/contracts/dashboard.ts（Zod 驗證）
                → backend `/api/dashboard/*`
```

- service 使用 `unwrapResponse` 處理 envelope，僅對成功 2xx 回傳 `data`。
- 銷售趨勢資料由後端聚合後回傳，再轉換成前端使用的 `totalSales` / `categorySales` 結構。

## 開發守則

1. **契約優先**：調整欄位請先更新 `shared/schemas/zod/dashboard.ts` 與 `shared/api/contracts/dashboard.ts`。
2. **共用 client**：前端請透過 `dashboardService` 或 `dashboardContractClient` 存取 API，不再直呼 axios。
3. **錯誤處理一致**：保持 `unwrapResponse` + `createError` 形式，確保訊息與狀態碼一致。
4. **測試建議**：
   - 契約／整合：以 `dashboardContractClient` 直接呼叫後端。
   - Hooks：使用 MSW 模擬成功與失敗情境。

---

PR Checklist：

- shared 契約／schema diff。
- 測試證據（unit / integration / contract）。
- 風險與回滾策略（例如儀表板暫時顯示舊資料的應對）。
