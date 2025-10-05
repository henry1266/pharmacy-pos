# Daily Journal 模組

> 交班 / 記帳作業使用 shared Zod schema 與 ts-rest 契約為單一事實來源，透過 contract client 與 RTK Query / service v2 統一資料流程。

## 功能總覽

- 記帳列表：依日期、班別、關鍵字篩選，顯示每日記帳與金額彙總。
- 記帳詳情：檢視／編輯記帳項目、未結銷售與狀態切換。
- 記帳分類：建立／更新／刪除記帳類別。
- 未結銷售：依日期取得未與記帳連結的銷售資料。

## 目錄結構

```text
daily-journal/
├─ api/
│  └─ client.ts                # ts-rest accounting contract client（自動注入 Authorization header）
├─ components/…               # 列表、表單、篩選、資料表等 UI 元件
├─ hooks/…                    # `useAccountingData` 等業務邏輯 hooks
├─ pages/                     # `JournalPage`、`NewEntryPage`、`CategoryPage`…
├─ services/                  # 透過 ts-rest 客戶端實作的 `accountingServiceV2`
└─ README.md                  # 本文件
```

## 資料流

```text
Component / Hook
    ↓ (accountingServiceV2 / RTK Query)
Accounting contract client (`accountingContractClient`)
    ↓ shared/api/contracts/accounting.ts（Zod 驗證）
backend routes `/api/accounting`, `/api/accounting-categories`, `/api/accounting/unaccounted-sales`
```

- 新增／更新時會先將日期格式化為 `yyyy-MM-dd` 後再送出。
- 回傳格式兼容 envelope 與直接物件，service 會自動解包。

## 開發守則

1. **契約優先**：欄位調整請先更新 `shared/schemas/zod/accounting.ts` 與 `shared/api/contracts/accounting.ts`。
2. **RTK Query / service v2**：`useAccountingData` 等 hooks 應透過 ts-rest service，避免直接使用 axios。
3. **錯誤處理一致**：使用 `unwrapResponse`（內建於 service）維持訊息一致性。
4. **測試策略**：
   - 契約 / 整合：用 `accountingContractClient` 直接打後端。
   - Hooks：搭配 MSW 模擬成功、400、404 等情境。

## TODO / 建議

- 建立 `daily-journal/api/journalApi.ts`（RTK Query）作為下一階段優化。
- 撰寫 hooks / service 的單元測試。
- 清理 `useAccountingData` 中的中文亂碼班別常數（改為 enum）。

---

提交 PR 時記得附上：

- shared 契約或 schema 變更 diff。
- 測試證據（unit / integration / 契約）。
- 風險與回滾策略（特別是涉及批次記帳／銷售連動）。
