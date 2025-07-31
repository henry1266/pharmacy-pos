# Backend 測試與優化實施指南

## 📋 概述

本指南提供了 pharmacy-pos backend 系統測試與優化的具體實施步驟，包括已創建的檔案和需要執行的操作。

---

## 🎯 已完成的工作

### 1. 測試配置修復
- ✅ 修復了 [`jest.config.js`](backend/jest.config.js) 中的配置錯誤
- ✅ 創建了 [`test/setup.ts`](backend/test/setup.ts) 測試環境設置
- ✅ 配置了 MongoDB Memory Server 用於測試

### 2. 創建的檔案清單

#### 測試檔案
- [`routes/__tests__/products.test.ts`](backend/routes/__tests__/products.test.ts) - 產品 API 完整測試套件

#### 性能優化
- [`services/OptimizedProductService.ts`](backend/services/OptimizedProductService.ts) - 優化的產品服務（解決 N+1 查詢）

#### 監控系統
- [`middleware/performanceMonitor.ts`](backend/middleware/performanceMonitor.ts) - 性能監控中間件
- [`routes/monitoring.ts`](backend/routes/monitoring.ts) - 監控和健康檢查端點
- [`utils/logger.ts`](backend/utils/logger.ts) - 結構化日誌系統

#### 資料庫優化
- [`scripts/createIndexes.js`](backend/scripts/createIndexes.js) - 資料庫索引創建腳本

---

## 🚀 實施步驟

### 階段一：基礎設置 (立即執行)

#### 1. 安裝必要的依賴
```bash
cd backend

# 安裝測試相關依賴
npm install --save-dev @types/jest @types/supertest

# 安裝監控相關依賴
npm install winston

# 如果需要更好的日誌格式
npm install winston-daily-rotate-file
```

#### 2. 創建日誌目錄
```bash
mkdir -p logs
```

#### 3. 執行資料庫索引創建
```bash
# 創建所有索引
node scripts/createIndexes.js

# 查看索引統計
node scripts/createIndexes.js --stats

# 如果需要重新創建（先刪除再創建）
node scripts/createIndexes.js --drop
node scripts/createIndexes.js
```

### 階段二：整合監控系統

#### 1. 更新 server.ts
在 [`server.ts`](backend/server.ts) 中添加監控中間件：

```typescript
// 在現有 import 後添加
import { performanceMonitor } from './middleware/performanceMonitor';
import monitoringRoutes from './routes/monitoring';

// 在 app.use(cors()) 後添加
app.use(performanceMonitor);

// 在現有路由後添加
app.use('/api/monitoring', monitoringRoutes);
```

#### 2. 更新日誌系統
替換現有的 console.log 為結構化日誌：

```typescript
// 替換
console.log('伺服器已啟動');

// 為
import logger from './utils/logger';
logger.info('伺服器已啟動', { port: PORT, host: HOST });
```

### 階段三：測試實施

#### 1. 運行現有測試
```bash
# 運行所有測試
npm test

# 運行特定測試檔案
npm test -- routes/__tests__/products.test.ts

# 運行測試並生成覆蓋率報告
npm test -- --coverage
```

#### 2. 創建更多測試檔案
基於 [`routes/__tests__/products.test.ts`](backend/routes/__tests__/products.test.ts) 的模式，為其他路由創建測試：

```bash
# 建議創建的測試檔案
touch routes/__tests__/sales.test.ts
touch routes/__tests__/customers.test.ts
touch routes/__tests__/inventory.test.ts
touch services/__tests__/OptimizedProductService.test.ts
```

### 階段四：性能優化實施

#### 1. 替換現有的產品查詢
在需要的地方使用 [`OptimizedProductService`](backend/services/OptimizedProductService.ts)：

```typescript
// 替換原有的產品查詢
import { OptimizedProductService } from '../services/OptimizedProductService';

// 使用優化的查詢
const result = await OptimizedProductService.getProductsWithPackageUnits(
  query,
  { page: 1, limit: 20, includePackageUnits: true }
);
```

#### 2. 實施分頁機制
更新所有列表 API 以支援分頁：

