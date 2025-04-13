# 出貨系統設計文檔

## 1. 概述

出貨系統是藥局POS系統的重要組成部分，用於管理藥品的出貨流程。該系統與進貨系統結構對稱，但在功能上有所不同：進貨系統增加庫存，而出貨系統扣減庫存。

## 2. 數據模型設計

### 2.1 出貨單模型 (ShippingOrder)

```javascript
{
  _id: ObjectId,            // MongoDB自動生成的ID
  soid: String,             // 出貨單號，格式：SO + 年月日 + 序號，例如：SO2025041300001
  sobill: String,           // 發票號碼
  sobilldate: Date,         // 發票日期
  socustomer: String,       // 客戶名稱
  customer: {               // 客戶引用
    type: ObjectId,
    ref: 'Customer'
  },
  items: [{                 // 出貨項目
    did: String,            // 藥品代碼
    dname: String,          // 藥品名稱
    dquantity: Number,      // 出貨數量
    dtotalCost: Number,     // 總金額
    product: {              // 藥品引用
      type: ObjectId,
      ref: 'Product'
    }
  }],
  totalAmount: Number,      // 總金額
  notes: String,            // 備註
  status: {                 // 狀態：處理中、已完成、已取消
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {          // 付款狀態：未收、已收款、已開立
    type: String,
    default: '未收'
  },
  createdAt: Date,          // 創建時間
  updatedAt: Date           // 更新時間
}
```

### 2.2 客戶模型 (Customer)

```javascript
{
  _id: ObjectId,            // MongoDB自動生成的ID
  name: String,             // 客戶名稱
  contact: String,          // 聯絡人
  phone: String,            // 電話
  address: String,          // 地址
  email: String,            // 電子郵件
  notes: String,            // 備註
  createdAt: Date,          // 創建時間
  updatedAt: Date           // 更新時間
}
```

## 3. API設計

### 3.1 出貨單API

#### 3.1.1 獲取所有出貨單
- **路徑**: `/api/shipping-orders`
- **方法**: GET
- **描述**: 獲取所有出貨單列表
- **響應**: 出貨單數組

#### 3.1.2 獲取單個出貨單
- **路徑**: `/api/shipping-orders/:id`
- **方法**: GET
- **描述**: 根據ID獲取單個出貨單詳情
- **響應**: 出貨單對象

#### 3.1.3 創建出貨單
- **路徑**: `/api/shipping-orders`
- **方法**: POST
- **描述**: 創建新的出貨單，並扣減庫存
- **請求體**: 出貨單數據
- **響應**: 創建的出貨單對象

#### 3.1.4 更新出貨單
- **路徑**: `/api/shipping-orders/:id`
- **方法**: PUT
- **描述**: 更新現有出貨單，並調整庫存
- **請求體**: 更新的出貨單數據
- **響應**: 更新後的出貨單對象

#### 3.1.5 刪除出貨單
- **路徑**: `/api/shipping-orders/:id`
- **方法**: DELETE
- **描述**: 刪除出貨單，並恢復庫存
- **響應**: 刪除結果

#### 3.1.6 搜索出貨單
- **路徑**: `/api/shipping-orders/search`
- **方法**: POST
- **描述**: 根據條件搜索出貨單
- **請求體**: 搜索條件
- **響應**: 符合條件的出貨單數組

#### 3.1.7 CSV導入出貨單
- **路徑**: `/api/shipping-orders/import/basic`
- **方法**: POST
- **描述**: 從CSV導入基本出貨單信息
- **請求體**: CSV文件
- **響應**: 導入結果

#### 3.1.8 CSV導入出貨項目
- **路徑**: `/api/shipping-orders/import/items`
- **方法**: POST
- **描述**: 從CSV導入出貨項目
- **請求體**: CSV文件
- **響應**: 導入結果

### 3.2 客戶API

#### 3.2.1 獲取所有客戶
- **路徑**: `/api/customers`
- **方法**: GET
- **描述**: 獲取所有客戶列表
- **響應**: 客戶數組

#### 3.2.2 獲取單個客戶
- **路徑**: `/api/customers/:id`
- **方法**: GET
- **描述**: 根據ID獲取單個客戶詳情
- **響應**: 客戶對象

