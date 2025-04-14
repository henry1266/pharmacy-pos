# 出貨單自動計算總成本功能實現報告

## 需求概述

根據用戶需求，在出貨單輸入數量時，需要自動帶入該產品目前的進貨價*數量的數字到總成本的輸入框中。

## 實現方案

修改出貨單表單中的產品項目輸入組件，使其在輸入數量時自動計算並填入總成本。

### 主要修改

在`ItemForm.js`中添加了以下功能：

1. 新增了`getProductPurchasePrice`函數，用於獲取當前選中產品的進貨價：
   ```javascript
   // 獲取當前選中產品的進貨價
   const getProductPurchasePrice = () => {
     if (!currentItem.product) return 0;
     const selectedProduct = products?.find(p => p._id === currentItem.product);
     return selectedProduct?.purchasePrice || 0;
   };
   ```

2. 新增了`calculateTotalCost`函數，用於計算總成本：
   ```javascript
   // 自動計算總成本
   const calculateTotalCost = (quantity) => {
     const purchasePrice = getProductPurchasePrice();
     return (parseFloat(purchasePrice) * parseInt(quantity)).toFixed(2);
   };
   ```

3. 新增了`handleQuantityChange`函數，用於處理數量輸入變更並自動計算總成本：
   ```javascript
   // 處理數量輸入變更，自動計算總成本
   const handleQuantityChange = (e) => {
     const quantity = e.target.value;
     handleItemInputChange(e);
     
     if (quantity && quantity > 0) {
       const totalCost = calculateTotalCost(quantity);
       // 創建一個模擬的事件對象來更新總成本
       const totalCostEvent = {
         target: {
           name: 'dtotalCost',
           value: totalCost
         }
       };
       handleItemInputChange(totalCostEvent);
     }
   };
   ```

4. 將原來的`onChange={handleItemInputChange}`修改為`onChange={handleQuantityChange}`：
   ```javascript
   <TextField
     fullWidth
     label="數量"
     name="dquantity"
     type="number"
     value={currentItem.dquantity}
     onChange={handleQuantityChange}
     inputProps={{ min: 1 }}
     error={!isInventorySufficient()}
     helperText={!isInventorySufficient() ? "庫存不足" : ""}
     onKeyDown={(event) => {
       // 當按下ENTER鍵時
       if (event.key === 'Enter') {
         event.preventDefault();
         // 聚焦到總成本輸入框
         document.querySelector('input[name="dtotalCost"]').focus();
       }
     }}
   />
   ```

## 功能說明

1. 當用戶選擇一個產品後，系統會記錄該產品的進貨價
2. 當用戶在數量輸入框中輸入數量時，系統會自動計算該產品的進貨價*數量
3. 計算結果會自動填入總成本輸入框中
4. 用戶仍然可以手動修改總成本，以應對特殊情況

## 測試方法

可以通過以下步驟測試此功能：

1. 進入出貨單創建或編輯頁面
2. 選擇一個產品
3. 在數量輸入框中輸入數量
4. 觀察總成本輸入框是否自動填入了該產品的進貨價*數量的數字

## 注意事項

1. 自動計算功能僅在輸入數量時觸發，用戶仍然可以手動修改總成本
2. 如果產品沒有設置進貨價，或進貨價為0，總成本將被設置為0
3. 總成本會被格式化為兩位小數
