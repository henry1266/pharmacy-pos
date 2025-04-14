# 出貨單庫存記錄功能實現報告（最終版）

## 需求概述

根據專案需求和用戶反饋，出貨單(shippingorders)在完成時需要產生一個全新的inventories記錄，類型為"ship"，而不是修改現有記錄。當出貨單被刪除時，也要同時刪除對應的庫存記錄。此外，ProductsPage右側的庫存統計和ProductDetailCard的InventoryList也需要包含ship類型的記錄。

## 實現方案

參考進貨單(purchaseorders)的設計架構，為出貨單(shippingorders)完成時創建全新的ship類型庫存記錄，並更新前端顯示。

### 主要修改

1. 在`Inventory.js`模型中：
   - 添加了'ship'類型到enum列表中
   - 添加了shippingOrderId和shippingOrderNumber字段來存儲出貨單的相關信息

2. 在`shippingOrders.js`中：
   - 移除了影響其他inventories記錄的代碼（updateInventory函數的調用）
   - 保留了createShippingInventoryRecords函數來創建新的ship類型庫存記錄
   - 修改了出貨單刪除的處理邏輯，確保刪除出貨單時也刪除對應的庫存記錄

3. 在`useInventoryData.js`中：
   - 更新了mergeInventoryByPurchaseOrder函數，確保它能處理shippingOrderNumber
   - 確保getTotalInventory函數包含所有類型的庫存記錄，包括ship類型

4. 在`InventoryList.js`中：
   - 更新了篩選條件，考慮shippingOrderNumber
   - 添加了shipGroups來合併相同出貨單號的記錄
   - 更新了排序邏輯，考慮shippingOrderNumber
   - 更新了類型顯示和數量計算，為'ship'類型添加特定的顯示文本和顏色
   - 更新了orderLink生成邏輯，為'ship'類型生成正確的鏈接

### 具體實現

1. **修改shippingOrders.js**：
   ```javascript
   // 移除updateInventory函數的調用
   // 如果狀態為已完成，則創建ship類型庫存記錄
   if (shippingOrder.status === 'completed') {
     await createShippingInventoryRecords(shippingOrder);
   }

   // 如果狀態從非完成變為完成，則創建ship類型庫存記錄
   if (oldStatus !== 'completed' && shippingOrder.status === 'completed') {
     await createShippingInventoryRecords(shippingOrder);
   }
   ```

2. **更新useInventoryData.js**：
   ```javascript
   // 合併相同進貨單號的庫存記錄
   const mergeInventoryByPurchaseOrder = (inventoryData) => {
     // 使用Map來按進貨單號分組並加總數量
     const groupedByPO = new Map();
     
     // 第一步：按進貨單號分組並加總數量
     inventoryData.forEach(item => {
       const poNumber = item.purchaseOrderNumber || item.shippingOrderNumber || '未指定';
       
       if (groupedByPO.has(poNumber)) {
         // 如果已有該進貨單號的記錄，加總數量
         const existingItem = groupedByPO.get(poNumber);
         existingItem.quantity = (parseInt(existingItem.quantity) || 0) + (parseInt(item.quantity) || 0);
       } else {
         // 如果是新的進貨單號，創建新記錄
         groupedByPO.set(poNumber, { ...item });
       }
     });
     
     // 第二步：將Map轉換回數組
     const mergedInventory = Array.from(groupedByPO.values());
     
     // 第三步：按進貨單號排序
     mergedInventory.sort((a, b) => {
       const poA = a.purchaseOrderNumber || a.shippingOrderNumber || '';
       const poB = b.purchaseOrderNumber || b.shippingOrderNumber || '';
       return poA.localeCompare(poB);
     });
     
     // 第四步：重新計算累計庫存量
     let cumulativeQuantity = 0;
     mergedInventory.forEach(item => {
       cumulativeQuantity += parseInt(item.quantity) || 0;
       item.cumulativeQuantity = cumulativeQuantity;
     });
     
     return mergedInventory;
   };
   ```

3. **更新InventoryList.js**：
   ```javascript
   // 篩選條件：至少saleNumber、purchaseOrderNumber或shippingOrderNumber其中之一要有值
   const filteredInventories = response.data.filter(inv => {
     const hasSaleNumber = inv.saleNumber && inv.saleNumber.trim() !== '';
     const hasPurchaseOrderNumber = inv.purchaseOrderNumber && inv.purchaseOrderNumber.trim() !== '';
     const hasShippingOrderNumber = inv.shippingOrderNumber && inv.shippingOrderNumber.trim() !== '';
     return hasSaleNumber || hasPurchaseOrderNumber || hasShippingOrderNumber;
   });
   
   // 合併相同類型且單號相同的記錄
   const mergedInventories = [];
   const saleGroups = {};
   const purchaseGroups = {};
   const shipGroups = {};
   
   filteredInventories.forEach(inv => {
     if (inv.saleNumber) {
       // 處理銷售記錄
     } else if (inv.purchaseOrderNumber) {
       // 處理進貨記錄
     } else if (inv.shippingOrderNumber) {
       if (!shipGroups[inv.shippingOrderNumber]) {
         shipGroups[inv.shippingOrderNumber] = {
           ...inv,
           type: 'ship',
           totalQuantity: inv.quantity
         };
       } else {
         shipGroups[inv.shippingOrderNumber].totalQuantity += inv.quantity;
       }
     }
   });
   
   // 將合併後的記錄添加到結果數組
   Object.values(saleGroups).forEach(group => mergedInventories.push(group));
   Object.values(purchaseGroups).forEach(group => mergedInventories.push(group));
   Object.values(shipGroups).forEach(group => mergedInventories.push(group));
   ```

## 庫存記錄格式

出貨單創建的庫存記錄格式如下：

```javascript
{
  "product": {
    "$oid": "產品ID"
  },
  "quantity": -數量, // 負數表示庫存減少
  "totalAmount": 總金額,
  "shippingOrderId": {
    "$oid": "出貨單ID"
  },
  "shippingOrderNumber": "出貨單號",
  "type": "ship", // 類型為'ship'
  "lastUpdated": {
    "$date": "更新時間"
  },
  "__v": 0
}
```

## 測試方法

可以通過以下步驟測試此功能：

1. 創建一個新的出貨單，並將狀態設置為"completed"
2. 檢查inventories集合中是否生成了相應的記錄，類型為'ship'，數量為負數
3. 確認ProductsPage右側的庫存統計是否正確包含ship類型記錄
4. 確認ProductDetailCard的InventoryList是否顯示ship類型記錄，並且顯示為"出貨"類型
5. 將出貨單狀態從"completed"改為其他狀態，檢查相關的庫存記錄是否被刪除
6. 刪除一個已完成的出貨單，檢查相關的庫存記錄是否被刪除

## 注意事項

1. 出貨單創建的庫存記錄使用'ship'類型，而不是'sale'
2. 出貨單創建的庫存記錄數量為負數，表示庫存減少
3. 出貨單創建的庫存記錄使用出貨單ID和出貨單號，存儲在shippingOrderId和shippingOrderNumber字段中
4. 當出貨單被刪除時，相關的庫存記錄也會被刪除
5. 已移除影響其他inventories記錄的代碼，確保出貨單完成時只創建新的ship類型記錄而不修改現有記錄
6. 已更新產品頁面庫存統計和ProductDetailCard的InventoryList，確保ship類型的記錄也被包含在統計中並正確顯示
