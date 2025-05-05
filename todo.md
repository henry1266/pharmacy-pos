# 專案優化：元件分析

## InventoryList.js

- [X] **InventoryList.js**:
    - [X] 評估其通用性：是否在至少 2-3 個不同功能模組中使用？ (結果：否，僅用於產品詳情相關模組)
    - [X] 檢查是否嚴格遵循 Props-Driven 設計？是否包含內部業務邏輯？ (結果：否，包含大量內部業務邏輯和狀態管理)
    - [X] 若非真正通用或過於複雜，考慮移至特定功能模組或重構。(決策：已移至 `src/components/products/` 並驗證建置成功)

## FIFOSimulationDialog.js

- [ ] **FIFOSimulationDialog.js**:
    - [X] 評估其通用性。(結果：否，僅被 `PriceTooltip.js` 引用)
    - [X] 檢查是否 Props-Driven。(結果：大部分是，但 `handleApplyCost` 包含複雜的 DOM 操作邏輯，與特定表單耦合)
    - [X] 若非通用，移至相關功能模組。(決策：已重構 `handleApplyCost` 移除 DOM 操作，並將 `FIFOSimulationDialog.js` 與 `PriceTooltip.js` 一同移至 `src/components/form-widgets/`，建置驗證成功)
