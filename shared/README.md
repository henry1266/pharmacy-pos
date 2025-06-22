# Pharmacy POS Shared Types

藥局 POS 系統共享型別定義模組，提供前後端統一的型別定義、常數、工具函數等。

## 📁 目錄結構

```
shared/
├── types/          ← 共享型別定義
│   ├── entities.ts ← 業務實體型別
│   └── api.ts      ← API 介面型別
├── enums/          ← 列舉常數
│   └── index.ts    ← 所有列舉定義
├── constants/      ← 共享常數
│   └── index.ts    ← 系統常數定義
├── schemas/        ← API 驗證 schema
│   └── index.ts    ← 驗證規則定義
├── utils/          ← 型別工具函數
│   └── index.ts    ← 工具函數型別
├── index.ts        ← 主要匯出檔案
├── package.json    ← 套件配置
├── tsconfig.json   ← TypeScript 配置
└── README.md       ← 說明文件
```

## 🚀 安裝與使用

### 安裝依賴

```bash
cd shared
npm install
```

### 編譯

```bash
# 編譯 TypeScript
npm run build

# 監控模式編譯
npm run build:watch

# 型別檢查
npm run type-check
```

### 在前端使用

```typescript
// frontend/src/types/shared.ts
export * from '../../../shared';

// 使用範例
import { Product, ApiResponse, UserRole } from '../../../shared';

interface ProductListProps {
  products: Product[];
  onUpdate: (product: Product) => Promise<ApiResponse<Product>>;
}

const userRole: UserRole = UserRole.PHARMACIST;
```

### 在後端使用

```typescript
// backend/src/types/shared.ts
export * from '../../../shared';

// 使用範例
import { IProduct, ApiResponse, ProductCreateRequest } from '../../../shared';

const createProduct = async (data: ProductCreateRequest): Promise<ApiResponse<IProduct>> => {
  // 實作邏輯
};
```

## 📋 主要功能

### 1. 型別定義 (`types/`)

#### 業務實體型別 (`entities.ts`)
- `Employee` - 員工資料
- `Product` - 產品資料
- `Customer` - 客戶資料
- `Sale` - 銷售記錄
- `PurchaseOrder` - 採購訂單
- `ShippingOrder` - 出貨訂單
- `Inventory` - 庫存記錄
- `Accounting` - 會計記錄

#### API 介面型別 (`api.ts`)
- `ApiResponse<T>` - 統一 API 回應格式
- `PaginatedResponse<T>` - 分頁回應格式
- `LoginRequest` - 登入請求
- `ProductCreateRequest` - 產品建立請求
- 各種 CRUD 操作的請求/回應型別

### 2. 列舉常數 (`enums/`)

```typescript
import { UserRole, PaymentMethod, OrderStatus } from '../../../shared';

// 使用者角色
const role: UserRole = UserRole.ADMIN;

// 付款方式
const payment: PaymentMethod = PaymentMethod.CASH;

// 訂單狀態
const status: OrderStatus = OrderStatus.COMPLETED;
```

### 3. 系統常數 (`constants/`)

```typescript
import { API_CONSTANTS, VALIDATION_CONSTANTS, ERROR_MESSAGES } from '../../../shared';

// API 常數
const pageSize = API_CONSTANTS.PAGINATION.DEFAULT_LIMIT;

// 驗證規則
const minPasswordLength = VALIDATION_CONSTANTS.PASSWORD.MIN_LENGTH;

// 錯誤訊息
const errorMsg = ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS;
```

### 4. 驗證 Schema (`schemas/`)

```typescript
import { Schemas } from '../../../shared';

// 產品建立驗證
const productSchema = Schemas.Product.create;

// 使用者登入驗證
const loginSchema = Schemas.Auth.login;
```

### 5. 工具函數型別 (`utils/`)

```typescript
import { DateUtilsType, ValidationUtilsType } from '../../../shared';

// 日期工具函數介面
const dateUtils: DateUtilsType = {
  formatDate: (date, format) => { /* 實作 */ },
  parseDate: (dateString) => { /* 實作 */ },
  // ...
};

// 驗證工具函數介面
const validationUtils: ValidationUtilsType = {
  validateEmail: (email) => { /* 實作 */ },
  validatePhone: (phone) => { /* 實作 */ },
  // ...
};
```

## 🔧 開發指南

### 新增型別定義

1. **業務實體型別**：在 `types/entities.ts` 中新增
2. **API 介面型別**：在 `types/api.ts` 中新增
3. **列舉常數**：在 `enums/index.ts` 中新增
4. **系統常數**：在 `constants/index.ts` 中新增
5. **驗證規則**：在 `schemas/index.ts` 中新增

### 型別命名規範

- **介面型別**：使用 PascalCase，如 `Product`、`ApiResponse`
- **列舉型別**：使用 PascalCase，如 `UserRole`、`PaymentMethod`
- **常數物件**：使用 UPPER_SNAKE_CASE，如 `API_CONSTANTS`
- **型別別名**：使用 PascalCase，如 `DeepPartial<T>`

### 版本控制

- 遵循語義化版本控制 (Semantic Versioning)
- 主版本號：不相容的 API 變更
- 次版本號：向下相容的功能新增
- 修訂版本號：向下相容的問題修正

## 📝 型別安全最佳實踐

### 1. 使用嚴格的 TypeScript 配置

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### 2. 善用型別守衛

```typescript
import { isDefined, isString, isNumber } from '../../../shared';

if (isDefined(user.email) && isString(user.email)) {
  // user.email 現在是 string 型別
  console.log(user.email.toLowerCase());
}
```

### 3. 使用工具型別

```typescript
import { DeepPartial, Optional, RequiredFields } from '../../../shared';

// 深度可選
type PartialProduct = DeepPartial<Product>;

// 部分欄位可選
type ProductUpdate = Optional<Product, 'createdAt' | 'updatedAt'>;

// 部分欄位必填
type ProductCreate = RequiredFields<Product, 'name' | 'code'>;
```

## 🧪 測試

```bash
# 執行型別檢查
npm run type-check

# 執行 ESLint 檢查
npm run lint

# 修復 ESLint 問題
npm run lint:fix
```

## 📚 相關文件

- [TypeScript 官方文件](https://www.typescriptlang.org/docs/)
- [專案架構設計文件](../docs/architecture.md)
- [API 設計規範](../docs/api-design.md)
- [前端開發指南](../frontend/README.md)
- [後端開發指南](../backend/README.md)

## 🤝 貢獻指南

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 📄 授權

本專案採用 MIT 授權條款 - 詳見 [LICENSE](../LICENSE) 檔案

## 📞 聯絡資訊

- 專案維護者：Development Team
- Email: dev-team@example.com
- 專案首頁：https://github.com/your-org/pharmacy-pos