# AccountingDataGrid 子組件

## 📋 概述

本目錄包含 AccountingDataGrid 使用的所有子組件，這些組件負責特定的視覺呈現和交互功能。

## 🏗️ 組件列表

### FundingStatus.tsx
顯示資金狀態的組件，包括可用餘額、已使用金額等信息。

### LoadingSkeleton.tsx
數據載入時顯示的骨架屏組件，提供良好的載入體驗。

### StatusChip.tsx
顯示交易狀態的標籤組件，根據不同狀態顯示不同顏色和文字。

### TransactionFlow.tsx
視覺化顯示交易資金流向的組件，清晰展示資金來源和去向。

## 🚀 使用方式

這些組件主要由 AccountingDataGrid 主組件內部使用，但也可以在其他地方單獨使用：

```tsx
import { StatusChip, TransactionFlow } from '@/modules/accounting3/components/ui/AccountingDataGrid';

const MyComponent = () => {
  return (
    <div>
      <StatusChip status="confirmed" />
      <TransactionFlow 
        sourceAccount="現金"
        targetAccount="銷售收入"
        amount={1000}
      />
    </div>
  );
};
```

## 🎯 設計原則

1. **單一職責**: 每個子組件只負責一個特定功能
2. **可重用性**: 組件設計為可在不同上下文中重用
3. **一致性**: 遵循統一的設計語言和交互模式

---

**最後更新**: 2025-08-07  
**維護者**: 開發團隊