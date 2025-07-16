# Adapters 適配器

此目錄包含 Accounting3 模組的適配器，主要用於外部系統整合和資料轉換。

## 📁 目錄結構

```
adapters/
└── README.md           # 本文件
```

## 🔄 適配器概念

適配器模式用於：
- **外部 API 整合**: 與第三方會計系統整合
- **資料格式轉換**: 不同資料格式間的轉換
- **系統介面適配**: 適配不同系統的介面差異

## 🚀 未來擴展

### 可能的適配器類型

1. **外部會計系統適配器**
   - ERP 系統整合
   - 會計軟體資料匯入/匯出
   - 稅務申報系統介接

2. **資料格式適配器**
   - CSV/Excel 匯入匯出
   - JSON/XML 格式轉換
   - 報表格式適配

3. **API 適配器**
   - REST API 適配
   - GraphQL 適配
   - WebSocket 適配

## 🛠️ 實作指南

### 建立新適配器

```typescript
// 範例：外部 API 適配器
export class ExternalAPIAdapter {
  constructor(private apiClient: APIClient) {}

  async syncAccounts(): Promise<Account3[]> {
    const externalAccounts = await this.apiClient.getAccounts();
    return externalAccounts.map(this.convertToAccount3);
  }

  private convertToAccount3(externalAccount: ExternalAccount): Account3 {
    return {
      _id: externalAccount.id,
      code: externalAccount.accountCode,
      name: externalAccount.accountName,
      accountType: this.mapAccountType(externalAccount.type),
      type: 'other',
      parentId: externalAccount.parentId,
      level: externalAccount.level || 1,
      isActive: externalAccount.active ?? true,
      normalBalance: this.mapNormalBalance(externalAccount.type),
      balance: externalAccount.balance || 0,
      initialBalance: externalAccount.initialBalance || 0,
      currency: externalAccount.currency || 'TWD',
      description: externalAccount.description,
      organizationId: externalAccount.organizationId,
      createdAt: new Date(externalAccount.createdAt),
      updatedAt: new Date(externalAccount.updatedAt),
      createdBy: externalAccount.createdBy || 'system'
    };
  }

  private mapAccountType(externalType: string): AccountType {
    const typeMap: Record<string, AccountType> = {
      'asset': 'asset',
      'liability': 'liability',
      'equity': 'equity',
      'revenue': 'revenue',
      'expense': 'expense'
    };
    return typeMap[externalType] || 'asset';
  }

  private mapNormalBalance(accountType: AccountType): 'debit' | 'credit' {
    return ['asset', 'expense'].includes(accountType) ? 'debit' : 'credit';
  }
}
```

### 適配器介面設計

```typescript
interface DataAdapter<TSource, TTarget> {
  convert(source: TSource): TTarget;
  validate(source: TSource): ValidationResult;
  batch(sources: TSource[]): TTarget[];
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// 範例實作
export class CSVAdapter implements DataAdapter<CSVRow, Account3> {
  convert(csvRow: CSVRow): Account3 {
    return {
      _id: this.generateId(),
      code: csvRow.accountCode,
      name: csvRow.accountName,
      accountType: this.parseAccountType(csvRow.type),
      // ... 其他欄位轉換
    };
  }

  validate(csvRow: CSVRow): ValidationResult {
    const errors: string[] = [];
    
    if (!csvRow.accountCode) {
      errors.push('科目代碼不能為空');
    }
    
    if (!csvRow.accountName) {
      errors.push('科目名稱不能為空');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  batch(csvRows: CSVRow[]): Account3[] {
    return csvRows
      .filter(row => this.validate(row).isValid)
      .map(row => this.convert(row));
  }
}
```

## 🧪 測試策略

### 適配器測試

```typescript
describe('ExternalAPIAdapter', () => {
  let adapter: ExternalAPIAdapter;
  let mockApiClient: jest.Mocked<APIClient>;

  beforeEach(() => {
    mockApiClient = createMockAPIClient();
    adapter = new ExternalAPIAdapter(mockApiClient);
  });

  it('should convert external account to Account3', async () => {
    const externalAccount: ExternalAccount = {
      id: '123',
      accountCode: '1101',
      accountName: '現金',
      type: 'asset',
      balance: 1000,
      active: true,
      organizationId: 'org1',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      createdBy: 'admin'
    };

    mockApiClient.getAccounts.mockResolvedValue([externalAccount]);

    const accounts = await adapter.syncAccounts();

    expect(accounts).toHaveLength(1);
    expect(accounts[0].code).toBe('1101');
    expect(accounts[0].name).toBe('現金');
    expect(accounts[0].accountType).toBe('asset');
    expect(accounts[0].balance).toBe(1000);
  });

  it('should handle API errors gracefully', async () => {
    mockApiClient.getAccounts.mockRejectedValue(new Error('API Error'));

    await expect(adapter.syncAccounts()).rejects.toThrow('API Error');
  });
});

describe('CSVAdapter', () => {
  let adapter: CSVAdapter;

  beforeEach(() => {
    adapter = new CSVAdapter();
  });

  it('should validate CSV row correctly', () => {
    const validRow: CSVRow = {
      accountCode: '1101',
      accountName: '現金',
      type: 'asset'
    };

    const result = adapter.validate(validRow);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid CSV row', () => {
    const invalidRow: CSVRow = {
      accountCode: '',
      accountName: '',
      type: 'invalid'
    };

    const result = adapter.validate(invalidRow);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('科目代碼不能為空');
    expect(result.errors).toContain('科目名稱不能為空');
  });
});
```

