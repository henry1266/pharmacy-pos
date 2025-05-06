# SalesPage vs SalesEditPage UI 比對 (2025-05-06)

**目標**: 讓 SalesEditPage 的輸入介面與 SalesPage 盡可能相似。

**主要差異點**:

1.  **整體佈局**:
    *   `SalesPage`: 左右兩欄佈局 (md=8 主內容區, md=4 側邊資訊區)。主內容區包含產品輸入和項目列表，側邊包含銷售資訊卡和快捷按鈕。
    *   `SalesEditPage`: 單欄佈局，元件 (資訊卡、項目列表、摘要操作區) 垂直堆疊。

2.  **元件使用與內容分配**:
    *   **客戶選擇**: `SalesPage` 在側邊欄的 `SaleInfoCard`；`SalesEditPage` 在頂部的 `SaleEditInfoCard`。
    *   **條碼輸入**: `SalesPage` 在主內容區頂部的 `SalesProductInput`；`SalesEditPage` 在頂部的 `SaleEditInfoCard`。
    *   **項目列表**: `SalesPage` 使用 `SalesItemsTable` (主內容區)，有輸入模式切換；`SalesEditPage` 使用 `SalesEditItemsTable` (主區域)，直接編輯數量/單價。
    *   **折扣/付款/備註**: `SalesPage` 在側邊欄的 `SaleInfoCard`；`SalesEditPage` 在底部的 `SaleEditSummaryActions`。
    *   **總金額顯示**: `SalesPage` 在 `SalesItemsTable` 下方；`SalesEditPage` 在底部的 `SaleEditSummaryActions`。
    *   **儲存/更新按鈕**: `SalesPage` 在主內容區底部；`SalesEditPage` 在底部的 `SaleEditSummaryActions`。
    *   **快捷按鈕/自訂產品**: `SalesPage` 有；`SalesEditPage` 無 (合理，編輯頁面通常不需要)。

**重構 SalesEditPage UI 規劃**:

1.  **調整佈局**: 將 `SalesEditPage.js` 的 Grid 改為左右兩欄 (md=8, md=4)，類似 `SalesPage`。
2.  **重新分配元件位置**: 
    *   將 `SaleEditInfoCard` 移至主內容區 (md=8)，並修改其內容，可能只保留條碼輸入。
    *   創建一個新的元件 `SaleEditDetailsCard` (類似 `SaleInfoCard`)，放置於側邊欄 (md=4)，用於放置客戶選擇、折扣、付款方式/狀態、備註等欄位。
    *   `SalesEditItemsTable` 保留在主內容區 (md=8)。
    *   將「更新銷售記錄」按鈕移至主內容區 (md=8) 底部。
    *   移除 `SaleEditSummaryActions` 元件。
3.  **元件適配**: 
    *   修改 `SaleEditInfoCard`，使其專注於條碼輸入。
    *   實現 `SaleEditDetailsCard`。
4.  **更新 Props 傳遞**: 在 `SalesEditPage.js` 中調整傳遞給各子元件的 props。

