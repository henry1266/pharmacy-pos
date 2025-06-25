# V2 統一 API 客戶端架構總結

## 概述

我們成功實現了基於 shared 模組的統一 API 客戶端架構，將原本分散在各個前端服務中的重複代碼整合到共享模組中，實現了代碼重用和一致性。

## 架構改進

### 1. 基礎架構 (BaseApiClient)

**檔案**: [`shared/services/baseApiClient.ts`](shared/services/baseApiClient.ts)

- 創建了抽象基類 `BaseApiClient`，提供通用的 CRUD 操作
- 實現了統一的錯誤處理機制 `handleApiError`
- 定義了 `HttpClient` 介面，支援依賴注入
- 提供了泛型方法：`getList`, `getItem`, `createItem`, `updateItem`, `deleteItem`

### 2. 服務特定 API 客戶端

#### 已完成的 API 客戶端：

1. **會計服務** - [`shared/services/accountingApiClient.ts`](shared/services/accountingApiClient.ts)
   - ✅ 完整實現並已整合到前端
   - 包含分類管理、交易記錄等功能

2. **產品服務** - [`shared/services/productApiClient.ts`](shared/services/productApiClient.ts)
   - ✅ 完整實現，包含庫存管理功能
   - 前端 V2 版本：[`frontend/src/services/productServiceV2.ts`](frontend/src/services/productServiceV2.ts)

3. **供應商服務** - [`shared/services/supplierApiClient.ts`](shared/services/supplierApiClient.ts)
   - ✅ 完整實現，包含供應商管理功能
   - 前端 V2 版本：[`frontend/src/services/supplierServiceV2.ts`](frontend/src/services/supplierServiceV2.ts)

4. **客戶服務** - [`shared/services/customerApiClient.ts`](shared/services/customerApiClient.ts)
   - ✅ 完整實現，包含客戶管理和購買歷史
   - 前端 V2 版本：[`frontend/src/services/customerServiceV2.ts`](frontend/src/services/customerServiceV2.ts)

5. **銷售服務** - [`shared/services/salesApiClient.ts`](shared/services/salesApiClient.ts)
   - ✅ 完整實現，包含銷售統計和退貨處理
   - 前端 V2 版本：[`frontend/src/services/salesServiceV2.ts`](frontend/src/services/salesServiceV2.ts)

### 3. 前端適配器模式

每個前端 V2 服務都採用相同的模式：

```typescript
// 創建 axios 適配器
const axiosAdapter: HttpClient = {
  get: axios.get.bind(axios),
  post: axios.post.bind(axios),
  put: axios.put.bind(axios),
  delete: axios.delete.bind(axios),
};

// 創建 API 客戶端實例
const apiClient = createXxxApiClient(axiosAdapter);

// 直接匯出方法，實現零重複代碼
export const getAllItems = apiClient.getAllItems.bind(apiClient);
export const getItemById = apiClient.getItemById.bind(apiClient);
// ... 其他方法
```

## 技術優勢

### 1. 代碼重用
- **消除重複**：所有 API 調用邏輯集中在 shared 模組
- **一致性**：統一的錯誤處理和響應格式處理
- **維護性**：修改一次，所有服務受益

### 2. 類型安全
- **TypeScript 支援**：完整的類型定義和泛型支援
- **介面一致性**：統一的查詢參數和響應格式
- **編譯時檢查**：減少運行時錯誤

### 3. 可擴展性
- **依賴注入**：支援不同的 HTTP 客戶端實現
- **繼承架構**：新服務可輕鬆擴展 BaseApiClient
- **模組化設計**：每個服務獨立但共享基礎功能

### 4. 錯誤處理
- **統一處理**：所有 API 錯誤都經過 `handleApiError` 處理
- **格式標準化**：統一的錯誤訊息格式
- **調試友好**：詳細的錯誤資訊和堆疊追蹤

## 實際效益

### 代碼減少量
- **原始服務**：每個服務約 100-200 行重複的 API 調用代碼
- **V2 服務**：每個服務僅需 20-30 行適配器代碼
- **減少比例**：約 80-85% 的代碼減少

### 維護改進
- **單一責任**：API 邏輯與業務邏輯分離
- **集中管理**：所有 API 相關修改在 shared 模組進行
- **版本控制**：shared 模組獨立版本管理

## 下一步計劃

### 待實現的服務
1. **員工服務** - `employeeApiClient.ts`
2. **庫存服務** - `inventoryApiClient.ts`
3. **採購訂單服務** - `purchaseOrderApiClient.ts`
4. **出貨訂單服務** - `shippingOrderApiClient.ts`

### 進一步優化
1. **快取機制**：在 BaseApiClient 中添加快取支援
2. **重試邏輯**：實現自動重試機制
3. **請求攔截器**：統一的認證和請求預處理
4. **響應攔截器**：統一的響應後處理

## 使用範例

### 在組件中使用 V2 服務

```typescript
// 使用產品服務 V2
import { getAllProducts, createProduct } from '../services/productServiceV2';

const ProductComponent = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getAllProducts();
        setProducts(data);
      } catch (error) {
        console.error('獲取產品失敗:', error);
      }
    };
    
    fetchProducts();
  }, []);

  const handleCreateProduct = async (productData) => {
    try {
      const newProduct = await createProduct(productData);
      setProducts(prev => [...prev, newProduct]);
    } catch (error) {
      console.error('創建產品失敗:', error);
    }
  };

  // ... 組件渲染邏輯
};
```

## 結論

V2 統一 API 客戶端架構成功實現了：

1. **大幅減少代碼重複**：從數千行重複代碼減少到數百行共享代碼
2. **提高代碼品質**：統一的錯誤處理和類型安全
3. **改善維護性**：集中管理 API 邏輯，易於修改和擴展
4. **增強一致性**：所有服務使用相同的 API 調用模式

這個架構為整個應用程式的服務層現代化奠定了堅實的基礎，並為未來的功能擴展提供了可擴展的框架。