# 出貨訂單服務 V2 使用指南

## 概述

出貨訂單服務 V2 是基於統一 API 架構重構的服務，提供完整的出貨訂單管理功能。本服務採用 BaseApiClient 架構，確保與其他服務的一致性和可維護性。

## 架構特點

### 1. 統一 API 客戶端
- 基於 `BaseApiClient` 的統一架構
- 標準化的 HTTP 方法和錯誤處理
- 類型安全的 API 調用

### 2. 前端服務包裝
- 業務邏輯封裝
- 錯誤處理和狀態管理
- 單例模式確保資源效率

### 3. 完整功能覆蓋
- CRUD 基本操作
- 高級搜尋和篩選
- CSV 匯入功能
- 批次操作
- 統計和報表

## 文件結構

```
shared/services/
├── shippingOrderApiClient.ts     # 共享 API 客戶端
frontend/src/services/
├── shippingOrderServiceV2.ts     # 前端服務包裝
frontend/src/tests/
├── shippingOrderServiceV2.test.ts # 測試套件
frontend/src/examples/
├── shippingOrderServiceV2Example.tsx # 使用範例
docs/
├── shipping-order-service-v2.md  # 本文件
```

## 快速開始

### 1. 基本使用

```typescript
import { shippingOrderServiceV2 } from '../services/shippingOrderServiceV2';

// 獲取所有出貨訂單
const orders = await shippingOrderServiceV2.getAllShippingOrders();

// 根據 ID 獲取特定訂單
const order = await shippingOrderServiceV2.getShippingOrderById('order-id');

// 創建新訂單
const newOrder = await shippingOrderServiceV2.createShippingOrder({
  sosupplier: '供應商名稱',
  items: []
});
```

### 2. 搜尋和篩選

```typescript
// 基本搜尋
const results = await shippingOrderServiceV2.searchShippingOrders({
  soid: 'SO-2024-001',
  sosupplier: '供應商A'
});

// 日期範圍搜尋
const dateResults = await shippingOrderServiceV2.searchShippingOrders({
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

// 根據供應商獲取訂單
const supplierOrders = await shippingOrderServiceV2.getShippingOrdersBySupplier('supplier-id');
```

### 3. 批次操作

```typescript
// 批次更新狀態
await shippingOrderServiceV2.batchUpdateStatus(
  ['order-id-1', 'order-id-2'], 
  'completed'
);

// 批次更新付款狀態
await shippingOrderServiceV2.batchUpdatePaymentStatus(
  ['order-id-1', 'order-id-2'], 
  '已收款'
);
```

### 4. CSV 匯入

```typescript
// 匯入基本出貨訂單資訊
const basicImportResult = await shippingOrderServiceV2.importBasicShippingOrders(csvFile);

// 匯入藥品明細
const medicineImportResult = await shippingOrderServiceV2.importMedicineDetails(csvFile);
```

## API 參考

### 基本 CRUD 操作

#### `getAllShippingOrders(params?: PaginationParams): Promise<ShippingOrder[]>`
獲取所有出貨訂單，支援分頁參數。

#### `getShippingOrderById(id: string): Promise<ShippingOrder>`
根據 ID 獲取特定出貨訂單。

#### `createShippingOrder(data: ShippingOrderCreateRequest): Promise<ShippingOrder>`
創建新的出貨訂單。

#### `updateShippingOrder(id: string, data: ShippingOrderUpdateRequest): Promise<ShippingOrder>`
更新現有出貨訂單。

#### `deleteShippingOrder(id: string): Promise<void>`
刪除出貨訂單。

### 搜尋和查詢

#### `searchShippingOrders(params: ShippingOrderSearchParams): Promise<ShippingOrder[]>`
根據搜尋參數查找出貨訂單。

**搜尋參數：**
```typescript
interface ShippingOrderSearchParams {
  soid?: string;           // 出貨單號
  sosupplier?: string;     // 供應商
  status?: string;         // 狀態
  paymentStatus?: string;  // 付款狀態
  startDate?: string;      // 開始日期
  endDate?: string;        // 結束日期
  page?: number;           // 頁碼
  limit?: number;          // 每頁數量
}
```

#### `getShippingOrdersBySupplier(supplierId: string): Promise<ShippingOrder[]>`
根據供應商 ID 獲取出貨訂單。

#### `getShippingOrdersByProduct(productId: string): Promise<ShippingOrder[]>`
根據產品 ID 獲取相關出貨訂單。

#### `getRecentShippingOrders(limit?: number): Promise<ShippingOrder[]>`
獲取最近的出貨訂單。

### 匯入功能

#### `importBasicShippingOrders(file: File): Promise<any>`
匯入出貨訂單基本資訊 CSV 文件。

#### `importMedicineDetails(file: File): Promise<any>`
匯入藥品明細 CSV 文件。

### 批次操作

#### `batchUpdateStatus(ids: string[], status: 'pending' | 'completed' | 'cancelled'): Promise<void>`
批次更新出貨訂單狀態。

#### `batchUpdatePaymentStatus(ids: string[], paymentStatus: '未收' | '已收款' | '已開立'): Promise<void>`
批次更新付款狀態。

### 輔助功能

#### `generateOrderNumber(): Promise<string>`
生成新的出貨訂單號。

#### `getShippingOrderStats(): Promise<any>`
獲取出貨訂單統計資訊。

### 業務邏輯方法