#### 3.2.3 創建客戶
- **路徑**: `/api/customers`
- **方法**: POST
- **描述**: 創建新的客戶
- **請求體**: 客戶數據
- **響應**: 創建的客戶對象

#### 3.2.4 更新客戶
- **路徑**: `/api/customers/:id`
- **方法**: PUT
- **描述**: 更新現有客戶
- **請求體**: 更新的客戶數據
- **響應**: 更新後的客戶對象

#### 3.2.5 刪除客戶
- **路徑**: `/api/customers/:id`
- **方法**: DELETE
- **描述**: 刪除客戶
- **響應**: 刪除結果

## 4. 前端組件結構

### 4.1 出貨單相關組件結構

```
frontend/src/components/
├── shipping-orders/            # 出貨單相關組件
│   ├── common/                 # 共用元件
│   │   ├── StatusChip.js       # 狀態標籤組件
│   │   ├── PaymentStatusChip.js # 付款狀態標籤組件
│   │   └── ConfirmDialog.js    # 通用確認對話框
│   ├── list/                   # 列表相關組件
│   │   ├── ShippingOrdersTable.js # 出貨單表格
│   │   ├── TableActions.js     # 表格操作按鈕
│   │   ├── TableFilters.js     # 表格篩選器
│   │   └── PreviewPopover.js   # 預覽彈出框
│   ├── form/                   # 表單相關組件
│   │   ├── BasicInfo/          # 基本信息相關
│   │   │   ├── index.js        # 基本信息表單主組件
│   │   │   ├── CustomerSelect.js # 客戶選擇組件
│   │   │   ├── StatusSelect.js # 狀態選擇組件
│   │   │   └── PaymentSelect.js # 付款狀態選擇組件
│   │   └── ProductItems/       # 產品項目相關
│   │       ├── ItemsTable.js   # 項目表格
│   │       ├── ItemForm.js     # 項目表單
│   │       └── ItemActions.js  # 項目操作按鈕
│   └── import/                 # 導入相關組件
│       └── CsvImportDialog.js  # CSV導入對話框
```

### 4.2 頁面組件

```
frontend/src/pages/
├── ShippingOrdersPage.js       # 出貨單列表頁面
├── ShippingOrderFormPage.js    # 出貨單表單頁面
├── ShippingOrderEditPage.js    # 出貨單編輯頁面
└── ShippingOrderDetailPage.js  # 出貨單詳情頁面
```

### 4.3 Redux相關

```
frontend/src/redux/
├── actions/
│   ├── shippingOrderActions.js # 出貨單相關actions
│   └── customerActions.js      # 客戶相關actions
└── reducers/
    ├── shippingOrderReducer.js # 出貨單相關reducer
    └── customerReducer.js      # 客戶相關reducer
```

## 5. 功能差異說明

出貨系統與進貨系統的主要功能差異在於庫存處理：

1. **進貨系統**：添加進貨單時，增加相應藥品的庫存數量。
2. **出貨系統**：添加出貨單時，扣減相應藥品的庫存數量。

具體實現差異：

1. **API實現**：
   - 出貨API在創建和更新出貨單時，需要檢查庫存是否足夠，不足時應該返回錯誤。
   - 出貨API在刪除出貨單時，需要恢復之前扣減的庫存。

2. **前端實現**：
   - 出貨表單需要顯示當前庫存數量，以便用戶參考。
   - 出貨表單需要在用戶輸入數量時，驗證是否超過庫存。

3. **用戶體驗**：
   - 出貨系統需要提供庫存不足的警告和錯誤提示。
   - 出貨系統需要在選擇藥品時顯示當前庫存數量。

## 6. 實現計劃

1. **後端實現**：
   - 創建客戶模型和API
   - 創建出貨單模型和API
   - 實現庫存扣減邏輯

2. **前端實現**：
   - 創建出貨單相關組件
   - 創建出貨單相關頁面
   - 實現Redux相關功能
   - 實現用戶界面和交互邏輯

3. **測試**：
   - 測試出貨單基本功能
   - 測試庫存扣減功能
   - 測試錯誤處理

4. **部署**：
   - 提交代碼到GitHub
   - 更新文檔
