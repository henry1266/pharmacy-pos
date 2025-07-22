# 後端API設計方案

## 1. 包裝單位管理API

### 1.1 包裝單位CRUD操作

```typescript
// GET /api/products/:productId/package-units
// 獲取產品的包裝單位配置
interface GetPackageUnitsResponse {
  success: boolean;
  data: ProductPackageUnit[];
}

// POST /api/products/:productId/package-units
// 創建或更新產品的包裝單位配置
interface CreatePackageUnitsRequest {
  packageUnits: Omit<ProductPackageUnit, '_id' | 'productId' | 'createdAt' | 'updatedAt'>[];
}

interface CreatePackageUnitsResponse {
  success: boolean;
  data: ProductPackageUnit[];
  message: string;
}

// PUT /api/products/:productId/package-units
// 批量更新包裝單位配置
interface UpdatePackageUnitsRequest {
  packageUnits: ProductPackageUnit[];
}

// DELETE /api/products/:productId/package-units
// 刪除產品的包裝單位配置（恢復為基礎單位模式）
interface DeletePackageUnitsResponse {
  success: boolean;
  message: string;
}
```

### 1.2 包裝單位驗證API

```typescript
// POST /api/package-units/validate
// 驗證包裝單位配置的合理性
interface ValidatePackageUnitsRequest {
  packageUnits: Omit<ProductPackageUnit, '_id' | 'productId' | 'createdAt' | 'updatedAt'>[];
}

interface ValidatePackageUnitsResponse {
  success: boolean;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

## 2. 庫存計算API

### 2.1 包裝顯示轉換API

```typescript
// POST /api/inventory/convert-to-package-display
// 將基礎單位數量轉換為包裝顯示
interface ConvertToPackageDisplayRequest {
  productId: string;
  baseQuantity: number;
  useHistoricalConfig?: boolean;  // 是否使用歷史配置
  configDate?: string;            // 指定配置日期
}

interface ConvertToPackageDisplayResponse {
  success: boolean;
  data: {
    baseQuantity: number;
    packageBreakdown: PackageBreakdownItem[];
    displayText: string;
    configUsed: ProductPackageUnit[];
  };
}

// POST /api/inventory/convert-to-base-unit
// 將包裝單位輸入轉換為基礎單位
interface ConvertToBaseUnitRequest {
  productId: string;
  packageInput: string;
}

interface ConvertToBaseUnitResponse {
  success: boolean;
  data: {
    baseQuantity: number;
    parsedInput: {
      unitName: string;
      quantity: number;
    }[];
    displayText: string;
  };
  errors?: string[];
}
```

### 2.2 庫存查詢API擴展

```typescript
// GET /api/inventory/product/:productId?includePackageDisplay=true
// 獲取產品庫存（包含包裝顯示）
interface GetProductInventoryResponse {
  success: boolean;
  data: {
    totalStock: number;                    // 基礎單位總庫存
    packageDisplay?: {                     // 包裝顯示（可選）
      displayText: string;
      breakdown: PackageBreakdownItem[];
    };
    inventoryRecords: InventoryRecord[];
    packageUnits: ProductPackageUnit[];
  };
}

// GET /api/inventory/summary?includePackageDisplay=true
// 獲取庫存摘要（支援包裝顯示）
interface GetInventorySummaryResponse {
  success: boolean;
  data: {
    productId: string;
    productName: string;
    totalStock: number;
    packageDisplay?: {
      displayText: string;
      breakdown: PackageBreakdownItem[];
    };
    minStock: number;
    isLowStock: boolean;
  }[];
}
```

## 3. 庫存操作API

### 3.1 庫存輸入API

```typescript
// POST /api/inventory/add-stock
// 新增庫存（支援包裝單位輸入）
interface AddStockRequest {
  productId: string;
  input: string | number;        // 支援包裝輸入或基礎單位數字
  inputType: 'package' | 'base'; // 輸入類型
  type: 'purchase' | 'adjustment' | 'return';
  referenceId?: string;
  notes?: string;
}

interface AddStockResponse {
  success: boolean;
  data: {
    inventoryRecord: InventoryRecord;
    convertedQuantity: number;     // 轉換後的基礎單位數量
    packageDisplay: {
      displayText: string;
      breakdown: PackageBreakdownItem[];
    };
  };
  message: string;
}

// POST /api/inventory/reduce-stock
// 減少庫存（支援包裝單位輸入）
interface ReduceStockRequest {
  productId: string;
  input: string | number;
  inputType: 'package' | 'base';
  type: 'sale' | 'ship' | 'adjustment';
  referenceId?: string;
  notes?: string;
}
```

### 3.2 庫存盤點API

```typescript
// POST /api/inventory/stock-count
// 庫存盤點
interface StockCountRequest {
  productId: string;
  countedQuantity: string | number;  // 盤點數量
  inputType: 'package' | 'base';
  notes?: string;
}

interface StockCountResponse {
  success: boolean;
  data: {
    previousStock: number;
    countedStock: number;
    difference: number;
    adjustmentRecord?: InventoryRecord;
    packageDisplay: {
      previous: string;
      counted: string;
      difference: string;
    };
  };
  message: string;
}