#### `canEditOrder(order: ShippingOrder): boolean`
判斷訂單是否可以編輯。

#### `canDeleteOrder(order: ShippingOrder): boolean`
判斷訂單是否可以刪除。

#### `canCompleteOrder(order: ShippingOrder): boolean`
判斷訂單是否可以完成。

#### `canCancelOrder(order: ShippingOrder): boolean`
判斷訂單是否可以取消。

#### `calculateOrderTotal(items: ShippingOrderItem[]): number`
計算訂單總金額。

#### `formatOrderStatus(status: string): string`
格式化訂單狀態顯示文字。

#### `formatPaymentStatus(paymentStatus: string): string`
格式化付款狀態顯示文字。

## 錯誤處理

服務內建完整的錯誤處理機制：

```typescript
try {
  const order = await shippingOrderServiceV2.getShippingOrderById('invalid-id');
} catch (error) {
  if (error instanceof Error) {
    console.error('操作失敗:', error.message);
    // 處理特定錯誤
    if (error.message.includes('404')) {
      console.log('訂單不存在');
    }
  }
}
```

## 類型定義

### ShippingOrder
```typescript
interface ShippingOrder {
  _id: string;
  soid?: string;
  orderNumber: string;
  sosupplier?: string;
  supplier?: string | Supplier;
  customer?: string | Customer;
  orderDate: string | Date;
  items: ShippingOrderItem[];
  totalAmount: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'completed';
  paymentStatus?: '未收' | '已收款' | '已開立';
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}
```

### ShippingOrderItem
```typescript
interface ShippingOrderItem {
  _id?: string;
  product: string | Product;
  did?: string;
  dname?: string;
  quantity: number;
  dquantity?: number;
  price: number;
  subtotal: number;
  dtotalCost?: number;
  notes?: string;
}
```

## 最佳實踐

### 1. 錯誤處理
```typescript
// 推薦：使用 try-catch 處理異步操作
try {
  const result = await shippingOrderServiceV2.createShippingOrder(data);
  // 處理成功結果
} catch (error) {
  // 處理錯誤
  console.error('創建訂單失敗:', error);
}
```

### 2. 狀態檢查
```typescript
// 推薦：在操作前檢查業務邏輯
if (shippingOrderServiceV2.canEditOrder(order)) {
  await shippingOrderServiceV2.updateShippingOrder(order._id, updateData);
} else {
  console.log('訂單無法編輯');
}
```

### 3. 批次操作
```typescript
// 推薦：對大量數據使用批次操作
const pendingOrderIds = orders
  .filter(order => order.status === 'pending')
  .map(order => order._id);

if (pendingOrderIds.length > 0) {
  await shippingOrderServiceV2.batchUpdateStatus(pendingOrderIds, 'completed');
}
```

### 4. 搜尋優化
```typescript
// 推薦：使用具體的搜尋條件
const searchParams = {
  sosupplier: '特定供應商',
  status: 'pending',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  limit: 50
};

const results = await shippingOrderServiceV2.searchShippingOrders(searchParams);
```

## 測試

服務包含完整的測試套件，涵蓋：

- 基本 CRUD 操作測試
- 搜尋和篩選功能測試
- 匯入功能測試
- 批次操作測試
- 業務邏輯方法測試
- 錯誤處理測試

執行測試：
```bash
# 在 frontend 目錄下
pnpm test shippingOrderServiceV2.test.ts
```

## 遷移指南

### 從舊版服務遷移

1. **更新匯入語句**
```typescript
// 舊版
import { shippingOrderService } from '../services/shippingOrderService';

// 新版
import { shippingOrderServiceV2 } from '../services/shippingOrderServiceV2';
```

2. **更新方法調用**
```typescript
// 舊版可能的方法名
shippingOrderService.getAll()

// 新版統一方法名
shippingOrderServiceV2.getAllShippingOrders()
```

3. **更新錯誤處理**
```typescript
// 新版提供更詳細的錯誤資訊
try {
  const result = await shippingOrderServiceV2.createShippingOrder(data);
} catch (error) {
  // 錯誤物件包含更多上下文資訊
  console.error('詳細錯誤:', error);
}
```

## 性能考量

1. **分頁查詢**：對於大量數據，使用分頁參數避免一次載入過多資料
2. **批次操作**：對多個項目的操作使用批次 API 減少網路請求
3. **快取策略**：考慮在組件層面實現適當的快取機制
4. **搜尋優化**：使用具體的搜尋條件減少不必要的數據傳輸

## 故障排除

### 常見問題

1. **類型錯誤**
   - 確保使用正確的 TypeScript 類型
   - 檢查 API 請求和回應的類型匹配

2. **網路錯誤**
   - 檢查後端服務是否正常運行
   - 確認 API 端點配置正確

3. **權限錯誤**
   - 確保用戶有適當的權限
   - 檢查認證 token 是否有效

4. **數據驗證錯誤**
   - 檢查必填欄位是否提供
   - 確認數據格式符合 API 要求

## 更新日誌

### v2.0.0 (2024-12-25)
- 初始版本發布
- 基於 BaseApiClient 的統一架構
- 完整的 CRUD 操作支援
- 高級搜尋和篩選功能
- CSV 匯入功能
- 批次操作支援
- 業務邏輯方法
- 完整的測試覆蓋

## 支援

如有問題或建議，請聯繫開發團隊或在專案中提出 issue。