```typescript
// 範例：產品列表 API
router.get('/', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  
  const result = await OptimizedProductService.getProductsWithPackageUnits(
    buildQuery(req.query),
    { page, limit }
  );
  
  res.json({
    success: true,
    data: result.products,
    pagination: result.pagination
  });
});
```

---

## 📊 監控端點使用

### 健康檢查
```bash
# 基本健康檢查
curl http://localhost:5000/api/monitoring/health

# 詳細健康檢查
curl http://localhost:5000/api/monitoring/health/detailed
```

### 性能監控
```bash
# 性能統計
curl http://localhost:5000/api/monitoring/performance

# 慢請求查詢
curl "http://localhost:5000/api/monitoring/performance/slow?threshold=1000&limit=10"

# 系統資源使用
curl http://localhost:5000/api/monitoring/system/resources
```

### 資料庫狀態
```bash
# 資料庫連接狀態
curl http://localhost:5000/api/monitoring/database/status
```

---

## 🔧 配置建議

### 1. 環境變數設置
在 `.env` 檔案中添加：

```env
# 日誌級別
LOG_LEVEL=info

# 性能監控
ENABLE_PERFORMANCE_MONITORING=true

# 健康檢查
HEALTH_CHECK_ENABLED=true
```

### 2. package.json 腳本更新
在 [`package.json`](backend/package.json) 中添加：

```json
{
  "scripts": {
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "db:indexes": "node scripts/createIndexes.js",
    "db:indexes:drop": "node scripts/createIndexes.js --drop",
    "logs:clear": "rm -rf logs/*.log",
    "health:check": "curl http://localhost:5000/api/monitoring/health"
  }
}
```

### 3. 生產環境配置
```typescript
// 生產環境中禁用某些監控端點
if (process.env.NODE_ENV === 'production') {
  // 限制監控端點訪問
  app.use('/api/monitoring', requireAuth, monitoringRoutes);
} else {
  app.use('/api/monitoring', monitoringRoutes);
}
```

---

## 📈 預期效果測量

### 1. 性能指標
執行優化前後的基準測試：

```bash
# 使用 Apache Bench 測試
ab -n 1000 -c 10 http://localhost:5000/api/products

# 使用 curl 測量響應時間
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000/api/products
```

### 2. 測試覆蓋率目標
- 目標覆蓋率：80%+
- 關鍵服務：90%+
- 工具函數：95%+

### 3. 性能改善目標
- API 響應時間：減少 60-80%
- 資料庫查詢次數：減少 70%
- 記憶體使用：降低 40-50%

---

## 🚨 注意事項

### 1. 資料庫索引
- 索引會增加寫入成本，但大幅改善查詢性能
- 定期監控索引使用情況
- 避免創建過多不必要的索引

### 2. 日誌管理
- 定期清理舊日誌檔案
- 監控日誌檔案大小
- 考慮使用日誌輪轉

### 3. 性能監控
- 監控數據會消耗記憶體
- 定期清理舊的性能指標
- 在生產環境中限制監控端點訪問

### 4. 測試環境
- 確保測試資料庫與生產環境隔離
- 定期清理測試數據
- 使用 MongoDB Memory Server 進行單元測試

---

## 🔄 持續改進

### 1. 定期檢查
- 每週檢查性能指標
- 每月檢查測試覆蓋率
- 每季度檢查索引效能

### 2. 監控告警
建議設置以下告警：
- API 響應時間 > 5秒
- 記憶體使用 > 80%
- 錯誤率 > 5%
- 資料庫連接失敗

### 3. 代碼審查
- 新功能必須包含測試
- 性能敏感的代碼需要基準測試
- 定期重構和優化

---

## 📚 相關文檔

- [測試與優化報告](backend/TESTING_AND_OPTIMIZATION_REPORT.md)
- [Jest 配置文檔](https://jestjs.io/docs/configuration)
- [Winston 日誌文檔](https://github.com/winstonjs/winston)
- [MongoDB 索引文檔](https://docs.mongodb.com/manual/indexes/)

---

**最後更新**: 2025-01-30  
**版本**: v1.0  
**維護者**: Expert Full-Stack Architect & Code Quality Coach