// GET /api/inventory/count-suggestion/:productId
// 獲取盤點建議
interface GetCountSuggestionResponse {
  success: boolean;
  data: {
    currentStock: number;
    packageDisplay: {
      displayText: string;
      breakdown: PackageBreakdownItem[];
    };
    countingSuggestion: {
      order: string[];              // 建議盤點順序
      template: string;             // 輸入模板
    };
  };
}
```

## 4. 批量操作API

### 4.1 批量包裝配置

```typescript
// POST /api/products/batch-package-units
// 批量設定產品包裝單位
interface BatchSetPackageUnitsRequest {
  operations: {
    productId: string;
    packageUnits: Omit<ProductPackageUnit, '_id' | 'productId' | 'createdAt' | 'updatedAt'>[];
  }[];
}

interface BatchSetPackageUnitsResponse {
  success: boolean;
  data: {
    successful: string[];          // 成功的產品ID
    failed: {
      productId: string;
      error: string;
    }[];
  };
  message: string;
}
```

### 4.2 批量庫存操作

```typescript
// POST /api/inventory/batch-operations
// 批量庫存操作（支援包裝單位）
interface BatchInventoryOperationsRequest {
  operations: {
    productId: string;
    input: string | number;
    inputType: 'package' | 'base';
    type: 'purchase' | 'sale' | 'adjustment';
    referenceId?: string;
    notes?: string;
  }[];
}

interface BatchInventoryOperationsResponse {
  success: boolean;
  data: {
    successful: {
      productId: string;
      convertedQuantity: number;
      packageDisplay: string;
    }[];
    failed: {
      productId: string;
      error: string;
    }[];
  };
  summary: {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
  };
}
```

## 5. 報表和統計API

### 5.1 庫存報表API

```typescript
// GET /api/reports/inventory-summary?includePackageDisplay=true
// 庫存摘要報表（包含包裝顯示）
interface InventoryReportResponse {
  success: boolean;
  data: {
    reportDate: string;
    products: {
      productId: string;
      productName: string;
      category: string;
      totalStock: number;
      packageDisplay: string;
      minStock: number;
      isLowStock: boolean;
      stockValue: number;
    }[];
    summary: {
      totalProducts: number;
      lowStockProducts: number;
      totalStockValue: number;
    };
  };
}

// GET /api/reports/inventory-movements?includePackageDisplay=true
// 庫存異動報表
interface InventoryMovementReportResponse {
  success: boolean;
  data: {
    movements: {
      date: string;
      productName: string;
      type: string;
      quantity: number;
      packageDisplay: string;
      referenceNumber: string;
      notes: string;
    }[];
    summary: {
      totalMovements: number;
      totalInbound: number;
      totalOutbound: number;
    };
  };
}
```

## 6. 系統配置API

### 6.1 包裝模式設定

```typescript
// GET /api/system/package-mode-settings
// 獲取系統包裝模式設定
interface GetPackageModeSettingsResponse {
  success: boolean;
  data: {
    enablePackageMode: boolean;           // 全域啟用包裝模式
    defaultPackageUnits: {               // 預設包裝單位模板
      [category: string]: ProductPackageUnit[];
    };
    displaySettings: {
      showBreakdownInList: boolean;      // 列表中顯示分解
      showBaseUnitInDisplay: boolean;    // 顯示中包含基礎單位
      defaultInputMode: 'package' | 'base';  // 預設輸入模式
    };
  };
}

// PUT /api/system/package-mode-settings
// 更新系統包裝模式設定
interface UpdatePackageModeSettingsRequest {
  enablePackageMode?: boolean;
  defaultPackageUnits?: {
    [category: string]: ProductPackageUnit[];
  };
  displaySettings?: {
    showBreakdownInList?: boolean;
    showBaseUnitInDisplay?: boolean;
    defaultInputMode?: 'package' | 'base';
  };
}
```

## 7. 中間件和服務層

### 7.1 包裝單位服務

```typescript
// backend/services/PackageUnitService.ts
class PackageUnitService {
  
