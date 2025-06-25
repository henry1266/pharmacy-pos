# 採購訂單服務 V2 (PurchaseOrderServiceV2)

## 概述

PurchaseOrderServiceV2 是基於統一 API 客戶端架構的採購訂單管理服務，提供完整的 CRUD 操作、搜尋篩選、批次處理、CSV 匯入等功能。

## 架構設計

### 核心組件

1. **PurchaseOrderApiClient** (`shared/services/purchaseOrderApiClient.ts`)
   - 基於 BaseApiClient 的統一 API 客戶端
   - 處理所有 HTTP 請求和回應
   - 提供類型安全的 API 介面

2. **PurchaseOrderServiceV2** (`frontend/src/services/purchaseOrderServiceV2.ts`)
   - 前端服務包裝器
   - 整合 HTTP 客戶端適配器
   - 提供業務邏輯方法

3. **AxiosHttpClient** (內建於服務中)
   - HTTP 客戶端適配器
   - 處理認證和請求配置
   - 支援 multipart/form-data 上傳

## 功能特性

### 基本 CRUD 操作

```typescript
// 獲取所有採購訂單
const orders = await purchaseOrderServiceV2.getAllPurchaseOrders();

// 根據ID獲取採購訂單
const order = await purchaseOrderServiceV2.getPurchaseOrderById('orderId');

// 創建新採購訂單
const newOrder = await purchaseOrderServiceV2.createPurchaseOrder({
  supplier: 'supplierId',
  items: [
    {
      product: 'productId',
      quantity: 10,
      price: 100
    }
  ],
  expectedDeliveryDate: '2024-12-31',
  notes: '備註'
});

// 更新採購訂單
const updatedOrder = await purchaseOrderServiceV2.updatePurchaseOrder('orderId', {
  notes: '更新的備註'
});

// 刪除採購訂單
await purchaseOrderServiceV2.deletePurchaseOrder('orderId');
```

### 搜尋和篩選

```typescript
// 搜尋採購訂單
const orders = await purchaseOrderServiceV2.searchPurchaseOrders({
  keyword: '關鍵字',
  status: 'pending',
  paymentStatus: '未付',
  supplierId: 'supplierId',
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

// 根據供應商獲取採購訂單
const ordersBySupplier = await purchaseOrderServiceV2.getPurchaseOrdersBySupplier('supplierId');

// 根據產品獲取採購訂單
const ordersByProduct = await purchaseOrderServiceV2.getPurchaseOrdersByProduct('productId');

// 獲取最近的採購訂單
const recentOrders = await purchaseOrderServiceV2.getRecentPurchaseOrders(10);
```

### 匯入功能

```typescript
// 匯入採購訂單基本資訊
const file = new File(['csv content'], 'orders.csv', { type: 'text/csv' });
const result = await purchaseOrderServiceV2.importBasicPurchaseOrders(file);

// 匯入採購訂單項目
const itemsResult = await purchaseOrderServiceV2.importPurchaseOrderItems(
  file,
  'PO-2024-001', // 可選：指定訂單號
  supplierData   // 可選：預設供應商
);
```

### 批次操作

```typescript
// 批次更新採購訂單狀態
const updatedOrders = await purchaseOrderServiceV2.batchUpdateStatus(
  ['orderId1', 'orderId2'],
  'completed'
);

// 批次更新付款狀態
const updatedOrders = await purchaseOrderServiceV2.batchUpdatePaymentStatus(
  ['orderId1', 'orderId2'],
  '已匯款'
);
```

### 輔助功能

```typescript
// 生成新的採購訂單號
const orderNumber = await purchaseOrderServiceV2.generateOrderNumber();

// 獲取採購訂單統計資訊
const stats = await purchaseOrderServiceV2.getPurchaseOrderStats({
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  supplierId: 'supplierId'
});
```

### 業務邏輯方法

```typescript
// 檢查採購訂單是否可以編輯
const canEdit = purchaseOrderServiceV2.canEditOrder(order);

// 檢查採購訂單是否可以刪除
const canDelete = purchaseOrderServiceV2.canDeleteOrder(order);

// 檢查採購訂單是否可以完成
const canComplete = purchaseOrderServiceV2.canCompleteOrder(order);

// 檢查採購訂單是否可以取消
const canCancel = purchaseOrderServiceV2.canCancelOrder(order);

// 檢查採購訂單是否可以接收
const canReceive = purchaseOrderServiceV2.canReceiveOrder(order);

// 計算採購訂單總金額
const total = purchaseOrderServiceV2.calculateOrderTotal(order);

// 格式化狀態顯示
const statusText = purchaseOrderServiceV2.formatOrderStatus('pending');
const paymentStatusText = purchaseOrderServiceV2.formatPaymentStatus('未付');

// 獲取狀態顏色
const statusColor = purchaseOrderServiceV2.getStatusColor('pending');
const paymentStatusColor = purchaseOrderServiceV2.getPaymentStatusColor('未付');
```

## 狀態管理

### 採購訂單狀態

