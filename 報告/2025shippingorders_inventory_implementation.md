# 出貨單庫存記錄功能實現報告

## 需求概述

根據專案需求，出貨單(shippingorders)在完成時需要產生一個inventories記錄，類似於進貨單(purchaseorders)的功能。目前出貨管理已成功新增shippingorders，但未建立inventories紀錄。

## 實現方案

參考進貨單(purchaseorders)的設計架構，為出貨單(shippingorders)完成時也能產生對應的inventories記錄。

### 主要修改

1. 在`shippingOrders.js`中新增了以下功能：

   - `createInventoryRecords`函數：為出貨單的每個項目創建新的庫存記錄
   - `deleteInventoryRecords`函數：刪除與出貨單相關的庫存記錄
   - 在出貨單狀態變為"completed"時調用這些函數

### 具體實現

1. **新增createInventoryRecords函數**：
   ```javascript
   // 新增：為出貨單創建庫存記錄的輔助函數
   async function createInventoryRecords(shippingOrder) {
     try {
       for (const item of shippingOrder.items) {
         if (!item.product) continue;
         
         // 為每個出貨單項目創建新的庫存記錄
         const inventory = new Inventory({
           product: item.product,
           quantity: -parseInt(item.dquantity), // 負數表示庫存減少
           totalAmount: Number(item.dtotalCost),
           purchaseOrderId: shippingOrder._id, // 使用出貨單ID
           purchaseOrderNumber: shippingOrder.orderNumber, // 使用出貨單號
           type: 'sale' // 設置類型為'sale'
         });
         
         await inventory.save();
         console.log(`已為產品 ${item.product} 創建新庫存記錄，出貨單號: ${shippingOrder.orderNumber}, 數量: -${item.dquantity}, 總金額: ${item.dtotalCost}`);
       }
       
       console.log(`已成功為出貨單 ${shippingOrder._id} 創建所有庫存記錄`);
     } catch (err) {
       console.error(`創建庫存記錄時出錯: ${err.message}`);
       throw err; // 重新拋出錯誤，讓調用者知道出了問題
     }
   }
   ```

2. **新增deleteInventoryRecords函數**：
   ```javascript
   // 新增：刪除與出貨單相關的庫存記錄
   async function deleteInventoryRecords(shippingOrderId) {
     try {
       const result = await Inventory.deleteMany({ purchaseOrderId: shippingOrderId, type: 'sale' });
       console.log(`已刪除 ${result.deletedCount} 筆與出貨單 ${shippingOrderId} 相關的庫存記錄`);
       return result;
     } catch (err) {
       console.error(`刪除庫存記錄時出錯: ${err.message}`);
       throw err;
     }
   }
   ```

3. **在出貨單創建和更新時調用這些函數**：
   ```javascript
   // 在創建出貨單時
   if (shippingOrder.status === 'completed') {
     await updateInventory(shippingOrder);
     // 新增：為出貨單創建庫存記錄
     await createInventoryRecords(shippingOrder);
   }

   // 在更新出貨單時
   if (oldStatus !== 'completed' && shippingOrder.status === 'completed') {
     await updateInventory(shippingOrder);
     // 新增：為出貨單創建庫存記錄
     await createInventoryRecords(shippingOrder);
   }

   // 當狀態從已完成改為其他狀態時
   if (oldStatus === 'completed' && status !== 'completed') {
     await restoreInventory(shippingOrder._id);
     // 新增：刪除相關的庫存記錄
     await deleteInventoryRecords(shippingOrder._id);
   }
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
  "purchaseOrderId": {
    "$oid": "出貨單ID"
  },
  "purchaseOrderNumber": "出貨單號",
  "type": "sale", // 類型為'sale'
  "lastUpdated": {
    "$date": "更新時間"
  },
  "__v": 0
}
```

## 測試方法

可以通過以下步驟測試此功能：

1. 創建一個新的出貨單，並將狀態設置為"completed"
2. 檢查inventories集合中是否生成了相應的記錄，類型為'sale'，數量為負數
3. 將出貨單狀態從"completed"改為其他狀態，檢查相關的庫存記錄是否被刪除

## 注意事項

1. 出貨單創建的庫存記錄使用'sale'類型，而不是'shipping'，因為Inventory模型中定義的類型枚舉為['purchase', 'sale', 'return', 'adjustment']
2. 出貨單創建的庫存記錄數量為負數，表示庫存減少
3. 出貨單創建的庫存記錄使用出貨單ID和出貨單號，存儲在purchaseOrderId和purchaseOrderNumber字段中