## 📋 開發檢查清單

### 新增適配器時
- [ ] 定義清楚的介面契約
- [ ] 實作資料驗證機制
- [ ] 處理錯誤情況
- [ ] 撰寫完整的測試
- [ ] 更新文檔
- [ ] 考慮性能影響
- [ ] 實作日誌記錄

### 維護現有適配器
- [ ] 定期檢查外部 API 變更
- [ ] 更新資料格式對應
- [ ] 監控轉換錯誤率
- [ ] 優化性能瓶頸
- [ ] 更新測試案例

## 🔧 故障排除

### 常見問題

1. **資料轉換失敗**
   ```typescript
   // 檢查來源資料格式
   console.log('Source data:', JSON.stringify(sourceData, null, 2));
   
   // 驗證欄位對應關係
   const validation = adapter.validate(sourceData);
   if (!validation.isValid) {
     console.error('Validation errors:', validation.errors);
   }
   
   // 查看轉換日誌
   logger.error('Conversion failed', { sourceData, error });
   ```

2. **外部 API 連接問題**
   ```typescript
   // 確認 API 端點可用性
   try {
     const response = await fetch(apiEndpoint + '/health');
     console.log('API Status:', response.status);
   } catch (error) {
     console.error('API connection failed:', error);
   }
   
   // 檢查認證資訊
   if (!apiKey || !apiSecret) {
     throw new Error('API credentials missing');
   }
   
   // 驗證網路連接
   const isOnline = navigator.onLine;
   console.log('Network status:', isOnline ? 'online' : 'offline');
   ```

3. **性能問題**
   ```typescript
   // 實作批量處理
   async function batchProcess<T>(items: T[], batchSize = 100) {
     const results = [];
     for (let i = 0; i < items.length; i += batchSize) {
       const batch = items.slice(i, i + batchSize);
       const batchResults = await processBatch(batch);
       results.push(...batchResults);
     }
     return results;
   }
   
   // 使用快取機制
   const cache = new Map();
   function getCachedResult(key: string) {
     return cache.get(key);
   }
   
   // 考慮非同步處理
   const worker = new Worker('./conversion-worker.js');
   worker.postMessage({ data: largeDataSet });
   ```

## 🎯 最佳實踐

### 1. 錯誤處理
```typescript
export class RobustAdapter {
  async convertWithRetry<T>(
    data: any,
    converter: (data: any) => T,
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return converter(data);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          await this.delay(attempt * 1000); // 指數退避
          continue;
        }
      }
    }
    
    throw new Error(`轉換失敗，已重試 ${maxRetries} 次: ${lastError.message}`);
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 2. 資料驗證
```typescript
export class ValidationAdapter {
  private validators: Array<(data: any) => ValidationResult> = [];
  
  addValidator(validator: (data: any) => ValidationResult) {
    this.validators.push(validator);
    return this;
  }
  
  validate(data: any): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    
    for (const validator of this.validators) {
      const result = validator(data);
      if (!result.isValid) {
        allErrors.push(...result.errors);
      }
      if (result.warnings) {
        allWarnings.push(...result.warnings);
      }
    }
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }
}
```

### 3. 日誌記錄
```typescript
export class LoggingAdapter {
  private logger: Logger;
  
  constructor(logger: Logger) {
    this.logger = logger;
  }
  
  async convert(data: any): Promise<any> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();
    
    this.logger.info('開始轉換', {
      correlationId,
      dataType: typeof data,
      dataSize: JSON.stringify(data).length
    });
    
    try {
      const result = await this.performConversion(data);
      
      this.logger.info('轉換成功', {
        correlationId,
        duration: Date.now() - startTime,
        resultSize: JSON.stringify(result).length
      });
      
      return result;
    } catch (error) {
      this.logger.error('轉換失敗', {
        correlationId,
        duration: Date.now() - startTime,
        error: error.message,
        stack: error.stack
      });
      
      throw error;
    }
  }
  
  private generateCorrelationId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
```

## 📚 相關文檔

- [Accounting3 Types](../types/README.md) - 型別定義
- [Core Services](../core/README.md) - 核心服務
- [Components](../components/README.md) - React 組件

---

**最後更新**: 2025-01-16  
**維護者**: 開發團隊