- `pending`: 待處理
- `approved`: 已核准
- `received`: 已接收
- `completed`: 已完成
- `cancelled`: 已取消

### 付款狀態

- `未付`: 未付款
- `已下收`: 已下收
- `已匯款`: 已匯款

## 錯誤處理

服務內建完整的錯誤處理機制：

```typescript
try {
  const order = await purchaseOrderServiceV2.getPurchaseOrderById('orderId');
} catch (error) {
  console.error('獲取採購訂單失敗:', error);
  // 處理錯誤
}
```

所有方法都會：
1. 記錄錯誤到控制台
2. 拋出原始錯誤供上層處理
3. 提供有意義的錯誤訊息

## 類型安全

服務完全基於 TypeScript，提供：

- 完整的類型定義
- 編譯時類型檢查
- IDE 智能提示
- 介面一致性保證

## 使用範例

### React 組件中的使用

```typescript
import React, { useState, useEffect } from 'react';
import { purchaseOrderServiceV2 } from '../services/purchaseOrderServiceV2';
import { PurchaseOrder } from '@pharmacy-pos/shared/types/entities';

const PurchaseOrderList: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const data = await purchaseOrderServiceV2.getAllPurchaseOrders();
        setOrders(data);
      } catch (error) {
        console.error('載入失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      await purchaseOrderServiceV2.batchUpdateStatus([orderId], status as any);
      // 重新載入數據
      const data = await purchaseOrderServiceV2.getAllPurchaseOrders();
      setOrders(data);
    } catch (error) {
      console.error('更新失敗:', error);
    }
  };

  return (
    <div>
      {loading ? (
        <div>載入中...</div>
      ) : (
        <div>
          {orders.map(order => (
            <div key={order._id}>
              <h3>{order.orderNumber}</h3>
              <p>狀態: {purchaseOrderServiceV2.formatOrderStatus(order.status)}</p>
              <p>總金額: NT$ {order.totalAmount.toLocaleString()}</p>
              
              {purchaseOrderServiceV2.canCompleteOrder(order) && (
                <button onClick={() => handleStatusUpdate(order._id, 'completed')}>
                  完成訂單
                </button>
              )}
              
              {purchaseOrderServiceV2.canCancelOrder(order) && (
                <button onClick={() => handleStatusUpdate(order._id, 'cancelled')}>
                  取消訂單
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 搜尋功能範例

```typescript
const SearchComponent: React.FC = () => {
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    status: '',
    paymentStatus: ''
  });
  const [results, setResults] = useState<PurchaseOrder[]>([]);

  const handleSearch = async () => {
    try {
      const data = await purchaseOrderServiceV2.searchPurchaseOrders(searchParams);
      setResults(data);
    } catch (error) {
      console.error('搜尋失敗:', error);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="關鍵字"
        value={searchParams.keyword}
        onChange={(e) => setSearchParams(prev => ({ ...prev, keyword: e.target.value }))}
      />
      
      <select
        value={searchParams.status}
        onChange={(e) => setSearchParams(prev => ({ ...prev, status: e.target.value }))}
      >
        <option value="">全部狀態</option>
        <option value="pending">待處理</option>
        <option value="approved">已核准</option>
        <option value="completed">已完成</option>
      </select>
      
      <button onClick={handleSearch}>搜尋</button>
      
      <div>
        {results.map(order => (
          <div key={order._id}>{order.orderNumber}</div>
        ))}
      </div>
    </div>
  );
};
```

## 測試

服務包含完整的單元測試：

```bash
# 執行採購訂單服務測試
pnpm test --testNamePattern="PurchaseOrderServiceV2"
```

測試涵蓋：
- 基本 CRUD 操作
- 搜尋和篩選功能
- 匯入功能
- 批次操作
- 業務邏輯方法
- 錯誤處理

## 效能考量

1. **請求優化**: 使用分頁和篩選減少數據傳輸
2. **快取策略**: 可在上層實現數據快取
3. **批次操作**: 支援批次更新減少 API 調用
4. **錯誤重試**: 可在上層實現重試機制

## 擴展性

服務設計支援未來擴展：

1. **新增 API 端點**: 在 ApiClient 中添加新方法
2. **業務邏輯擴展**: 在 Service 中添加新的業務方法
3. **類型擴展**: 在 shared/types 中擴展類型定義
4. **中間件支援**: 可添加請求/回應中間件

## 最佳實踐

1. **錯誤處理**: 總是使用 try-catch 包裝 API 調用
2. **載入狀態**: 在 UI 中顯示載入狀態
3. **用戶反饋**: 提供操作成功/失敗的用戶反饋
4. **數據驗證**: 在發送請求前驗證數據
5. **權限檢查**: 使用業務邏輯方法檢查操作權限

## 相關文件

- [共享類型定義](../shared/types/entities.ts)
- [API 類型定義](../shared/types/api.ts)
- [基礎 API 客戶端](../shared/services/baseApiClient.ts)
- [使用範例組件](../frontend/src/examples/purchaseOrderServiceV2Example.tsx)
- [單元測試](../frontend/src/tests/purchaseOrderServiceV2.test.ts)