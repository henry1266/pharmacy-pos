# 出貨單庫存記錄功能實現報告（更新版）

## 需求概述

根據專案需求，出貨單(shippingorders)在完成時需要產生一個全新的inventories記錄，類型為"ship"，而不是修改現有記錄。當出貨單被刪除時，也要同時刪除對應的庫存記錄。

## 實現方案

參考進貨單(purchaseorders)的設計架構，為出貨單(shippingorders)完成時創建全新的ship類型庫存記錄。

### 主要修改

1. 在`Inventory.js`模型中：
   - 添加了'ship'類型到enum列表中
   - 添加了shippingOrderId和shippingOrderNumber字段來存儲出貨單的相關信息

2. 在`shippingOrders.js`中新增了以下功能：
   - `createShippingInventoryRecords`函數：為出貨單的每個項目創建新的ship類型庫存記錄
   - `deleteShippingInventoryRecords`函數：刪除與出貨單相關的ship類型庫存記錄
   - 在出貨單狀態變為"completed"時調用這些函數
   - 修改了出貨單刪除的處理邏輯，確保即使是已完成的出貨單被刪除時也會刪除相關庫存記錄

### 具體實現

1. **修改Inventory模型**：
   ```javascript
   const InventorySchema = new mongoose.Schema({
     // 其他字段...
     type: {
       type: String,
       enum: ['purchase', 'sale', 'return', 'adjustment', 'ship'],
       default: 'purchase'
     },
     // 其他字段...
     shippingOrderId: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'shippingorder'
     },
     shippingOrderNumber: {
       type: String
     },
     // 其他字段...
   });
   ```

2. **新增createShippingInventoryRecords函數**：
   ```javascript
   // 為出貨單創建新的ship類型庫存記錄的輔助函數
   async function createShippingInventoryRecords(shippingOrder) {
     try {
       for (const item of shippingOrder.items) {
         if (!item.product) continue;
         
         // 為每個出貨單項目創建新的庫存記錄
         const inventory = new Inventory({
           product: item.product,
           quantity: -parseInt(item.dquantity), // 負數表示庫存減少
           totalAmount: Number(item.dtotalCost),
           shippingOrderId: shippingOrder._id, // 使用出貨單ID
           shippingOrderNumber: shippingOrder.orderNumber, // 使用出貨單號
           type: 'ship' // 設置類型為'ship'
         });
         
         await inventory.save();
         console.log(`已為產品 ${item.product} 創建新庫存記錄，出貨單號: ${shippingOrder.orderNumber}, 數量: -${item.dquantity}, 總金額: ${item.dtotalCost}, 類型: ship`);
       }
       
       console.log(`已成功為出貨單 ${shippingOrder._id} 創建所有ship類型庫存記錄`);
     } catch (err) {
       console.error(`創建ship類型庫存記錄時出錯: ${err.message}`);
       throw err; // 重新拋出錯誤，讓調用者知道出了問題
     }
   }
   ```

3. **新增deleteShippingInventoryRecords函數**：
   ```javascript
   // 刪除與出貨單相關的ship類型庫存記錄
   async function deleteShippingInventoryRecords(shippingOrderId) {
     try {
       const result = await Inventory.deleteMany({ shippingOrderId: shippingOrderId, type: 'ship' });
       console.log(`已刪除 ${result.deletedCount} 筆與出貨單 ${shippingOrderId} 相關的ship類型庫存記錄`);
       return result;
     } catch (err) {
       console.error(`刪除ship類型庫存記錄時出錯: ${err.message}`);
       throw err;
     }
   }
   ```

4. **在出貨單創建和更新時調用這些函數**：
   ```javascript
   // 在創建出貨單時
   if (shippingOrder.status === 'completed') {
     await updateInventory(shippingOrder);
     // 為出貨單創建新的ship類型庫存記錄
     await createShippingInventoryRecords(shippingOrder);
   }

   // 在更新出貨單時
   if (oldStatus !== 'completed' && shippingOrder.status === 'completed') {
     await updateInventory(shippingOrder);
     // 為出貨單創建新的ship類型庫存記錄
     await createShippingInventoryRecords(shippingOrder);
   }

   // 當狀態從已完成改為其他狀態時
   if (oldStatus === 'completed' && status !== 'completed') {
     await restoreInventory(shippingOrder._id);
     // 刪除相關的ship類型庫存記錄
     await deleteShippingInventoryRecords(shippingOrder._id);
   }
   ```

5. **修改出貨單刪除的處理邏輯**：
   ```javascript
   // 刪除出貨單
   router.delete('/:id', async (req, res) => {
     try {
       const shippingOrder = await ShippingOrder.findById(req.params.id);
       if (!shippingOrder) {
         return res.status(404).json({ msg: '找不到該出貨單' });
       }

       // 如果出貨單已完成，也允許刪除，但需要處理庫存
       if (shippingOrder.status === 'completed') {
         // 刪除相關的ship類型庫存記錄
         await deleteShippingInventoryRecords(shippingOrder._id);
         // 恢復庫存
         await restoreInventory(shippingOrder._id);
       }

       await shippingOrder.deleteOne();
       res.json({ msg: '出貨單已刪除' });
     } catch (err) {
       console.error(err.message);
       if (err.kind === 'ObjectId') {
         return res.status(404).json({ msg: '找不到該出貨單' });
       }
       res.status(500).send('伺服器錯誤');
     }
   });
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
3. 將出貨單狀態從"completed"改為其他狀態，檢查相關的庫存記錄是否被刪除
4. 刪除一個已完成的出貨單，檢查相關的庫存記錄是否被刪除

## 注意事項

1. 出貨單創建的庫存記錄使用'ship'類型，而不是'sale'
2. 出貨單創建的庫存記錄數量為負數，表示庫存減少
3. 出貨單創建的庫存記錄使用出貨單ID和出貨單號，存儲在shippingOrderId和shippingOrderNumber字段中
4. 當出貨單被刪除時，相關的庫存記錄也會被刪除
5. 已修改出貨單刪除的處理邏輯，即使是已完成的出貨單也可以被刪除，但會先刪除相關庫存記錄並恢復庫存
