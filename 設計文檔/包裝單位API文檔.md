# 包裝單位 API 文檔

## 概述

包裝單位 API 提供了完整的包裝單位管理功能，包括 CRUD 操作、驗證和轉換計算。所有 API 都遵循 RESTful 設計原則，並提供統一的錯誤處理和響應格式。

## 基礎 URL

```
http://localhost:5000/api
```

## 通用響應格式

### 成功響應
```json
{
  "success": true,
  "data": {}, // 響應數據
  "message": "操作成功" // 可選的成功消息
}
```

### 錯誤響應
```json
{
  "success": false,
  "error": "錯誤描述",
  "code": "ERROR_CODE" // 錯誤代碼
}
```

## 錯誤代碼

| 代碼 | 描述 |
|------|------|
| `PRODUCT_NOT_FOUND` | 產品不存在 |
| `INVALID_PACKAGE_UNITS` | 無效的包裝單位配置 |
| `INVALID_PACKAGE_INPUT` | 無效的包裝輸入格式 |
| `INVALID_DATE_FORMAT` | 無效的日期格式 |
| `INVALID_BASE_QUANTITY` | 無效的基礎數量 |
| `INTERNAL_SERVER_ERROR` | 服務器內部錯誤 |

---

## API 端點

### 1. 獲取產品包裝單位配置

**GET** `/products/{productId}/package-units`

獲取指定產品的當前包裝單位配置。

#### 路徑參數
- `productId` (string, required): 產品ID

#### 響應示例
```json
{
  "success": true,
  "data": [
    {
      "unitName": "盒",
      "baseUnitCount": 100,
      "level": 1
    },
    {
      "unitName": "排",
      "baseUnitCount": 10,
      "level": 2
    },
    {
      "unitName": "粒",
      "baseUnitCount": 1,
      "level": 3
    }
  ]
}
```

#### 錯誤響應
- `400 Bad Request`: 產品ID為空
- `500 Internal Server Error`: 服務器錯誤

---

### 2. 獲取歷史包裝單位配置

**GET** `/products/{productId}/package-units/history?date={date}`

獲取指定產品在特定日期的包裝單位配置。

#### 路徑參數
- `productId` (string, required): 產品ID

#### 查詢參數
- `date` (string, optional): 查詢日期 (ISO 8601 格式，如 "2024-01-01")，默認為當前日期

#### 響應示例
```json
{
  "success": true,
  "data": [
    {
      "unitName": "盒",
      "baseUnitCount": 100,
      "level": 1
    }
  ],
  "queryDate": "2024-01-01T00:00:00.000Z"
}
```

#### 錯誤響應
- `400 Bad Request`: 產品ID為空或日期格式無效
- `500 Internal Server Error`: 服務器錯誤

---

### 3. 創建包裝單位配置

**POST** `/products/{productId}/package-units`

為指定產品創建新的包裝單位配置。

#### 路徑參數
- `productId` (string, required): 產品ID

#### 請求體
```json
{
  "packageUnits": [
    {
      "unitName": "盒",
      "baseUnitCount": 100,
      "level": 1
    },
    {
      "unitName": "排",
      "baseUnitCount": 10,
      "level": 2
    },
    {
      "unitName": "粒",
      "baseUnitCount": 1,
      "level": 3
    }
  ]
}
```

#### 響應示例
```json
{
  "success": true,
  "data": {
    "productId": "product123",
    "packageUnits": [
      {
        "unitName": "盒",
        "baseUnitCount": 100,
        "level": 1
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "包裝單位配置創建成功"
}
```

#### 錯誤響應
- `400 Bad Request`: 產品ID為空或包裝單位數據無效
- `500 Internal Server Error`: 服務器錯誤

---

### 4. 更新包裝單位配置

**PUT** `/products/{productId}/package-units`

更新指定產品的包裝單位配置。

#### 路徑參數
- `productId` (string, required): 產品ID

#### 請求體
```json
{
  "packageUnits": [
    {
      "unitName": "盒",
      "baseUnitCount": 120,
      "level": 1
    },
    {
      "unitName": "粒",
      "baseUnitCount": 1,
      "level": 2
    }
  ]
}
```

#### 響應示例
```json
{
  "success": true,
  "data": {
    "productId": "product123",
    "packageUnits": [
      {
        "unitName": "盒",
        "baseUnitCount": 120,
        "level": 1
      }
    ],
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "包裝單位配置更新成功"
}
```

#### 錯誤響應
- `400 Bad Request`: 產品ID為空或包裝單位數據無效
- `500 Internal Server Error`: 服務器錯誤

---

### 5. 刪除包裝單位配置

**DELETE** `/products/{productId}/package-units`

刪除指定產品的包裝單位配置。

#### 路徑參數
- `productId` (string, required): 產品ID

#### 響應示例
```json
{
  "success": true,
  "message": "包裝單位配置刪除成功"
}
```

#### 錯誤響應
- `400 Bad Request`: 產品ID為空
- `500 Internal Server Error`: 刪除失敗

---

### 6. 驗證包裝單位配置

**POST** `/package-units/validate`

驗證包裝單位配置的有效性。

#### 請求體
```json
{
  "packageUnits": [
    {
      "unitName": "盒",
      "baseUnitCount": 100,
      "level": 1
    },
    {
      "unitName": "排",
      "baseUnitCount": 10,
      "level": 2
    }
  ]
}
```

