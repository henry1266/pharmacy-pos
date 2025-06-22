/**
 * 共享常數定義
 * 統一前後端使用的常數值
 */

/**
 * API 相關常數
 */
export const API_CONSTANTS = {
  // HTTP 狀態碼
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
  },

  // 預設分頁設定
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    MIN_LIMIT: 1
  },

  // API 版本
  VERSION: 'v1',

  // 請求超時時間 (毫秒)
  TIMEOUT: 30000,

  // 重試次數
  MAX_RETRIES: 3
} as const;

/**
 * 驗證相關常數
 */
export const VALIDATION_CONSTANTS = {
  // 密碼規則
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true
  },

  // 使用者名稱規則
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9_-]+$/
  },

  // 電子郵件規則
  EMAIL: {
    MAX_LENGTH: 254,
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },

  // 電話號碼規則
  PHONE: {
    PATTERN: /^[\d\s\-\+\(\)]+$/,
    MIN_LENGTH: 8,
    MAX_LENGTH: 20
  },

  // 產品代碼規則
  PRODUCT_CODE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    PATTERN: /^[A-Za-z0-9\-_]+$/
  },

  // 產品名稱規則
  PRODUCT_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200
  },

  // 客戶名稱規則
  CUSTOMER_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100
  },

  // 供應商名稱規則
  SUPPLIER_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100
  },

  // 身分證字號規則 (台灣)
  ID_NUMBER: {
    PATTERN: /^[A-Z][12][0-9]{8}$/
  },

  // 統一編號規則 (台灣)
  TAX_ID: {
    PATTERN: /^[0-9]{8}$/
  }
} as const;

/**
 * 業務邏輯常數
 */
export const BUSINESS_CONSTANTS = {
  // 庫存相關
  INVENTORY: {
    MIN_STOCK_DEFAULT: 0,
    MAX_STOCK_DEFAULT: 9999,
    LOW_STOCK_THRESHOLD: 10,
    EXPIRY_WARNING_DAYS: 30
  },

  // 價格相關
  PRICING: {
    MIN_PRICE: 0,
    MAX_PRICE: 999999.99,
    DECIMAL_PLACES: 2,
    DEFAULT_CURRENCY: 'TWD'
  },

  // 折扣相關
  DISCOUNT: {
    MIN_PERCENTAGE: 0,
    MAX_PERCENTAGE: 100,
    MIN_AMOUNT: 0,
    MAX_AMOUNT: 999999.99
  },

  // 數量相關
  QUANTITY: {
    MIN_QUANTITY: 0,
    MAX_QUANTITY: 999999,
    DECIMAL_PLACES: 3
  },

  // 訂單編號格式
  ORDER_NUMBER: {
    SALE_PREFIX: 'S',
    PURCHASE_PREFIX: 'P',
    SHIPPING_PREFIX: 'SH',
    ACCOUNTING_PREFIX: 'A',
    SEQUENCE_LENGTH: 6,
    DATE_FORMAT: 'YYYYMMDD'
  },

  // 會計相關
  ACCOUNTING: {
    SHIFTS: ['早', '中', '晚'],
    MAX_AMOUNT: 999999.99,
    MIN_AMOUNT: -999999.99
  },

  // 員工相關
  EMPLOYEE: {
    MIN_SALARY: 0,
    MAX_SALARY: 999999,
    MAX_OVERTIME_HOURS: 12,
    MIN_OVERTIME_HOURS: 0.5
  }
} as const;

/**
 * 檔案處理常數
 */
export const FILE_CONSTANTS = {
  // 允許的檔案類型
  ALLOWED_EXTENSIONS: {
    IMAGES: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
    DOCUMENTS: ['.pdf', '.doc', '.docx', '.txt'],
    SPREADSHEETS: ['.xls', '.xlsx', '.csv'],
    ALL: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.csv']
  },

  // 檔案大小限制 (bytes)
  MAX_FILE_SIZE: {
    IMAGE: 5 * 1024 * 1024, // 5MB
    DOCUMENT: 10 * 1024 * 1024, // 10MB
    SPREADSHEET: 20 * 1024 * 1024, // 20MB
    DEFAULT: 5 * 1024 * 1024 // 5MB
  },

  // MIME 類型
  MIME_TYPES: {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/bmp': ['.bmp'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'text/csv': ['.csv']
  }
} as const;

/**
 * 日期時間常數
 */
export const DATE_CONSTANTS = {
  // 日期格式
  FORMATS: {
    DATE: 'YYYY-MM-DD',
    DATETIME: 'YYYY-MM-DD HH:mm:ss',
    TIME: 'HH:mm:ss',
    DISPLAY_DATE: 'YYYY/MM/DD',
    DISPLAY_DATETIME: 'YYYY/MM/DD HH:mm',
    ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
  },

  // 時區
  TIMEZONE: 'Asia/Taipei',

  // 工作日 (0=週日, 1=週一, ..., 6=週六)
  WORK_DAYS: [1, 2, 3, 4, 5],

  // 班別時間
  SHIFT_TIMES: {
    MORNING: { start: '08:00', end: '16:00' },
    AFTERNOON: { start: '16:00', end: '24:00' },
    EVENING: { start: '00:00', end: '08:00' }
  }
} as const;

/**
 * 快取相關常數
 */
