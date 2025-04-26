# AccountingNewPage 退押金負值與紅色顯示功能實現報告

## 功能概述

在 AccountingNewPage 中實現與 AccountingForm 相同的退押金規則：當項目為"退押金"時，該條目的值自動轉為負數，並且輸入框顯示為紅色，以視覺方式提示用戶這是一筆退款交易。

## 實現細節

### 1. 退押金負值處理

修改了 `handleItemChange` 函數，添加了對"退押金"類別的特殊處理：

```javascript
// 如果是類別變更為"退押金"，確保金額為負數
if (field === 'category' && value === '退押金') {
  // 如果當前金額為正數或為空，則將其轉為負數
  const currentAmount = updatedItems[index].amount;
  if (currentAmount > 0) {
    updatedItems[index].amount = -Math.abs(currentAmount);
  } else if (currentAmount === '' || currentAmount === 0) {
    // 如果為空或為0，暫時不處理，等待用戶輸入金額
  }
}

// 如果是金額變更且類別為"退押金"，確保金額為負數
if (field === 'amount' && updatedItems[index].category === '退押金' && value !== '') {
  updatedItems[index][field] = -Math.abs(parseFloat(value));
} else {
  updatedItems[index][field] = field === 'amount' ? (value === '' ? '' : parseFloat(value)) : value;
}
```

這段代碼實現了兩種情況下的負值處理：
1. 當用戶選擇"退押金"類別時，如果已有金額，則自動轉為負數
2. 當用戶在"退押金"類別下輸入金額時，無論輸入正數還是負數，系統都會將其轉為負數

### 2. 紅色框顯示

為金額輸入框添加了條件樣式，當類別為"退押金"時顯示紅色邊框和紅色文字：

```javascript
sx={{
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: item.category === '退押金' ? 'red' : 'inherit',
      borderWidth: item.category === '退押金' ? 2 : 1
    },
    '&:hover fieldset': {
      borderColor: item.category === '退押金' ? 'red' : 'inherit'
    },
    '&.Mui-focused fieldset': {
      borderColor: item.category === '退押金' ? 'red' : 'primary.main'
    }
  },
  '& .MuiInputBase-input': {
    color: item.category === '退押金' ? 'red' : 'inherit'
  }
}}
```

這段樣式實現了：
1. 當類別為"退押金"時，輸入框邊框顯示為紅色，並且邊框寬度增加為2px
2. 當鼠標懸停在輸入框上時，保持紅色邊框
3. 當輸入框獲得焦點時，保持紅色邊框
4. 輸入框內的文字顯示為紅色

## 使用說明

1. 在記帳新增頁面中，當選擇"退押金"作為名目類別時：
   - 如果已經輸入了金額，系統會自動將其轉為負數
   - 如果尚未輸入金額，當用戶輸入金額時，系統會自動將其轉為負數
   - 金額輸入框會顯示為紅色邊框，輸入的數字也會顯示為紅色

2. 這種視覺提示可以幫助用戶快速識別退押金交易，避免錯誤輸入正數金額。

## 技術說明

1. **代碼重用**：
   - 與 AccountingForm 組件中實現的功能完全相同
   - 保持了代碼的一致性，確保相同的業務邏輯在不同頁面中有相同的實現

2. **數據處理**：
   - 使用 Math.abs() 確保取絕對值
   - 使用負號 (-) 確保金額為負數
   - 對空值和零值進行特殊處理，避免轉換錯誤

3. **樣式處理**：
   - 使用 Material-UI 的 sx 屬性設置條件樣式
   - 通過 CSS 選擇器定制輸入框的不同狀態（默認、懸停、聚焦）
   - 同時修改邊框顏色、邊框寬度和文字顏色

## 效果展示

當用戶選擇"退押金"類別時：
- 金額自動變為負數
- 輸入框顯示紅色邊框
- 金額文字顯示為紅色

這種視覺和數據上的雙重處理，確保了退押金交易在記帳系統中的正確記錄和直觀識別。

## 與 AccountingForm 的一致性

此實現確保了 AccountingNewPage 和 AccountingForm 組件在處理退押金交易時有完全一致的行為和視覺效果，提高了系統的一致性和用戶體驗。