  // 驗證包裝單位配置
  static validatePackageUnits(units: ProductPackageUnit[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // 檢查基礎單位
    const baseUnits = units.filter(u => u.isBaseUnit);
    if (baseUnits.length !== 1) {
      errors.push('必須有且僅有一個基礎單位');
    }
    
    // 檢查整除關係
    const sortedUnits = units.sort((a, b) => b.priority - a.priority);
    for (let i = 0; i < sortedUnits.length - 1; i++) {
      const current = sortedUnits[i];
      const next = sortedUnits[i + 1];
      if (current.unitValue % next.unitValue !== 0) {
        warnings.push(`${current.unitName}(${current.unitValue}) 無法被 ${next.unitName}(${next.unitValue}) 整除`);
      }
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  }
  
  // 轉換為包裝顯示
  static convertToPackageDisplay(
    baseQuantity: number, 
    packageUnits: ProductPackageUnit[]
  ): PackageDisplayResult {
    // 實現轉換邏輯
  }
  
  // 轉換為基礎單位
  static convertToBaseUnit(
    input: string, 
    packageUnits: ProductPackageUnit[]
  ): number {
    // 實現轉換邏輯
  }
}
```

### 7.2 庫存服務擴展

```typescript
// backend/services/InventoryService.ts
class InventoryService {
  
  // 創建庫存記錄（支援包裝輸入）
  static async createInventoryRecord(data: {
    productId: string;
    input: string | number;
    inputType: 'package' | 'base';
    type: InventoryType;
    referenceId?: string;
    notes?: string;
  }): Promise<InventoryRecord> {
    
    // 1. 獲取產品包裝配置
    const packageUnits = await this.getProductPackageUnits(data.productId);
    
    // 2. 轉換為基礎單位
    let baseQuantity: number;
    if (data.inputType === 'package' && typeof data.input === 'string') {
      baseQuantity = PackageUnitService.convertToBaseUnit(data.input, packageUnits);
    } else {
      baseQuantity = Number(data.input);
    }
    
    // 3. 創建庫存記錄（統一使用基礎單位存儲）
    const inventoryRecord = await Inventory.create({
      product: data.productId,
      quantity: baseQuantity,  // 統一基礎單位存儲
      type: data.type,
      referenceId: data.referenceId,
      notes: data.notes,
      date: new Date()
    });
    
    return inventoryRecord;
  }
  
  // 獲取產品庫存（包含包裝顯示）
  static async getProductInventoryWithPackageDisplay(
    productId: string
  ): Promise<{
    totalStock: number;
    packageDisplay: PackageDisplayResult;
    inventoryRecords: InventoryRecord[];
  }> {
    
    // 1. 獲取庫存記錄
    const inventoryRecords = await Inventory.find({ product: productId });
    
    // 2. 計算總庫存（基礎單位）
    const totalStock = inventoryRecords.reduce((sum, record) => sum + record.quantity, 0);
    
    // 3. 獲取包裝配置並轉換顯示
    const packageUnits = await this.getProductPackageUnits(productId);
    const packageDisplay = PackageUnitService.convertToPackageDisplay(totalStock, packageUnits);
    
    return {
      totalStock,
      packageDisplay,
      inventoryRecords
    };
  }
}
```

## 8. 錯誤處理和驗證

### 8.1 API錯誤碼定義

```typescript
enum PackageUnitErrorCodes {
  INVALID_PACKAGE_UNITS = 'INVALID_PACKAGE_UNITS',
  MISSING_BASE_UNIT = 'MISSING_BASE_UNIT',
  MULTIPLE_BASE_UNITS = 'MULTIPLE_BASE_UNITS',
  INVALID_UNIT_VALUE = 'INVALID_UNIT_VALUE',
  DUPLICATE_UNIT_NAME = 'DUPLICATE_UNIT_NAME',
  DUPLICATE_PRIORITY = 'DUPLICATE_PRIORITY',
  INVALID_PACKAGE_INPUT = 'INVALID_PACKAGE_INPUT',
  UNKNOWN_UNIT_NAME = 'UNKNOWN_UNIT_NAME',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND'
}
```

### 8.2 輸入驗證中間件

```typescript
// backend/middleware/packageUnitValidation.ts
export const validatePackageUnitsInput = (req: Request, res: Response, next: NextFunction) => {
  const { packageUnits } = req.body;
  
  if (!Array.isArray(packageUnits)) {
    return res.status(400).json({
      success: false,
      error: 'packageUnits must be an array',
      code: 'INVALID_INPUT'
    });
  }
  
  const validation = PackageUnitService.validatePackageUnits(packageUnits);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Invalid package units configuration',
      code: PackageUnitErrorCodes.INVALID_PACKAGE_UNITS,
      details: validation.errors
    });
  }
  
  next();
};
```

## 9. 性能優化

### 9.1 緩存策略

```typescript
// backend/services/CacheService.ts
class PackageUnitCacheService {
  private static cache = new Map<string, ProductPackageUnit[]>();
  private static TTL = 60 * 60 * 1000; // 1小時
  
  static async getPackageUnits(productId: string): Promise<ProductPackageUnit[]> {
    const cacheKey = `package_units_${productId}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    const packageUnits = await ProductPackageUnit.find({ productId, isActive: true });
    this.cache.set(cacheKey, packageUnits);
    
    // 設定TTL
    setTimeout(() => {
      this.cache.delete(cacheKey);
    }, this.TTL);
    
    return packageUnits;
  }
  
  static clearCache(productId: string): void {
    const cacheKey = `package_units_${productId}`;
    this.cache.delete(cacheKey);
  }
}
```

## 10. 總結

後端API設計重點：

1. **數據一致性**：所有庫存數據統一使用基礎單位存儲
2. **靈活轉換**：提供包裝單位與基礎單位的雙向轉換API
3. **批量操作**：支援批量配置和操作，提升效率
4. **完整驗證**：嚴格的輸入驗證和錯誤處理
5. **性能優化**：合理的緩存策略和查詢優化
6. **向後兼容**：保持與現有API的兼容性

這樣的API設計確保了功能的完整性和系統的穩定性。