export const CACHE_CONSTANTS = {
  // TTL (秒)
  TTL: {
    SHORT: 300, // 5分鐘
    MEDIUM: 1800, // 30分鐘
    LONG: 3600, // 1小時
    VERY_LONG: 86400 // 24小時
  },

  // 快取鍵前綴
  KEYS: {
    USER: 'user:',
    PRODUCT: 'product:',
    CUSTOMER: 'customer:',
    SUPPLIER: 'supplier:',
    INVENTORY: 'inventory:',
    SALE: 'sale:',
    PURCHASE_ORDER: 'purchase_order:',
    SHIPPING_ORDER: 'shipping_order:',
    ACCOUNTING: 'accounting:'
  }
} as const;

/**
 * 錯誤訊息常數
 */
export const ERROR_MESSAGES = {
  // 通用錯誤
  GENERIC: {
    INTERNAL_ERROR: '系統內部錯誤',
    SERVER_ERROR: '伺服器錯誤',
    INVALID_REQUEST: '無效的請求',
    UNAUTHORIZED: '未授權的存取',
    FORBIDDEN: '禁止存取',
    NOT_FOUND: '找不到資源',
    VALIDATION_FAILED: '資料驗證失敗',
    DUPLICATE_ENTRY: '資料重複'
  },

  // 認證相關
  AUTH: {
    INVALID_CREDENTIALS: '帳號或密碼錯誤',
    TOKEN_EXPIRED: '登入已過期',
    TOKEN_INVALID: '無效的登入憑證',
    INSUFFICIENT_PERMISSIONS: '權限不足'
  },

  // 產品相關
  PRODUCT: {
    NOT_FOUND: '找不到產品',
    CODE_EXISTS: '產品代碼已存在',
    INVALID_PRICE: '價格格式錯誤',
    INSUFFICIENT_STOCK: '庫存不足'
  },

  // 客戶相關
  CUSTOMER: {
    NOT_FOUND: '找不到客戶',
    CODE_EXISTS: '客戶編號已存在',
    PHONE_EXISTS: '電話號碼已存在',
    EMAIL_EXISTS: '電子郵件已存在'
  },

  // 供應商相關
  SUPPLIER: {
    NOT_FOUND: '找不到供應商',
    CODE_EXISTS: '供應商代碼已存在'
  },

  // 檔案相關
  FILE: {
    TOO_LARGE: '檔案過大',
    INVALID_TYPE: '不支援的檔案類型',
    UPLOAD_FAILED: '檔案上傳失敗'
  }
} as const;

/**
 * 成功訊息常數
 */
export const SUCCESS_MESSAGES = {
  // 通用成功
  GENERIC: {
    CREATED: '建立成功',
    UPDATED: '更新成功',
    DELETED: '刪除成功',
    OPERATION_SUCCESS: '操作成功'
  },

  // 認證相關
  AUTH: {
    LOGIN_SUCCESS: '登入成功',
    LOGOUT_SUCCESS: '登出成功',
    PASSWORD_CHANGED: '密碼變更成功'
  },

  // 檔案相關
  FILE: {
    UPLOAD_SUCCESS: '檔案上傳成功',
    IMPORT_SUCCESS: '資料匯入成功'
  }
} as const;

/**
 * 系統配置常數
 */
export const SYSTEM_CONSTANTS = {
  // 應用程式資訊
  APP: {
    NAME: 'Pharmacy POS System',
    VERSION: '1.0.0',
    DESCRIPTION: '藥局銷售管理系統'
  },

  // 資料庫相關
  DATABASE: {
    CONNECTION_TIMEOUT: 10000,
    QUERY_TIMEOUT: 30000,
    MAX_CONNECTIONS: 10
  },

  // JWT 相關
  JWT: {
    EXPIRES_IN: '24h',
    REFRESH_EXPIRES_IN: '7d',
    ALGORITHM: 'HS256'
  },

  // 日誌相關
  LOGGING: {
    MAX_FILE_SIZE: '10m',
    MAX_FILES: 5,
    DATE_PATTERN: 'YYYY-MM-DD'
  }
} as const;

/**
 * 正規表達式常數
 */
export const REGEX_PATTERNS = {
  // 台灣身分證字號
  TW_ID_NUMBER: /^[A-Z][12][0-9]{8}$/,
  
  // 台灣統一編號
  TW_TAX_ID: /^[0-9]{8}$/,
  
  // 台灣手機號碼
  TW_MOBILE: /^09[0-9]{8}$/,
  
  // 台灣市話
  TW_PHONE: /^0[2-8][0-9]{7,8}$/,
  
  // 產品代碼
  PRODUCT_CODE: /^[A-Za-z0-9\-_]+$/,
  
  // 英數字
  ALPHANUMERIC: /^[A-Za-z0-9]+$/,
  
  // 中文字符
  CHINESE: /^[\u4e00-\u9fa5]+$/,
  
  // 中英文數字
  CHINESE_ALPHANUMERIC: /^[\u4e00-\u9fa5A-Za-z0-9]+$/,
  
  // 價格格式 (最多兩位小數)
  PRICE: /^\d+(\.\d{1,2})?$/,
  
  // 數量格式 (最多三位小數)
  QUANTITY: /^\d+(\.\d{1,3})?$/
} as const;