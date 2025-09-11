# 簡易交易流向輸入模式

## 概述

簡易交易流向輸入模式是為了簡化一借一貸交易的輸入過程而設計的功能。它提供了一個直觀的界面，讓用戶可以快速完成常見的會計分錄輸入。

## 主要特點

### 1. 流向圖設計
- **視覺化流向**：以「來源科目 → 目標科目」的方式顯示交易流向
- **兩端選擇器**：只顯示流向圖的兩端，簡化選擇過程
- **科目標籤**：使用 Chip 組件顯示科目名稱，清晰易讀

### 2. 一鍵借貸對調
- **中間按鈕**：在流向圖中間放置對調按鈕
- **即時對調**：點擊按鈕可立即交換借方和貸方科目
- **視覺反饋**：按鈕有明確的視覺提示和 hover 效果

### 3. 單一金額輸入
- **自動平衡**：只需輸入一個金額，系統自動確保借貸平衡
- **即時更新**：金額變更時立即更新分錄資料
- **格式化顯示**：支援貨幣格式化顯示

### 4. 智能模式切換
- **自動判斷**：系統自動判斷交易是否適合簡易模式
- **無縫切換**：可隨時切換到進階模式
- **狀態保持**：切換時保持已輸入的資料

## 組件結構

### SimpleTransactionFlow
主要的簡易模式組件，包含：
- 科目選擇器
- 借貸對調按鈕
- 金額輸入欄位
- 交易描述輸入
- 狀態顯示

### EnhancedDoubleEntrySection
增強版的雙分錄區塊，支援：
- 簡易模式和進階模式切換
- 自動相容性檢測
- 統一的介面和事件處理

## 使用流程

1. **選擇來源科目**：點擊「從（貸方）」按鈕選擇資金來源科目
2. **選擇目標科目**：點擊「到（借方）」按鈕選擇資金流向科目
3. **輸入金額**：在金額欄位輸入交易金額
4. **填寫描述**：輸入交易描述
5. **確認提交**：檢查資料無誤後提交

## 技術實現

### 資料流
```typescript
// 分錄資料結構
interface EmbeddedAccountingEntry3FormData {
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  description: string;
}

// 簡易模式狀態
const [simpleAmount, setSimpleAmount] = useState(0);
const [simpleDescription, setSimpleDescription] = useState('');
```

### 借貸對調邏輯
```typescript
const handleSwapAccounts = () => {
  const newEntries = [...entries];
  newEntries.forEach(entry => {
    const temp = entry.debitAmount;
    entry.debitAmount = entry.creditAmount;
    entry.creditAmount = temp;
  });
  onEntriesChange(newEntries);
};
```

### 自動平衡機制
```typescript
const handleAmountChange = (newAmount: number) => {
  // 找到借方和貸方分錄
  const debitIndex = newEntries.findIndex(entry => entry.debitAmount > 0);
  const creditIndex = newEntries.findIndex(entry => entry.creditAmount > 0);
  
  // 同時更新借方和貸方金額
  newEntries[debitIndex].debitAmount = newAmount;
  newEntries[creditIndex].creditAmount = newAmount;
};
```

## 相容性檢測

系統會自動檢測交易是否適合簡易模式：

```typescript
const isSimpleModeCompatible = useMemo(() => {
  if (entries.length !== 2) return false;
  
  const debitEntries = entries.filter(entry => entry.debitAmount > 0);
  const creditEntries = entries.filter(entry => entry.creditAmount > 0);
  
  return debitEntries.length === 1 && creditEntries.length === 1;
}, [entries]);
```

## 錯誤處理

- **科目未選擇**：顯示提示訊息要求選擇科目
- **金額無效**：驗證金額格式和範圍
- **描述為空**：提供預設描述或要求填寫
- **平衡檢查**：確保借貸金額相等

## 樣式設計

### 色彩系統
- **來源科目**：使用 secondary 色彩（橘色系）
- **目標科目**：使用 primary 色彩（藍色系）
- **對調按鈕**：使用 primary 色彩配合邊框設計
- **成功狀態**：使用 success 色彩（綠色系）

### 響應式設計
- 支援桌面和行動裝置
- 彈性佈局適應不同螢幕尺寸
- 觸控友好的按鈕大小

## 未來擴展

1. **範本支援**：預設常用的交易範本
2. **快捷鍵**：支援鍵盤快捷操作
3. **批次輸入**：支援多筆相似交易的快速輸入
4. **智能建議**：根據歷史記錄提供科目建議
5. **多幣別支援**：支援不同貨幣的交易輸入

## 注意事項

- 簡易模式僅適用於一借一貸的交易
- 複雜的多分錄交易需要使用進階模式
- 切換模式時會保持已輸入的資料
- 系統會自動驗證借貸平衡