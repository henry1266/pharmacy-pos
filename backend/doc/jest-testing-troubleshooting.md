# Jest 測試錯誤排除指南

## 概述
本文檔記錄了在 pharmacy-pos 專案中遇到的 Jest 測試錯誤及其解決方案，提供給開發團隊參考。

## 常見錯誤類型與解決方案

### 2. Jest Mock 初始化順序錯誤

#### 錯誤訊息
```
ReferenceError: Cannot access 'mockBaseProduct' before initialization
```

#### 原因分析
- `jest.mock()` 在變數定義之前被調用
- Jest 的 hoisting 機制導致 mock 調用時變數尚未初始化

#### 解決方案
將 mock 變數定義移到 `jest.mock()` 調用之前：

```typescript
// 正確的順序
// 1. 先定義 mock 變數
const mockBaseProduct = {
  find: jest.fn(),
  findById: jest.fn(),
  findByCode: jest.fn(),
  // ...
};

// 2. 再調用 jest.mock()
jest.mock('../../models/BaseProduct', () => ({
  __esModule: true,
  default: mockBaseProduct,
  // ...
}));

// 3. 最後導入模組
import productsRouter from '../products';
```

### 3. CommonJS 與 ES6 模組混用問題

#### 錯誤訊息
```
TypeError: BaseProduct.find is not a function
```

#### 原因分析
- 路由檔案使用 `require()` 導入模組
- 測試檔案的 mock 只支援 ES6 模組格式
- Mock 沒有正確攔截 CommonJS 調用

#### 解決方案
創建同時支援 CommonJS 和 ES6 的 mock：

```typescript
jest.mock('../../models/BaseProduct', () => {
  const MockProduct = class MockProduct {
    // Mock 類別實現
  };

  const MockMedicine = class MockMedicine {
    // Mock 類別實現
  };

  // 支援 CommonJS require() 調用
  const mockModule = Object.assign(mockBaseProduct, {
    __esModule: true,
    default: mockBaseProduct,
    Product: MockProduct,
    Medicine: MockMedicine
  });

  return mockModule;
});
```

### 4. Mongoose 連接衝突

#### 錯誤訊息
```
MongooseError: Can't call `openUri()` on an active connection with different connection strings
```

#### 原因分析
- 多個測試檔案同時運行時，Mongoose 已有活躍連接
- 嘗試建立新連接時發生衝突

#### 解決方案
在 `beforeAll` 中先檢查並斷開現有連接：

```typescript
beforeAll(async () => {
  // 斷開現有連接（如果有的話）
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  // 創建新的測試資料庫連接
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});
```

### 5. Express 路由匹配問題

#### 錯誤訊息
```
expected 404 "Not Found", got 500 "Internal Server Error"
```

#### 原因分析
- 測試期待 404 錯誤，但實際返回 500
- 路由 `/api/products/` 匹配到 `GET /api/products` 而不是 `GET /api/products/:id`

#### 解決方案
理解 Express 路由匹配規則，調整測試期待：

```typescript
it('應該處理缺少ID參數的情況', async () => {
  // 當訪問 /api/products/ 時，實際上會匹配到 GET /api/products 路由
  // 所以需要 mock 產品列表的查詢
  mockBaseProduct.find.mockReturnValue({
    populate: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      })
    })
  });

  const response = await request(app)
    .get('/api/products/')
    .expect(200); // 實際上會返回產品列表

  expect(response.body.success).toBe(true);
  expect(response.body.message).toBe('產品列表獲取成功');
});
```

## 最佳實踐

### 1. Mock 設置原則
- 將 mock 變數定義放在檔案頂部
- 使用描述性的變數名稱
- 支援多種模組格式（CommonJS + ES6）

### 2. 資料庫測試
- 使用 MongoDB Memory Server 進行隔離測試
- 在每個測試套件前檢查並清理連接
- 在 `afterAll` 中正確清理資源

### 3. 路由測試
- 理解 Express 路由匹配機制
- 正確設置 mock 以符合實際路由行為
- 測試各種邊界情況

### 4. 錯誤處理測試
- 測試正常流程和錯誤流程
- 驗證錯誤訊息和狀態碼
- 確保 mock 正確模擬錯誤情況


## 更新記錄

- 2025-08-01: 初始版本，記錄 products.test.ts 和 AccountingIntegrationService.test.ts 的修正經驗