#### 響應示例
```json
{
  "success": true,
  "isValid": true,
  "errors": [],
  "warnings": []
}
```

#### 驗證失敗示例
```json
{
  "success": true,
  "isValid": false,
  "errors": [
    "包裝單位數量必須大於0",
    "包裝單位名稱不能為空"
  ],
  "warnings": [
    "建議按照包裝層級排序"
  ]
}
```

#### 錯誤響應
- `400 Bad Request`: 包裝單位數據格式錯誤
- `500 Internal Server Error`: 服務器錯誤

---

### 7. 轉換基礎單位為包裝顯示

**POST** `/inventory/convert-to-package-display`

將基礎單位數量轉換為包裝單位顯示格式。

#### 請求體
```json
{
  "productId": "product123",
  "baseQuantity": 1635,
  "useHistoricalConfig": false,
  "configDate": "2024-01-01" // 當 useHistoricalConfig 為 true 時使用
}
```

#### 響應示例
```json
{
  "success": true,
  "data": {
    "baseQuantity": 1635,
    "packageBreakdown": [
      {
        "unitName": "盒",
        "quantity": 16
      },
      {
        "unitName": "排",
        "quantity": 3
      },
      {
        "unitName": "粒",
        "quantity": 5
      }
    ],
    "displayText": "16盒 3排 5粒",
    "configUsed": [
      {
        "unitName": "盒",
        "baseUnitCount": 100,
        "level": 1
      },
      {
        "unitName": "排",
        "baseUnitCount": 10,
        "level": 2
      },
      {
        "unitName": "粒",
        "baseUnitCount": 1,
        "level": 3
      }
    ]
  }
}
```

#### 錯誤響應
- `400 Bad Request`: 產品ID為空、基礎數量無效或日期格式錯誤
- `500 Internal Server Error`: 服務器錯誤

---

### 8. 轉換包裝輸入為基礎單位

**POST** `/inventory/convert-to-base-unit`

將包裝單位輸入轉換為基礎單位數量。

#### 請求體
```json
{
  "productId": "product123",
  "packageInput": "2盒 3排 5粒"
}
```

#### 響應示例
```json
{
  "success": true,
  "data": {
    "baseQuantity": 235,
    "parsedInput": [
      {
        "unitName": "盒",
        "quantity": 2
      },
      {
        "unitName": "排",
        "quantity": 3
      },
      {
        "unitName": "粒",
        "quantity": 5
      }
    ],
    "displayText": "2盒 3排 5粒"
  },
  "errors": []
}
```

#### 解析錯誤示例
```json
{
  "success": true,
  "data": {
    "baseQuantity": 200,
    "parsedInput": [
      {
        "unitName": "盒",
        "quantity": 2
      }
    ],
    "displayText": "2盒"
  },
  "errors": [
    "無法識別的包裝單位: 瓶"
  ]
}
```

#### 錯誤響應
- `400 Bad Request`: 產品ID為空或包裝輸入為空
- `500 Internal Server Error`: 服務器錯誤

---

## 使用示例

### JavaScript/TypeScript 示例

```typescript
// 獲取產品包裝單位配置
const getPackageUnits = async (productId: string) => {
  const response = await fetch(`/api/products/${productId}/package-units`);
  const result = await response.json();
  
  if (result.success) {
    console.log('包裝單位配置:', result.data);
  } else {
    console.error('錯誤:', result.error);
  }
};

// 創建包裝單位配置
const createPackageUnits = async (productId: string, packageUnits: any[]) => {
  const response = await fetch(`/api/products/${productId}/package-units`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ packageUnits }),
  });
  
  const result = await response.json();
  return result;
};

// 轉換顯示
const convertToDisplay = async (productId: string, baseQuantity: number) => {
  const response = await fetch('/api/inventory/convert-to-package-display', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productId, baseQuantity }),
  });
  
  const result = await response.json();
  if (result.success) {
    console.log('顯示格式:', result.data.displayText);
  }
};
```

### cURL 示例

```bash
# 獲取包裝單位配置
curl -X GET "http://localhost:5000/api/products/product123/package-units"

# 創建包裝單位配置
curl -X POST "http://localhost:5000/api/products/product123/package-units" \
  -H "Content-Type: application/json" \
  -d '{
    "packageUnits": [
      {"unitName": "盒", "baseUnitCount": 100, "level": 1},
      {"unitName": "粒", "baseUnitCount": 1, "level": 2}
    ]
  }'

# 轉換為包裝顯示
curl -X POST "http://localhost:5000/api/inventory/convert-to-package-display" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product123",
    "baseQuantity": 235
  }'
```

---

## 注意事項

1. **數據一致性**: 所有包裝單位配置都會進行驗證，確保數據的一致性和有效性。

2. **歷史記錄**: 系統會保留包裝單位配置的歷史記錄，支持按日期查詢歷史配置。

3. **錯誤處理**: 所有 API 都提供詳細的錯誤信息和錯誤代碼，便於客戶端處理。

4. **性能優化**: 包裝單位配置使用了適當的數據庫索引，確保查詢性能。

5. **類型安全**: 所有 API 都有完整的 TypeScript 類型定義，確保類型安全。

6. **測試覆蓋**: 所有 API 端點都有完整的單元測試覆蓋，確保功能的正確性。