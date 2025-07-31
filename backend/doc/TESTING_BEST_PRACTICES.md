# 測試開發最佳實踐指南

## 概述

本文件記錄了在開發測試時常見的 TypeScript 編譯錯誤和最佳實踐，幫助開發者避免重複犯同樣的錯誤。

## 常見 TypeScript 編譯錯誤

### 1. 未使用的 Import (TS6133)

**錯誤示例：**
```typescript
// ❌ 錯誤：導入了但未使用
import { ProductType } from '@pharmacy-pos/shared/enums';
import mongoose from 'mongoose';

describe('Test', () => {
  // 測試中沒有使用 ProductType 或 mongoose
});
```

**解決方案：**
```typescript
// ✅ 正確：只導入需要的模組
import request from 'supertest';
import { createApp } from '../../app';
import Customer from '../../models/Customer';

describe('Test', () => {
  // 只使用實際需要的導入
});
```

### 2. 未使用的變數宣告

**錯誤示例：**
```typescript
// ❌ 錯誤：宣告了但未使用的變數
const ApiResponse = {};
const ErrorResponse = {};
const ProductType = {
  PRODUCT: 'product',
  MEDICINE: 'medicine'
};
```

**解決方案：**
```typescript
// ✅ 正確：移除未使用的變數，或使用 ESLint 註解
const ProductType = {
  PRODUCT: 'product',
  MEDICINE: 'medicine'
};
// 如果確實需要保留，可以使用：
// eslint-disable-next-line @typescript-eslint/no-unused-vars
```

## 測試檔案 Import 最佳實踐

### 1. 按需導入原則

```typescript
// ✅ 推薦：只導入測試中實際使用的模組
import request from 'supertest';
import { createApp } from '../../app';
import Customer from '../../models/Customer';
// 只在需要時才導入 mongoose
// import mongoose from 'mongoose';
```

### 2. 條件性導入

```typescript
// ✅ 在需要時才導入
describe('Customer API with ObjectId', () => {
  it('should handle invalid ObjectId', async () => {
    const mongoose = require('mongoose'); // 局部導入
    const fakeId = new mongoose.Types.ObjectId();
    // 測試邏輯...
  });
});
```

### 3. 共享模組導入

```typescript
// ✅ 正確使用 shared 模組
import { ProductType } from '@pharmacy-pos/shared/enums';

describe('Product Tests', () => {
  it('should create product with correct type', async () => {
    const productData = {
      productType: ProductType.PRODUCT, // 實際使用導入的類型
      // 其他屬性...
    };
  });
});
```

## 測試檔案結構最佳實踐

### 1. 標準測試檔案結構

```typescript
// 1. 外部依賴導入
import request from 'supertest';
import mongoose from 'mongoose';

// 2. 內部模組導入
import { createApp } from '../../app';
import Customer from '../../models/Customer';

// 3. 共享模組導入
import { ProductType } from '@pharmacy-pos/shared/enums';

// 4. 類型導入（如需要）
import type { CustomerDocument } from '../../types/customer';

describe('API Tests', () => {
  let app: any;
  
  beforeAll(async () => {
    app = await createApp();
  });
  
  // 測試案例...
});
```

### 2. 避免全域導入

```typescript
// ❌ 避免：不必要的全域導入
import * as mongoose from 'mongoose';
import * as request from 'supertest';

// ✅ 推薦：具體導入
import mongoose from 'mongoose';
import request from 'supertest';
```

## 編譯檢查工具配置

### 1. TypeScript 配置

確保 `tsconfig.json` 包含嚴格的未使用變數檢查：

```json
{
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "strict": true
  }
}
```

### 2. ESLint 規則

在 `.eslintrc.js` 中配置：

```javascript
module.exports = {
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-unused-imports': 'error'
  }
};
```

## 常見錯誤修復清單

### 建置前檢查清單

- [ ] 檢查所有 import 是否在測試中實際使用
- [ ] 移除未使用的變數宣告
- [ ] 確認 mongoose 導入只在需要 ObjectId 時使用
- [ ] 驗證 shared 模組的導入是否正確使用
- [ ] 檢查是否有重複的導入

### 修復步驟

1. **執行 TypeScript 編譯檢查**
   ```bash
   pnpm build
   ```

2. **識別錯誤類型**
   - `TS6133`: 未使用的導入或變數
   - `TS2304`: 找不到名稱
   - `TS2307`: 找不到模組

3. **應用對應修復**
   - 移除未使用的 import
   - 移除未使用的變數
   - 修正模組路徑

4. **重新驗證**
   ```bash
   pnpm build
   ```

## 測試模式特殊考量

### 1. 測試模式環境變數

```typescript
beforeAll(async () => {
  // 設置測試模式
  process.env.REACT_APP_TEST_MODE = 'true';
  app = await createApp();
});
```

### 2. 資料庫連接管理

```typescript
// ✅ 讓 test/setup.ts 管理連接
afterAll(async () => {
  // 清理由 test/setup.ts 管理的連接
  // 不要在這裡手動關閉 mongoose 連接
});
```

## 預防措施

### 1. 開發時即時檢查

使用 IDE 擴展或 watch 模式：
```bash
# TypeScript watch 模式
tsc --watch

# 或使用 nodemon
nodemon --exec "tsc --noEmit"
```

### 2. Git Hook 設置

在 `.husky/pre-commit` 中添加：
```bash
#!/bin/sh
pnpm build
```

### 3. CI/CD 整合

確保 CI 流程包含編譯檢查：
```yaml
- name: TypeScript Check
  run: pnpm build
```

## 總結

遵循這些最佳實踐可以有效避免常見的 TypeScript 編譯錯誤：

1. **按需導入**：只導入實際使用的模組
2. **定期清理**：移除未使用的導入和變數
3. **工具輔助**：使用 ESLint 和 TypeScript 嚴格模式
4. **持續驗證**：在開發過程中定期執行編譯檢查

記住：**乾淨的代碼從乾淨的導入開始！**